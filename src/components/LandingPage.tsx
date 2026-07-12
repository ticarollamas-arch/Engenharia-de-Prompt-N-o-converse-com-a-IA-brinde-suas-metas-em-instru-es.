/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sparkles, ArrowRight, ShieldCheck, Mail, Phone, MapPin, Check, Zap, Award, Monitor, HelpCircle, ArrowUpRight } from "lucide-react";
import { GlobalConfig } from "../types";

interface LandingPageProps {
  config: GlobalConfig;
  onEnterApp: () => void;
  onOpenAuth: () => void;
  isAuthenticated: boolean;
}

export default function LandingPage({ config, onEnterApp, onOpenAuth, isAuthenticated }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const steps = [
    {
      num: "01",
      title: "Descreva sua Necessidade",
      desc: "Digite a sua profissão, a tarefa desejada e preencha as regras que você precisa impor à Inteligência Artificial."
    },
    {
      num: "02",
      title: "Selecione a Estrutura Técnica",
      desc: "Escolha entre nossos templates calibrados por analistas SRE ou use o seu próprio preset estrutural de engenharia."
    },
    {
      num: "03",
      title: "Geração sob Metaprompting",
      desc: "Nosso motor de blindagem usa inteligência própria avançada para costurar as instruções, injetando regras anti-alucinação robustas."
    },
    {
      num: "04",
      title: "Copie & Domine os Modelos",
      desc: "Copie o prompt perfeitamente blindado e use-o em seu assistente ou chat preferido para colher respostas 100% corretas."
    }
  ];

  const plans = [
    {
      id: "gold",
      name: "Operador Cyber (Gold)",
      price: "R$ 97",
      period: "por mês",
      desc: "Acesso total à fábrica de prompts para acelerar sua produtividade diária.",
      features: [
        "Acesso ilimitado à fábrica",
        "Histórico e biblioteca duráveis",
        "Templates avançados de saúde, advocacia, dev, etc.",
        "Assistência de erros anti-alucinações",
        "Modificar e criar presets de engenharia",
        "Suporte por e-mail"
      ],
      checkoutUrl: config.monthlyCheckoutUrl || "https://pay.hotmart.com/mock-monthly",
      badge: "Iniciante Ágil"
    },
    {
      id: "black",
      name: "Hunt Black (Anual)",
      price: "R$ 197",
      period: "por ano",
      desc: "Para profissionais obstinados que exigem prioridade militar e menor custo por mês.",
      features: [
        "Economia de mais de 80% do valor mensal",
        "Acesso total e vitalício às atualizações de IA",
        "Templates avançados e customizados salvos em nuvem",
        "Métricas de produtividade e análise de tokens",
        "Selo Expert e suporte VIP prioritário",
        "Recomendações e curadoria personalizada"
      ],
      checkoutUrl: config.annualCheckoutUrl || "https://pay.hotmart.com/mock-annual",
      badge: "Melhor Custo Benefício",
      popular: true
    }
  ];

  const faqs = [
    {
      q: "O que é Engenharia de Metaprompting?",
      a: "É a metodologia científica de instruir IAs generativas de forma hierárquica. Ao invés de perguntas superficiais, inserimos barreiras de papel/persona, contexto, tratamento de exceções negativas e formatação estruturada."
    },
    {
      q: "Como funcionam os planos e pagamentos?",
      a: "O faturamento é processado de forma 100% segura através do nosso checkout integrado. Você pode pagar via PIX, Cartão de Crédito em até 12x ou boleto bancário."
    },
    {
      q: "Eu posso cancelar a qualquer momento?",
      a: "Sim, absolutamente. Você pode cancelar sua assinatura instantaneamente, sem burocracias, diretamente pelo suporte ou portal de pagamentos."
    },
    {
      q: "Existe alguma garantia?",
      a: "Sim. Oferecemos nossa garantia lendária de 7 dias. Se por qualquer motivo você se arrepender, devolvemos seu dinheiro integralmente, sem perguntas."
    }
  ];

  const siteNameLower = (config.siteName || "Cyber Hunt Lab").toLowerCase();

  return (
    <div className="bg-slate-950 text-slate-100 font-sans min-h-screen">
      {/* 🚀 Dynamic TOP banner */}
      <div className="bg-gradient-to-r from-teal-950/60 via-indigo-950/80 to-purple-950/60 border-b border-indigo-500/10 py-2.5 text-center text-xs text-indigo-300 px-4 animate-fade-in flex items-center justify-center gap-2 max-sm:flex-col font-mono select-none">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-ping" />
        <strong>CAMPANHA ESPECIAL:</strong> Liberação de licenças com 7 dias de teste incondicional ativos.
      </div>

      {/* 🧭 Nav Menu */}
      <nav className="w-full max-w-7xl mx-auto px-4 py-5 flex flex-col items-center justify-center gap-4 border-b border-slate-900 bg-slate-950/30 backdrop-blur-md sticky top-0 z-40 select-none">
        {/* Centered Brand Title */}
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black hover:scale-105 transition duration-200 shadow-md">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <span className="notranslate text-xl font-extrabold tracking-tight bg-gradient-to-r from-red-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent" translate="no">
              {config.siteName || "Cyber Hunt Lab"}
            </span>
          </div>
          <p className="text-[9px] font-mono tracking-widest text-slate-500 uppercase font-black">AI Prompt SRE</p>
        </div>

        {/* Navigation Quick Links Links */}
        <div className="flex items-center gap-6 text-[11px] text-slate-400 font-bold">
          <a href="#como-funciona" className="hover:text-slate-150 transition">Como Funciona</a>
          <a href="#precos" className="hover:text-slate-150 transition">Preços & Planos</a>
          <a href="#garantia" className="hover:text-slate-150 transition">Garantia</a>
          <a href="#faq" className="hover:text-slate-150 transition">FAQ</a>
        </div>

        {/* Actions stacked below (Title is in the middle, and these buttons are placed centered below) */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs justify-center pt-1">
          {isAuthenticated ? (
            <button
              onClick={onEnterApp}
              className="h-10 px-5 w-full rounded-xl bg-indigo-600 hover:bg-slate-100 hover:text-slate-950 text-white font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              Ir ao App Portal <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-4 w-full justify-center">
              <button
                onClick={onOpenAuth}
                className="text-xs font-bold text-slate-400 hover:text-slate-200 transition py-2 px-4 border border-slate-800 rounded-xl bg-slate-900/40 hover:bg-slate-900"
              >
                Entrar no Portal
              </button>
              <button
                onClick={onOpenAuth}
                className="h-10 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:opacity-90 text-white font-bold text-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                Assinar Agora
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* 🛸 1. HERO SECTION */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-slate-900 select-none">
        {/* Backdrop cosmic light leak */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] gradient-theme-bg opacity-20 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-full max-w-4xl mx-auto text-center px-4 sm:px-6 space-y-6 relative">
          <span className="py-1 px-3.5 rounded-full bg-rose-600/10 border border-rose-500/20 text-rose-300 font-mono text-[9px] font-bold uppercase tracking-widest leading-none">
            ⚡ ENGENHARIA DE PROMPTING ROBUSTA SRE
          </span>

          <h1 className="text-4xl sm:text-6xl font-black font-sans tracking-tight text-white leading-none max-w-3xl mx-auto">
            Não converse com a Inteligência Artificial, <span className="gradient-text">Blinde Suas Metainstruções</span>.
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Elimine alucinações e respostas imprecisas dos assistentes de linguagem corporativa. O <strong className="notranslate" translate="no">{config.siteName || "Cyber Hunt Lab"}</strong> estrutura, calibra e endurece seus prompts diários sob medida para o seu nicho profissional.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                if (isAuthenticated) onEnterApp();
                else onOpenAuth();
              }}
              className="h-12 w-full sm:w-auto px-7 rounded-xl bg-gradient-to-r from-purple-600 via-rose-600 to-indigo-600 text-white font-bold text-xs transition duration-200 active:scale-95 shadow-xl flex items-center justify-center gap-2 cursor-pointer border border-rose-500/15"
            >
              Começar Grátis ou Customizar <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#precos"
              className="h-12 w-full sm:w-auto px-7 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1 hover:text-slate-100"
            >
              Ver Tabela de Planos
            </a>
          </div>

          {/* Social Proof badge card */}
          <div className="pt-8 flex flex-col items-center justify-center gap-1 font-mono text-[10px] text-slate-500">
            <p className="uppercase tracking-widest font-bold">✓ Plataforma Protegida com garantia militar de resiliência</p>
            <p>Mais de 1,500 operadores construindo promptings de alta performance.</p>
          </div>
        </div>
      </section>

      {/* 📊 2. HOW IT WORKS SECTION */}
      <section id="como-funciona" className="py-16 sm:py-20 border-b border-slate-900 bg-slate-950/40 select-none">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-2">
            <span className="text-[10px] tracking-widest text-indigo-400 font-mono font-bold uppercase">MÉTODO PASSO A PASSO</span>
            <h2 className="text-2xl sm:text-3.5xl font-extrabold text-white tracking-tight">
              Como Funciona a Fábrica de Metaprompts?
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Nossa engine automatiza o rigor da Engenharia de Contexto para poupar o seu trabalho.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-950 bg-slate-900/30 hover:bg-slate-900/60 hover:border-slate-800 transition duration-300 flex flex-col justify-between group relative"
              >
                <div className="absolute top-4 right-4 text-3xl font-black text-slate-900 group-hover:text-indigo-950/80 transition duration-300 font-mono">
                  {st.num}
                </div>
                <div className="space-y-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">
                    {st.num}
                  </div>
                  <h3 className="font-bold text-xs text-slate-100">{st.title}</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 💰 3. PRICES & PLANS SECTION */}
      <section id="precos" className="py-16 sm:py-24 border-b border-slate-900 relative">
        <div className="absolute top-1/2 left-10 w-96 h-96 bg-purple-600/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-rose-600/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-2 select-none">
            <span className="text-[10px] tracking-widest text-rose-400 font-mono font-bold uppercase">ESCOLHA SUA ARMADURA</span>
            <h2 className="text-2xl sm:text-3.5xl font-extrabold text-white tracking-tight">
              Investimento Inteligente em Produtividade
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Ganhe tempo e qualidade de entrega. Destrave prompts perfeitamente blindados sem limites de cliques.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`p-6 sm:p-8 rounded-2xl border flex flex-col justify-between relative transition duration-300 hover:-translate-y-1 ${
                  p.popular
                    ? "border-rose-500 bg-slate-900/60 shadow-xl"
                    : "border-slate-800 bg-slate-900/20"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3.5 right-6 bg-gradient-to-r from-rose-600 to-purple-600 text-slate-50 text-[9px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                    Recomendado
                  </span>
                )}

                <div className="space-y-6">
                  <div>
                    <span className="py-0.5 px-2.5 rounded bg-slate-950 border border-slate-800 text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">
                      {p.badge}
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-100 mt-2.5">{p.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-1">{p.desc}</p>
                  </div>

                  {/* Price */}
                  <div className="border-t border-slate-900 pt-4 flex items-baseline gap-1 select-none">
                    <span className="text-3xl font-black text-slate-50">{p.price}</span>
                    <span className="text-[11px] text-slate-400 font-mono font-medium">{p.period}</span>
                  </div>

                  {/* Feature lists */}
                  <ul className="space-y-2.5 border-t border-slate-900 pt-4">
                    {p.features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <a
                    href={p.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-3 px-4 rounded-xl text-center font-bold text-xs transition block duration-200 active:scale-95 cursor-pointer shadow-md ${
                      p.popular
                        ? "bg-gradient-to-r from-purple-600 to-rose-600 text-slate-50 hover:opacity-95"
                        : "bg-slate-900 border border-slate-800 text-indigo-300 hover:text-white"
                    }`}
                  >
                    Ativar Assinatura Cyber <ArrowUpRight className="w-3.5 h-3.5 inline ml-1" />
                  </a>
                  <p className="text-center text-[9px] text-slate-500 mt-2 font-mono">
                    Garantia SRE incondicional de 7 dias com devolução
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🛡️ 4. GUARANTEE SECTION */}
      <section id="garantia" className="py-16 bg-slate-900/30 border-b border-slate-900 select-none">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-600 p-0.5 flex items-center justify-center mx-auto shadow-xl">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-rose-400">
              <Award className="w-8 h-8 animate-pulse" />
            </div>
          </div>

          <span className="py-0.5 px-3 rounded-full bg-rose-600/10 border border-rose-500/20 text-rose-300 font-mono text-[9px] font-bold uppercase tracking-widest">
            RISCO ZERO PARA VOCÊ
          </span>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Garantia de Satisfação de 7 Dias
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Nós confiamos tanto na calibre e blindagem das metainstruções do <strong className="notranslate" translate="no">{config.siteName || "Cyber Hunt Lab"}</strong> que te oferecemos risco zero. Experimente a plataforma e mude de nível. Se em até 7 dias você quiser desistir por qualquer motivo, nós devolvemos 100% de cada centavo seu. Sem perguntas, sem burocracias.
          </p>

          <div className="pt-2 font-mono text-[10px] text-slate-500">
            CONTRATO_CRIPTO_SRE: CERTIFICADO_DE_RISCO_ZERO_ATIVO
          </div>
        </div>
      </section>

      {/* 🧭 5. FAQ SECTION */}
      <section id="faq" className="py-16 sm:py-20 border-b border-slate-900">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 space-y-8 select-none">
          <div className="text-center space-y-2">
            <span className="text-[10px] tracking-widest text-indigo-400 font-mono font-bold uppercase">MITOS E VERDADES</span>
            <h2 className="text-2xl sm:text-3.5xl font-extrabold text-white tracking-tight">Dúvidas Frequentes</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((f, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-900 bg-slate-900/20 hover:border-slate-800 transition duration-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-200 flex justify-between items-center focus:outline-none cursor-pointer"
                >
                  <span>{f.q}</span>
                  <span className="text-indigo-400 font-bold font-mono">{activeFaq === idx ? "−" : "+"}</span>
                </button>
                {activeFaq === idx && (
                  <div className="p-4 pt-0 border-t border-slate-900/60 text-xs text-slate-400 leading-relaxed font-sans">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 📞 6. CONTACT_INFO & SEDE */}
      <section className="py-16 border-b border-slate-910 bg-slate-950/60">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 space-y-4 select-none">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight uppercase">Sede & Central de Atendimento</h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Estamos prontos para atender você a qualquer momento do dia. Entre em contato ou navegue até o nosso escritório técnico de inovação de prompt.
            </p>
            <div className="pt-2 space-y-3 text-xs text-slate-300">
              {config.address && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Sede Comercial:</strong> {config.address}</span>
                </div>
              )}
              {config.phone && (
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span><strong>SAC Telefone:</strong> {config.phone}</span>
                </div>
              )}
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <span><strong>E-mail de Contato:</strong> suporte@{siteNameLower.replace(/\s+/g, "")}.com.br</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 p-5 rounded-2xl border border-slate-800 bg-slate-900/20 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-4.5 h-4.5 text-amber-500" />
              Envie-nos uma Mensagem Rápida
            </h3>
            <p className="text-[10px] text-slate-500">Respondemos em até 2 horas úteis por e-mail ou zap.</p>
            <form onSubmit={(e) => { e.preventDefault(); alert("Mensagem despachada para nossa central com sucesso!"); }} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Seu nome"
                  className="w-full h-10 px-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-200 focus:outline-none"
                />
                <input
                  type="email"
                  required
                  placeholder="Seu e-mail"
                  className="w-full h-10 px-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-200 focus:outline-none"
                />
              </div>
              <textarea
                required
                rows={3}
                placeholder="Qual sua dúvida sobre nossos templates ou checkout?"
                className="w-full p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-200 focus:outline-none font-sans"
              />
              <button
                type="submit"
                className="h-10 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 w-full"
              >
                Despachar Mensagem Comercial
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 🏷️ 7. FOOTER */}
      <footer className="py-8 bg-slate-950/20 text-xs text-slate-500 text-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 select-none">
          <p>© 2026 <span className="notranslate" translate="no">{config.siteName || "Cyber Hunt Lab"}</span>. Todos os direitos reservados. CNPJ: 45.432.876/0001-90.</p>
          <div className="flex gap-4 font-bold">
            <a href="#como-funciona" className="hover:text-slate-300">Termos de Uso</a>
            <a href="#garantia" className="hover:text-slate-300">Privacidade</a>
            <span className="text-[10px] py-0.5 px-2 bg-slate-900 text-green-400 font-mono rounded">
              AMBIENTE_SRE_VERIFICADO
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
