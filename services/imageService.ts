import { GoogleGenAI } from "@google/genai";

const memoryCache = new Map<string, string>();

const CacheManager = {
  get(key: string): string | null {
    if (memoryCache.has(key)) {
      console.log(`[Cache Hit L1] Imagem encontrada na memória para: ${key}`);
      return memoryCache.get(key)!;
    }
    try {
      const cachedImage = localStorage.getItem(key);
      if (cachedImage) {
        console.log(`[Cache Hit L2] Imagem encontrada no localStorage para: ${key}`);
        memoryCache.set(key, cachedImage);
        return cachedImage;
      }
    } catch (e) {
      console.warn("Aviso: Falha ao ler do localStorage", e);
    }
    return null;
  },
  set(key: string, value: string): void {
    memoryCache.set(key, value);
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Aviso: Falha ao salvar no localStorage (possível limite de quota excedido)", e);
    }
  },
  remove(key: string): void {
    memoryCache.delete(key);
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("Aviso: Falha ao remover do localStorage", e);
    }
  }
};

const withTimeout = <T>(promise: Promise<T>, ms: number, timeoutMessage: string = "Timeout exceeded"): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(timeoutMessage)), ms))
  ]);
};

const isImageUrl = (url: string) => {
  if (!url || !/^(http|https):\/\//i.test(url)) return false;
  // Relaxed check: trust the LLM if it returns a valid HTTP URL, as many CDNs hide extensions
  return true;
};

/**
 * Busca a imagem de um EPI na internet priorizando o Nome e depois o CA.
 * Se não encontrar, utiliza a IA do Nano Banana (gemini-2.5-flash-image) para gerar uma imagem de alta fidelidade.
 */
export async function fetchOrGenerateImage(
  ai: GoogleGenAI,
  ca: string,
  name: string,
  manufacturer: string = "",
  visualContext: string = "",
  onStatusUpdate?: (status: string) => void,
  forceRefresh: boolean = false
): Promise<string | null> {
  const cacheKey = `epi_img_${ca}_${name.replace(/\s+/g, '_')}`;

  if (forceRefresh) {
    CacheManager.remove(cacheKey);
    console.log(`[Cache Invalidação] Cache limpo para: ${name}`);
    onStatusUpdate?.("Limpando cache antigo...");
  } else {
    const cachedImage = CacheManager.get(cacheKey);
    if (cachedImage) {
      onStatusUpdate?.("Imagem carregada do cache...");
      return cachedImage;
    }
  }

  let finalImage: string | null = null;

  // --- PASSO 1: Busca de Imagem na Internet ---
  try {
    onStatusUpdate?.("Buscando imagem oficial na internet...");
    const imageSearchPrompt = `
      Você é um assistente especializado em catálogos de EPIs (Equipamentos de Proteção Individual).
      Sua tarefa é encontrar a URL direta da imagem do produto: "${name}" (CA: ${ca}, Fabricante: ${manufacturer}).

      INSTRUÇÕES DE BUSCA:
      1. Pesquise no Google pelo nome exato do produto, fabricante e, PRINCIPALMENTE, pelo número do CA (${ca}).
      2. A imagem DEVE ser fiel ao produto relacionado a este CA específico.
      3. Busque em sites de distribuidores de EPI no Brasil (ex: Prometal EPI, Astro Distribuidora, Superepi, Mercado Livre) ou no site oficial do fabricante.
      4. Encontre a URL direta da imagem principal do produto (o link da tag <img src="...">).
      5. A URL deve ser pública e acessível (iniciar com http ou https).
      6. Dê preferência a imagens com fundo branco ou neutro, com foco claro no produto (estilo catálogo/e-commerce).

      FORMATO DE RESPOSTA OBRIGATÓRIO (JSON puro):
      {
        "imageUrl": "https://url-direta-da-imagem.com/imagem.jpg"
      }

      Se não encontrar nenhuma imagem confiável e fiel ao CA, retorne:
      {
        "imageUrl": null
      }
    `;

    const imgSearchResponse = await withTimeout(
      ai.models.generateContent({
         model: "gemini-3-flash-preview",
         contents: imageSearchPrompt,
         config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json"
         }
      }),
      15000, // Timeout de 15 segundos para a busca
      "Timeout na busca do Google"
    );

    if (imgSearchResponse.text) {
       const imgData = JSON.parse(imgSearchResponse.text);
       if (imgData.imageUrl && isImageUrl(imgData.imageUrl)) {
          finalImage = imgData.imageUrl;
       }
    }
  } catch (imgErr) {
     console.warn("Falha na busca de imagem (Passo 1):", imgErr);
     onStatusUpdate?.("Erro na busca. Tentando gerar imagem...");
  }

  // --- PASSO 2: Geração de Imagem IA (Fallback com Nano Banana) ---
  if (!finalImage) {
    try {
      onStatusUpdate?.("Gerando imagem de alta fidelidade com IA...");
      const visualCtx = visualContext || name;
      const imageGenPrompt = `
        Atue como um especialista em segurança do trabalho e renderização fotorrealista.

        Tarefa: Gere uma imagem hiper-realista do produto abaixo, garantindo que as características técnicas de design e segurança sejam respeitadas conforme o padrão de mercado.

        Especificações do Produto:

        Nome: ${name} (Fabricante: ${manufacturer || "Genérico"})

        CA (Certificado de Aprovação): ${ca}

        Descrição Visual: ${visualCtx}

        Diretrizes de Qualidade de Imagem:

        Estilo: Fotografia de estúdio de alta resolução, estilo "Product Photography".

        Iluminação: Luz suave de 3 pontos para destacar as texturas do material (ex: poros do couro, costuras reforçadas, brilho do policarbonato).

        Fundo: Fundo neutro (branco ou cinza claro) para foco total no produto.

        Detalhes: Enfatize detalhes que conferem realismo, como etiquetas de certificação, relevos de marca e acabamentos de costura.

        Perspectiva: Ângulo de 45 graus para mostrar profundidade e design tridimensional.

        Restrição: Não utilize ilustrações ou aspectos de desenho animado. A imagem deve parecer uma foto real de um catálogo de equipamentos de segurança industrial.
      `;
      
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: imageGenPrompt,
        config: {
            imageConfig: {
                aspectRatio: "1:1"
            }
        }
      });

      const parts = imageResponse.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            finalImage = `data:${mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    } catch (genErr) {
       console.warn("Falha na geração de imagem (Passo 2):", genErr);
       onStatusUpdate?.("Erro ao gerar imagem.");
    }
  }

  // --- SALVAR NO CACHE ---
  if (finalImage) {
    CacheManager.set(cacheKey, finalImage);
  }

  return finalImage;
}
