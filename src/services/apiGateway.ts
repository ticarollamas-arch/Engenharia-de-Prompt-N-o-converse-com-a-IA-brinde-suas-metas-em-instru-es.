/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = localStorage.getItem("accessToken");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  try {
    const response = await fetch(endpoint, { ...options, headers });
    
    // SRE Guard: Validate content type before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("O servidor web retornou uma resposta inválida (HTML/Texto contendo DOCTYPE) em vez de dados criptográficos.");
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || `Erro na API: Código de status ${response.status}`);
    }
    return data;
  } catch (error: any) {
    console.error("[API_GATEWAY_ERROR]", error.message, "at endpoint:", endpoint);
    return {
      status: "ERROR",
      detail: `${error.message || "Falha crítica de comunicação"} (endpoint: ${endpoint})`
    };
  }
};
