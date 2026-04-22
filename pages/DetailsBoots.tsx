import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Header } from '../components/Header';

const DetailsBoots: React.FC = () => {
  const navigate = useNavigate();

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
          <img
            alt="Bota Bracol Acquaflex"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAput8XCV0FZnk4aTAISSm-FlLXpYlft4mY1Ys_juqu9imOdtQvlI0hRp6bGeKaXg6XxLin17I8EXNDVtoLrQRHLMZeP_4XdN-Y1do1JLnsKXoODeBY0n57rpu2ikaNCxJhTHP0jSkzAwLw9ZeMMr517hs0i5cvBKy3rg0q_x-r-llRdjGyUMCVib7HrO8L8akM9PoEEPtzN8ZlgHk2FNkSXgySqXhA5YkSNuswSpL6WbQgNjyXnGlRFaQXFc3NKLc2OmMGTdro-Rs"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background-light dark:from-background-dark to-transparent"></div>
        </section>

        <section className="px-5 -mt-6 relative z-10">
          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-bold leading-tight flex-1">Bota Bracol Acquaflex 82BPC600</h2>
              <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded-md uppercase border border-primary/20">
                Ativo
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Icon name="verified" className="text-sm" />
              <span className="text-sm font-medium tracking-wide">C.A 37456</span>
            </div>
          </div>
        </section>

        <section className="px-5 py-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 ml-1">
            Visão Geral
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            Calçado ocupacional tipo bota, cano médio, confeccionado em PVC (Policloreto de Vinila). Oferece proteção
            integral contra umidade proveniente de operações com uso de água e agentes químicos leves.
          </p>
        </section>

        <section className="px-5 py-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 ml-1">
            Principais Benefícios
          </h3>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {[
              { icon: 'water_drop', color: 'blue', label: 'Impermeável' },
              { icon: 'personal_injury', color: 'amber', label: 'Antiderrapante' },
              { icon: 'cloud', color: 'green', label: 'Conforto' },
              { icon: 'verified_user', color: 'purple', label: 'Durabilidade' },
              { icon: 'oil_barrel', color: 'red', label: 'Resist. Óleo' },
            ].map((item, idx) => (
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

        <section className="px-5 py-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 ml-1">
            Características Técnicas
          </h3>
          <div className="bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500">Material</span>
              <span className="text-sm font-bold">PVC Virgem</span>
            </div>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-500">Design</span>
              <span className="text-sm font-bold">Cano Médio</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-xs font-medium text-slate-500">Solado</span>
              <span className="text-sm font-bold text-right">Full Grip / Monodensidade</span>
            </div>
          </div>
        </section>

        <section className="px-5 py-2 mb-10">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 ml-1">
            Indicações de Uso
          </h3>
          <div className="flex flex-wrap gap-2">
            {['Limpeza Industrial', 'Oficinas Mecânicas', 'Serviços Gerais', 'Cozinhas Industriais'].map((tag) => (
              <span key={tag} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-full text-xs font-bold">
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section className="px-5 pb-6">
          <button 
            onClick={() => navigate('/report')}
            className="w-full bg-primary text-white h-14 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all"
          >
            <Icon name="analytics" />
            Relatório Técnico
          </button>
          <div className="mt-6 flex flex-col items-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">
              By TCS
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DetailsBoots;