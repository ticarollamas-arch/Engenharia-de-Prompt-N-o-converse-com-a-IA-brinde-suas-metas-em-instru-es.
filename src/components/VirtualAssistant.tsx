/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { MessageSquareCode, X, Send, Sparkles, Award, Zap, HelpCircle } from "lucide-react";

interface VirtualAssistantProps {
  siteName: string;
  monthlyCheckoutUrl: string;
  annualCheckoutUrl: string;
}

interface Message {
  sender: "customer" | "assistant";
  text: string;
  timestamp: string;
}

export default function VirtualAssistant({ siteName, monthlyCheckoutUrl, annualCheckoutUrl }: VirtualAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "assistant",
      text: `Olá! Sou o Assistente de Inteligência do ${siteName}. Estou aqui para tirar qualquer dúvida e te ajudar a blindar seus prompts. Como posso ajudar você hoje?`,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      sender: "customer",
      text,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Simulated conversion-focused AI response
    setTimeout(() => {
      let replyText = "";
      const cleaned = text.toLowerCase();

      if (cleaned.includes("preço") || cleaned.includes("valor") || cleaned.includes("plano") || cleaned.includes("pagamento") || cleaned.includes("cust")) {
        replyText = `Temos excelentes planos para impulsionar sua carreira! O plano de Operador Cyber sai por apenas R$ 97/mês (acesso ilimitado) e o plano Hunt Black por R$ 197/mês (com suporte prioritário). Você pode comprar com segurança de 7 dias de garantia incondicional direto pelo checkout.`;
      } else if (cleaned.includes("como funciona") || cleaned.includes("ajuda") || cleaned.includes("funciona")) {
        replyText = `O ${siteName} combina inteligência artificial avançada de segurança com preceitos rigorosos SRE de estabilidade para gerar metaprontas estruturadas com tratamentos anti-alucinação. Basta descrever o que deseja e nós moldamos o prompt perfeito em segundos!`;
      } else if (cleaned.includes("garantia") || cleaned.includes("seguro") || cleaned.includes("7 dias") || cleaned.includes("cancelar")) {
        replyText = `Oferecemos uma Garantia Incondicional de 7 dias. Se por qualquer motivo você não gostar ou achar que não é para você, basta solicitar o reembolso e devolvemos 100% do seu dinheiro sem perguntas irritantes.`;
      } else if (cleaned.includes("checkout") || cleaned.includes("comprar") || cleaned.includes("assinar") || cleaned.includes("quero") || cleaned.includes("gold") || cleaned.includes("black")) {
        replyText = `Incrível! Para começar hoje mesmo com acesso total, você pode assinar o plano Operador Cyber clicando aqui: ${monthlyCheckoutUrl} ou garantir o plano Hunt Black. Quer que eu te guie para a seção de preços?`;
      } else {
        replyText = `Excelente pergunta! No ${siteName}, nossa missão é fornecer ferramentas de ponta para que você domine a era da IA com maior assertividade. Recomendo assinar hoje mesmo para liberar todos os presets avançados e economizar até 80% do seu tempo de trabalho diário.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: replyText,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
      setIsTyping(false);
    }, 1000);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const txt = inputText;
    setInputText("");
    handleSendMessage(txt);
  };

  const quickQuestions = [
    { text: "Como funciona plataforma?", val: "Como funciona a plataforma?" },
    { text: "Quais os planos e preços?", val: "Quais são os planos e valores?" },
    { text: "Tem garantia de 7 dias?", val: "Como funciona a garantia de 7 dias?" },
    { text: "Quero assinar agora!", val: "Quero assinar o plano premium para começar!" }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold transition duration-300 hover:scale-105 active:scale-95 shadow-2.5xl cursor-pointer relative animate-bounce"
          style={{
            background: "linear-gradient(135deg, var(--navy) 0%, var(--purple) 50%, var(--rose) 100%)",
            border: "1.5px solid rgba(255,107,107,0.3)"
          }}
          title="Falar com Assistente Virtual"
        >
          <MessageSquareCode className="w-6 h-6 text-white" />
          <span className="absolute -top-1.5 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </button>
      )}

      {/* Virtual Assistant Modal Container */}
      {isOpen && (
        <div className="w-[360px] max-sm:w-[320px] rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden flex flex-col justify-between animate-fade-in text-xs font-sans h-[480px]">
          {/* Modal Header */}
          <div
            className="p-4 flex items-center justify-between text-slate-100 font-bold"
            style={{ background: "linear-gradient(135deg, var(--navy) 0%, var(--purple) 50%, var(--rose) 100%)" }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-300 animate-pulse" />
              <div>
                <p className="font-extrabold uppercase tracking-wide text-[10px]">Cyber Assistente</p>
                <p className="text-[9px] font-medium text-purple-200">Em linha • Resposta Instante</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white transition focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Chat Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/80 scrollbar-thin">
            {messages.map((m, idx) => {
              const renderMessageText = (text: string) => {
                const terms = [siteName, "Hunt Black", "Operador Cyber", "Cyber Hunt Lab"];
                const escapedTerms = terms.map(t => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
                const regex = new RegExp(`(${escapedTerms.join('|')})`, 'g');
                
                const parts = text.split(regex);
                return parts.map((part, i) => {
                  if (terms.includes(part)) {
                    return <span key={i} className="notranslate font-bold" translate="no">{part}</span>;
                  }
                  return part;
                });
              };

              return (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] ${
                    m.sender === "customer" ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl leading-relaxed font-sans ${
                      m.sender === "customer"
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    {renderMessageText(m.text)}
                  </div>
                  <span className="text-[8px] text-slate-500 font-mono mt-1 px-1">{m.timestamp}</span>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900/40 border border-slate-800/40 text-slate-500 w-28 text-[10px] animate-pulse">
                <Sparkles className="w-3 h-3 text-rose-400 animate-spin" />
                <span>Digitando...</span>
              </div>
            )}
          </div>

          {/* FAQ Fast Actions triggers */}
          <div className="p-2.5 bg-slate-900/30 border-t border-slate-900 grid grid-cols-2 gap-1.5">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q.val)}
                className="p-1.5 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700 rounded-lg hover:bg-slate-900 text-left text-[9px] text-slate-400 transition"
              >
                {q.text}
              </button>
            ))}
          </div>

          {/* Form input messaging block */}
          <form onSubmit={handleFormSubmit} className="p-3 border-t border-slate-900 bg-slate-950 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Pergunte sobre planos, garantia..."
              className="flex-1 h-9 px-3 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
            />
            <button
              type="submit"
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
