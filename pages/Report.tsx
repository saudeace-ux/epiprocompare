import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Header } from '../components/Header';

const Report: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Get params
  const mainCA = searchParams.get('mainCA') || '43.298';
  const compCA = searchParams.get('compCA') || '39.812';
  const mainPriceRaw = searchParams.get('mainPrice') || 'R$ 148,90';
  const compPriceRaw = searchParams.get('compPrice') || 'R$ 126,50';
  const mainLifeRaw = searchParams.get('mainLife') || '24 Meses';
  const compLifeRaw = searchParams.get('compLife') || '18 Meses';
  const mainName = searchParams.get('mainName') || 'Capacete V-Gard H1';
  const compName = searchParams.get('compName') || 'Capacete Evolution';
  
  const state = location.state as { mainImage?: string; compImage?: string } || {};
  const mainImage = state.mainImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAput8XCV0FZnk4aTAISSm-FlLXpYlft4mY1Ys_juqu9imOdtQvlI0hRp6bGeKaXg6XxLin17I8EXNDVtoLrQRHLMZeP_4XdN-Y1do1JLnsKXoODeBY0n57rpu2ikaNCxJhTHP0jSkzAwLw9ZeMMr517hs0i5cvBKy3rg0q_x-r-llRdjGyUMCVib7HrO8L8akM9PoEEPtzN8ZlgHk2FNkSXgySqXhA5YkSNuswSpL6WbQgNjyXnGlRFaQXFc3NKLc2OmMGTdro-Rs';
  const compImage = state.compImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuASVvCGE_0Bz00sECvJu5IKWpnSiAxTAwLZ4mnDrkkesksd_y9zxrHX28y6rrL_hsX0uSHUVC1U6sAw-iNFO-k2EGbAN1qKu_vW-E5Ky-F9Z0VCpF8MtUx_-QuukSUl-rgBmygCg5ZipUsZv9XPVgsS7T1w_kN6al5siTZ-VOtroQslYeA1ijPTMsyqsPTEpc9rxGFsEe4KjYGl6mB9a28Hqcl-4JkcmcK_6eRDu8OfmDOlPJCVgOUw9vyZD6GB20Oqnj8EEhTeMSk';

  // Estados para os campos editáveis
  const [requester, setRequester] = useState('Diretoria de Operações - Unidade Sul');
  const [consultant, setConsultant] = useState('Ricardo Almeida');
  const [consultantTitle, setConsultantTitle] = useState('Engenheiro de Segurança do Trabalho');

  // Estados para a tabela comparativa
  const [vGardCA, setVGardCA] = useState(mainCA);
  const [evolutionCA, setEvolutionCA] = useState(compCA);
  const [vGardPrice, setVGardPrice] = useState(mainPriceRaw.includes('R$') ? mainPriceRaw : `R$ ${mainPriceRaw}`);
  const [evolutionPrice, setEvolutionPrice] = useState(compPriceRaw.includes('R$') ? compPriceRaw : `R$ ${compPriceRaw}`);
  const [vGardLife, setVGardLife] = useState(mainLifeRaw.includes('Meses') || mainLifeRaw.includes('Dias') ? mainLifeRaw : `${mainLifeRaw} Dias`);
  const [evolutionLife, setEvolutionLife] = useState(compLifeRaw.includes('Meses') || compLifeRaw.includes('Dias') ? compLifeRaw : `${compLifeRaw} Dias`);
  const [vGardMaterial, setVGardMaterial] = useState('Polietileno de Alta Densidade');
  const [evolutionMaterial, setEvolutionMaterial] = useState('ABS de Alta Resistência');

  // Parse values for calculations
  const parseCurrency = (val: string) => parseFloat(val.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
  const mainPrice = parseCurrency(mainPriceRaw);
  const compPrice = parseCurrency(compPriceRaw);
  const mainLife = parseInt(mainLifeRaw) || 1;
  const compLife = parseInt(compLifeRaw) || 1;

  const mainDaily = mainPrice / mainLife;
  const compDaily = compPrice / compLife;
  const isMainCheaper = mainDaily <= compDaily;
  const winnerName = isMainCheaper ? mainName : compName;
  const loserName = isMainCheaper ? compName : mainName;

  // Generate Chart Data (Accumulated Cost over 24 months)
  const chartData = useMemo(() => {
    return [1, 4, 8, 12, 16, 20, 24].map(month => {
      const days = month * 30;
      return {
        name: `M${month}`,
        mainCost: Math.ceil(days / mainLife) * mainPrice,
        compCost: Math.ceil(days / compLife) * compPrice,
      };
    });
  }, [mainPrice, mainLife, compPrice, compLife]);

  // Calculate Savings for Technical Opinion
  const savingsData = useMemo(() => {
    const days24Months = 24 * 30;
    const users = 100;
    const mainTotalCost = Math.ceil(days24Months / mainLife) * mainPrice * users;
    const compTotalCost = Math.ceil(days24Months / compLife) * compPrice * users;
    
    const difference = Math.abs(mainTotalCost - compTotalCost);
    const percentDiff = Math.abs((mainDaily - compDaily) / Math.max(mainDaily, compDaily)) * 100;

    return {
      difference: difference.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      percentDiff: percentDiff.toFixed(1),
      mainTotalCost,
      compTotalCost
    };
  }, [mainPrice, mainLife, compPrice, compLife, mainDaily, compDaily]);

  return (
    <div className="bg-pdf-bg text-slate-900 min-h-screen flex flex-col font-display antialiased">
      <Header
        variant="report"
        rightActions={
            <div className="flex items-center gap-4">
              <button className="text-white hover:text-primary transition-colors">
                <Icon name="print" className="text-[22px]" />
              </button>
              <button className="text-white hover:text-primary transition-colors">
                <Icon name="share" className="text-[22px]" />
              </button>
            </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
        <article
          id="report-content"
          className="w-full max-w-2xl bg-white shadow-2xl mx-auto flex flex-col min-h-[141.4vw] md:min-h-[842px] rounded-sm p-6 md:p-10 text-[10px] leading-tight"
        >
          <header className="flex flex-col items-center border-b-2 border-slate-800 pb-4 mb-6">
            <div className="w-12 h-12 bg-slate-900 rounded mb-2 flex items-center justify-center">
              <Icon name="shield" className="text-white text-3xl" />
            </div>
            <h1 className="text-base font-black text-center uppercase tracking-tight">
              RELATÓRIO DE VIABILIDADE TÉCNICA E FINANCEIRA
            </h1>
            <p className="text-[8px] text-slate-500 font-medium uppercase">Sistema Inteligente de Análise de EPI</p>
          </header>

          <section className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-3 border border-slate-200 rounded">
            <div>
              <p className="text-slate-400 font-bold uppercase text-[7px] mb-0.5">Solicitante</p>
              <input 
                type="text" 
                value={requester}
                onChange={(e) => setRequester(e.target.value)}
                className="font-bold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary focus:outline-none w-full p-0 text-[10px] text-slate-900 transition-colors placeholder:text-slate-300"
                placeholder="Nome do Solicitante"
              />
            </div>
            <div className="text-right">
              <p className="text-slate-400 font-bold uppercase text-[7px] mb-0.5">Data de Emissão</p>
              <p className="font-bold">24 de Maio de 2024</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase text-[7px] mb-0.5">ID do Relatório</p>
              <p className="font-bold">#REP-2024-05892-AI</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 font-bold uppercase text-[7px] mb-0.5">Status</p>
              <p className="text-green-600 font-bold">Documento Verificado</p>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-[11px] font-black border-l-4 border-primary pl-2 mb-3 uppercase tracking-wider">
              1. Comparativo Direto
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="p-2 font-bold uppercase text-slate-600 text-[8px] border-r border-slate-200 w-1/4">
                      Especificação
                    </th>
                    <th className="p-2 font-bold uppercase text-slate-600 text-[8px] border-r border-slate-200 w-[37.5%] text-center">
                      <div className="flex flex-col items-center gap-1.5 py-1">
                        <div className="w-16 h-16 rounded border border-slate-300 bg-white p-1 flex items-center justify-center overflow-hidden">
                          <img
                            alt={mainName}
                            className="w-full h-full object-contain"
                            src={mainImage}
                          />
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[9px] text-slate-900 leading-none font-bold">{mainName}</span>
                          <div className="flex gap-0.5 mt-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Icon
                                key={s}
                                name={s === 5 ? 'star_half' : 'star'}
                                className="text-[10px] text-yellow-500"
                                fill
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </th>
                    <th className="p-2 font-bold uppercase text-slate-600 text-[8px] w-[37.5%] text-center">
                      <div className="flex flex-col items-center gap-1.5 py-1">
                        <div className="w-16 h-16 rounded border border-slate-300 bg-white p-1 flex items-center justify-center overflow-hidden">
                          <img
                            alt={compName}
                            className="w-full h-full object-contain"
                            src={compImage}
                          />
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[9px] text-slate-900 leading-none font-bold">{compName}</span>
                          <div className="flex gap-0.5 mt-0.5">
                            {[1, 2, 3, 4].map((s) => (
                              <Icon key={s} name="star" className="text-[10px] text-yellow-500" fill />
                            ))}
                            <Icon name="star" className="text-[10px] text-slate-200" />
                          </div>
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 bg-blue-50/30">
                    <td className="p-2 font-bold bg-slate-50 border-r border-slate-200 uppercase text-[7px] text-slate-500">
                      Score de Avaliação
                    </td>
                    <td className="p-2 text-center border-r border-slate-200 font-black text-primary text-[10px]">
                      9.2 / 10
                    </td>
                    <td className="p-2 text-center font-bold text-slate-700 text-[10px]">7.5 / 10</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-2 font-bold bg-slate-50 border-r border-slate-200 uppercase text-[7px] text-slate-500">
                      C.A. (Certificado)
                    </td>
                    <td className="p-2 text-center border-r border-slate-200">
                      <input 
                        type="text" 
                        value={vGardCA}
                        onChange={(e) => setVGardCA(e.target.value)}
                        className="w-full text-center bg-transparent border-none focus:outline-none p-0 font-medium text-slate-900 text-[9px] hover:bg-slate-50 rounded"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input 
                        type="text" 
                        value={evolutionCA}
                        onChange={(e) => setEvolutionCA(e.target.value)}
                        className="w-full text-center bg-transparent border-none focus:outline-none p-0 font-medium text-slate-900 text-[9px] hover:bg-slate-50 rounded"
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-2 font-bold bg-slate-50 border-r border-slate-200 uppercase text-[7px] text-slate-500">
                      Preço Unitário
                    </td>
                    <td className="p-2 text-center border-r border-slate-200">
                      <input 
                        type="text" 
                        value={vGardPrice}
                        onChange={(e) => setVGardPrice(e.target.value)}
                        className="w-full text-center bg-transparent border-none focus:outline-none p-0 font-bold text-primary text-[9px] hover:bg-slate-50 rounded"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input 
                        type="text" 
                        value={evolutionPrice}
                        onChange={(e) => setEvolutionPrice(e.target.value)}
                        className="w-full text-center bg-transparent border-none focus:outline-none p-0 font-bold text-slate-900 text-[9px] hover:bg-slate-50 rounded"
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-2 font-bold bg-slate-50 border-r border-slate-200 uppercase text-[7px] text-slate-500">
                      Vida Útil Estimada
                    </td>
                    <td className="p-2 text-center border-r border-slate-200">
                      <input 
                        type="text" 
                        value={vGardLife}
                        onChange={(e) => setVGardLife(e.target.value)}
                        className="w-full text-center bg-transparent border-none focus:outline-none p-0 font-medium text-slate-900 text-[9px] hover:bg-slate-50 rounded"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input 
                        type="text" 
                        value={evolutionLife}
                        onChange={(e) => setEvolutionLife(e.target.value)}
                        className="w-full text-center bg-transparent border-none focus:outline-none p-0 font-medium text-slate-900 text-[9px] hover:bg-slate-50 rounded"
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-2 font-bold bg-slate-50 border-r border-slate-200 uppercase text-[7px] text-slate-500">
                      Material Principal
                    </td>
                    <td className="p-2 text-center border-r border-slate-200">
                      <input 
                        type="text" 
                        value={vGardMaterial}
                        onChange={(e) => setVGardMaterial(e.target.value)}
                        className="w-full text-center bg-transparent border-none focus:outline-none p-0 text-slate-900 text-[9px] hover:bg-slate-50 rounded"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input 
                        type="text" 
                        value={evolutionMaterial}
                        onChange={(e) => setEvolutionMaterial(e.target.value)}
                        className="w-full text-center bg-transparent border-none focus:outline-none p-0 text-slate-900 text-[9px] hover:bg-slate-50 rounded"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-[11px] font-black border-l-4 border-primary pl-2 mb-3 uppercase tracking-wider">
              2. Gráfico de Projeção de ROI
            </h3>
            <div className="border border-slate-200 rounded-lg p-4 bg-white">
              <div className="flex justify-end items-center mb-4">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <span className="text-[8px]">{mainName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                    <span className="text-[8px]">{compName}</span>
                  </div>
                </div>
              </div>
              <div className="h-[100px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="chartGradientMain" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#197fe6" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#197fe6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="chartGradientComp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Tooltip 
                          contentStyle={{ fontSize: '10px', borderRadius: '4px', padding: '4px' }}
                          formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        />
                        <Area 
                          type="stepAfter" 
                          dataKey="mainCost" 
                          name={mainName}
                          stroke="#197fe6" 
                          strokeWidth={2} 
                          fillOpacity={1} 
                          fill="url(#chartGradientMain)" 
                        />
                        <Area 
                          type="stepAfter" 
                          dataKey="compCost" 
                          name={compName}
                          stroke="#94a3b8" 
                          strokeWidth={2} 
                          strokeDasharray="4 4"
                          fillOpacity={1} 
                          fill="url(#chartGradientComp)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between mt-2 text-[7px] font-bold text-slate-400">
                <span>M1</span>
                <span>M4</span>
                <span>M8</span>
                <span>M12</span>
                <span>M16</span>
                <span>M20</span>
                <span>M24</span>
              </div>
              <div className="mt-4 text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase">
                  Projeção Financeira de 24 Meses
                </span>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h3 className="text-[11px] font-black border-l-4 border-primary pl-2 mb-3 uppercase tracking-wider">
              3. Parecer do Consultor Técnico
            </h3>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg leading-relaxed text-slate-700">
              <p className="mb-3 text-[9px]">
                Com base na análise técnica de durabilidade e custos operacionais realizada pelo{' '}
                <strong>Consultor Técnico</strong>, o <strong>{winnerName}</strong> apresenta uma viabilidade superior em <strong>{savingsData.percentDiff}%</strong>
                {' '}comparado ao {loserName}. {isMainCheaper && mainPrice > compPrice ? 
                  "Apesar de possuir um custo de aquisição inicial mais elevado, sua resistência superior e maior ciclo de vida resultam em um custo por dia de uso significativamente menor." : 
                  "Sua relação entre custo de aquisição e durabilidade apresenta a melhor performance financeira para a operação."}
              </p>
              <p className="mb-3 text-[9px]">
                <strong>Economia Projetada:</strong> Estima-se uma redução de custos de <strong>{savingsData.difference}</strong> em
                um horizonte de 24 meses por lote de 100 usuários. O ponto de equilíbrio financeiro e a mitigação de custos logísticos de reposição reforçam esta escolha.
              </p>
              <p className="text-[9px]">
                <strong>Recomendação:</strong> Recomendamos a padronização do <strong>{winnerName}</strong> para as frentes de
                trabalho, garantindo maior conformidade, proteção aos colaboradores e eficiência na alocação de recursos da empresa.
              </p>
            </div>
          </section>

          <footer className="mt-auto pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 items-end">
            <div className="flex flex-col items-center relative" id="signature-section">
              <div className="w-full min-h-[40px] flex flex-col items-center justify-center">
                 {/* Sign Button removed for PDF view state, showing signature directly */}
                <div className="flex flex-col items-center w-full">
                  <input
                    value={consultant}
                    onChange={(e) => setConsultant(e.target.value)}
                    className="font-signature text-2xl text-slate-800 leading-none h-8 w-full text-center bg-transparent border-none outline-none focus:bg-slate-50 hover:bg-slate-50 transition-colors rounded"
                  />
                  <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 border border-green-200 rounded mt-1">
                    <Icon name="verified_user" className="text-green-600 text-[10px]" fill />
                    <span className="text-[6px] text-green-700 font-bold uppercase tracking-tighter">
                      Assinado Digitalmente - 24/05/2024 16:42
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-full border-b border-slate-400 mt-2 mb-2"></div>
              <input
                  value={consultantTitle}
                  onChange={(e) => setConsultantTitle(e.target.value)}
                  className="text-[8px] font-bold uppercase w-full text-center bg-transparent border-none outline-none text-slate-900"
              />
              <p className="text-[7px] text-slate-400">Assinatura Digital via Blockchain ID</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-2 border-primary/30 rounded-full flex items-center justify-center text-primary/30 rotate-12 mb-1">
                <Icon name="verified" className="text-3xl" />
              </div>
              <p className="text-[8px] font-bold uppercase text-primary">Conformidade Atestada</p>
              <p className="text-[7px] text-slate-400">Selo de Auditoria IA-2024</p>
            </div>
          </footer>
          <div className="mt-8 text-center">
            <p className="text-[8px] text-slate-300 font-medium uppercase tracking-widest">By TCS</p>
          </div>
        </article>
        
        <div className="flex justify-center pb-24">
          <span className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">Fim do Relatório</span>
        </div>
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-40">
        <button className="bg-white text-primary px-6 py-3 rounded-full shadow-2xl font-bold text-sm flex items-center gap-2 border border-slate-200 hover:bg-slate-50 transition-colors">
          <Icon name="file_download" className="text-[20px]" />
          Baixar
        </button>
        <button className="bg-primary text-white px-8 py-3 rounded-full shadow-2xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors">
          <Icon name="send" className="text-[20px]" />
          Enviar
        </button>
      </div>
    </div>
  );
};

export default Report;