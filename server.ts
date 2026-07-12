/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import jwt from "jsonwebtoken";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { dbService, hashPassword } from "./server/db";
import { getTemplate, categoriesList } from "./server/templates";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "PROMPT_FORGE_AI_SUPER_SECRET_TOKEN_2026";

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Configure it in settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Global Middlewares
app.use(express.json({ limit: "5mb" }));

// Middleware to prevent crash on invalid JSON payloads (Anti-Crash SRE block)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
    return res.status(400).json({
      status: "ERROR",
      detail: "O payload JSON enviado está malformado ou corrompido."
    });
  }
  next();
});

// ==================== IP AND SESSION UTILITIES ====================
function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return ip.trim();
  }
  return req.socket.remoteAddress || "127.0.0.1";
}

async function isVpnOrProxy(ip: string): Promise<boolean> {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.16.")) {
    return false;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // SRE fail-fast 2s timeout
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=proxy,hosting`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return false;
    const data: any = await response.json();
    return !!(data && (data.proxy === true || data.hosting === true));
  } catch (err) {
    return false; // Graceful fallback: do not interrupt production in case of external service downtime
  }
}

// Authenticaton token boundary middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tier: string;
    jti?: string;
  };
}

function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ status: "ERROR", detail: "Acesso não autorizado. Faça login primeiro." });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ status: "ERROR", detail: "Sua sessão expirou ou o token é inválido." });
    }

    const clientIp = getClientIp(req);
    const userId = decoded.id;
    const jti = decoded.jti;

    if (jti) {
      const activeSession = dbService.getSession(jti, userId);
      if (!activeSession) {
        return res.status(401).json({ status: "ERROR", detail: "Sessão inválida. Faça login novamente." });
      }

      if (activeSession.ipAddress !== clientIp) {
        // Tolerância SRE a IP mutável/flutuante em Cloud Run - atualiza IP da sessão silenciosamente para evitar desconexão indesejada
        console.log(`[SRE_SESSION_WARN] Usuário ${userId} alterou IP de ${activeSession.ipAddress} para ${clientIp}. Configurações mantidas.`);
        activeSession.ipAddress = clientIp;
      }

      dbService.updateSessionActivity(jti);
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      tier: decoded.tier,
      jti: decoded.jti
    };
    next();
  });
}

// ============================================================
// AUTHENTICATION API ROUTES
// ============================================================

app.post("/api/auth/register", async (req: Request, res: Response) => {
  const { email, password, name, profession } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ status: "ERROR", detail: "E-mail, senha e nome são obrigatórios." });
  }

  const clientIp = getClientIp(req);

  // 1. IP Check: Multiple accounts threshold (Max 1 account per IP per 24 hours)
  if (dbService.hasRegistrationFromIpIn24h(clientIp)) {
    return res.status(403).json({ 
      status: "ERROR", 
      detail: "Não é permitido criar múltiplas contas a partir do mesmo endereço de rede." 
    });
  }

  // 2. Anti-VPN / Anti-Proxy filter Check
  const isVpn = await isVpnOrProxy(clientIp);
  if (isVpn) {
    return res.status(403).json({ 
      status: "ERROR", 
      detail: "Cadastros via conexões tipo VPN ou Proxy não são permitidos." 
    });
  }

  try {
    const hashedPassword = hashPassword(password);
    const role = email.toLowerCase().includes("admin") ? "admin" : "user";
    const user = dbService.addUser(
      email, 
      hashedPassword, 
      name, 
      profession || "Entusiasta de IA", 
      role, 
      clientIp
    );
    return res.json({ status: "SUCCESS", user });
  } catch (err: any) {
    console.error("[REGISTER_ERROR]", err.message);
    return res.status(409).json({ status: "ERROR", detail: err.message || "Erro no cadastro de conta." });
  }
});

app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: "ERROR", detail: "E-mail e senha são obrigatórios." });
  }

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@cyberhuntlab.com.br";
  const ADMIN_PASS = process.env.ADMIN_PASS || "admin123456";

  try {
    let user: any = dbService.getUserByEmail(email);

    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASS) {
      if (!user) {
        user = dbService.addUser(
          ADMIN_EMAIL,
          hashPassword(ADMIN_PASS),
          "Administrador do Sistema",
          "Engineer",
          "admin"
        );
      }
    } else {
      if (!user || user.passwordHash !== hashPassword(password)) {
        return res.status(401).json({ status: "ERROR", detail: "E-mail ou senha inválidos." });
      }
    }

    const clientIp = getClientIp(req);
    const jti = crypto.randomUUID();

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, tier: user.tier, jti },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Save active session tracking
    dbService.addSession(user.id, jti, clientIp);

    const { passwordHash: _, ...cleanUser } = user;
    return res.json({
      status: "SUCCESS",
      access_token: token,
      token_type: "bearer",
      user: cleanUser
    });
  } catch (err: any) {
    console.error("[LOGIN_ERROR]", err.message);
    return res.status(500).json({ status: "ERROR", detail: "Erro interno ao realizar autenticação." });
  }
});

app.post("/api/auth/admin/login", (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: "ERROR", detail: "E-mail e senha são obrigatórios." });
  }

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@cyberhuntlab.com.br";
  const ADMIN_PASS = process.env.ADMIN_PASS || "admin123456";

  if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASS) {
    return res.status(401).json({ status: "ERROR", detail: "Credenciais de administrador inválidas." });
  }

  try {
    let user = dbService.getUserByEmail(ADMIN_EMAIL);
    const clientIp = getClientIp(req);

    if (!user) {
      // Auto-register admin to maintain schema consistency
      const createdUser = dbService.addUser(
        ADMIN_EMAIL,
        hashPassword(ADMIN_PASS),
        "Administrador Master",
        "Engenheiro de Metaprompting SRE",
        "admin",
        clientIp
      );
      // Promote admin to expert tier
      dbService.updateUserTier(createdUser.id, "expert");
      user = dbService.getUserByEmail(ADMIN_EMAIL);
    }

    const jti = crypto.randomUUID();

    const token = jwt.sign(
      { id: user!.id, email: user!.email, role: user!.role, tier: user!.tier, jti },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Register active session
    dbService.addSession(user!.id, jti, clientIp);

    const { passwordHash: _, ...cleanUser } = user!;
    return res.json({
      status: "SUCCESS",
      access_token: token,
      token_type: "bearer",
      user: cleanUser
    });
  } catch (err: any) {
    console.error("[ADMIN_LOGIN_ERROR]", err.message);
    return res.status(500).json({ status: "ERROR", detail: "Erro interno ao processar login administrativo." });
  }
});

app.post("/api/auth/logout", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user && req.user.jti) {
      dbService.deleteSession(req.user.jti);
    }
    return res.json({ status: "SUCCESS", message: "Logout realizado com sucesso." });
  } catch (err: any) {
    return res.status(500).json({ status: "ERROR", detail: "Erro na desconexão." });
  }
});

app.get("/api/auth/me", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = dbService.getUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({ status: "ERROR", detail: "Usuário não encontrado." });
    }
    const { passwordHash: _, ...cleanUser } = user;
    return res.json({ status: "SUCCESS", user: cleanUser });
  } catch (err: any) {
    return res.status(500).json({ status: "ERROR", detail: "Falha ao obter dados do usuário." });
  }
});

// ============================================================
// DYNAMIC PROMPT FORGE GENERATION API
// ============================================================

app.get("/api/categories", (req: Request, res: Response) => {
  return res.json({ status: "SUCCESS", categories: categoriesList });
});

app.post("/api/prompts/generate", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { niche, profession, task, detailLevel, outputFormat, tone, customInstructions } = req.body;

  if (!niche || !profession || !task) {
    return res.status(400).json({ status: "ERROR", detail: "Nicho, Profissão e Descrição da Tarefa são obrigatórios." });
  }

  try {
    // 1. Retrieve the corresponding structural template
    const template = getTemplate(niche, profession);

    // 2. Build target instructions
    const formattedSections = template.sections.map(section => {
      // Replace variables in templates
      return section
        .replace("{task_description}", task)
        .replace("{output_format}", outputFormat || "Markdown");
    }).join("\n\n");

    const systemInstructionPrompt = `
Você é o mais sofisticado Engenheiro de Prompts do mundo, especialista em IA Generativa, Metaprompting e Confiabilidade de Respostas.
Sua missão é fabricar um prompt de engenharia final extremamente estruturado e detalhado para ${profession} no setor de ${niche}.
O prompt de engenharia que você gerar será copiado pelo usuário final para interagir com outra inteligência artificial (LLM) de forma perfeita.

Siga rigorosamente estes requisitos estruturais para formatar o prompt final de engenharia:
1. Comece definindo o Papel e Personagem (Role & Persona) detalhado do especialista, herdado de: "${template.role}".
2. Crie uma seção de CONTEXTO E METAS fundamentada em: "${task}".
3. Adicione cada uma das seguintes diretrizes de execução, enriquecendo-as com requisitos explícitos coerentes com o nível de detalhe "${detailLevel || "Avançado"}":
${formattedSections}
4. Especifique que o formato de saída esperado da outra IA deve ser exatamente "${outputFormat || "Markdown"}".
5. Defina o tom de escrita do especialista final como "${tone || "Profissional, Técnico e Preciso"}".
6. Adicione obrigatoriamente uma proteção anti-alucinações (Prompt Hardening), instruindo a outra IA a admitir se não souber e evitar criar fatos ou códigos não testados.
7. Se houver instruções customizadas do usuário abaixo, mescle-as de forma orgânica e harmoniosa nas diretrizes obrigatórias:
"${customInstructions || "Nenhuma adicional"}"

IMPORTANTE: Responda APENAS com o texto completo do prompt gerado em formato Markdown cristalino. Não inclua conversas antes ou depois dele. Comece diretamente com as instruções do prompt.
    `;

    // 3. Command Gemini to execute prompt engineering building
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Gere o prompt para a seguinte tarefa de alto nível: ${task}`,
      config: {
        systemInstruction: systemInstructionPrompt,
        temperature: 0.3,
      }
    });

    const generatedPrompt = response.text || "Ops! Não foi possível gerar o prompt de forma adequada.";

    // 4. Save to history
    const historyItem = dbService.addPrompt(
      req.user!.id,
      niche,
      profession,
      task,
      detailLevel || "Avançado",
      outputFormat || "Markdown",
      tone || "Técnico",
      generatedPrompt
    );

    return res.json({
      status: "SUCCESS",
      prompt: generatedPrompt,
      record: historyItem
    });
  } catch (err: any) {
    console.error("[PROMPT_GEN_ERROR]", err.message);
    return res.status(500).json({
      status: "ERROR",
      detail: err.message || "Erro interno na comunicação com o cérebro da IA Gemini."
    });
  }
});

