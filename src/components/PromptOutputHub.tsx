/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Copy, Download, Bookmark, BookmarkCheck, Star, ShieldCheck, Check, Sparkles, FileText, Info } from "lucide-react";
import { apiRequest } from "../services/apiGateway";

interface PromptOutputHubProps {
  promptText: string;
  record: any;
  onUpdateRecord: (updatedRecord: any) => void;
  onFavoriteToggle: () => void;
}

export default function PromptOutputHub({ promptText, record, onUpdateRecord, onFavoriteToggle }: PromptOutputHubProps) {
  const [copied, setCopied] = useState(false);
  const [hoverStar, setHoverStar] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  // Statistics calculation helpers
  const wordCount = promptText ? promptText.split(/\s+/).filter(Boolean).length : 0;
  const charCount = promptText ? promptText.length : 0;
  const estimatedTokens = Math.ceil(charCount / 3.9);

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    try {
      const fileName = `promptforge_${record?.profession || "engineered"}_prompt.md`
        .toLowerCase()
        .replace(/[^a-z0-9_.-]/g, "_");
      
      const blob = new Blob([promptText], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Falha ao efetuar download:", err);
    }
  };

  const handleRate = async (stars: number) => {
    if (!record?.id) return;
    setRatingLoading(true);
    try {
      const response = await apiRequest(`/api/prompts/${record.id}/rate`, {
        method: "POST",
        body: JSON.stringify({ rating: stars })
      });
      if (response.status === "SUCCESS") {
        onUpdateRecord(response.prompt);
      }
    } catch (err) {
      console.error("Falha ao registrar voto:", err);
    } finally {
      setRatingLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl transition-all duration-300">
      {/* Decorative vertical gradient edge */}
      <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500" />

      {/* Header container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-slate-800 gap-3 bg-slate-900/50">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">PROMPT DE ENGENHARIA FABRICADO</h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Disponível para copiar e decolar</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Favorite Toggle Action */}
          <button
            onClick={onFavoriteToggle}
            title={record?.favorited ? "Remover dos salvos" : "Salvar no histórico principal"}
            className={`p-2 rounded-lg border transition ${
              record?.favorited
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {record?.favorited ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>

          {/* Copy Trigger */}
          <button
            onClick={handleCopy}
            className={`h-9 px-3 rounded-lg text-xs font-semibold border transition duration-150 flex items-center gap-1.5 ${
              copied
                ? "bg-green-600/10 border-green-500 text-green-400"
                : "bg-indigo-600 hover:bg-indigo-500 border-none text-slate-100"
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copiado!" : "Copiar Prompt"}
          </button>

          {/* Download MD */}
          <button
            onClick={handleDownload}
            title="Download em Markdown (.md)"
            className="p-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Structured Stats panel */}
      <div className="grid grid-cols-3 border-b border-slate-800/40 bg-slate-950/40 text-center py-2 text-xs divide-x divide-slate-800/40">
        <div>
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">Palavras</span>
          <span className="text-slate-200 font-mono font-medium">{wordCount}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">Caracteres</span>
          <span className="text-slate-200 font-mono font-medium">{charCount}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">Tokens Aprox.</span>
          <span className="text-slate-200 font-mono font-medium">{estimatedTokens}</span>
        </div>
      </div>

      {/* Main prompt viewer body */}
      <div className="p-4 bg-slate-950/65">
        <textarea
          readOnly
          value={promptText}
          className="w-full h-80 p-3.5 rounded-xl border border-slate-800/60 bg-slate-950 text-slate-300 font-mono text-xs leading-relaxed focus:outline-none resize-none overflow-y-auto selection:bg-indigo-600 selection:text-white"
        />

        {/* Security / Quality audit validation tag */}
        <div className="flex items-center gap-2 mt-4 p-3 rounded-xl border border-green-500/20 bg-green-950/10 text-green-400 text-xs">
          <Sparkles className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <span>
            <strong>Blindagem Anti-Alucinações Ativa:</strong> Foram adicionadas diretrizes explícitas de verificação, limits de segurança e formato de contornabilidade.
          </span>
        </div>
      </div>

      {/* Rating & Favorite indicators bar */}
      {record?.id && (
        <div className="flex items-center justify-between p-4 border-t border-slate-800/70 bg-slate-900/40">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Avaliar Utilidade:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((stars) => {
                const isLit = (hoverStar !== null ? hoverStar : record.rating || 0) >= stars;
                return (
                  <button
                    key={stars}
                    type="button"
                    disabled={ratingLoading}
                    onMouseEnter={() => setHoverStar(stars)}
                    onMouseLeave={() => setHoverStar(null)}
                    onClick={() => handleRate(stars)}
                    className="p-1 rounded text-slate-500 hover:text-amber-400 transition"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        isLit ? "fill-amber-400 text-amber-400 font-bold" : "text-slate-600"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-500" />
            Salvo automaticamente no histórico
          </div>
        </div>
      )}
    </div>
  );
}
