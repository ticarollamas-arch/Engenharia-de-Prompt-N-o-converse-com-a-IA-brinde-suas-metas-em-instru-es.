/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from "react";

interface SeoProps {
  title?: string;
  description?: string;
  siteName?: string;
}

export function useSEO({ title, description, siteName = "Cyber Hunt Lab" }: SeoProps) {
  useEffect(() => {
    // 1. Update Title tag
    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    document.title = fullTitle;

    // 2. Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", description || "O portal definitivo de inteligência cibernética e engenharia de metaprompt.");

    // 3. Update OG Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", fullTitle);

    // 4. Update OG Description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement("meta");
      ogDesc.setAttribute("property", "og:description");
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute("content", description || "Otimização Avançada de Prompts com Metaprompting SRE profissional.");

    // 5. Inject Structured Data (JSON-LD)
    let jsonLdScript = document.getElementById("seo-jsonld") as HTMLScriptElement;
    if (!jsonLdScript) {
      jsonLdScript = document.createElement("script");
      jsonLdScript.id = "seo-jsonld";
      jsonLdScript.type = "application/ld+json";
      document.head.appendChild(jsonLdScript);
    }

    const schemaData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": siteName,
      "operatingSystem": "All",
      "applicationCategory": "DeveloperApplication",
      "description": description || "Plataforma avançada de engenharia e blindagem de prompts com proteção e robustez cibernética.",
      "offers": {
        "@type": "Offer",
        "price": "97.00",
        "priceCurrency": "BRL"
      }
    };
    jsonLdScript.textContent = JSON.stringify(schemaData);
  }, [title, description, siteName]);
}