// ============================================================
// HISTORY & INTERACTIVE ACTIONS
// ============================================================

app.get("/api/prompts", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = dbService.getPrompts(req.user!.id);
    return res.json({ status: "SUCCESS", prompts: list });
  } catch (err: any) {
    return res.status(500).json({ status: "ERROR", detail: "Falha ao recuperar histórico." });
  }
});

app.post("/api/prompts/:id/favorite", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const updated = dbService.toggleFavoritePrompt(id, req.user!.id);
    return res.json({ status: "SUCCESS", prompt: updated });
  } catch (err: any) {
    return res.status(404).json({ status: "ERROR", detail: err.message || "Tentativa de favoritar inválida." });
  }
});

app.post("/api/prompts/:id/rate", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { rating } = req.body;

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return res.status(400).json({ status: "ERROR", detail: "A avaliação deve ser um número de 1 a 5." });
  }

  try {
    const updated = dbService.ratePrompt(id, rating, req.user!.id);
    return res.json({ status: "SUCCESS", prompt: updated });
  } catch (err: any) {
    return res.status(404).json({ status: "ERROR", detail: err.message || "Erro ao gravar sua avaliação." });
  }
});

app.delete("/api/prompts/:id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    dbService.deletePrompt(id, req.user!.id);
    return res.json({ status: "SUCCESS", message: "Histórico de prompt removido com sucesso." });
  } catch (err: any) {
    return res.status(404).json({ status: "ERROR", detail: err.message || "Erro ao excluir o prompt." });
  }
});

