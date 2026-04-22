import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { GoogleGenAI, Type } from "@google/genai";
import { Icon } from '../components/Icon';
import { Header } from '../components/Header';
import { MOCK_DB, ProductData } from '../data/mockData';
import { fetchOrGenerateImage } from '../services/imageService';
import { SuspenseImage, ImageErrorBoundary } from '../components/SuspenseImage';

const Details: React.FC = () => {
  const navigate = useNavigate();
  const { ca } = useParams<{ ca: string }>();
  const location = useLocation();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("Iniciando busca...");
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);

  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      setError(null);
      setSources([]);

      if (!ca) {
        setLoading(false);
        setError("CA não fornecido.");
        return;
      }

      // Check for passed state from Dashboard
      const stateProduct = location.state?.productData;
      
      // Helper para verificar URL
      const isUrl = /^(http|https):\/\//i.test(ca);

      // 1. Tentar buscar no banco local (se não for URL)
      if (!isUrl && MOCK_DB[ca]) {
        setProduct({
            ...MOCK_DB[ca],
            // Override image if passed from dashboard (e.g. AI generated one)
            image: stateProduct?.image || MOCK_DB[ca].image
        });
        setLoading(false);
        return;
      }

      // 2. Se não encontrar ou for URL, usar a IA para gerar dados
      try {
        setStatus("Buscando informações do produto...");
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
           throw new Error("API Key not available for generation");
        }

        const ai = new GoogleGenAI({ apiKey });

        // Geração de Dados de Texto
        const textModel = "gemini-3-flash-preview";
        let prompt = "";
        let tools: any[] = [];
        
        if (isUrl) {
           prompt = `Gere um objeto JSON contendo dados técnicos fictícios mas realistas para um Equipamento de Proteção Individual (EPI) Genérico (Ex: Bota, Capacete ou Luva).
           Ignore o número de CA pois estamos usando uma imagem personalizada.
           O JSON deve seguir exatamente esta estrutura:
           {
             "ca": "N/A",
             "name": "Item Personalizado (IA)",
             "price": "100,00",
             "life": "365",
             "description": "Descrição detalhada do equipamento...",
             "type": "EPI Genérico",
             "benefits": [{"icon": "check", "color": "green", "label": "Benefício"}],
             "specs": [{"label": "Material", "value": "..."}],
             "indications": ["Uso Geral"]
           }`;
        } else {
           const isNumeric = /^\d+$/.test(ca);
           const productName = stateProduct?.name || "";
           
           prompt = `Pesquise no Google pelo Certificado de Aprovação (CA) número "${ca}" de EPI (Equipamento de Proteção Individual).
           ${productName ? `Nome sugerido: "${productName}".` : ""}
           Identifique o produto exato, o fabricante e as características técnicas.

           Gere um objeto JSON com os dados reais encontrados. Se não encontrar dados exatos, faça a melhor estimativa baseada em produtos similares com esse CA.
           O JSON deve seguir exatamente esta estrutura:
           {
             "ca": "${isNumeric ? ca : "N/A"}",
             "name": "NOME DO PRODUTO - FABRICANTE",
             "price": "Preço estimado (ex: 50,00)",
             "life": "Validade do CA em dias (ex: 1825)",
             "description": "Descrição técnica detalhada do produto encontrado...",
             "type": "Tipo do EPI",
             "benefits": [{"icon": "check", "color": "green", "label": "Benefício 1"}, {"icon": "verified", "color": "blue", "label": "Benefício 2"}],
             "specs": [{"label": "Fabricante", "value": "Nome do Fabricante"}, {"label": "Material", "value": "..."}],
             "indications": ["Indicação 1", "Indicação 2"]
           }
           
           IMPORTANTE: O campo "name" deve estar no formato "NOME DO PRODUTO - FABRICANTE". Exemplo: "LUVA SEGURANCA BORRACHA - DANNY".`;
           
           tools = [{ googleSearch: {} }];
        }

        const textResponse = await ai.models.generateContent({
          model: textModel,
          contents: prompt,
          config: { 
            responseMimeType: "application/json",
            tools: tools
          }
        });

        const generatedData = JSON.parse(textResponse.text || "{}");

        // Extrair fontes de pesquisa (Grounding)
        const chunks = textResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
            const extractedSources = chunks
                .map((chunk: any) => chunk.web)
                .filter((web: any) => web && web.uri && web.title);
            setSources(extractedSources);
        }

        // Geração de Imagem baseada no Nome (Apenas se NÃO for URL e NÃO tiver vindo do Dashboard)
        let imageUrl = isUrl ? ca : 'https://placehold.co/600x450?text=Imagem+Gerada+por+IA';
        
        // Helper para verificar se é URL de imagem
        const isImageUrl = (url: string) => {
            if (!url || !/^(http|https):\/\//i.test(url)) return false;
            const cleanUrl = url.split('?')[0].toLowerCase();
            return /\.(jpg|jpeg|png|webp|gif|svg)$/.test(cleanUrl);
        };

        // CRITICAL: Use image from dashboard state if available
        if (stateProduct?.image) {
            imageUrl = stateProduct.image;
        } else if (!isUrl) {
          // 1. Tenta buscar imagem na internet e gerar com IA (Fallback)
          try {
              const manufacturer = generatedData.specs?.find((s:any) => s.label === 'Fabricante')?.value || '';
              const visualCtx = `Tipo: ${generatedData.type}. Especificações: ${JSON.stringify(generatedData.specs)}`;
              
              const fetchedImage = await fetchOrGenerateImage(
                ai,
                ca,
                generatedData.name,
                manufacturer,
                visualCtx,
                (msg) => setStatus(msg)
              );
              
              if (fetchedImage) {
                imageUrl = fetchedImage;
              }
          } catch (e) { 
              console.warn("Erro busca img details", e); 
          }
        }

        setProduct({
            ...generatedData,
            image: imageUrl,
            ca: isUrl ? 'Custom' : ca, // Garante que o CA é o solicitado ou marca como custom
            price: stateProduct?.price || generatedData.price, // Prefer dashboard price if available
            life: stateProduct?.life || generatedData.life // Prefer dashboard life if available
        });

      } catch (err) {
        console.error("Erro ao buscar/gerar produto:", err);
        setError("Não foi possível localizar ou gerar informações para o item solicitado.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [ca, location.state]);

  if (loading) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col">
        <Header title="Buscando EPI..." />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <Icon name="psychology" className="text-6xl text-primary animate-pulse" />
          <h2 className="text-xl font-bold text-slate-700 dark:text-white">Analisando Dados</h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            {status}
          </p>
        </div>
      </div>
    );
  }

  // Estado de carregamento ou não encontrado
  if (error || !product) {
    return (
      <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white min-h-screen flex flex-col">
        <Header title="Detalhes do EPI" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <Icon name="search_off" className="text-6xl text-slate-300 mb-4" />
            <h2 className="text-xl font-bold mb-2">EPI Não Encontrado</h2>
            <p className="text-slate-500 mb-6">{error || "Não foi possível localizar ou gerar informações para o item solicitado."}</p>
            <button 
                onClick={() => navigate('/dashboard')}
                className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20"
            >
                Voltar ao Início
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white min-h-screen flex flex-col">
      <Header
        title="Detalhes do EPI"
        rightActions={
          <button className="p-2 -mr-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <Icon name="bookmark" className="text-[24px]" />
          </button>
        }
      />

      <main className="flex-1 max-w-md mx-auto w-full pb-8">
        <section className="relative w-full aspect-[4/3] bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <ImageErrorBoundary 
            fallback={
              <img 
                src="https://placehold.co/600x450?text=Erro+ao+Carregar+Imagem" 
                alt="Erro ao carregar" 
                className="w-full h-full object-cover" 
              />
            }
          >
            <React.Suspense 
              fallback={
                <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 animate-pulse">
                  <Icon name="image" className="text-6xl text-slate-400" />
                </div>
              }
            >
              <SuspenseImage
                alt={product.name}
                className="w-full h-full object-cover"
                src={product.image}
              />
            </React.Suspense>
          </ImageErrorBoundary>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background-light dark:from-background-dark to-transparent"></div>
        </section>

        <section className="px-5 -mt-6 relative z-10">
          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-bold leading-tight flex-1">{product.name}</h2>
              <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-md uppercase border border-primary/20">
                Ativo
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Icon name="verified" className="text-sm" />
              <span className="text-sm font-medium tracking-wide">C.A {product.ca}</span>
            </div>
          </div>
        </section>

        <section className="px-5 py-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 ml-1">
            Visão Geral
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            {product.description}
          </p>
        </section>

        {product.benefits && (
            <section className="px-5 py-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 ml-1">
                Principais Benefícios
            </h3>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                {product.benefits.map((item, idx) => (
                <div key={idx} className="flex-shrink-0 flex flex-col items-center gap-2 w-20">
                    <div
                    className={`w-12 h-12 rounded-2xl bg-${item.color}-500/10 flex items-center justify-center border border-${item.color}-500/20`}
                    >
                    <Icon name={item.icon} className={`text-${item.color}-500`} />
                    </div>
                    <span className="text-[10px] font-bold text-center dark:text-slate-300">{item.label}</span>
                </div>
                ))}
            </div>
            </section>
        )}

        {product.specs && (
            <section className="px-5 py-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 ml-1">
                Características Técnicas
            </h3>
            <div className="bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {product.specs.map((spec, index) => (
                    <div key={index} className={`flex items-center justify-between p-4 ${index !== product.specs.length - 1 ? 'border-b border-slate-200 dark:border-slate-800' : ''}`}>
                    <span className="text-xs font-medium text-slate-500">{spec.label}</span>
                    <span className="text-sm font-bold text-right">{spec.value}</span>
                    </div>
                ))}
            </div>
            </section>
        )}

        {product.indications && (
            <section className="px-5 py-2 mb-10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 ml-1">
                Indicações de Uso
            </h3>
            <div className="flex flex-wrap gap-2">
                {product.indications.map((tag) => (
                <span key={tag} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-full text-xs font-bold">
                    {tag}
                </span>
                ))}
            </div>
            </section>
        )}

        <section className="px-5 pb-6">
          <button 
            onClick={() => navigate('/report')}
            className="w-full bg-primary text-white h-14 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all"
          >
            <Icon name="analytics" />
            Relatório Técnico
          </button>
          <div className="mt-6 flex flex-col items-center">
            {sources && sources.length > 0 && (
              <div className="w-full mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 ml-1 text-center">
                  Fontes da Pesquisa
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {sources.map((source: any, idx: number) => (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary bg-primary/5 hover:bg-primary/10 px-2 py-1 rounded border border-primary/10 truncate max-w-[150px]"
                      title={source.title}
                    >
                      {source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">
              By TCS
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Details;