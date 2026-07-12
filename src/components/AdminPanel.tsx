/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Link, UserCog, ShieldAlert, CheckCircle, RefreshCcw, Save, Trash, AlertTriangle, KeySquare } from "lucide-react";
import { apiRequest } from "../services/apiGateway";
import { GlobalConfig } from "../types";

interface AdminPanelProps {
  isAuthenticated: boolean;
  currentUser: { email: string; role: string } | null;
}

export default function AdminPanel({ isAuthenticated, currentUser }: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"checkout" | "users" | "github">("checkout");
  const [config, setConfig] = useState<GlobalConfig>({
    siteName: "Cyber Hunt Lab",
    monthlyCheckoutUrl: "",
    annualCheckoutUrl: "",
    address: "",
    phone: ""
  });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = isAuthenticated && currentUser?.role === "admin";

  useEffect(() => {
    if (isAdmin) {
      loadGlobalConfig();
      loadUsers();
    }
  }, [isAdmin]);

  const loadGlobalConfig = async () => {
    try {
      const resp = await apiRequest("/api/config/global");
      if (resp.status === "SUCCESS") {
        setConfig(resp.config);
      }
    } catch (err) {
      console.error("Falha ao recuperar configurações globais:", err);
    }
  };

  const loadUsers = async () => {
    try {
      const resp = await apiRequest("/api/admin/users");
      if (resp.status === "SUCCESS") {
        setUsers(resp.users);
      }
    } catch (err) {
      console.error("Falha ao recuperar lista de usuários:", err);
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const resp = await apiRequest("/api/admin/update-checkout", {
        method: "PUT",
        body: JSON.stringify(config)
      });

      if (resp.status === "SUCCESS") {
        setSuccess("Configurações globais atualizadas com sucesso!");
        setConfig(resp.config);
        // Dispatch custom event to let app refresh state
        window.dispatchEvent(new CustomEvent("config-updated"));
      } else {
        setError(resp.detail || "Falha ao gravar configurações.");
      }
    } catch (err) {
      setError("Erro de rede ao salvar configurações de checkout.");
    } finally {
      setLoading(false);
    }
  };

  const handleActivatePremium = async (userId: string, targetTier: "free" | "premium" | "expert") => {
    setError("");
    setSuccess("");
    try {
      const resp = await apiRequest("/api/admin/activate-premium", {
        method: "POST",
        body: JSON.stringify({ userId, tier: targetTier })
      });

      if (resp.status === "SUCCESS") {
        setSuccess(`Usuário atualizado para o nível [${targetTier.toUpperCase()}] com sucesso.`);
        // Reload users list
        loadUsers();
      } else {
        setError(resp.detail || "Erro ao atualizar o nível do usuário.");
      }
    } catch (err) {
      setError("Erro ao tentar fazer requisição de upgrade.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 rounded-2xl border border-red-950/40 bg-red-950/10 text-center space-y-4 max-w-xl mx-auto my-12 animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-red-900/40 border border-red-700/40 flex items-center justify-center text-red-400 mx-auto">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest">Painel Administrativo Protegido</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Você precisa estar autenticado como administrador para visualizar esta seção. 
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* Sidebar options */}
      <div className="lg:col-span-3 space-y-2">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex items-center gap-2.5 mb-4 select-none">
          <div className="w-9 h-9 rounded-lg bg-rose-600/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <UserCog className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs text-slate-200">Painel de Controle</h3>
            <p className="text-[10px] text-slate-500">Acesso Nível Admin • Ativo</p>
          </div>
        </div>

        <button
          onClick={() => setActiveSubTab("checkout")}
          className={`w-full text-left p-3 rounded-xl border text-xs font-bold font-sans flex items-center gap-2 transition focus:outline-none ${
            activeSubTab === "checkout"
              ? "border-indigo-500/30 bg-slate-900 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
          }`}
        >
          <Link className="w-4 h-4" />
          Checkout Dinâmico & Configs
        </button>

        <button
          onClick={() => setActiveSubTab("users")}
          className={`w-full text-left p-3 rounded-xl border text-xs font-bold font-sans flex items-center gap-2 transition focus:outline-none ${
            activeSubTab === "users"
              ? "border-indigo-500/30 bg-slate-900 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
          }`}
        >
          <KeySquare className="w-4 h-4" />
          Gerenciar Assinantes Premium
        </button>
      </div>

      {/* Main Configurations Content panel */}
      <div className="lg:col-span-9 p-5 rounded-2xl border border-slate-800 bg-slate-900/30">
        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 rounded-lg bg-green-950/40 border border-green-500/30 text-green-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-400" />
            <span>{success}</span>
          </div>
        )}

        {activeSubTab === "checkout" && (
          <form onSubmit={handleUpdateConfig} className="space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Ajustes da Landing Page & Checkout</h4>
              <p className="text-[10px] text-slate-500">Modifique o comportamento, títulos e os botões de venda externos em tempo de execução</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-12">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nome do Site (Editável via Contexto)</label>
                <input
                  type="text"
                  required
                  value={config.siteName}
                  onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                  placeholder="Ex: Cyber Hunt Lab"
                  className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-400 mb-1">URL de Checkout do Plano Mensal (Gold)</label>
                <input
                  type="url"
                  required
                  value={config.monthlyCheckoutUrl}
                  onChange={(e) => setConfig({ ...config, monthlyCheckoutUrl: e.target.value })}
                  placeholder="Ex: https://pay.kiwify.com.br/xxx"
                  className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-xs focus:outline-none font-mono"
                />
              </div>

              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-400 mb-1">URL de Checkout do Plano Anual (Black)</label>
                <input
                  type="url"
                  required
                  value={config.annualCheckoutUrl}
                  onChange={(e) => setConfig({ ...config, annualCheckoutUrl: e.target.value })}
                  placeholder="Ex: https://pay.kiwify.com.br/yyy"
                  className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-xs focus:outline-none font-mono"
                />
              </div>

              <div className="md:col-span-7">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Endereço Comercial / Sede</label>
                <input
                  type="text"
                  value={config.address}
                  onChange={(e) => setConfig({ ...config, address: e.target.value })}
                  placeholder="Ex: Av Goulart, 230 - São Paulo"
                  className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div className="md:col-span-5">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Telefone Comercial / Suporte</label>
                <input
                  type="text"
                  value={config.phone}
                  onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                  placeholder="Ex: +55 (11) 99999-5555"
                  className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-xs focus:outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {loading ? "Gravando alterações..." : "Salvar Configurações Dinâmicas"}
            </button>
          </form>
        )}

        {activeSubTab === "users" && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Usuários de Plataforma</h4>
                <p className="text-[10px] text-slate-500">Ative o plano Premium de clientes à mão instantaneamente</p>
              </div>
              <button
                onClick={loadUsers}
                className="p-1 px-2.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-100 text-[10px] flex items-center gap-1 transition font-bold"
              >
                <RefreshCcw className="w-3 h-3" /> Atualizar Lista
              </button>
            </div>

            {users.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">Nenhum usuário cadastrado além de você.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wider bg-slate-900/60">
                      <th className="p-3.5 pl-4">Nome</th>
                      <th className="p-3.5">E-mail</th>
                      <th className="p-3.5">Papel</th>
                      <th className="p-3.5">Plano / Tier</th>
                      <th className="p-3.5 text-right pr-4">Ação Rápida Assinatura</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-xs text-slate-300">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-900/30 transition">
                        <td className="p-3.5 pl-4 font-semibold text-slate-200">{u.name}</td>
                        <td className="p-3.5 text-slate-400 font-mono text-[11px]">{u.email}</td>
                        <td className="p-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] capitalize font-bold ${
                            u.role === "admin" ? "bg-red-950 text-red-400 border border-red-900/20" : "bg-slate-900 text-slate-500"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold ${
                            u.tier === "expert"
                              ? "bg-purple-950 text-purple-300 border border-purple-900/20"
                              : u.tier === "premium"
                              ? "bg-amber-950 text-amber-300 border border-amber-900/20"
                              : "bg-slate-900 text-slate-500"
                          }`}>
                            {u.tier}
                          </span>
                        </td>
                        <td className="p-3.5 text-right pr-4 space-x-1.5">
                          {u.tier !== "premium" && (
                            <button
                              onClick={() => handleActivatePremium(u.id, "premium")}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-[9px] uppercase transition cursor-pointer"
                            >
                              Ativar Premium
                            </button>
                          )}
                          {u.tier !== "expert" && (
                            <button
                              onClick={() => handleActivatePremium(u.id, "expert")}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-[9px] uppercase transition cursor-pointer"
                            >
                              Ativar Expert
                            </button>
                          )}
                          {u.tier !== "free" && (
                            <button
                              onClick={() => handleActivatePremium(u.id, "free")}
                              className="px-2 py-1 bg-slate-900 hover:bg-red-950/20 hover:text-red-400 text-slate-500 text-[9px] font-bold rounded uppercase transition cursor-pointer font-mono"
                            >
                              Reset
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