// ============================================================
// CUSTOM TEMPLATES
// ============================================================

app.get("/api/templates", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = dbService.getTemplates(req.user!.id);
    return res.json({ status: "SUCCESS", templates: list });
  } catch (err: any) {
    return res.status(500).json({ status: "ERROR", detail: "Erro ao buscar templates customizados." });
  }
});

app.post("/api/templates", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { name, niche, profession, sections } = req.body;

  if (!name || !niche || !profession || !sections || !Array.isArray(sections)) {
    return res.status(400).json({ status: "ERROR", detail: "Todos os campos do template são obrigatórios." });
  }

  try {
    const created = dbService.addTemplate(req.user!.id, name, niche, profession, sections);
    return res.json({ status: "SUCCESS", template: created });
  } catch (err: any) {
    return res.status(500).json({ status: "ERROR", detail: "Erro ao criar template." });
  }
});

app.delete("/api/templates/:id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    dbService.deleteTemplate(id, req.user!.id);
    return res.json({ status: "SUCCESS", message: "Template customizado removido." });
  } catch (err: any) {
    return res.status(404).json({ status: "ERROR", detail: err.message || "Erro ao excluir o template." });
  }
});

// ============================================================
// SECURITY CORE SCANNER & REFACTORING API
// ============================================================

