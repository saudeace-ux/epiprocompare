import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { Icon } from '../components/Icon';
import { Header } from '../components/Header';
import { MOCK_DB } from '../data/mockData';
import { fetchOrGenerateImage } from '../services/imageService';

const INITIAL_INPUTS = {
  mainCA: '43377',
  mainPrice: '150,00',
  mainLife: '365',
  compCA: '11268',
  compPrice: '35,00',
  compLife: '90'
};

interface HistoryItem {
  mainCA: string;
  compCA: string;
  mainName: string;
  compName: string;
  timestamp: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [inputs, setInputs] = useState(INITIAL_INPUTS);
  
  // Estado separado para os CAs "Ativos" na visualização (Cards)
  const [activeCAs, setActiveCAs] = useState({
    main: INITIAL_INPUTS.mainCA,
    comp: INITIAL_INPUTS.compCA
  });

  // Estado para armazenar produtos gerados/buscados dinamicamente pela IA
  const [dynamicProducts, setDynamicProducts] = useState<{
    main?: { name: string; image: string };
    comp?: { name: string; image: string };
  }>({});

  const [searchLoading, setSearchLoading] = useState({ main: false, comp: false });
  const [searchStatus, setSearchStatus] = useState({ main: '', comp: '' });
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Helper para verificar URL
  const isUrl = (str: string) => /^(http|https):\/\//i.test(str.trim());

  const [isRestored, setIsRestored] = useState(false);

  // Carregar histórico do localStorage ao iniciar
  useEffect(() => {
    const savedHistory = localStorage.getItem('epi_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    // Recuperar estado da sessão (persistência ao voltar da tela de detalhes)
    const savedSession = sessionStorage.getItem('dashboard_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.inputs) setInputs(parsed.inputs);
        if (parsed.activeCAs) setActiveCAs(parsed.activeCAs);
        if (parsed.dynamicProducts) setDynamicProducts(parsed.dynamicProducts);
      } catch (e) {
        console.error("Erro ao restaurar sessão", e);
      }
    }
    setIsRestored(true);
  }, []);

  // Salvar estado na sessão sempre que mudar
  useEffect(() => {
    if (!isRestored) return;

    const sessionData = {
      inputs,
      activeCAs,
      dynamicProducts
    };
    sessionStorage.setItem('dashboard_session', JSON.stringify(sessionData));
  }, [inputs, activeCAs, dynamicProducts, isRestored]);

