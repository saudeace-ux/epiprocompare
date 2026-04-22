import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip, CartesianGrid, Legend, YAxis } from 'recharts';
import { Icon } from '../components/Icon';
import { Period } from '../types';
import { Header } from '../components/Header';
import { MOCK_DB } from '../data/mockData';
import { fetchOrGenerateImage } from '../services/imageService';

const Analysis: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [period, setPeriod] = useState<Period>(Period.QUARTER);

  // Get params
  const mainCA = searchParams.get('mainCA') || '';
  const compCA = searchParams.get('compCA') || '';
  const mainPriceRaw = searchParams.get('mainPrice') || '0';
  const compPriceRaw = searchParams.get('compPrice') || '0';
  const mainLifeRaw = searchParams.get('mainLife') || '1';
  const compLifeRaw = searchParams.get('compLife') || '1';
  const mainName = searchParams.get('mainName');
  const compName = searchParams.get('compName');
  
  const state = location.state as { mainImage?: string; compImage?: string } || {};
  const mainImage = state.mainImage || searchParams.get('mainImage');
  const compImage = state.compImage || searchParams.get('compImage');

  // State for images to allow AI updates
  const [mainImg, setMainImg] = useState(mainImage || MOCK_DB[mainCA]?.image || '');
  const [compImg, setCompImg] = useState(compImage || MOCK_DB[compCA]?.image || '');

  // Parse values
  const parseCurrency = (val: string) => parseFloat(val.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
  const mainPrice = parseCurrency(mainPriceRaw);
  const compPrice = parseCurrency(compPriceRaw);
  const mainLife = parseInt(mainLifeRaw) || 1;
  const compLife = parseInt(compLifeRaw) || 1;

  // Get product info
  const mainProduct = { 
      name: mainName || MOCK_DB[mainCA]?.name || `EPI CA ${mainCA}`, 
      image: mainImg, 
      type: 'EPI' 
  };
  const compProduct = { 
      name: compName || MOCK_DB[compCA]?.name || `EPI CA ${compCA}`, 
      image: compImg, 
      type: 'EPI' 
  };

  // AI Image Fetch Effect
  useEffect(() => {
    const fetchImage = async (ca: string, name: string, currentImage: string, setImage: (img: string) => void) => {
        // Skip if we already have a valid image URL (http/data)
        if (currentImage && (currentImage.startsWith('http') || currentImage.startsWith('data:'))) return;
        
        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) return;
            const ai = new GoogleGenAI({ apiKey });
            
            let finalImage = '';
            
            try {
                const fetchedImage = await fetchOrGenerateImage(ai, ca, name);
                if (fetchedImage) {
                    finalImage = fetchedImage;
                }
            } catch (err) {
                console.warn("Analysis: Image fetch/gen failed", err);
            }
            
            if (finalImage) {
                setImage(finalImage);
            }
            
        } catch (error) {
            console.error("Error fetching image for", name, error);
        }
    };

    // Trigger fetches
    fetchImage(mainCA, mainProduct.name, mainImg, setMainImg);
    fetchImage(compCA, compProduct.name, compImg, setCompImg);
    
  }, [mainCA, compCA]); // Run when IDs change

  // Calculate Daily Costs
  const mainDaily = mainPrice / mainLife;
  const compDaily = compPrice / compLife;

  // Generate Chart Data (Accumulated Cost)
  const chartData = useMemo(() => {
    const daysMap = {
      [Period.MONTH]: 30,
      [Period.QUARTER]: 90,
      [Period.SEMESTER]: 180,
      [Period.YEAR]: 365,
    };
    const totalDays = daysMap[period];
    const points = 6; // Number of points in chart
    const interval = totalDays / (points - 1);

    const data = [];
    for (let i = 0; i < points; i++) {
      const day = Math.round(i * interval);
      data.push({
        name: `Dia ${day}`,
        alpha: parseFloat((mainDaily * day).toFixed(2)),
        beta: parseFloat((compDaily * day).toFixed(2)),
      });
    }
    return data;
  }, [period, mainDaily, compDaily]);

  // Calculate Financial Summary
  const financialSummary = useMemo(() => {
      const daysMap = {
        [Period.MONTH]: 30,
        [Period.QUARTER]: 90,
        [Period.SEMESTER]: 180,
        [Period.YEAR]: 365,
      };
      const days = daysMap[period];
      const mainTotal = mainDaily * days;
      const compTotal = compDaily * days;
      
      const diff = compTotal - mainTotal;
      const isMainCheaper = diff > 0;
      
      // ROI Calculation: (Gain from Investment - Cost of Investment) / Cost of Investment
      // Here we treat "Savings" as Gain.
      const roi = isMainCheaper 
        ? ((diff / mainTotal) * 100).toFixed(1) 
        : (((mainTotal - compTotal) / compTotal) * 100).toFixed(1);

      return {
          mainTotal: mainTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          compTotal: compTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          roi: `${isMainCheaper ? '+' : '-'}${roi}%`,
          value: Math.abs(diff).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          isMainCheaper
      };
  }, [period, mainDaily, compDaily]);

  // Attribute Comparison Logic
  const attributes = useMemo(() => {
      const getScore = (val1: number, val2: number, inverse = false) => {
          if (val1 === val2) return 'REGULAR';
          if (inverse) return val1 < val2 ? 'ALTA' : 'BAIXA';
          return val1 > val2 ? 'ALTA' : 'BAIXA';
      };

      return [
          {
              label: 'Durabilidade (Dias)',
              main: mainLife > 180 ? 'ALTA' : (mainLife > 90 ? 'MÉDIA' : 'BAIXA'),
              comp: compLife > 180 ? 'ALTA' : (compLife > 90 ? 'MÉDIA' : 'BAIXA'),
              mainColor: mainLife >= compLife ? 'success' : 'warning',
              compColor: compLife >= mainLife ? 'success' : 'warning'
          },
          {
              label: 'Custo Aquisição',
              main: mainPrice > compPrice ? 'ALTO' : 'BAIXO',
              comp: compPrice > mainPrice ? 'ALTO' : 'BAIXO',
              mainColor: mainPrice < compPrice ? 'success' : 'danger',
              compColor: compPrice < mainPrice ? 'success' : 'danger'
          },
          {
              label: 'Custo Diário',
              main: `R$ ${mainDaily.toFixed(2)}`,
              comp: `R$ ${compDaily.toFixed(2)}`,
              mainColor: mainDaily < compDaily ? 'success' : 'danger',
              compColor: compDaily < mainDaily ? 'success' : 'danger'
          },
          {
              label: 'Certificado (CA)',
              main: 'ATIVO',
              comp: 'ATIVO',
              mainColor: 'success',
              compColor: 'success'
          }
      ];
  }, [mainLife, compLife, mainPrice, compPrice, mainDaily, compDaily]);

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display antialiased min-h-screen">
      <Header
        title="Análise de Viabilidade"
        showBack={true}
        rightActions={
            <button className="flex items-center justify-center rounded-lg h-10 w-10 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <Icon name="ios_share" className="text-2xl" />
            </button>
        }
      />

      <main className="max-w-md mx-auto pb-10">
        <div className="px-4 py-4">
          <div className="flex h-11 items-center justify-center rounded-xl bg-slate-200 dark:bg-card-dark p-1">
            {[Period.MONTH, Period.QUARTER, Period.SEMESTER, Period.YEAR].map((p) => (
              <label
                key={p}
                className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-[10px] uppercase tracking-wider transition-all font-semibold
                  ${period === p 
                    ? 'bg-white dark:bg-background-dark shadow-sm text-primary' 
                    : 'text-slate-500 dark:text-slate-400'
                  }`}
              >
                <span>{p === 'Month' ? 'MÊS' : p === 'Quarter' ? 'TRIMESTRE' : p === 'Semester' ? 'SEMESTRE' : 'ANO'}</span>
                <input
                  type="radio"
                  name="period"
                  value={p}
                  className="hidden"
                  checked={period === p}
                  onChange={() => setPeriod(p)}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="px-4 mb-6">
          <section className="bg-white dark:bg-card-dark rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Projeção de Custo Acumulado
              </h4>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span className="text-[10px] font-bold text-slate-400 truncate max-w-[60px]">{mainProduct.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span className="text-[10px] font-bold text-slate-400 truncate max-w-[60px]">{compProduct.name}</span>
                </div>
              </div>
            </div>
            <div className="relative h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', fontSize: '12px', color: '#fff' }} 
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => [`R$ ${value}`, 'Custo']}
                    />
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                  <Line
                    type="monotone"
                    dataKey="alpha"
                    stroke="#197fe6"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#197fe6', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                   <Line
                    type="monotone"
                    dataKey="beta"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#94a3b8', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div className="px-4 mb-6">
          <section className="bg-white dark:bg-card-dark rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
              TABELA COMPARATIVA DE ATRIBUTOS
            </h4>
            <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <th className="p-3 font-bold text-slate-400 uppercase tracking-tighter">Atributo</th>
                    <th className="p-3 font-bold text-primary uppercase tracking-tighter text-center w-1/3">Principal</th>
                    <th className="p-3 font-bold text-slate-400 uppercase tracking-tighter text-center w-1/3">Comparação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {attributes.map((attr, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{attr.label}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full bg-${attr.mainColor === 'success' ? 'green' : attr.mainColor === 'warning' ? 'yellow' : 'red'}-100 text-${attr.mainColor === 'success' ? 'green' : attr.mainColor === 'warning' ? 'yellow' : 'red'}-600 font-bold text-[10px]`}>
                            {attr.main}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full bg-${attr.compColor === 'success' ? 'green' : attr.compColor === 'warning' ? 'yellow' : 'red'}-100 text-${attr.compColor === 'success' ? 'green' : attr.compColor === 'warning' ? 'yellow' : 'red'}-600 font-bold text-[10px]`}>
                            {attr.comp}
                          </span>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-6 px-4 mb-8">
            {/* Main Product Card */}
          <section className={`bg-white dark:bg-card-dark rounded-2xl p-5 shadow-sm border ${financialSummary.isMainCheaper ? 'border-primary/30 ring-1 ring-primary/20' : 'border-slate-100 dark:border-slate-800'} relative overflow-hidden transition-all`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden">
                  {mainProduct.image ? (
                      <img src={mainProduct.image} alt={mainProduct.name} className="w-full h-full object-cover" />
                  ) : (
                      <Icon name="safety_check" className="text-primary text-3xl" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Opção Principal</span>
                  <h3 className="text-sm font-bold truncate">{mainProduct.name}</h3>
                </div>
              </div>
            </div>
            <div className="mb-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                CUSTO TOTAL NO PERÍODO
              </h4>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <p className={`text-3xl font-bold ${financialSummary.isMainCheaper ? 'text-success' : 'text-slate-700 dark:text-slate-300'}`}>
                      {financialSummary.mainTotal}
                  </p>
                  {financialSummary.isMainCheaper && (
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mt-1">
                        <Icon name="trending_up" className="text-sm text-success" />
                        <span className="text-success font-bold">Economia de {financialSummary.value}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Comparison Product Card */}
          <section className={`bg-white dark:bg-card-dark rounded-2xl p-5 shadow-sm border ${!financialSummary.isMainCheaper ? 'border-primary/30 ring-1 ring-primary/20' : 'border-slate-100 dark:border-slate-800'} relative overflow-hidden transition-all`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {compProduct.image ? (
                        <img src={compProduct.image} alt={compProduct.name} className="w-full h-full object-cover" />
                    ) : (
                        <Icon name="shield" className="text-slate-400 text-3xl" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Opção Comparação</span>
                  <h3 className="text-sm font-bold truncate">{compProduct.name}</h3>
                </div>
              </div>
            </div>
            <div className="mb-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                CUSTO TOTAL NO PERÍODO
              </h4>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <p className={`text-3xl font-bold ${!financialSummary.isMainCheaper ? 'text-success' : 'text-danger'}`}>
                      {financialSummary.compTotal}
                  </p>
                  {!financialSummary.isMainCheaper && (
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mt-1">
                        <Icon name="trending_up" className="text-sm text-success" />
                        <span className="text-success font-bold">Economia de {financialSummary.value}</span>
                    </div>
                  )}
                   {financialSummary.isMainCheaper && (
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mt-1">
                        <Icon name="trending_down" className="text-sm text-danger" />
                        <span className="text-danger font-bold">Custo extra de {financialSummary.value}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="px-4 py-8 mt-4 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-white/[0.02]">
          <div className="max-w-md mx-auto">
            <button 
                onClick={() => {
                  const params = new URLSearchParams({
                    mainCA: mainCA,
                    compCA: compCA,
                    mainPrice: mainPriceRaw,
                    compPrice: compPriceRaw,
                    mainLife: mainLifeRaw,
                    compLife: compLifeRaw,
                    mainName: mainProduct.name,
                    compName: compProduct.name
                  });
                  navigate(`/report?${params.toString()}`, {
                    state: {
                      mainImage: mainProduct.image,
                      compImage: compProduct.image
                    }
                  });
                }}
                className="flex w-full items-center justify-center text-center gap-2 h-14 rounded-2xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30 transition-all active:scale-95"
            >
              <Icon name="assessment" className="text-xl" />
              Relatório Técnico
            </button>
            <p className="text-center mt-4 text-[10px] font-bold tracking-widest uppercase text-slate-400/50 dark:text-white/20">
              By TCS
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analysis;