app.post("/api/security/scan", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { files } = req.body;

  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ status: "ERROR", detail: "Nenhum arquivo de código foi enviado para análise." });
  }

  try {
    const ai = getAiClient();
    
    // Select relevant files to avoid token overhead (only files with text/code extensions, up to 10 files max for performance)
    const validFiles = files
      .filter(f => {
        const ext = f.path.split('.').pop()?.toLowerCase();
        return ext && ["js", "jsx", "ts", "tsx", "py", "java", "php", "go", "cs", "rb", "html", "css", "json", "env"].includes(ext);
      })
      .slice(0, 15);

    if (validFiles.length === 0) {
      return res.json({
        status: "SUCCESS",
        vulnerabilities: [],
        score: 100,
        grade: "A+",
        summary: "Nenhum arquivo de código passível de varredura foi detectado no ZIP para auditoria."
      });
    }

    // Prepare code bundle text for LLM
    const codePayloadData = validFiles.map(f => {
      const codeSnippet = f.content ? f.content.slice(0, 8000) : ""; // safety truncate per file
      return `--- MULTIPART_FILE: ${f.path} ---\n${codeSnippet}\n--- END_FILE ---`;
    }).join("\n\n");

    const systemPromptMessage = `
Você é o Engenheiro Chefe de SRE, Segurança de Código e Auditoria Avançada Militar do Cyber Hunt Lab SRE.
Sua missão é escanear o código fonte abaixo e identificar vulnerabilidades reais, gargalos de latência, códigos ineficientes, segredos expostos, erros de login ou vulnerabilidades do OWASP Top 10.

Você deve responder APENAS com um array JSON válido que possa ser parseado diretamente por JSON.parse() no JavaScript. Não introduza blocos de markdown adicionais ou papo furado. Não coloque tags \`\`\`json ou \`\`\`. Retorne APENAS o array plano contendo objetos com esta estrutura exata:
[
  {
    "id": "vulnerabilidade_gerada_id",
    "name": "Nome da Vulnerabilidade / Erro Encontrado",
    "file": "Nome exato do arquivo (ex: src/components/Login.tsx)",
    "line": 42,
    "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
    "description": "Explicação clara e objetiva do erro/vulnerabilidade, detalhando o impacto de desempenho, segurança ou latência.",
    "fixSuggested": "O código exato corrigido pronto para ser substituído.",
    "category": "Segurança" | "Desempenho" | "OWASP" | "Configuração" | "Autenticação"
  }
]

Se nenhum problema for detectado, retorne um array vazio [].
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Analise as seguintes fontes de dados:\n\n${codePayloadData}`,
      config: {
        systemInstruction: systemPromptMessage,
        temperature: 0.2,
      }
    });

    const aiOutput = response.text || "[]";
    
    // Safe parse JSON from raw text or markdown encapsulated JSON
    let parseable = aiOutput.trim();
    if (parseable.startsWith("```json")) {
      parseable = parseable.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (parseable.startsWith("```")) {
      parseable = parseable.replace(/^```/, "").replace(/```$/, "").trim();
    }

    let vulnerabilities = [];
    try {
      vulnerabilities = JSON.parse(parseable);
    } catch {
      // Fallback regex extract JSON array
      const matches = parseable.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (matches) {
        vulnerabilities = JSON.parse(matches[0]);
      } else {
        vulnerabilities = [];
      }
    }

    // Assure id for each item
    vulnerabilities = vulnerabilities.map((v: any, index: number) => ({
      ...v,
      id: v.id || `vuln_sre_${Date.now()}_${index}`,
      line: Number(v.line) || 1
    }));

    // Calculate simulated code integrity score
    let scoreBase = 100;
    vulnerabilities.forEach((v: any) => {
      if (v.severity === "CRITICAL") scoreBase -= 25;
      else if (v.severity === "HIGH") scoreBase -= 15;
      else if (v.severity === "MEDIUM") scoreBase -= 8;
      else scoreBase -= 3;
    });
    const finalScore = Math.max(10, scoreBase);
    let grade = "A+";
    if (finalScore < 50) grade = "F";
    else if (finalScore < 70) grade = "D";
    else if (finalScore < 80) grade = "C";
    else if (finalScore < 90) grade = "B";
    else if (finalScore < 98) grade = "A";

    return res.json({
      status: "SUCCESS",
      vulnerabilities,
      score: finalScore,
      grade,
      summary: `Auditoria SRE concluída. Foram analisados ${validFiles.length} arquivos, identificando ${vulnerabilities.length} alertas em tempo real.`
    });

  } catch (err: any) {
    console.error("[SECURITY_SCAN_ERROR]", err.message);
    return res.status(500).json({ status: "ERROR", detail: err.message || "Erro interno ao varrer código fonte com Gemini." });
  }
});