  const handleChange = (key: string, value: string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const saveToHistory = (mainKey: string, compKey: string, mainNameVal?: string, compNameVal?: string) => {
    const newItem: HistoryItem = {
      mainCA: mainKey,
      compCA: compKey,
      mainName: mainNameVal || MOCK_DB[mainKey]?.name || (isUrl(mainKey) ? 'Item Personalizado' : `CA ${mainKey}`),
      compName: compNameVal || MOCK_DB[compKey]?.name || (isUrl(compKey) ? 'Item Personalizado' : `CA ${compKey}`),
      timestamp: new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    };

    setHistory(prev => {
      const filtered = prev.filter(item => !(item.mainCA === mainKey && item.compCA === compKey));
      const updated = [newItem, ...filtered].slice(0, 5);
      localStorage.setItem('epi_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSearchCA = async (field: 'main' | 'comp', forceRefresh: boolean = false) => {
    const ca = field === 'main' ? inputs.mainCA : inputs.compCA;
    if (!ca) return;

    // Fix: Define inputValue based on ca
    const inputValue = ca;

    setSearchLoading(prev => ({ ...prev, [field]: true }));
    setSearchStatus(prev => ({ ...prev, [field]: 'Iniciando busca...' }));
    setSearchError(null);

    // Check if input is likely a CA (numeric)
    const isNumeric = /^\d+$/.test(inputValue.replace(/\./g, '').trim());
    let currentCA = inputValue;

    // Dados base
    let finalName = `EPI ${inputValue}`;
    let finalManufacturer = "";
    let finalImage = "";
    let finalDescription = "";

    // PRE-FILL: Se for numérico e existir no MOCK_DB, usa como base, mas CONTINUA a busca online
    if (isNumeric && MOCK_DB[inputValue]) {
      const dbItem = MOCK_DB[inputValue];
      finalName = dbItem.name;
      // Não definimos finalImage aqui para forçar a busca/geração via imageService
      
      // Atualiza inputs de preço/vida útil se estiverem vazios ou padrão
      setInputs(prev => ({
        ...prev,
        [field === 'main' ? 'mainPrice' : 'compPrice']: dbItem.price,
        [field === 'main' ? 'mainLife' : 'compLife']: dbItem.life
      }));
    }

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      const ai = new GoogleGenAI({ apiKey });

      // --- PASSO 1: Identificação do Produto via Busca ---
      if (!isUrl(inputValue)) {
        try {
          setSearchStatus(prev => ({ ...prev, [field]: 'Buscando informações do produto...' }));
          let searchPrompt = "";
          
          if (isNumeric) {
             searchPrompt = `
            Você é um assistente especializado em EPIs (Equipamentos de Proteção Individual) no Brasil.
            Tarefa: Pesquise no Google e encontre o NOME EXATO e uma IMAGEM OFICIAL do produto correspondente ao CA (Certificado de Aprovação): "${inputValue}".
            
            IMPORTANTE:
            1. O número "${inputValue}" é um CA (Certificado de Aprovação) emitido pelo Ministério do Trabalho do Brasil.
            2. Busque especificamente por "CA ${inputValue}" ou "Certificado de Aprovação ${inputValue}".
            3. Identifique o Fabricante e o Modelo/Nome do EPI.
            4. Tente encontrar uma URL de imagem direta (JPG/PNG) em sites OFICIAIS do fabricante ou grandes distribuidores.

            Fontes de confiança (Prioridade Alta):
            - Sites dos Fabricantes (Marluvas, Danny, 3M, MSA, etc.)
            - Catálogos Oficiais
            - Grandes Distribuidores (Superepi, Dimensional, Tuiuti)

            Fontes Secundárias:
            - consultaca.com
            - tst.jus.br
            - gov.br
            - Marketplaces com Lojas Oficiais

            Retorne APENAS um JSON com:
            {
              "manufacturer": "Nome do Fabricante",
              "productName": "Nome do Produto (ex: Botina Nobuck, Capacete Aba Frontal)",
              "ca": "${inputValue}",
              "visualContext": "Descrição visual curta para gerar imagem (ex: Bota marrom couro nobuck)"
            }
          `;
          } else {
             searchPrompt = `
            Você é um assistente especializado em EPIs (Equipamentos de Proteção Individual) no Brasil.
            Tarefa: Pesquise no Google e encontre os detalhes do EPI com o nome: "${inputValue}".
            
            IMPORTANTE:
            1. Busque pelo produto "${inputValue}".
            2. Tente encontrar o CA (Certificado de Aprovação) se possível.
            3. Identifique o Fabricante e o Modelo exato.

            Retorne APENAS um JSON com:
            {
              "manufacturer": "Nome do Fabricante",
              "productName": "Nome do Produto Corrigido/Completo",
              "ca": "Número do CA se encontrado (ou null)",
              "visualContext": "Descrição visual curta para gerar imagem"
            }
          `;
          }

          const searchResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: searchPrompt,
            config: {
              tools: [{ googleSearch: {} }],
              responseMimeType: "application/json"
            }
          });

          if (searchResponse.text) {
             const data = JSON.parse(searchResponse.text);
             if (data.productName) finalName = data.productName;
             if (data.manufacturer) finalManufacturer = data.manufacturer;
             if (data.visualContext) finalDescription = data.visualContext;
             
             // Se encontrou um CA e a busca original não era numérica, atualiza o input
             if (data.ca && !isNumeric) {
                 const foundCA = data.ca.replace(/\D/g, ''); // Remove non-digits
                 if (foundCA) {
                     currentCA = foundCA;
                     // Update input field to show the found CA
                     handleChange(field === 'main' ? 'mainCA' : 'compCA', currentCA);
                     
                     // Check MOCK_DB again with the found CA
                     if (MOCK_DB[currentCA]) {
                        const dbItem = MOCK_DB[currentCA];
                        // Optionally update price/life if not set
                        setInputs(prev => ({
                            ...prev,
                            [field === 'main' ? 'mainPrice' : 'compPrice']: dbItem.price,
                            [field === 'main' ? 'mainLife' : 'compLife']: dbItem.life
                        }));
                     }
                 }
             }
          }
        } catch (searchErr) {
          console.warn("Falha na busca de dados (Passo 1):", searchErr);
        }
      } else {
        finalName = "Item Personalizado";
        finalImage = inputValue;
      }

      // Nome composto para busca de imagem
      const displayName = finalManufacturer && !finalName.toLowerCase().includes(finalManufacturer.toLowerCase())
        ? `${finalName} - ${finalManufacturer}`
        : finalName;

      // --- PASSO 2 e 3: Busca e Geração de Imagem (via Serviço) ---
      if (!finalImage && !isUrl(inputValue)) {
        const fetchedImage = await fetchOrGenerateImage(
          ai,
          currentCA,
          displayName,
          finalManufacturer,
          finalDescription,
          (status) => setSearchStatus(prev => ({ ...prev, [field]: status })),
          forceRefresh
        );
        if (fetchedImage) {
          finalImage = fetchedImage;
        }
      }

      // --- Fallback Final ---
      if (!finalImage) {
        finalImage = `https://placehold.co/400x400?text=${encodeURIComponent(finalName.substring(0, 15))}`;
      }

      // Atualiza Estados
      setDynamicProducts(prev => ({
        ...prev,
        [field]: {
          name: displayName,
          image: finalImage
        }
      }));

      setActiveCAs(prev => ({ ...prev, [field]: currentCA }));

      // Histórico
      const otherField = field === 'main' ? 'comp' : 'main';
      const otherCA = field === 'main' ? inputs.compCA : inputs.mainCA;
      const otherName = dynamicProducts[otherField]?.name || MOCK_DB[otherCA]?.name || (isUrl(otherCA) ? 'Item Personalizado' : `CA ${otherCA}`);

      saveToHistory(
        field === 'main' ? ca : otherCA,
        field === 'main' ? otherCA : ca,
        field === 'main' ? displayName : otherName,
        field === 'comp' ? displayName : otherName
      );

    } catch (globalErr) {
      console.error("Erro crítico no fluxo de busca:", globalErr);
      setSearchError("Falha ao buscar dados. Verifique sua conexão ou tente novamente.");
      setDynamicProducts(prev => ({
        ...prev,
        [field]: {
          name: `EPI CA ${ca}`,
          image: `https://placehold.co/400x400?text=CA+${ca}`
        }
      }));
      setActiveCAs(prev => ({ ...prev, [field]: ca }));
    } finally {
      setSearchLoading(prev => ({ ...prev, [field]: false }));
      setSearchStatus(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Clear error when inputs change
  useEffect(() => {
    if (searchError) setSearchError(null);
  }, [inputs]);

  // Trigger initial search on mount if no session was restored
  useEffect(() => {
    if (isRestored && !sessionStorage.getItem('dashboard_session_loaded')) {
      sessionStorage.setItem('dashboard_session_loaded', 'true');
      // Only search if we don't already have dynamic products loaded
      if (!dynamicProducts.main) handleSearchCA('main');
      if (!dynamicProducts.comp) handleSearchCA('comp');
    }
  }, [isRestored]);

  const handleClear = () => {
    setInputs({
      mainCA: '',
      mainPrice: '',
      mainLife: '',
      compCA: '',
      compPrice: '',
      compLife: ''
    });
    setActiveCAs({ main: '', comp: '' });
    setDynamicProducts({});
    setSearchError(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Limpa dados dinâmicos para forçar a re-renderização
    setDynamicProducts({});
    
    await Promise.all([
      handleSearchCA('main', true),
      handleSearchCA('comp', true)
    ]);

    const mainKey = inputs.mainCA.trim();
    const compKey = inputs.compCA.trim();
    saveToHistory(mainKey, compKey);
    
    setIsRefreshing(false);
  };

  const restoreHistoryItem = (item: HistoryItem) => {
    setInputs(prev => ({
      ...prev,
      mainCA: item.mainCA,
      compCA: item.compCA,
      mainPrice: MOCK_DB[item.mainCA]?.price || prev.mainPrice,
      mainLife: MOCK_DB[item.mainCA]?.life || prev.mainLife,
      compPrice: MOCK_DB[item.compCA]?.price || prev.compPrice,
      compLife: MOCK_DB[item.compCA]?.life || prev.compLife,
    }));
    setActiveCAs({ main: item.mainCA, comp: item.compCA });
    
    setDynamicProducts({});
    setShowHistory(false);
  };

  const loadFromCatalog = (item: any, target: 'main' | 'comp') => {
    setInputs(prev => ({
        ...prev,
        [target === 'main' ? 'mainCA' : 'compCA']: item.ca,
        [target === 'main' ? 'mainPrice' : 'compPrice']: item.price,
        [target === 'main' ? 'mainLife' : 'compLife']: item.life
    }));
    setActiveCAs(prev => ({ ...prev, [target]: item.ca }));
    setDynamicProducts(prev => ({
        ...prev,
        [target]: { name: item.name, image: item.image }
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'Capacete', label: 'Capacetes' },
    { id: 'Calçado', label: 'Botas' },
    { id: 'Luva', label: 'Luvas' },
    { id: 'Proteção Visual', label: 'Óculos' },
    { id: 'Proteção Auditiva', label: 'Auditiva' },
  ];

  const filteredItems = useMemo(() => {
    const items = Object.values(MOCK_DB);
    if (selectedCategory === 'all') return items;
    return items.filter(item => item.type === selectedCategory);
  }, [selectedCategory]);

  // Lógica de Cálculo em Tempo Real
  const calculations = useMemo(() => {
    const parseValue = (str: string) => {
      if (!str) return 0;
      return parseFloat(str.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
    };

    const mainP = parseValue(inputs.mainPrice);
    const mainL = parseInt(inputs.mainLife) || 1;
    const compP = parseValue(inputs.compPrice);
    const compL = parseInt(inputs.compLife) || 1;

    const mainDaily = mainP / mainL;
    const compDaily = compP / compL;

    const isMainCheaper = mainDaily < compDaily;
    const cheaperDaily = isMainCheaper ? mainDaily : compDaily;
    const expensiveDaily = isMainCheaper ? compDaily : mainDaily;
    
    const economyPercent = expensiveDaily > 0 
      ? ((expensiveDaily - cheaperDaily) / expensiveDaily) * 100 
      : 0;
    
    const maxLife = Math.max(mainL, compL);
    const mainLifePercent = Math.max((mainL / maxLife) * 100, 5);
    const compLifePercent = Math.max((compL / maxLife) * 100, 5);

    const mainDBItem = MOCK_DB[activeCAs.main];
    const compDBItem = MOCK_DB[activeCAs.comp];
    const mainDyn = dynamicProducts.main;
    const compDyn = dynamicProducts.comp;

    const mainIsUrl = isUrl(activeCAs.main);
    const compIsUrl = isUrl(activeCAs.comp);
    const fallbackImage = 'https://placehold.co/400x400?text=EPI';

    // Prioridade: Dinâmico (IA) > Banco de Dados Mock > URL Direta > Fallback
    const mainName = mainDyn?.name || mainDBItem?.name || (mainIsUrl ? 'Item Personalizado' : 'EPI Principal');
    const compName = compDyn?.name || compDBItem?.name || (compIsUrl ? 'Item Personalizado' : 'Comparação');
    
    const mainImage = mainDyn?.image || mainDBItem?.image || (mainIsUrl ? activeCAs.main : (activeCAs.main ? fallbackImage : null));
    const compImage = compDyn?.image || compDBItem?.image || (compIsUrl ? activeCAs.comp : (activeCAs.comp ? fallbackImage : null));

    return {
      mainDaily,
      compDaily,
      isMainCheaper,
      economyPercent: economyPercent.toFixed(0),
      winnerName: isMainCheaper ? mainName : compName,
      loserName: isMainCheaper ? compName : mainName,
      mainName,
      compName,
      mainImage,
      compImage,
      mainCA: activeCAs.main,
      compCA: activeCAs.comp,
      mainLifePercent,
      compLifePercent
    };
  }, [inputs, activeCAs, dynamicProducts]);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white min-h-screen flex flex-col relative">
      {/* Modal de Histórico */}
      {showHistory && (
        <div 
          className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-start pt-20"
          onClick={() => setShowHistory(false)}
        >
          <div 
            className="bg-white dark:bg-card-dark w-full max-w-sm mx-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-[fadeIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-700 dark:text-slate-200">Últimas Comparações</h3>
              <button 
                onClick={() => setShowHistory(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {history.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  <Icon name="history" className="text-3xl mb-2 opacity-50" />
                  <p>Nenhum histórico recente.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.map((item, index) => (
                    <li key={index}>
                      <button 
                        onClick={() => restoreHistoryItem(item)}
                        className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                            <Icon name="schedule" className="text-[10px]" />
                            {item.timestamp}
                          </div>
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                            <span className="truncate max-w-[100px]">{item.mainName}</span>
                            <span className="text-slate-400">vs</span>
                            <span className="truncate max-w-[100px]">{item.compName}</span>
                          </div>
                        </div>
                        <Icon name="chevron_right" className="text-slate-300 group-hover:text-primary transition-colors" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 text-center border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => {
                  setHistory([]);
                  localStorage.removeItem('epi_history');
                }}
                className="text-xs text-red-500 hover:text-red-600 font-medium"
              >
                Limpar Histórico
              </button>
            </div>
          </div>
        </div>
      )}

      <Header 
        showBack={true}
        rightActions={
          <>
            <button 
              onClick={handleClear}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
              title="Limpar Campos"
            >
              <Icon name="delete_sweep" />
            </button>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors ${showHistory ? 'bg-primary/10 text-primary' : ''}`}
              title="Histórico de Buscas"
            >
              <Icon name="history" />
            </button>
            <button 
              onClick={handleRefresh}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
              title="Atualizar dados"
            >
              <Icon name="refresh" className={isRefreshing ? "animate-spin" : ""} />
            </button>
          </>
        }
      />

      <main className="flex-1 max-w-md mx-auto w-full pb-8">
        <section className="px-4 py-6 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-1">
            COMPARAR NÚMEROS DE CA
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {searchError && (
              <div className="col-span-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center gap-2">
                <Icon name="error" className="text-red-500" />
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">{searchError}</p>
              </div>
            )}
            <div className="space-y-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 ml-1">EPI Principal (CA ou Nome)</span>
                <div className="relative">
                  <input
                    className="form-input w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary h-10 text-sm pr-9"
                    placeholder="Ex: 45678 ou Botina"
                    type="text"
                    value={inputs.mainCA}
                    onChange={(e) => handleChange('mainCA', e.target.value)}
                    onBlur={() => handleSearchCA('main')}
                  />
                  <button 
                    onClick={() => handleSearchCA('main', true)}
                    disabled={searchLoading.main}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-primary transition-colors disabled:opacity-50"
                    title="Forçar Nova Busca"
                  >
                    <Icon name={searchLoading.main ? "sync" : "search"} className={`text-lg ${searchLoading.main ? "animate-spin" : ""}`} />
                  </button>
                </div>
                {searchLoading.main && searchStatus.main && (
                  <p className="text-[10px] text-primary animate-pulse mt-1">{searchStatus.main}</p>
                )}
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 ml-1 text-[10px] uppercase">
                  Valor (R$)
                </span>
                <input
                  className="form-input w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary h-10 text-sm"
                  type="text"
                  value={inputs.mainPrice}
                  onChange={(e) => handleChange('mainPrice', e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 ml-1 text-[10px] uppercase">
                  Vida Útil (Dias)
                </span>
                <input
                  className="form-input w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary h-10 text-sm"
                  type="text"
                  value={inputs.mainLife}
                  onChange={(e) => handleChange('mainLife', e.target.value)}
                />
              </label>
            </div>
            <div className="space-y-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 ml-1">Comparação (CA ou Nome)</span>
                <div className="relative">
                  <input
                    className="form-input w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary h-10 text-sm pr-9"
                    placeholder="Ex: 12345 ou Óculos"
                    type="text"
                    value={inputs.compCA}
                    onChange={(e) => handleChange('compCA', e.target.value)}
                    onBlur={() => handleSearchCA('comp')}
                  />
                  <button 
                    onClick={() => handleSearchCA('comp', true)}
                    disabled={searchLoading.comp}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-primary transition-colors disabled:opacity-50"
                    title="Forçar Nova Busca"
                  >
                    <Icon name={searchLoading.comp ? "sync" : "search"} className={`text-lg ${searchLoading.comp ? "animate-spin" : ""}`} />
                  </button>
                </div>
                {searchLoading.comp && searchStatus.comp && (
                  <p className="text-[10px] text-primary animate-pulse mt-1">{searchStatus.comp}</p>
                )}
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 ml-1 text-[10px] uppercase">
                  Valor (R$)
                </span>
                <input
                  className="form-input w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary h-10 text-sm"
                  type="text"
                  value={inputs.compPrice}
                  onChange={(e) => handleChange('compPrice', e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 ml-1 text-[10px] uppercase">
                  Vida Útil (Dias)
                </span>
                <input
                  className="form-input w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary h-10 text-sm"
                  type="text"
                  value={inputs.compLife}
                  onChange={(e) => handleChange('compLife', e.target.value)}
                />
              </label>
            </div>
          </div>
        </section>

        <section className="px-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            {/* Card 1 - EPI Principal */}
            <div 
              className="flex flex-col gap-3 p-3 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/details/${encodeURIComponent(calculations.mainCA)}`, {
                state: {
                  productData: {
                    ca: calculations.mainCA,
                    name: calculations.mainName,
                    image: calculations.mainImage,
                    price: inputs.mainPrice,
                    life: inputs.mainLife
                  }
                }
              })}
            >
              <div className="relative w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 group flex items-center justify-center">
                {calculations.mainImage ? (
                  <img
                    alt={calculations.mainName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    src={calculations.mainImage}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Erro+Imagem';
                    }}
                  />
                ) : (
                  <Icon name="image" className="text-4xl text-slate-300 dark:text-slate-600 opacity-50" />
                )}
                <div className="absolute top-2 right-2 bg-green-500 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900"></div>
                {/* Indicador de que é um dado dinâmico da IA */}
                {dynamicProducts.main && (
                  <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold text-white flex items-center gap-1">
                    <Icon name="auto_awesome" className="text-[10px] text-primary" fill />
                    AI Generated
                  </div>
                )}
              </div>
              <div>
                <p className="text-slate-900 dark:text-white text-sm font-bold leading-tight line-clamp-2 min-h-[2.5em]">{calculations.mainName}</p>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold mt-1 uppercase">
                  Custo por Dia: {formatCurrency(calculations.mainDaily)}
                </p>
              </div>
              <div className="space-y-1.5 mt-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-500 uppercase">Durabilidade</span>
                  <span className="text-green-500">{inputs.mainLife} DIAS</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="bg-green-500 h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${calculations.mainLifePercent}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Card 2 - Comparação */}
            <div 
              className="flex flex-col gap-3 p-3 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl opacity-90 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/details/${encodeURIComponent(calculations.compCA)}`, {
                state: {
                  productData: {
                    ca: calculations.compCA,
                    name: calculations.compName,
                    image: calculations.compImage,
                    price: inputs.compPrice,
                    life: inputs.compLife
                  }
                }
              })}
            >
              <div className="relative w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 group flex items-center justify-center">
                {calculations.compImage ? (
                  <img
                    alt={calculations.compName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    src={calculations.compImage}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Erro+Imagem';
                    }}
                  />
                ) : (
                  <Icon name="image" className="text-4xl text-slate-300 dark:text-slate-600 opacity-50" />
                )}
                <div className="absolute top-2 right-2 bg-amber-500 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900"></div>
                {/* Indicador de que é um dado dinâmico da IA */}
                {dynamicProducts.comp && (
                  <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold text-white flex items-center gap-1">
                    <Icon name="auto_awesome" className="text-[10px] text-primary" fill />
                    AI Generated
                  </div>
                )}
              </div>
              <div>
                <p className="text-slate-900 dark:text-white text-sm font-bold leading-tight line-clamp-2 min-h-[2.5em]">{calculations.compName}</p>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold mt-1 uppercase">
                  Custo por Dia: {formatCurrency(calculations.compDaily)}
                </p>
              </div>
              <div className="space-y-1.5 mt-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-500 uppercase">Durabilidade</span>
                  <span className="text-amber-500">{inputs.compLife} DIAS</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${calculations.compLifePercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-6">
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary text-white p-1 rounded-md">
                  <Icon name="psychology" className="text-sm" />
                </div>
                <h3 className="text-sm font-bold text-primary tracking-tight">Recomendação de Viabilidade por IA</h3>
              </div>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              Análise concluída: O <span className="font-bold text-primary">{calculations.winnerName}</span> apresenta melhor performance financeira. 
              {calculations.isMainCheaper 
                ? " Seu custo por dia de uso é menor devido à relação entre preço e vida útil."
                : " Atenção: O EPI de comparação está saindo mais barato no longo prazo."}
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3">
                <Icon name="payments" className="text-green-500 text-lg" />
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-slate-200">Custo-Benefício:</span> O custo
                  por dia de uso é de <span className="text-green-500 font-bold">{formatCurrency(calculations.mainDaily)}</span> contra {formatCurrency(calculations.compDaily)} do
                  concorrente. Economia de {calculations.economyPercent}% ao escolher o {calculations.winnerName}.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Icon name="calendar_today" className="text-green-500 text-lg" />
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-slate-200">Ciclo de Substituição:</span> A
                  vida útil de {inputs.mainLife} dias impacta diretamente na frequência de compra e no custo logístico de reposição anual.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                const params = new URLSearchParams({
                  mainCA: inputs.mainCA,
                  compCA: inputs.compCA,
                  mainPrice: inputs.mainPrice,
                  compPrice: inputs.compPrice,
                  mainLife: inputs.mainLife,
                  compLife: inputs.compLife,
                  mainName: calculations.mainName,
                  compName: calculations.compName
                });
                navigate(`/analysis?${params.toString()}`, {
                  state: {
                    mainImage: calculations.mainImage,
                    compImage: calculations.compImage
                  }
                });
              }}
              className="bg-white dark:bg-slate-900/40 text-slate-900 dark:text-white h-12 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-95 transition-transform"
            >
              <Icon name="analytics" className="text-base" />
              Análises
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams({
                  mainCA: inputs.mainCA,
                  compCA: inputs.compCA,
                  mainPrice: inputs.mainPrice,
                  compPrice: inputs.compPrice,
                  mainLife: inputs.mainLife,
                  compLife: inputs.compLife,
                  mainName: calculations.mainName,
                  compName: calculations.compName
                });
                navigate(`/report?${params.toString()}`, {
                  state: {
                    mainImage: calculations.mainImage,
                    compImage: calculations.compImage
                  }
                });
              }}
              className="bg-white dark:bg-slate-900/40 text-slate-900 dark:text-white h-12 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-95 transition-transform"
            >
              <Icon name="description" className="text-base" />
              Relatório
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams({
                  mainCA: inputs.mainCA,
                  compCA: inputs.compCA,
                  mainPrice: inputs.mainPrice,
                  compPrice: inputs.compPrice,
                  mainName: calculations.mainName,
                  compName: calculations.compName
                });
                navigate(`/price-trends?${params.toString()}`);
              }}
              className="col-span-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-12 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95 transition-transform"
            >
              <Icon name="trending_up" className="text-base" />
              Histórico de Preços
            </button>
          </div>
        </section>

        <section className="px-4 py-6 border-t border-slate-200 dark:border-slate-800 mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
            Catálogo de Referência
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map(item => (
              <div 
                key={item.ca}
                className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col gap-2 hover:border-primary/50 transition-colors"
              >
                <div className="aspect-square rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 min-h-[2.5em]">{item.name}</p>
                    <p className="text-[10px] text-slate-500 mt-1">CA {item.ca}</p>
                </div>
                <div className="flex gap-2 mt-auto pt-2">
                    <button 
                        onClick={() => loadFromCatalog(item, 'main')}
                        className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold py-1.5 rounded transition-colors"
                    >
                        Principal
                    </button>
                    <button 
                        onClick={() => loadFromCatalog(item, 'comp')}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-[10px] font-bold py-1.5 rounded transition-colors"
                    >
                        Comparar
                    </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-8 mb-4 flex flex-col items-center justify-center gap-2">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
            By TCS
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;