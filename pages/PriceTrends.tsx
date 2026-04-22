import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Icon } from '../components/Icon';
import { Header } from '../components/Header';
import { MOCK_DB } from '../data/mockData';

const PriceTrends: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get params
  const mainCA = searchParams.get('mainCA') || '';
  const compCA = searchParams.get('compCA') || '';
  const mainPriceRaw = searchParams.get('mainPrice') || '0';
  const compPriceRaw = searchParams.get('compPrice') || '0';
  const mainName = searchParams.get('mainName');
  const compName = searchParams.get('compName');

  // Parse values
  const parseCurrency = (val: string) => parseFloat(val.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
  const mainPrice = parseCurrency(mainPriceRaw);
  const compPrice = parseCurrency(compPriceRaw);

  // Get product info
  const mainProduct = { 
      name: mainName || MOCK_DB[mainCA]?.name || `EPI ${mainCA}`, 
      currentPrice: mainPrice
  };
  const compProduct = { 
      name: compName || MOCK_DB[compCA]?.name || `EPI ${compCA}`, 
      currentPrice: compPrice
  };

  // Generate Mock Historical Data (Last 12 Months)
  const chartData = useMemo(() => {
    const data = [];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonthIndex = new Date().getMonth(); // 0-11

    // Generate data for the last 12 months ending with current month
    for (let i = 11; i >= 0; i--) {
      const monthIndex = (currentMonthIndex - i + 12) % 12;
      const monthLabel = months[monthIndex];
      
      // Simulate price fluctuation
      // Random variation between -10% and +10% of current price, with a slight trend
      const randomFactorMain = 1 + (Math.random() * 0.2 - 0.1); 
      const randomFactorComp = 1 + (Math.random() * 0.2 - 0.1);

      // Make the last point match the current price exactly
      const priceMain = i === 0 ? mainProduct.currentPrice : mainProduct.currentPrice * randomFactorMain;
      const priceComp = i === 0 ? compProduct.currentPrice : compProduct.currentPrice * randomFactorComp;

      data.push({
        name: monthLabel,
        main: parseFloat(priceMain.toFixed(2)),
        comp: parseFloat(priceComp.toFixed(2)),
      });
    }
    return data;
  }, [mainProduct.currentPrice, compProduct.currentPrice]);

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display antialiased min-h-screen">
      <Header
        title="Histórico de Preços"
        showBack={true}
        rightActions={
            <button className="flex items-center justify-center rounded-lg h-10 w-10 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <Icon name="ios_share" className="text-2xl" />
            </button>
        }
      />

      <main className="max-w-md mx-auto pb-10 px-4">
        <div className="mb-6 mt-4">
          <section className="bg-white dark:bg-card-dark rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Evolução de Preço (12 Meses)
              </h4>
            </div>
            
            <div className="flex gap-4 mb-4 justify-center">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span className="text-[10px] font-bold text-slate-500 truncate max-w-[100px]">{mainProduct.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span className="text-[10px] font-bold text-slate-500 truncate max-w-[100px]">{compProduct.name}</span>
                </div>
            </div>

            <div className="relative h-64 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', fontSize: '12px', color: '#fff' }} 
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => [`R$ ${value}`, 'Preço']}
                    />
                    <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} tick={{fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} width={40} />
                  <Line
                    type="monotone"
                    dataKey="main"
                    stroke="#197fe6"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#197fe6', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                   <Line
                    type="monotone"
                    dataKey="comp"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#94a3b8', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 ml-1">Análise de Tendência</h3>
            
            <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Icon name="trending_down" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">Estabilidade de Preço</h4>
                    <p className="text-xs text-slate-500 mt-1">
                        O produto <span className="font-bold">{mainProduct.name}</span> apresentou uma variação média de apenas 2.5% no último ano.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Icon name="calendar_month" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">Melhor Momento de Compra</h4>
                    <p className="text-xs text-slate-500 mt-1">
                        Historicamente, os preços tendem a cair nos meses de <span className="font-bold">Novembro e Dezembro</span> devido a renovações de estoque.
                    </p>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};

export default PriceTrends;