app.post("/api/security/auto-fix", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { path, content, vulnerabilityName, vulnerabilityDescription, fixSuggested } = req.body;

  if (!content) {
    return res.status(400).json({ status: "ERROR", detail: "O conteúdo original do arquivo é obrigatório para refatoração." });
  }

  try {
    const ai = getAiClient();
    
    const promptMessage = `
Você é o mais avançado Engenheiro de Software SRE e Auditor Militar de Segurança da Cyber Hunt Lab.
Você deve corrigir AUTOMATICAMENTE a vulnerabilidade "${vulnerabilityName}" no arquivo "${path || "código_original.tsx"}".

Descrição da Vulnerabilidade:
"${vulnerabilityDescription}"

Sugestão de Correção Inicial:
"${fixSuggested || "Substituir trecho por código limpo"}"

Aqui está o CÓDIGO FONTE COMPLETO original do arquivo para que você possa entender o contexto e retornar o arquivo corrigido preservando todas as outras lógicas, importações, nomes de variáveis e estruturas de forma impecável:

--- INÍCIO DO CÓDIGO ---
${content}
--- FIM DO CÓDIGO ---

Por favor, reescreva o arquivo de código fonte acima aplicando a correção. Garanta desempenho, remova latências escondidas de login, livre o código de exploits e certifique que o arquivo permaneça compilando perfeitamente.
IMPORTANTE: Retorne APENAS o código fonte final completo do arquivo corrigido estruturado eletronicamente. Não inclua observações, tags de markdown extras ou papos explicativos antes ou depois. Comece a resposta diretamente com o código.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptMessage,
      config: {
        temperature: 0.1,
      }
    });

    let correctedCode = response.text || content;
    // Strip markdown formatting if any was returned despite system instructions
    if (correctedCode.trim().startsWith("```")) {
      const firstLineBreak = correctedCode.indexOf("\n");
      correctedCode = correctedCode.slice(firstLineBreak + 1);
      if (correctedCode.trim().endsWith("```")) {
        correctedCode = correctedCode.slice(0, correctedCode.lastIndexOf("```"));
      }
    }

    return res.json({
      status: "SUCCESS",
      correctedCode: correctedCode.trim()
    });

  } catch (err: any) {
    console.error("[AUTO_FIX_ERROR]", err.message);
    return res.status(500).json({ status: "ERROR", detail: err.message || "Erro interno ao compilar correções automáticas com Gemini." });
  }
});

