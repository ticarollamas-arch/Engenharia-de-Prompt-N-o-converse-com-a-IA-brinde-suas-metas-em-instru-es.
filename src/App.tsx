/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, Library, FileArchive, LogOut, LogIn, Star, Zap, Trash, Copy, Check, Flame, ChevronRight, HelpCircle, ArrowUpRight, Award, Database, RefreshCw, BarChart2, MessageSquareCode, UserCog, Monitor, Cpu, Key, AlertTriangle, Github } from "lucide-react";
import AuthModal from "./components/AuthModal";
import LibraryView from "./components/LibraryView";
import LandingPage from "./components/LandingPage";
import AdminPanel from "./components/AdminPanel";
import VirtualAssistant from "./components/VirtualAssistant";
import PathLoginForm from "./components/PathLoginForm";
import GithubCallback from "./components/GithubCallback";
import ZipFolderReader from "./components/ZipFolderReader";
import PromptGeneratorForm from "./components/PromptGeneratorForm";
import PromptOutputHub from "./components/PromptOutputHub";
import { useSEO } from "./hooks/useSEO";
import { User as UserType, PromptHistoryItem, CustomTemplate, GlobalConfig } from "./types";
import { apiRequest } from "./services/apiGateway";

export default function App() {
  // Path Router state
  const [currentPath] = useState(window.location.pathname);

  // Authentication states
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("accessToken"));
  const [authOpen, setAuthOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // App Navigation state
  const [activeTab, setActiveTab] = useState<"fabricate" | "generator" | "library" | "templates" | "audit" | "admin">("generator");

  // Global Config loaded from DB Service
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>({
    siteName: "Cyber Hunt Lab",
    monthlyCheckoutUrl: "https://pay.hotmart.com/mock-monthly",
    annualCheckoutUrl: "https://pay.hotmart.com/mock-annual",
    address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100",
    phone: "+55 (11) 99999-8888"
  });

  // Current view mode (either public Landing page or active portal app)
  const [viewMode, setViewMode] = useState<"landing" | "portal">("landing");

  // Core Prompt Generation data
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [activeRecord, setActiveRecord] = useState<PromptHistoryItem | null>(null);

  // Database lists
  const [historyList, setHistoryList] = useState<PromptHistoryItem[]>([]);
  const [userGithubId, setUserGithubId] = useState(() => localStorage.getItem("gh_client_id") || "");
  const [userGithubSecret, setUserGithubSecret] = useState(() => localStorage.getItem("gh_client_secret") || "");
  const [githubSaveMsg, setGithubSaveMsg] = useState("");
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);

  // Subscription Modal logic
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [tierLoading, setTierLoading] = useState(false);
  const [tierFeedback, setTierFeedback] = useState("");

  // Activate dynamic search engine optimization hook
  useSEO({
    title: viewMode === "landing" ? "Fábrica e Engenharia de Prompting SRE" : "Portal de IA",
    description: "Plataforma avançada Cyber Hunt Lab de modelagem e blindagem de prompts contra alucinações de Inteligência Artificial.",
    siteName: globalConfig.siteName
  });

  // Retrieve global config on start
  useEffect(() => {
    async function loadConfig() {
      try {
        const resp = await apiRequest("/api/config/global");
        if (resp.status === "SUCCESS") {
          setGlobalConfig(resp.config);
        }
      } catch (err) {
        console.error("Incapaz de carregar configurações:", err);
      }
    }
    loadConfig();

    const handleConfigReload = () => {
      loadConfig();
    };
    window.addEventListener("config-updated", handleConfigReload);
    return () => {
      window.removeEventListener("config-updated", handleConfigReload);
    };
  }, []);

  // Track if redirection requires opening registration
  useEffect(() => {
    if (window.location.search.includes("register=true")) {
      setAuthOpen(true);
      // Clean query parameter quietly from browser history
      const newUrl = window.location.pathname;
      window.history.replaceState({ path: newUrl }, "", newUrl);
    }
  }, []);

  // Check the authenticated session on mount
  useEffect(() => {
    async function fetchSession() {
      if (token) {
        try {
          const resp = await apiRequest("/api/auth/me");
          if (resp.status === "SUCCESS") {
            setUser(resp.user);
            setViewMode("portal");
          } else {
            // Token is invalid/expired, clear it
            localStorage.removeItem("accessToken");
            setToken(null);
          }
        } catch (err) {
          console.error("Erro ao restabelecer sessão automática:", err);
        }
      }
      setAuthLoading(false);
    }
    fetchSession();
  }, [token]);

  // Synchronize dynamic collections of history and templates when user commits or logs in
  useEffect(() => {
    if (user) {
      loadHistory();
      loadTemplates();
    } else {
      setHistoryList([]);
      setCustomTemplates([]);
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      const resp = await apiRequest("/api/prompts");
      if (resp.status === "SUCCESS") {
        setHistoryList(resp.prompts);
      }
    } catch (err) {
      console.error("Falha ao sincronizar histórico:", err);
    }
  };

  const loadTemplates = async () => {
    try {
      const resp = await apiRequest("/api/templates");
      if (resp.status === "SUCCESS") {
        setCustomTemplates(resp.templates);
      }
    } catch (err) {
      console.error("Falha ao sincronizar templates:", err);
    }
  };

  const handleLoginSuccess = (cleanUser: UserType, userToken: string) => {
    setUser(cleanUser);
    setToken(userToken);
    setViewMode("portal");
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    setToken(null);
    setUser(null);
    setGeneratedPrompt("");
    setActiveRecord(null);
    setActiveTab("generator");
    setViewMode("landing");
  };

  const handleGenerationSuccess = (prompt: string, record: any) => {
    setGeneratedPrompt(prompt);
    setActiveRecord(record);
    loadHistory(); // Refresh library list
  };

  // Star-rating hook
  const handleRatePrompt = async (id: string, stars: number) => {
    try {
      const resp = await apiRequest(`/api/prompts/${id}/rate`, {
        method: "POST",
        body: JSON.stringify({ rating: stars })
      });
      if (resp.status === "SUCCESS") {
        // update active record if it is the one being rated
        if (activeRecord && activeRecord.id === id) {
          setActiveRecord(resp.prompt);
        }
        setHistoryList(prev => prev.map(p => p.id === id ? resp.prompt : p));
      }
    } catch (err) {
      console.error("Falha ao avaliar:", err);
    }
  };

  // Favoriting action
  const handleFavoriteToggle = async (id: string) => {
    try {
      const resp = await apiRequest(`/api/prompts/${id}/favorite`, {
        method: "POST"
      });
      if (resp.status === "SUCCESS") {
        // update active record if applicable
        if (activeRecord && activeRecord.id === id) {
          setActiveRecord(resp.prompt);
        }
        setHistoryList(prev => prev.map(p => p.id === id ? resp.prompt : p));
      }
    } catch (err) {
      console.error("Falha ao favoritar:", err);
    }
  };

  // Deletion hook
  const handleDeletePrompt = async (id: string) => {
    try {
      const resp = await apiRequest(`/api/prompts/${id}`, {
        method: "DELETE"
      });
      if (resp.status === "SUCCESS") {
        if (activeRecord && activeRecord.id === id) {
          setActiveRecord(null);
          setGeneratedPrompt("");
        }
        setHistoryList(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error("Falha ao excluir prompt:", err);
    }
  };

  // Change Subscription Level hook (Interactive payments simulator)
  const handleChangeSubscription = async (targetTier: "free" | "premium" | "expert") => {
    setTierLoading(true);
    setTierFeedback("");
    try {
      const resp = await apiRequest("/api/user/tier", {
        method: "POST",
        body: JSON.stringify({ tier: targetTier })
      });
      if (resp.status === "SUCCESS") {
        setUser(resp.user);
        setTierFeedback(`Concluído! Sua assinatura foi alterada para o plano ${targetTier.toUpperCase()} com sucesso.`);
        setTimeout(() => {
          setUpgradeOpen(false);
          setTierFeedback("");
        }, 2200);
      } else {
        setTierFeedback("Falha: " + resp.detail);
      }
    } catch (err) {
      setTierFeedback("Erro ao tentar atualizar o seu plano de créditos.");
    } finally {
      setTierLoading(false);
    }
  };

  // Load old prompt into generating panel for live edits
  const handleSelectOldPrompt = (item: PromptHistoryItem) => {
    setGeneratedPrompt(item.prompt);
    setActiveRecord(item);
    setActiveTab("generator");
  };

  // Render routing based on direct URL pathname overrides first
  if (currentPath === "/auth/callback") {
    return <GithubCallback />;
  }

  if (currentPath === "/admin/login") {
    return (
      <PathLoginForm
        type="admin"
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (currentPath === "/user/login") {
    return (
      <PathLoginForm
        type="user"
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (viewMode === "landing") {
    return (
      <>
        <LandingPage
          config={globalConfig}
          onEnterApp={() => setViewMode("portal")}
          onOpenAuth={() => setAuthOpen(true)}
          isAuthenticated={!!user}
        />
        <VirtualAssistant
          siteName={globalConfig.siteName}
          monthlyCheckoutUrl={globalConfig.monthlyCheckoutUrl}
          annualCheckoutUrl={globalConfig.annualCheckoutUrl}
        />
        {authOpen && (
          <AuthModal
            isOpen={authOpen}
            onClose={() => setAuthOpen(false)}
            onSuccess={handleLoginSuccess}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      {/* Dynamic top bar subscription promo */}
      {!authLoading && user && user.tier === "free" && (
        <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900 to-indigo-950/60 border-b border-indigo-500/20 py-2 text-center text-xs text-indigo-200 px-4 flex items-center justify-center gap-2 max-sm:flex-col animate-fade-in">
          <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
          <span>Você está usando o limite gratuito da <strong className="notranslate" translate="no">{globalConfig.siteName}</strong>.</span>
          <button 
            onClick={() => setUpgradeOpen(true)}
            className="underline hover:text-indigo-100 font-semibold flex items-center gap-0.5 cursor-pointer"
          >
            Acessar plano Premium Ilimitado <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Header navigation */}
      <header className="border-b border-slate-900 bg-slate-950/85 backdrop-blur-md sticky top-0 z-40">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo brand */}
          <div className="flex items-center gap-3 select-none">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400">
              <Sparkles className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="notranslate text-lg font-bold tracking-tight bg-gradient-to-r from-red-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent" translate="no">
                {globalConfig.siteName}
              </span>
              <span className="text-[9px] font-bold text-indigo-400 bg-indigo-950 border border-indigo-500/20 py-0.5 px-1.5 rounded-full block mt-0.5 w-fit">
                METAPROMPTING SRE
              </span>
            </div>
          </div>

          {/* Nav Links Tabs selectors */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/50 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("landing")}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition text-slate-400 hover:text-slate-200"
            >
              <Monitor className="w-4 h-4 text-rose-400" />
              Ver Site
            </button>

            <button
              id="tab-generator"
              onClick={() => setActiveTab("generator")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                activeTab === "generator" ? "bg-slate-800 text-indigo-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Cpu className="w-4 h-4" />
              Gerador
            </button>

            <button
              onClick={() => setActiveTab("fabricate")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                activeTab === "fabricate" ? "bg-slate-800 text-indigo-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileArchive className="w-4 h-4" />
              Leitor ZIP
            </button>

            <button
              id="tab-library"
              onClick={() => {
                if (!user) {
                  setAuthOpen(true);
                } else {
                  setActiveTab("library");
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                activeTab === "library" ? "bg-slate-800 text-indigo-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Library className="w-4 h-4" />
              Histórico
              {historyList.length > 0 && (
                <span className="bg-slate-950 text-indigo-400 text-[10px] px-1.5 py-0.5 rounded-full border border-indigo-500/10 ml-0.5">
                  {historyList.length}
                </span>
              )}
            </button>

            <button
              id="tab-audit"
              onClick={() => {
                if (!user) {
                  setAuthOpen(true);
                } else {
                  setActiveTab("audit");
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                activeTab === "audit" ? "bg-slate-800 text-indigo-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Métricas
            </button>

            {user?.role === "admin" && (
              <button
                id="tab-admin"
                onClick={() => setActiveTab("admin")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  activeTab === "admin" ? "bg-slate-800 text-indigo-450 font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <UserCog className="w-4 h-4 text-indigo-400" />
                Painel Admin
              </button>
            )}
          </nav>

          {/* User Section */}
          <div className="flex items-center gap-3">
            {authLoading ? (
              <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {/* Subscription Tier badge tracker */}
                <button
                  onClick={() => setUpgradeOpen(true)}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-extrabold tracking-wide uppercase cursor-pointer select-none py-1.5 ${
                    user.tier === "expert"
                      ? "bg-purple-600/10 border-purple-500 text-purple-300"
                      : user.tier === "premium"
                      ? "bg-amber-600/10 border-amber-500 text-amber-300"
                      : "bg-slate-900 border-slate-800 text-slate-400"
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Plano: {user.tier}
                </button>

                {/* Profile display with logout trigger */}
                <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
                  <div className="hidden lg:block text-right">
                    <p className="text-xs font-bold text-slate-200">{user.name}</p>
                    <p className="text-[10px] text-slate-500">{user.email}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    title="Desconectar conta"
                    className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-950/30 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold text-xs transition flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Acessar Portal
              </button>
            )}
          </div>
        </div>

        {/* Mobile quick tabs sub-navigation */}
        <div className="md:hidden border-t border-slate-900 bg-slate-950 flex justify-around p-1">
          <button
            onClick={() => setActiveTab("generator")}
            className={`flex-1 flex flex-col items-center py-2 text-[10px] uppercase font-bold tracking-wide transition ${
              activeTab === "generator" ? "text-indigo-400" : "text-slate-500"
            }`}
          >
            <Cpu className="w-4 h-4 mb-0.5" />
            Gerador
          </button>
          <button
            onClick={() => setActiveTab("fabricate")}
            className={`flex-1 flex flex-col items-center py-2 text-[10px] uppercase font-bold tracking-wide transition ${
              activeTab === "fabricate" ? "text-indigo-400" : "text-slate-500"
            }`}
          >
            <FileArchive className="w-4 h-4 mb-0.5" />
            Leitor ZIP
          </button>
          <button
            onClick={() => {
              if (!user) setAuthOpen(true);
              else setActiveTab("library");
            }}
            className={`flex-1 flex flex-col items-center py-2 text-[10px] uppercase font-bold tracking-wide transition ${
              activeTab === "library" ? "text-indigo-400" : "text-slate-500"
            }`}
          >
            <Library className="w-4 h-4 mb-0.5" />
            Histórico
          </button>
          <button
            onClick={() => {
              if (!user) setAuthOpen(true);
              else setActiveTab("audit");
            }}
            className={`flex-1 flex flex-col items-center py-2 text-[10px] uppercase font-bold tracking-wide transition ${
              activeTab === "audit" ? "text-indigo-400" : "text-slate-500"
            }`}
          >
            <BarChart2 className="w-4 h-4 mb-0.5" />
            Métricas
          </button>

          {user?.role === "admin" && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex-1 flex flex-col items-center py-2 text-[10px] uppercase font-bold tracking-wide transition ${
                activeTab === "admin" ? "text-indigo-400" : "text-slate-500"
              }`}
            >
              <UserCog className="w-4 h-4 mb-0.5" />
              Admin
            </button>
          )}
        </div>
      </header>

      {/* Main Container stage */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 animate-fade-in">
        {/* Tab content router */}
        {activeTab === "generator" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-12 xl:col-span-5 space-y-6">
              <PromptGeneratorForm
                isAuthenticated={!!user}
                onGenerationSuccess={handleGenerationSuccess}
                onOpenAuth={() => setAuthOpen(true)}
                userTier={user?.tier || "free"}
              />
            </div>
            
            <div className="lg:col-span-12 xl:col-span-7">
              <PromptOutputHub
                promptText={generatedPrompt}
                record={activeRecord}
                onUpdateRecord={setActiveRecord}
                onFavoriteToggle={() => activeRecord && handleFavoriteToggle(activeRecord.id)}
              />
            </div>
          </div>
        )}

        {activeTab === "fabricate" && (
          <div className="w-full space-y-6">
            <div className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/30/80 backdrop-blur-md shadow-xl animate-fade-in">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3.5 mb-5 select-none">
                <Flame className="w-5 h-5 text-indigo-400 animate-pulse" />
                <div>
                  <h2 className="text-base font-extrabold text-slate-100 leading-tight">DESCOMPACTADOR & EXTRATOR SRE</h2>
                  <p className="text-[10px] text-slate-500 tracking-wider uppercase font-mono mt-0.5 font-bold">Leitura de Arquivos de Pasta ZIP e Exportação Atômica ao GitHub</p>
                </div>
              </div>
              <ZipFolderReader />
            </div>
          </div>
        )}

        {activeTab === "library" && user && (
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/30/80 backdrop-blur-md shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 select-none">
                <Library className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-extrabold text-slate-100">BIBLIOTECA DE PROMPTS GERADOS</h2>
              </div>
              <button 
                onClick={loadHistory}
                className="p-1 px-3 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-100 text-[10px] font-bold flex items-center gap-1 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Sincronizar
              </button>
            </div>

            <LibraryView
              prompts={historyList}
              onDelete={handleDeletePrompt}
              onFavoriteToggle={handleFavoriteToggle}
              onRate={handleRatePrompt}
              onSelectPrompt={handleSelectOldPrompt}
            />
          </div>
        )}

        {activeTab === "audit" && user && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4 space-y-6">
              {/* Profile Card */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 leading-tight">{user.name}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{user.email}</p>
                    <span className="inline-block px-2 py-0.5 mt-1 text-[9px] font-bold tracking-wider uppercase bg-indigo-950 border border-indigo-500/10 text-indigo-400 rounded-md">
                      Plano {user.tier.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Membro desde:</span>
                    <span className="font-mono text-slate-300">{new Date(user.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Ocupação informada:</span>
                    <span className="text-slate-300 font-semibold">{user.profession}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Controle de Apenas salvos:</span>
                    <span className="text-amber-400 font-semibold">{historyList.filter(h => h.favorited).length} prompts</span>
                  </div>
                  {user.tier !== "free" && (
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Vencimento do plano ({user.tier === "expert" ? "Anual" : "Mensal"}):</span>
                      <span className="text-indigo-400 font-bold font-mono">
                        {new Date(Date.now() + (user.tier === "expert" ? 365 : 30) * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  )}
                </div>

                {user.tier === "free" && (
                  <button
                    onClick={() => setUpgradeOpen(true)}
                    className="w-full h-9 rounded-lg bg-indigo-600/15 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-4.5 h-4.5 text-amber-500/90" />
                    Mudar Plano Assinatura
                  </button>
                )}
              </div>

              {/* Stats highlights */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <BarChart2 className="w-5 h-5 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Minha Produtividade</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Total Gerado</span>
                    <span className="text-xl font-extrabold font-mono text-slate-100">{historyList.length}</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Favoritos</span>
                    <span className="text-xl font-extrabold font-mono text-amber-400">
                      {historyList.filter((x) => x.favorited).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuração de Domínio (GitHub OAuth) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Github className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Configuração de Domínio (GitHub OAuth)</h3>
                </div>
                <p className="text-[10px] text-slate-500">Mapeamento Dinâmico: Utilize os links abaixo para preencher o formulário do desenvolvedor GitHub com as credenciais corretas deste ambiente.</p>
                
                <div className="p-3.5 rounded-xl border border-amber-900/40 bg-amber-950/15 text-amber-300 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-450 text-amber-400 flex-shrink-0" />
                    <span>ALERTA CRÍTICO DE CONFIGURAÇÃO:</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-amber-400/90">
                    Você deve copiar os links <strong>exatamente</strong> como exibidos abaixo (terminando com <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300">.run.app</code>). <br />
                    <span className="text-rose-450 text-red-400 font-extrabold uppercase">⚠️ NUNCA use o domínio ou link 'aistudio.google.com'</span> nas configurações de Homepage ou Callback do seu GitHub App. Caso utilize, a autenticação do GitHub redirecionará para uma página inexistente com <strong>Erro 404</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1 mt-2">
                    <label className="block text-[11px] font-bold text-slate-400">Home URL (Página Inicial):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={window.location.origin}
                        readOnly
                        className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 text-xs focus:outline-none font-mono select-all transition"
                      />
                      <button 
                        type="button"
                        onClick={() => navigator.clipboard.writeText(window.location.origin)}
                        className="h-10 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] uppercase font-bold transition flex-shrink-0 cursor-pointer"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 mt-2">
                    <label className="block text-[11px] font-bold text-emerald-400">Authorization callback URL (Retorno):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={`${window.location.origin}/auth/callback`}
                        readOnly
                        className="w-full h-10 px-3 rounded-xl border border-emerald-900/60 bg-emerald-950/30 text-emerald-300 text-xs focus:outline-none font-mono select-all shadow-inner"
                      />
                      <button 
                        type="button"
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/auth/callback`)}
                        className="h-10 px-4 rounded-xl border border-emerald-800 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-400 text-[10px] uppercase font-bold transition flex-shrink-0 cursor-pointer"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-800 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-md border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <Key className="w-3 h-3" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-200">Insira as Credenciais Geradas no GitHub</h5>
                        <p className="text-[10px] text-slate-500 mt-0.5">Após a criação, copie o ID do cliente circulado e gere um Token / Segredo do cliente no site do GitHub.</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">ID do cliente (Client ID)</label>
                      <input
                        type="text"
                        value={userGithubId}
                        onChange={(e) => {
                          setUserGithubId(e.target.value);
                          setGithubSaveMsg("");
                        }}
                        placeholder="Ex: Ov23liTvLC3..."
                        className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Segredo do cliente (Client Token / Secret)</label>
                      <input
                        type="password"
                        value={userGithubSecret}
                        onChange={(e) => {
                          setUserGithubSecret(e.target.value);
                          setGithubSaveMsg("");
                        }}
                        placeholder="****************************************"
                        className="w-full h-10 px-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500 transition"
                      />
                      <p className="text-[9px] text-slate-500 mt-1.5 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        As credenciais inseridas acima são vinculadas diretamente localmente para uso pessoal.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          if (!userGithubId || !userGithubSecret) {
                            setGithubSaveMsg("⚠️ Preencha ambos os campos!");
                            return;
                          }
                          localStorage.setItem("gh_client_id", userGithubId);
                          localStorage.setItem("gh_client_secret", userGithubSecret);
                          localStorage.setItem("gh_access_token", ""); // Clear old token when updating keys
                          setGithubSaveMsg("✓ Credenciais salvas com sucesso!");
                          setTimeout(() => setGithubSaveMsg(""), 3000);
                        }}
                        className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
                      >
                        Salvar Credenciais
                      </button>
                      {githubSaveMsg && (
                        <p className={`text-xs mt-2 font-bold text-center ${githubSaveMsg.includes("✓") ? "text-emerald-400" : "text-amber-400"}`}>
                          {githubSaveMsg}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Log */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Histórico de Atividade (SRE Logs)</h3>
                </div>

              {historyList.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  Nenhum registro no histórico de auditoria.
                </div>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {historyList.map((log) => (
                    <div 
                      key={log.id}
                      className="p-3 rounded-lg border border-slate-800/50 bg-slate-950/40 text-xs flex items-center justify-between gap-3 text-slate-400"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="p-1 rounded bg-slate-900 border border-slate-800 text-[9px] font-mono text-indigo-400">LOG</span>
                        <p className="truncate text-slate-300">
                           <strong>Geração:</strong> "{log.task}" ({log.niche.split(" ")[0]})
                        </p>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500 flex-shrink-0">
                        <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                        <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {activeTab === "admin" && user?.role === "admin" && (
          <AdminPanel
            isAuthenticated={!!user}
            currentUser={user}
          />
        )}
      </main>

      {/* Footer copyright */}
      <footer className="border-t border-slate-900 bg-slate-950/40 text-center py-6 mt-12 text-xs text-slate-500">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 PromptForge AI. Todos os direitos reservados. Licença MIT.</p>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full border border-green-500/20 bg-green-950/10 text-green-400 text-[10px] font-mono">
              🚀 DEV_SERVER_ACTIVE: PORT_3000
            </span>
          </div>
        </div>
      </footer>

      {/* Auth boundary overlay modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Subscription upgrade interactive modal drawer */}
      {upgradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            <button
              onClick={() => setUpgradeOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <span className="py-1 px-3 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-extrabold tracking-widest uppercase">
                Planos de IA PromptForge
              </span>
              <h3 className="text-2xl font-black text-slate-100 font-sans tracking-tight mt-2">
                Garanta Acesso Técnico Sem Limites
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Desbloqueie templates de rigor avançado, maior assertividade na arquitetura de prompts e auditoria contínua.
              </p>
            </div>

            {tierFeedback && (
              <div className="p-3 mb-5 text-center text-xs text-indigo-300 bg-indigo-950/50 border border-indigo-500/20 rounded-xl">
                {tierFeedback}
              </div>
            )}

            {/* Pricing cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Plan Free */}
              <div className={`p-4 rounded-xl border bg-slate-950/70 flex flex-col justify-between ${
                user?.tier === "free" ? "border-indigo-500/40 bg-slate-900/10" : "border-slate-800"
              }`}>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Membro Comum</h4>
                  <p className="text-xl font-extrabold text-slate-100 mt-1">Grátis</p>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">Avaliação e fabricação básica limitada.</p>
                  
                  <ul className="mt-4 space-y-2 text-[10px] text-slate-400 border-t border-slate-900 pt-3">
                    <li className="flex items-center gap-1.5">✓ Histórico de 5 prompts</li>
                    <li className="flex items-center gap-1.5">✓ Presets comuns</li>
                    <li className="flex items-center gap-1.5">✕ Customização de templates</li>
                  </ul>
                </div>

                <button
                  onClick={() => handleChangeSubscription("free")}
                  disabled={tierLoading || user?.tier === "free"}
                  className="w-full h-8 rounded-lg mt-5 bg-slate-900 text-[10px] font-bold text-slate-300 hover:text-slate-100 disabled:opacity-50 cursor-pointer"
                >
                  {user?.tier === "free" ? "Plano Ativo" : "Selecionar plano"}
                </button>
              </div>

              {/* Plan Premium */}
              <div className={`p-4 rounded-xl border bg-slate-950/70 relative overflow-hidden flex flex-col justify-between ${
                user?.tier === "premium" ? "border-amber-500/50" : "border-slate-800"
              }`}>
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[8px] font-extrabold px-2 py-0.5 rounded-bl uppercase">
                  POPULAR
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Operador Cyber</h4>
                  <p className="text-xl font-extrabold text-slate-100 mt-1">R$ 97/mês</p>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">Fabricação ilimitada sob demanda para times ágeis.</p>
                  
                  <ul className="mt-4 space-y-2 text-[10px] text-slate-400 border-t border-slate-900 pt-3">
                    <li className="flex items-center gap-1.5 text-amber-300">✓ Fabricação Ilimitada</li>
                    <li className="flex items-center gap-1.5">✓ Customização de templates</li>
                    <li className="flex items-center gap-1.5">✓ Exportação Gists/MD</li>
                  </ul>
                </div>

                <button
                  onClick={() => handleChangeSubscription("premium")}
                  disabled={tierLoading || user?.tier === "premium"}
                  className="w-full h-8 rounded-lg mt-5 bg-amber-600 font-bold hover:bg-amber-500 text-slate-950 text-[10px] disabled:opacity-50 cursor-pointer"
                >
                  {user?.tier === "premium" ? "Plano Ativo" : "Migrar Instantâneo"}
                </button>
              </div>

              {/* Plan Expert Black */}
              <div className={`p-4 rounded-xl border bg-slate-950/70 flex flex-col justify-between ${
                user?.tier === "expert" ? "border-purple-500/50" : "border-slate-800"
              }`}>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Hunt Black</h4>
                  <p className="text-xl font-extrabold text-slate-100 mt-1">R$ 197/mês</p>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">Geração assistida em lote com auditoria militar.</p>
                  
                  <ul className="mt-4 space-y-2 text-[10px] text-slate-400 border-t border-slate-900 pt-3">
                    <li className="flex items-center gap-1.5 text-purple-300">✓ Resiliência Avançada</li>
                    <li className="flex items-center gap-1.5">✓ Suporte prioritário</li>
                    <li className="flex items-center gap-1.5">✓ Métricas dedicadas</li>
                  </ul>
                </div>

                <button
                  onClick={() => handleChangeSubscription("expert")}
                  disabled={tierLoading || user?.tier === "expert"}
                  className="w-full h-8 rounded-lg mt-5 bg-purple-600 font-bold hover:bg-purple-500 text-slate-100 text-[10px] disabled:opacity-50 cursor-pointer"
                >
                  {user?.tier === "expert" ? "Plano Ativo" : "Migrar Instantâneo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple close icon imported or mapped locally as SVG to avoid rendering issues
function X({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
