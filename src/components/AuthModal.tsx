/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, LogIn, Key, User, ShieldCheck, Mail, Check } from "lucide-react";
import { apiRequest } from "../services/apiGateway";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any, token: string) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin 
      ? { email, password }
      : { email, password, name, profession };

    try {
      const response = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (response.status === "SUCCESS") {
        if (isLogin) {
          // Store token & delegate to parent
          localStorage.setItem("accessToken", response.access_token);
          onSuccess(response.user, response.access_token);
          onClose();
        } else {
          setSuccess("Sua conta foi criada! Carregando painel de login...");
          setTimeout(() => {
            setIsLogin(true);
            setSuccess("");
          }, 1800);
        }
      } else {
        setError(response.detail || "Erro ao realizar operação. Verifique seus dados.");
      }
    } catch (err: any) {
      setError(err.message || "Erro crítico de rede.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        id="auth-modal"
        className="relative w-full max-w-md p-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl transition-all duration-300"
      >
        {/* Background glow lines */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <button 
          onClick={onClose}
          id="close-auth-modal"
          className="absolute top-4 right-4 p-1.5 rounded-full border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center mb-6 mt-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 font-sans tracking-tight">
            {isLogin ? "Acesse sua Conta" : "Crie sua Conta Grátis"}
          </h2>
          <p className="text-sm text-slate-400 mt-1 text-center">
            {isLogin 
              ? "Salve seus prompts de engenharia e acesse de qualquer lugar" 
              : "Junte-se à maior comunidade de engenharia de prompts"}
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 rounded-lg bg-green-950/40 border border-green-500/30 text-green-400 text-xs text-center flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">NOME COMPLETO</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="João Silva" 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">SUA PROFISSÃO (Nicho/Atuação)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <LogIn className="w-4 h-4 rotate-90" />
                  </span>
                  <input 
                    type="text" 
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder="ex: Engenheiro de Software, Médico" 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">ENDEREÇO DE E-MAIL</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu-email@dominio.com" 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">SUA SENHA</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Key className="w-4 h-4" />
              </span>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mínimo 6 caracteres" 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-medium text-sm transition shadow-lg shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-100/30 border-t-slate-100 rounded-full animate-spin" />
                Autenticando...
              </span>
            ) : isLogin ? "Entrar na Minha Conta" : "Cadastrar Agora"}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500 border-t border-slate-800/60 pt-4">
          {isLogin ? "Não tem uma conta cadastrada?" : "Já possui cadastro?"}{" "}
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setSuccess("");
            }}
            className="text-indigo-400 hover:text-indigo-300 font-semibold focus:outline-none"
          >
            {isLogin ? "Crie uma agora" : "Acesse seu login"}
          </button>
        </div>
      </div>
    </div>
  );
}