// ============================================================
// SUBSCRIPTION TIER INTERACTIVE MOCK
// ============================================================

app.post("/api/user/tier", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { tier } = req.body;

  if (!["free", "premium", "expert"].includes(tier)) {
    return res.status(400).json({ status: "ERROR", detail: "Plano inválido selecionado." });
  }

  try {
    const updatedUser = dbService.updateUserTier(req.user!.id, tier);
    return res.json({ status: "SUCCESS", user: updatedUser });
  } catch (err: any) {
    return res.status(500).json({ status: "ERROR", detail: "Incapaz de atualizar plano." });
  }
});

// ============================================================
// SYSTEM GLOBAL CONFIG & ADMIN APIS
// ============================================================

function authenticateAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  authenticateToken(req, res, () => {
    if (req.user && req.user.role === "admin") {
      next();
    } else {
      return res.status(403).json({ status: "ERROR", detail: "Acesso reservado exclusivamente para administradores." });
    }
  });
}

// Public configurations getter
app.get("/api/config/global", (req: Request, res: Response) => {
  try {
    const config = dbService.getGlobalConfig();
    return res.json({ status: "SUCCESS", config });
  } catch (err: any) {
    return res.status(500).json({ status: "ERROR", detail: "Erro ao ler configurações de sistema." });
  }
});

app.post("/api/github/token", async (req: Request, res: Response) => {
  const { code, client_id, client_secret, redirect_uri } = req.body;
  if (!code || !client_id || !client_secret) {
    return res.status(400).json({ status: "ERROR", detail: "Parâmetros OAuth insuficientes fornecidos." });
  }

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id,
        client_secret,
        code,
        redirect_uri
      })
    });
    
    // Some endpoints return text, but we specified Accept: application/json
    const data = await response.json();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ status: "ERROR", detail: err.message });
  }
});

