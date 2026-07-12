# 👑 Bancada Prompt: Orquestrador de Engenharia e Blindagem de Instruções Sênior

A **Bancada Prompt** é um motor de orquestração técnica e governança cognitiva de nível corporativo, projetado para garantir robustez, alta fidelidade e cibersegurança de instruções estruturadas destinadas a grandes modelos de linguagem (LLMs). O sistema substitui fluxos informais de escrita de prompts por sandboxes de execução isolados, blindagem rigorosa contra ataques de injeção semântica e mecanismos de isolamento de contexto.

Concebido sob uma arquitetura de microsserviços desacoplada e resiliente, o software fornece uma suíte completa para tradução de regras de negócio complexas em payloads padronizados e blindados. É a solução ideal para times de SRE, DevSecOps, auditorias de governança de dados e engenharia de software de alta performance.

---

## ⚡ Links Rápidos de Acesso e Demonstração

Para facilitar a avaliação da infraestrutura, arquitetura e execução em tempo real, utilize os seguintes canais:

*   **🌐 [Demonstração ao Vivo (Production Preview)](https://ais-pre-mpeuzkvwetxv36felaeerz-13767980963.us-west2.run.app)**: Instância de produção ativa executando o barramento do portal e a interface corporativa.
*   **⚡ [Remixar e Clonar no Google AI Studio](https://ai.studio/build/00e287f6-a979-4348-b38c-551fe3514ad6)**: Clone o espaço de trabalho completo em sua conta com um clique para executar testes, auditar o código-fonte em tempo real ou provisionar sua própria infraestrutura em containers.

---

## 🧱 Arquitetura e Fluxo do Sistema

O motor opera através de um pipeline desacoplado que valida esquemas de entrada na borda, envolve a instrução original em camadas determinísticas de sandbox cognitivo e gerencia contingências em tempo real via **Circuit Breaker**.

```
                                 [REQUISIÇÃO DO CLIENTE]
                                            │
                                            ▼
                                   [UNIFIED AUTH / RBAC]
                                            │
                                            ▼
                           [ORCHESTRATOR COGNITIVE SANDBOX]
                                            │
                  ┌─────────────────────────┴─────────────────────────┐
                  ▼                                                   ▼
       [ATIVADO: HIGH FIDELITY]                            [ATIVADO: ETHICAL SANDBOX]
                  │                                                   │
                  ▼                                                   ▼
      [CIRCUIT BREAKER CONTROL]                           [BLINDAGEM CONTRA INJEÇÃO]
                  │                                                   │
                  └─────────────────────────┬─────────────────────────┘
                                            ▼
                                  [WINSTON SRE LOGS]
                                            │
                                            ▼
                                  [LOCAL SQL/JSON DB]
```

### Componentes Fundamentais

1.  **Sandbox Cognitivo (Isolamento de Contexto)**: Restringe o escopo de interpretação do LLM estritamente às diretrizes do negócio definidas no template de instrução. Proíbe alucinações semânticas e desvios de escopo através de metaprompting estruturado.
2.  **Circuit Breaker Automático**: Classe de contingência embutida que monitora a latência e a taxa de erros nas chamadas de APIs de linguagem externas. Caso os limites estritos configurados sejam atingidos, o sistema entra em estado *Open* e chaveia de forma transparente para barramentos locais ou de contingência sem interrupção de serviço.
3.  **Idempotência e Webhooks Transacionais**: Processamento de eventos externos com proteção contra concorrência e replay attacks. O pipeline valida assinaturas digitais, evita reprocessamento de transações repetidas e gerencia o provisionamento automático de acessos.
4.  **Log de Observabilidade Estruturada (SRE)**: Monitoramento completo integrado via Winston, gerando logs em formato JSON padronizado na saída padrão (stdout/stderr) contendo carimbos de data/hora ISO-8601, correlação de Transaction-ID e payloads sanitizados para indexação direta em ferramentas como CloudWatch, Datadog ou ELK.

---

## 🛠️ Stack Tecnológica e Engenharia de Produção

*   **Runtime & Linguagem**: Node.js v18+, TypeScript estrito (compilação validada no pipeline de CI/CD).
*   **Backend Engine**: Express com middlewares customizados de tratamento atômico de erros e isolamento de rotas.
*   **Validação de Contratos**: Zod (sanitização rígida de entradas de dados e prevenção de payloads corrompidos).
*   **Build System**: `esbuild` otimizado para bundling unificado do backend em formato CommonJS (`.cjs`), resolvendo todas as dependências locais em tempo de compilação para inicialização acelerada e mitigação de *cold-starts* de container.
*   **Frontend UX/UI**: React 19 (SPA de alto contraste), integrado a animações fluidas via Motion (Motion/React) e estilização de altíssima performance via Tailwind CSS v4.
*   **Biblioteca de Elementos Gráficos**: Lucide React (comunicação de componentes com alta resolução).

---

## 🚀 Configuração, Inicialização e Deployment

### Pré-requisitos
*   Node.js v18.0.0 ou superior.
*   Gerenciador de pacotes NPM (nativo do Node).

### Instalação

1.  Clone este repositório de engenharia:
    ```bash
    git clone https://github.com/ana-caroline-lamas/bancada-prompt.git
    cd bancada-prompt
    ```

2.  Instale as dependências estruturadas do projeto:
    ```bash
    npm install
    ```

3.  Configure o arquivo de variáveis de ambiente:
    ```bash
    cp .env.example .env
    ```
    Configure as chaves e tokens de comunicação necessários, incluindo `GEMINI_API_KEY`, `APP_URL` e `JWT_SECRET`.

### Execução em Desenvolvimento

Inicie o servidor de desenvolvimento assistido TypeScript via `tsx` (carregamento automático de alterações e suporte nativo a ESM):
```bash
npm run dev
```
O console registrará o bootstrap inicial e a escuta na porta padrão do proxy reverso: **3000** (`http://localhost:3000`).

### Compilação de Produção e Inicialização

O pipeline de build realiza o empacotamento dos recursos de frontend em arquivos estáticos minificados e gera o bundler unificado do servidor:

1.  Compile a aplicação inteira para distribuição de produção:
    ```bash
    npm run build
    ```

2.  Inicialize a aplicação compilada em modo de produção standalone:
    ```bash
    npm run start
    ```

---

## 📂 Organização Arquitetural do Código Fonte

A distribuição de arquivos do projeto reflete um padrão limpo de separação de responsabilidades (SoC), essencial para auditorias técnicas de arquitetura:

```
├── data-store.json       # Persistência atômica local com proteção de leitura/escrita simultânea
├── server.ts             # Entry point do servidor Express com roteamento e injeção de middlewares
├── server/
│   ├── db.ts             # Camada de abstração de dados (leitura, escrita e contingência local)
│   └── templates.ts      # Biblioteca de estruturas fundamentais de sandboxes semânticos
├── src/
│   ├── App.tsx           # Ponto de entrada do SPA com roteamento, sincronização de estado e visualização
│   ├── index.css         # Estrutura global de folhas de estilo (Tailwind CSS v4 + Fontes)
│   ├── main.tsx          # Ponto de bootstrap do ecossistema React do cliente
│   ├── types.ts          # Interfaces e contratos de dados tipados estritamente em TypeScript
│   ├── components/       # Componentes desacoplados de interface do usuário
│   │   ├── SalesPage.tsx # Página de conversão e conversação de planos premium
│   │   ├── AdminPanel.tsx# Painel de controle de governança administrativa
│   │   └── ...           # Módulos funcionais isolados
│   └── services/
│       └── apiGateway.ts # Barramento de comunicação do cliente com APIs REST de backend
```

---

## 🛡️ Diretrizes de Segurança, Governança e Blindagem

O ecossistema da **Bancada Prompt** adota o conceito de *Security by Design* para mitigar vulnerabilidades e ataques em nível de instrução:

*   **Mitigação Ativa de Prompt Injection**: As entradas de usuários finais são isoladas em payloads de dados estritos encapsulados em delimitadores semânticos. O sistema garante que nenhuma injeção externa altere as instruções estruturais de controle de fluxo de governança cognitiva.
*   **Erros Seguros (Data Leak Prevention)**: O tratamento de exceções de borda no Express impede o vazamento de stack traces de infraestrutura, caminhos de sistema de arquivos internos ou segredos de chaves de API para os clientes em caso de falha de conexão com terceiros.
*   **Isolamento de Privilégios (RBAC)**: Validação criptográfica de tokens JWT contendo níveis de acesso estruturados (ex: Usuário, Auditor e Administrador) com renovação periódica.
*   **Sanitização Bidirecional**: Validação de esquemas na entrada da API via contratos do Zod combinados com tratamento estrito de tipos no front-end para isolar o core do negócio de dados corrompidos.

---

## 👩‍💻 Liderança de Arquitetura e Engenharia de Software

O ecossistema **Bancada Prompt** foi planejado, arquitetado e implementado sob a liderança técnica e autoria de:

**Ana Caroline Lamas** — *Lead Software Architect & Principal Prompt Engineer*

---
<p align="center"><i>Bancada Prompt • Engenharia de instrução robusta de nível corporativo.</i></p>
