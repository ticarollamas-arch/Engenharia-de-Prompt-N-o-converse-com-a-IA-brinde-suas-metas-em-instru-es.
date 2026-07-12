/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Trash, Copy, Check, Star, Bookmark, BookmarkCheck, Search, Info, Grid, List, Sparkles, Filter, AlertCircle, Cpu, HeartPulse, Scale, GraduationCap, TrendingUp, HelpCircle } from "lucide-react";
import { PromptHistoryItem } from "../types";
import { apiRequest } from "../services/apiGateway";

const iconMap: Record<string, any> = {
  "Tecnologia & Software": Cpu,
  "Saúde & Medicina": HeartPulse,
  "Marketing, Vendas & Growth": TrendingUp,
  "Direito & Advocacia": Scale,
  "Educação & Ensino": GraduationCap
};

interface LibraryViewProps {
  prompts: PromptHistoryItem[];
  onDelete: (id: string) => void;
  onFavoriteToggle: (id: string) => void;
  onRate: (id: string, stars: number) => void;
  onSelectPrompt: (prompt: PromptHistoryItem) => void;
}

export default function LibraryView({ prompts, onDelete, onFavoriteToggle, onRate, onSelectPrompt }: LibraryViewProps) {
  const [filterType, setFilterType] = useState<"all" | "favorites">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNicheFilter, setSelectedNicheFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Filter history based on search, favorites option, and niches
  const filteredPrompts = prompts.filter((p) => {
    const matchesSearch = p.task.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.profession.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFavorite = filterType === "all" || p.favorited;
    const matchesNiche = selectedNicheFilter === "all" || p.niche === selectedNicheFilter;

    return matchesSearch && matchesFavorite && matchesNiche;
  });

  const uniqueNiches = ["all", ...Array.from(new Set(prompts.map((p) => p.niche)))];

  return (
    <div className="space-y-4">
      {/* Search and Quick Filters bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search */}
        <div className="relative md:col-span-6">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por tarefa do prompt, profissão..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
          />
        </div>

        {/* Favorite toggle filter */}
        <div className="md:col-span-3 flex rounded-xl border border-slate-800 p-0.5 bg-slate-950">
          <button
            onClick={() => setFilterType("all")}
            className={`flex-1 h-9 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterType === "all"
                ? "bg-slate-900 text-slate-100"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Todos ({prompts.length})
          </button>
          <button
            onClick={() => setFilterType("favorites")}
            className={`flex-1 h-9 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterType === "favorites"
                ? "bg-slate-900 text-slate-100"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Sinalizados ({prompts.filter(p => p.favorited).length})
          </button>
        </div>

        {/* Niches Filter */}
        <div className="md:col-span-3">
          <select
            value={selectedNicheFilter}
            onChange={(e) => setSelectedNicheFilter(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 text-xs focus:outline-none"
          >
            <option value="all">Filtrar por Nicho (Tudo)</option>
            {uniqueNiches.filter(n => n !== "all").map((niche) => (
              <option key={niche} value={niche}>
                {niche}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredPrompts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-slate-800/60 bg-slate-950/20 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
            <Filter className="w-5 h-5 animate-pulse" />
          </div>
          <p className="text-slate-300 text-sm font-semibold">Nenhum prompt disponível no momento</p>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            Experimente mudar os parâmetros dos filtros ou fabrique um prompt usando o formulário para preencher sua biblioteca.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts.map((item) => {
            const NicheIcon = iconMap[item.niche] || HelpCircle;
            const dateStr = new Date(item.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "2-digit"
            });

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between p-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 transition duration-200"
              >
                <div>
                  {/* Category + Title bar */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                      <NicheIcon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{item.niche.split("&")[0]}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Favorite button */}
                      <button
                        onClick={() => onFavoriteToggle(item.id)}
                        className={`p-1 rounded hover:bg-slate-800/80 transition ${
                          item.favorited ? "text-amber-500" : "text-slate-600 hover:text-slate-400"
                        }`}
                        title="Favoritar / Marcar"
                      >
                        {item.favorited ? (
                          <BookmarkCheck className="w-4 h-4 fill-current" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>

                      {/* Trash Delete */}
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-950/20 transition"
                        title="Excluir do histórico"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Profession badge */}
                  <div className="mb-2.5">
                    <span className="inline-block py-0.5 px-2 bg-slate-900 text-indigo-300 text-[10px] font-bold rounded-md border border-indigo-500/10">
                      {item.profession}
                    </span>
                  </div>

                  {/* Task description */}
                  <p className="text-slate-200 text-xs font-semibold font-sans line-clamp-2 leading-relaxed mb-3">
                    {item.task}
                  </p>
                </div>

                {/* Footer and instant Actions */}
                <div className="border-t border-slate-800/50 pt-2.5 mt-2 flex items-center justify-between">
                  {/* Stars list rating */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((st) => (
                      <button
                        key={st}
                        onClick={() => onRate(item.id, st)}
                        className={`p-0.5 hover:scale-110 transition ${
                          (item.rating || 0) >= st ? "text-amber-400" : "text-slate-700"
                        }`}
                      >
                        <Star className="w-3 h-3 fill-current" />
                      </button>
                    ))}
                  </div>

                  {/* Date & Copy actions */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">{dateStr}</span>
                    <button
                      onClick={() => handleCopy(item.prompt, item.id)}
                      className={`h-7 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                        copiedId === item.id
                          ? "bg-green-600/10 border border-green-500/30 text-green-400"
                          : "bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-slate-100"
                      }`}
                    >
                      {copiedId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedId === item.id ? "Copiado!" : "Copiar"}
                    </button>
                    
                    {/* Select/View prompt */}
                    <button
                      onClick={() => onSelectPrompt(item)}
                      className="h-7 px-2 border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 text-[10px] font-bold rounded-lg hover:border-slate-700 transition"
                    >
                      Ver
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