// Server-side GitHub OAuth Redirect Interceptor for frame/popup sync
app.get(["/auth/callback", "/auth/callback/"], (req: Request, res: Response) => {
  const code = req.query.code || "";
  const error = req.query.error || req.query.error_description || "";
  
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Autenticação GitHub...</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: #020617;
          color: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          text-align: center;
        }
        .container {
          padding: 2rem;
          border-radius: 1rem;
          background-color: #0f172a;
          border: 1px solid #1e293b;
          max-width: 400px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        }
        h3 { margin-top: 0; color: #6366f1; font-weight: 700; }
        p { color: #94a3b8; font-size: 0.875rem; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <h3>Autenticação Concluída</h3>
        <p>Vinculando a sua conta e fechando esta janela automaticamente...</p>
      </div>
      <script>
        const code = "${code}";
        const error = "${error}";
        
        try {
          if (code) {
            localStorage.setItem("gh_oauth_temp_code", code);
          } else if (error) {
            localStorage.setItem("gh_oauth_temp_error", error);
          }
        } catch (e) {
          console.error("Falha ao salvar no localStorage no callback", e);
        }

        if (window.opener) {
          try {
            if (code) {
              window.opener.postMessage({ type: "GITHUB_OAUTH_CODE", code: code }, "*");
            } else {
              window.opener.postMessage({ type: "GITHUB_OAUTH_ERROR", error: error || "Falha na autorização" }, "*");
            }
          } catch (e) {
            console.error("Falha ao invocar postMessage no pai", e);
          }
          setTimeout(() => {
            window.close();
          }, 1200);
        } else {
          // Se não houver opener (por exemplo, aberto diretamente no celular), volta ao app usando a url de origem
          setTimeout(() => {
            const returnUrl = localStorage.getItem("gh_oauth_return_url") || "/";
            localStorage.removeItem("gh_oauth_return_url");
            window.location.href = returnUrl;
          }, 1500);
        }
      </script>
    </body>
    </html>
  `);
});

// Admin update configs
app.put("/api/admin/update-checkout", authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { siteName, monthlyCheckoutUrl, annualCheckoutUrl, address, phone } = req.body;
  try {
    const updated = dbService.updateGlobalConfig({
      siteName,
      monthlyCheckoutUrl,
      annualCheckoutUrl,
      address,
      phone
    });
    return res.json({ status: "SUCCESS", config: updated });
  } catch (err: any) {
    return res.status(500).json({ status: "ERROR", detail: "Erro ao atualizar as configurações globais." });
  }
});

// Admin list users
app.get("/api/admin/users", authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = dbService.getUsers().map(({ passwordHash, ...u }) => u);
    return res.json({ status: "SUCCESS", users });
  } catch (err: any) {
    return res.status(500).json({ status: "ERROR", detail: "Falta de permissão ao recuperar usuários." });
  }
});

// Admin activate users premium / custom tiers
app.post("/api/admin/activate-premium", authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { userId, tier } = req.body;
  if (!userId) {
    return res.status(400).json({ status: "ERROR", detail: "userId é requerido no body." });
  }
  try {
    const updatedUser = dbService.updateUserTier(userId, tier || "premium");
    if (!updatedUser) {
      return res.status(404).json({ status: "ERROR", detail: "Usuário não localizado." });
    }
    return res.json({ status: "SUCCESS", user: updatedUser });
  } catch (err: any) {
    return res.status(500).json({ status: "ERROR", detail: "Falha ao acionar ativação premium." });
  }
});

// Admin list active sessions
app.get("/api/admin/sessions", authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessions = dbService.getActiveSessions();
    return res.json({ status: "SUCCESS", sessions });
  } catch (err: any) {
    return res.status(500).json({ status: "ERROR", detail: "Falha ao recuperar sessões ativas de rede." });
  }
});

// Admin terminate a specific active session
app.delete("/api/admin/sessions/:jti", authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { jti } = req.params;
  try {
    const success = dbService.deleteSession(jti);
    if (!success) {
      return res.status(404).json({ status: "ERROR", detail: "Sessão não foi localizada ou já expirou." });
    }
    return res.json({ status: "SUCCESS", message: "Sessão remetente derrubada e invalidada com sucesso." });
  } catch (err: any) {
    return res.status(500).json({ status: "ERROR", detail: "Erro ao tentar remover a sessão de rede." });
  }
});

// ============================================================
// SERVER SETUP + VITE INTEGRATION
// ============================================================

async function startServer() {
  // Vite integration for rich development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Catch-all server process errors logic
  process.on("uncaughtException", (error: Error) => {
    console.error("[UNCAUGHT_EXCEPTION] Um erro catastrófico não tratado preventivamente ocorreu:", error.message);
  });

  process.on("unhandledRejection", (reason: any) => {
    console.error("[UNHANDLED_REJECTION] Uma promessa pendente foi rejeitada sem tratamento:", reason);
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n[🦾 PromptForge AI] Servidor rodando em modo full-stack ativo.`);
    console.log(`[+] Acesse através do portal de escuta: http://localhost:${PORT}\n`);
  });
}

startServer();
