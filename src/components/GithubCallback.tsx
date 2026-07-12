import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function GithubCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorObj, setErrorObj] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error") || params.get("error_description");

    if (code) {
      try {
        localStorage.setItem("gh_oauth_temp_code", code);
      } catch (e) {
        console.error(e);
      }
    } else if (error) {
      try {
        localStorage.setItem("gh_oauth_temp_error", error || "Falha na autorização");
      } catch (e) {
        console.error(e);
      }
    }

    if (window.opener) {
      if (code) {
        window.opener.postMessage({ type: "GITHUB_OAUTH_CODE", code }, "*");
        setStatus("success");
      } else {
        window.opener.postMessage({ type: "GITHUB_OAUTH_ERROR", error: error || "Falha na autorização" }, "*");
        setStatus("error");
        setErrorObj(error || "Acesso recusado pelo usuário.");
      }
      setTimeout(() => {
        window.close();
      }, 1000);
      return;
    }
    
    if (!code) {
      setStatus("error");
      setErrorObj("Código de autorização ausente na URL.");
      return;
    }

    const clientId = localStorage.getItem("gh_client_id");
    const clientSecret = localStorage.getItem("gh_client_secret");

    if (!clientId || !clientSecret) {
      setStatus("error");
      setErrorObj("Credenciais de aplicativo ausentes localmente. Por favor, configure as chaves na aba Admin.");
      return;
    }

    fetch("/api/github/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        code, 
        client_id: clientId, 
        client_secret: clientSecret,
        redirect_uri: `${window.location.origin}/auth/callback`
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.access_token) {
        localStorage.setItem("gh_access_token", data.access_token);
        setStatus("success");
        setTimeout(() => {
          const returnUrl = localStorage.getItem("gh_oauth_return_url") || "/";
          localStorage.removeItem("gh_oauth_return_url");
          window.location.href = returnUrl;
        }, 2000);
      } else {
        throw new Error(data.error_description || data.error || "Falha na autenticação via GitHub");
      }
    })
    .catch(err => {
      setStatus("error");
      setErrorObj(err.message);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-sans">
      <div className="max-w-md w-full p-8 rounded-2xl border border-slate-800 bg-slate-900/40 text-center space-y-6">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-100">Autenticando GitHub</h2>
              <p className="text-slate-400 text-sm">Validando o aplicativo OAuth de modo seguro...</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-100">Vinculado com Sucesso!</h2>
              <p className="text-slate-400 text-sm">O seu repositório está pronto para a exportação.</p>
              <p className="text-slate-500 text-xs">Redirecionando de volta ao app...</p>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-100">Falha de Autorização</h2>
              <p className="text-slate-400 text-sm">Não foi possível concluir o token OAuth.</p>
              <div className="p-3 mt-4 bg-red-950/30 border border-red-900/50 rounded-lg text-left">
                <p className="text-red-400 font-mono text-xs break-all">{errorObj}</p>
              </div>
              <button 
                onClick={() => window.location.href = "/"}
                className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-bold transition w-full cursor-pointer"
              >
                Voltar ao App
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
