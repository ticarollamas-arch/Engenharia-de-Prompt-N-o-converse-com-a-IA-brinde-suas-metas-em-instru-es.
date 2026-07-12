/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, Cpu, HeartPulse, Scale, GraduationCap, TrendingUp, HelpCircle, AlertCircle, Play, ChevronRight, Settings, Info } from "lucide-react";
import { Category } from "../types";
import { apiRequest } from "../services/apiGateway";

const iconMap: Record<string, any> = {
  Cpu,
  HeartPulse,
  Scale,
  GraduationCap,
  TrendingUp
};

interface PromptGeneratorFormProps {
  isAuthenticated: boolean;
  onGenerationSuccess: (prompt: string, record: any) => void;
  onOpenAuth: () => void;
  userTier: string;
}

export default function PromptGeneratorForm({ isAuthenticated, onGenerationSuccess, onOpenAuth, userTier }: PromptGeneratorFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedNiche, setSelectedNiche] = useState<string>("");
  const [selectedProfession, setSelectedProfession] = useState<string>("");
  const [task, setTask] = useState<string>("");
  const [detailLevel, setDetailLevel] = useState<string>("Avançado");
  const [outputFormat, setOutputFormat] = useState<string>("Markdown");
  const [tone, setTone] = useState<string>("Profissional, Técnico e Preciso");
  const [customInstructions, setCustomInstructions] = useState<string>("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [presetSuggestions, setPresetSuggestions] = useState<string[]>([]);

  // Load niches and professions from API
  useEffect(() => {
    async function loadCategories() {
      const resp = await apiRequest("/api/categories");
      if (resp.status === "SUCCESS") {
        setCategories(resp.categories);
        // auto select first
        if (resp.categories.length > 0) {
          setSelectedNiche(resp.categories[0].name);
        }
      }
    }
    loadCategories();
  }, []);

  // Update profession when niche changes
  useEffect(() => {
    if (selectedNiche && categories.length > 0) {
      const niche = categories.find(n => n.name === selectedNiche);
      if (niche && niche.professions.length > 0) {
        setSelectedProfession(niche.professions[0]);
      }
    }
  }, [selectedNiche, categories]);

  // Load preset suggestions relative to profession
  useEffect(() => {
    if (selectedProfession === "Engenheiro de Software") {
      setPresetSuggestions([
        "Implementar uma árvore de busca binária balanceada com testes unitários em TypeScript",
        "Criar um middleware Express resiliente que proteja contra injeções e registre requests",
        "Escrever um helper que faça polling de tarefas agendadas em Node.js com tratamento de falhas"
      ]);
    } else if (selectedProfession === "Médico Generalista") {
      setPresetSuggestions([
        "Criação de um prontuário preliminar de telemedicina para dor de garganta com tosse seca",
        "Desenhar plano de acompanhamento de hipertensão arterial leve controlada para paciente de 45 anos",
        "Diferencial inicial de cefaleia em salvas contra enxaqueca crônica recorrente"
      ]);
    } else if (selectedProfession === "Copywriter de Conversão") {
      setPresetSuggestions([
        "Elaborar copy de e-mail de vendas para lançamento de SaaS de IA focado em CEOs",
        "Criar título, subtítulo e CTA matadores para landing page de curso de programação",
        "Estrutura completa de anúncios no Facebook Ads seguindo o framework AIDA para e-commerce"
      ]);
    } else {
      setPresetSuggestions([
        "Fazer plano de aula prático com objetivos mensuráveis alinhado com Taxonomia de Bloom",
        "Produzir minuta simplificada de Contrato de NDA entre Startup e Desenvolvedor",
        "Elaborar planejamento de portfólio para perfil moderado com foco em dividendos"
      ]);
    }
  }, [selectedProfession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }

    if (!task.trim()) {
      setError("A especificação da sua tarefa/objetivo é fundamental.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest("/api/prompts/generate", {
        method: "POST",
        body: JSON.stringify({
          niche: selectedNiche,
          profession: selectedProfession,
          task,
          detailLevel,
          outputFormat,
          tone,
          customInstructions
        })
      });

      if (response.status === "SUCCESS") {
        onGenerationSuccess(response.prompt, response.record);
        // Clear task if required, keeping selection
        // setTask("");
      } else {
        setError(response.detail || "Erro de resposta da IA.");
      }
    } catch (err: any) {
      setError("Erro ao tentar falar com os servidores da PromptForge.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Niches */}
      <div>
        <label className="block text-xs font-bold text-slate-400 tracking-wider mb-2.5 uppercase">
          1. SELECIONE O SEU NICHO DE ATUAÇÃO
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {categories.map((cat) => {
            const IconComponent = iconMap[cat.icon] || Sparkles;
            const isSelected = selectedNiche === cat.name;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedNiche(cat.name)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 active:scale-95 cursor-pointer max-md:py-4 ${
                  isSelected
                    ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
                style={{ minHeight: "44px" }}
              >
                <IconComponent className="w-5 h-5 mb-1.5" />
                <span className="text-[11px] font-semibold leading-tight">{cat.name.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profession Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-400 tracking-wider mb-1.5 uppercase">
            PROFISSÃO ALVO DA IA
          </label>
          <select
            value={selectedProfession}
            onChange={(e) => setSelectedProfession(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition"
          >
            {categories
              .find((cat) => cat.name === selectedNiche)
              ?.professions.map((prof) => (
                <option key={prof} value={prof}>
                  {prof}
                </option>
              ))}
          </select>
        </div>

        {/* Level of Details */}
        <div>
          <label className="block text-xs font-bold text-slate-400 tracking-wider mb-1.5 uppercase">
            NÍVEL DE RIGOR / DETALHE
          </label>
          <div className="grid grid-cols-3 gap-2">
            {["Básico", "Intermediário", "Avançado"].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setDetailLevel(lvl)}
                className={`h-11 rounded-xl text-xs font-semibold border transition active:scale-95 cursor-pointer ${
                  detailLevel === lvl
                    ? "bg-indigo-600/10 border-indigo-500 text-indigo-400"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task input */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase">
            DESCREVA A TAREFA QUE VOCÊ DESEJA EXECUTAR
          </label>
          <span className="text-[10px] text-slate-500 font-mono">
            Copie uma sugestão abaixo
          </span>
        </div>
        <textarea
          rows={3}
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Ex: Criar uma API REST modular em Node.js com suporte a rate-limiting..."
          className="w-full p-3.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition leading-relaxed min-h-[90px]"
        />

        {/* Interactive presets badges */}
        <div className="mt-2.5 space-y-1.5">
          <p className="text-[10px] text-slate-500 font-semibold tracking-wide">💡 SUGESTÕES PARA ESTA PROFISSÃO:</p>
          <div className="flex flex-col gap-1.5">
            {presetSuggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTask(sug)}
                className="text-left text-xs bg-slate-950 hover:bg-slate-800/50 border border-slate-800/40 text-slate-400 hover:text-indigo-300 py-1.5 px-3 rounded-lg truncate transition active:scale-[0.99]"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Settings Panel (Accordion details) */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase select-none border-b border-slate-800/50 pb-2">
          <Settings className="w-4 h-4 text-indigo-400" />
          Configurações Avançadas de Formato e Tom
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase">
              Formato de Resposta Esperado
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {["Markdown", "Texto Puro", "JSON", "Código"].map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setOutputFormat(fmt)}
                  className={`h-9 px-1 rounded-lg text-[10px] font-bold border transition duration-150 ${
                    outputFormat === fmt
                      ? "bg-slate-800 border-indigo-400 text-indigo-300"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase">
              Tom de Escrita da IA Final
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full h-9 px-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 text-xs focus:outline-none"
            >
              <option value="Profissional, Técnico e Preciso">Profissional, Técnico e Preciso</option>
              <option value="Persuasivo, Empático e Direcionado">Persuasivo, Empático e Direcionado</option>
              <option value="Acadêmico, Formal e Clínico">Acadêmico, Formal e Clínico</option>
              <option value="Simples, Didático e Acessível">Simples, Didático e Acessível</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase">
            Instruções Adicionais Customizadas (Opcional)
          </label>
          <input
            type="text"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Ex: Adicionar tratamento contra SQLi, incluir referências científicas reais, etc."
            className="w-full h-9 px-3 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 text-xs focus:outline-none placeholder:text-slate-700"
          />
        </div>
      </div>

      {/* Submit Action boundary */}
      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-slate-100 font-bold text-sm tracking-wide transition shadow-lg shadow-indigo-600/10 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center gap-2.5">
              <div className="w-5 h-5 border-2 border-slate-100/30 border-t-slate-100 rounded-full animate-spin" />
              Fabricando Super Prompt...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Play className="w-4 h-4 fill-current" />
              {isAuthenticated ? "Fabricar Prompt de Engenharia" : "Registrar para Fabricar"}
            </span>
          )}
        </button>
        {!isAuthenticated && (
          <p className="text-center text-[11px] text-slate-500 mt-2">
            * É necessário realizar cadastro grátis para salvar o histórico e usufruir de créditos de IA.
          </p>
        )}
      </div>
    </form>
  );
}
