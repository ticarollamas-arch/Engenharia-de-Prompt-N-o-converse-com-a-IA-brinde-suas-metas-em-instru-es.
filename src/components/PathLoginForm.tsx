/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ArrowLeft, Shield, Mail, Key, ShieldAlert, Check } from "lucide-react";
import { apiRequest } from "../services/apiGateway";

interface PathLoginFormProps {
  type: "admin" | "user";
  onLoginSuccess: (user: any, token: string) => void;
}

export default function PathLoginForm({ type, onLoginSuccess }: PathLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = type === "admin";

  const handleGoBack = () => {
    window.location.href = "/";
  };

  const handleGotoRegister = (e: React.MouseEvent) => {
    e.preventDefault();
    // Redirect to landing page and open registration
    window.location.href = "/?register=true";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const endpoint = isAdmin ? "/api/auth/admin/login" : "/api/auth/login";

    try {
      const response = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (response && response.status === "SUCCESS") {
        setSuccess(
          isAdmin
            ? "Acesso administrativo autenticado. Inicializando console root..."
            : "Sessão iniciada com sucesso. Abrindo painel do cliente..."
        );
        localStorage.setItem("accessToken", response.access_token);
        
        // Let state update then redirect to home
        setTimeout(() => {
          onLoginSuccess(response.user, response.access_token);
          window.location.href = "/";
        }, 1200);
      } else {
        setError(
          response?.detail || 
          "O servidor web recusou o acesso das credenciais fornecidas."
        );
      }
    } catch (err: any) {
      // In case of a hard network or parsing exception, the SRE wrapper raises its own custom error:
      setError(err.message || "Erro crítico de conexão com o portal PromptForge.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Dynamic Background Mesh Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />
      
      {/* Decorative colored glow backdrop orbs */}
      <div 
        className={`absolute -top-40 w-96 h-96 rounded-full blur-3xl opacity-20 transition-all duration-300 ${
          isAdmin ? "bg-red-600/30 -left-20" : "bg-cyan-500/30 -right-20"
        }`} 
      />

      {/* Back button */}
      <button
        onClick={handleGoBack}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md text-slate-400 hover:text-slate-100 hover:border-slate-700 transition cursor-pointer text-xs font-semibold uppercase tracking-wider"
      >
        <ArrowLeft className="w-4.5 h-4.5" />
        Voltar para o site
      </button>

      {/* Main Login Card container */}
      <div className="relative w-full max-w-md z-10">
        <div 
          className={`w-full p-8 rounded-2xl border bg-slate-900/60 backdrop-blur-xl shadow-2xl transition-all duration-300 ${
            isAdmin 
              ? "border-red-950/40 hover:border-red-900/30 shadow-red-900/5" 
              : "border-slate-800/80 hover:border-cyan-900/30 shadow-cyan-900/5"
          }`}
        >
          {/* Animated colorful border strip (Crimson for Admin, Cyan/Purple for User) */}
          <div 
            className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${
              isAdmin 
                ? "from-red-600 via-rose-700 to-amber-600" 
                : "from-cyan-500 via-indigo-500 to-purple-500"
            }`} 
          />

          <div className="flex flex-col items-center mb-8">
            {/* Round themed shield badge */}
            <div 
              className={`flex items-center justify-center w-14 h-14 rounded-2xl border transition-colors mb-4 ${
                isAdmin 
                  ? "bg-red-950/20 border-red-500/35 text-red-500" 
                  : "bg-cyan-950/20 border-cyan-500/35 text-cyan-400"
              }`}
            >
              {isAdmin ? (
                <ShieldAlert className="w-7 h-7" />
              ) : (
                <Shield className="w-7 h-7" />
              )}
            </div>

            <h1 className="text-2xl font-black text-slate-100 font-sans tracking-tight uppercase text-center">
              {isAdmin ? "Admin Console" : "Área do Cliente"}
            </h1>
            <p 
              className={`text-[10px] font-mono tracking-widest uppercase mt-1.5 font-bold text-center ${
                isAdmin ? "text-red-400" : "text-cyan-400"
              }`}
            >
              {isAdmin ? "CONEXÃO CRIPTOGRAFADA • NÍVEL ROOT" : "INSIRA CREDENCIAIS PARA INICIALIZAR"}
            </p>
          </div>

          {/* SRE Alert Notification Banner (only if error occurs) */}
          {error && (
            <div className="p-4 mb-6 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs leading-relaxed text-left">
              <span className="font-bold uppercase block mb-1">Alerte do Sistema:</span>
              {error}
            </div>
          )}

          {/* Success screen feedback and logging tracker */}
          {success && (
            <div className="p-4 mb-6 rounded-xl bg-green-950/40 border border-green-500/30 text-green-400 text-xs flex items-start gap-2.5 text-left">
              <span className="p-1 rounded-md bg-green-900 border border-green-500/20 text-white flex-shrink-0 animate-bounce">
                <Check className="w-3.5 h-3.5" />
              </span>
              <div>
                <span className="font-bold uppercase block">Confirmado:</span>
                {success}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* E-mail fields input with thematic placeholder matching */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">
                {isAdmin ? "E-mail de Operação" : "E-mail Corporativo"}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu-email@dominio.com"
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-1 transition ${
                    isAdmin 
                      ? "focus:border-red-500 focus:ring-red-500" 
                      : "focus:border-cyan-500 focus:ring-cyan-500"
                  }`}
                />
              </div>
            </div>

            {/* Password input fields */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">
                {isAdmin ? "Senha de Controle" : "Senha de Acesso"}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Key className="w-4 h-4" />
                </span>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••" 
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-1 transition ${
                    isAdmin 
                      ? "focus:border-red-500 focus:ring-red-500" 
                      : "focus:border-cyan-500 focus:ring-cyan-500"
                  }`}
                />
              </div>
            </div>

            {/* CTA action submission buttons */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-5 rounded-xl text-slate-100 font-bold text-sm tracking-wider uppercase transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 outline-none mt-2 cursor-pointer shadow-lg ${
                isAdmin 
                  ? "bg-red-700 hover:bg-red-650 shadow-red-950/20" 
                  : "bg-cyan-600 hover:bg-cyan-550 shadow-cyan-950/20"
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-slate-100/30 border-t-slate-100 rounded-full animate-spin" />
                  Carregando...
                </span>
              ) : isAdmin ? (
                "Garantir Acesso Root"
              ) : (
                "Entrar no Painel"
              )}
            </button>
          </form>

          {/* Optional Footer register links redirection for client panels */}
          {!isAdmin && (
            <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-800/55 pt-5">
              Não possui uma licença ou conta ativa?{" "}
              <button 
                onClick={handleGotoRegister}
                className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
              >
                Criar Conta Grátis
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
