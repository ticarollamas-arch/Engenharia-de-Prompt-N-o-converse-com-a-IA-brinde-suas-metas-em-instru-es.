/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Plus, Trash, LayoutTemplate, HelpCircle, Save, Check, Sparkles, Cpu, AlertCircle } from "lucide-react";
import { CustomTemplate } from "../types";
import { apiRequest } from "../services/apiGateway";

interface TemplateManagerProps {
  isAuthenticated: boolean;
  onOpenAuth: () => void;
  templates: CustomTemplate[];
  onRefreshTemplates: () => void;
}

export default function TemplateManager({ isAuthenticated, onOpenAuth, templates, onRefreshTemplates }: TemplateManagerProps) {
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("Tecnologia & Software");
  const [profession, setProfession] = useState("Engenheiro de Software");
  const [sections, setSections] = useState<string[]>([
    "**Contexto Principal:** {task_description}",
    "**Diretrizes Técnicas:** Requisitos e restrições de código do sistema.",
    "**Tratamento de Exceções:** Como a IA resolve bugs ou falhas de api."
  ]);
  const [newSectionText, setNewSectionText] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAddSection = () => {
    if (!newSectionText.trim()) return;
    setSections([...sections, newSectionText]);
    setNewSectionText("");
  };

  const handleRemoveSection = (index: number) => {
    const updated = [...sections];
    updated.splice(index, 1);
    setSections(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }

    if (!name.trim()) {
      setError("Dê um nome amigável ao seu template.");
      return;
    }

    if (sections.length === 0) {
      setError("Adicione pelo menos uma seção estrutural ao seu template.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest("/api/templates", {
        method: "POST",
        body: JSON.stringify({ name, niche, profession, sections })
      });

      if (response.status === "SUCCESS") {
        setSuccess("Template estrutural customizado salvo com sucesso!");
        setName("");
        setSections([
          "**Contexto Principal:** {task_description}",
          "**Diretrizes Técnicas:** Requisitos e restrições de código do sistema."
        ]);
        onRefreshTemplates();
      } else {
        setError(response.detail || "Ops, erro ao salvar template.");
      }
    } catch (err) {
      setError("Erro ao se conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const response = await apiRequest(`/api/templates/${templateId}`, {
        method: "DELETE"
      });
      if (response.status === "SUCCESS") {
        onRefreshTemplates();
      }
    } catch (err) {
      console.error("Falha ao remover template:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Editor Panel */}
      <div className="lg:col-span-7 p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <LayoutTemplate className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-100">CRIAR TEMPLATE DE ENGENHARIA PERSONALIZADO</h3>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-green-950/40 border border-green-500/30 text-green-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-12">
              <label className="block text-xs font-semibold text-slate-400 mb-1">NOME DO TEMPLATE</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Padrão SRE API Modular, Checklist Médico Inicial"
                className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-700"
              />
            </div>

            <div className="md:col-span-6">
              <label className="block text-xs font-semibold text-slate-400 mb-1">NICHO</label>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full h-10 px-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 text-xs focus:outline-none"
              >
                <option value="Tecnologia & Software">Tecnologia & Software</option>
                <option value="Saúde & Medicina">Saúde & Medicina</option>
                <option value="Marketing, Vendas & Growth">Marketing, Vendas & Growth</option>
                <option value="Direito & Advocacia">Direito & Advocacia</option>
                <option value="Educação & Ensino">Educação & Ensino</option>
              </select>
            </div>

            <div className="md:col-span-6">
              <label className="block text-xs font-semibold text-slate-400 mb-1">PROFISSÃO</label>
              <input
                type="text"
                required
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="Ex: Engenheiro Backend, UX Writer"
                className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-700"
              />
            </div>
          </div>

          {/* Sections manager list */}
          <div className="border-t border-slate-800/60 pt-3">
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">
              SEÇÕES MANDATÓRIAS DO TEMPLATE ({sections.length})
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {sections.map((section, index) => (
                <div key={index} className="flex gap-2 items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[11px] font-bold text-indigo-400 font-mono">#{index + 1}</span>
                  <p className="text-slate-300 text-xs font-mono flex-1 truncate">{section}</p>
                  <button
                    type="button"
                    onClick={() => handleRemoveSection(index)}
                    className="p-1 hover:text-red-400 text-slate-500 transition focus:outline-none"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Form to append section */}
            <div className="flex gap-2 mt-2.5">
              <input
                type="text"
                value={newSectionText}
                onChange={(e) => setNewSectionText(e.target.value)}
                placeholder="Ex: **Exemplo de Entrada/Saída:** Exemplo prático..."
                className="flex-1 h-9 px-3 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSection}
                className="w-9 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-slate-100 flex items-center justify-center transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-bold transition shadow-lg flex items-center justify-center gap-2 active:scale-95"
          >
            {loading ? "Salvando..." : <><Save className="w-4 h-4" /> Gravar Novo Preset Técnico</>}
          </button>
        </form>
      </div>

      {/* Library of existing custom templates */}
      <div className="lg:col-span-5 p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-slate-100">MEUS PRESETS CUSTOMIZADOS ({templates.length})</h3>
        </div>

        {templates.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center text-slate-500">
            <LayoutTemplate className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-bold text-slate-400">Nenhum preset gravado</p>
            <p className="text-[10px] text-slate-600 mt-1">
              Escreva novas regras na lateral para modularizar a fabricação de prompts.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {templates.map((tmpl) => (
              <div key={tmpl.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-800 flex items-start gap-3 justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{tmpl.name}</h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="py-0.5 px-2 bg-slate-900 text-indigo-400 text-[9px] font-bold rounded">
                      {tmpl.niche.split(" ")[0]}
                    </span>
                    <span className="text-[10px] text-slate-500">→ {tmpl.profession}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-mono mt-1.5">
                    Contém {tmpl.sections.length} diretrizes mandatórias
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteTemplate(tmpl.id)}
                  className="p-1 hover:text-red-400 text-slate-500 hover:bg-red-950/25 rounded transition"
                  title="Excluir preset"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
