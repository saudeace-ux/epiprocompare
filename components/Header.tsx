import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from './Icon';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightActions?: React.ReactNode;
  variant?: 'default' | 'report';
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  showBack = true, 
  rightActions, 
  variant = 'default' 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getTitle = () => {
    if (title) return title;
    
    // Lógica de Título Dinâmico baseada na rota
    if (location.pathname.includes('/dashboard')) return 'Análise de EPI';
    if (location.pathname.includes('/analysis')) return 'Análise de Viabilidade';
    if (location.pathname.includes('/report')) return 'Modo Visualização';
    if (location.pathname.includes('/details')) return 'Detalhes do EPI';
    
    return 'EPI Pro-Compare II';
  };

  const handleBack = () => {
    if (location.pathname.includes('/dashboard')) {
      // Se estiver na Dashboard, volta para o Login
      navigate('/login');
    } else if (location.pathname.includes('/analysis')) {
      // Volta para a Dashboard explicitamente
      navigate('/dashboard');
    } else {
      // De qualquer outra página (Details, Report), volta para a página anterior
      navigate(-1);
    }
  };

  const isReport = variant === 'report';

  const containerClass = isReport
    ? "bg-slate-900/90 backdrop-blur-md border-b border-slate-700 text-white"
    : "bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white";

  return (
    <header className={`sticky top-0 z-50 ${containerClass} transition-all duration-200`}>
      <div className={`flex items-center p-4 justify-between w-full mx-auto ${isReport ? 'max-w-lg' : 'max-w-md'}`}>
        <div className="flex items-center gap-3 relative flex-1">
          {showBack && (
            <button
              onClick={handleBack}
              className={`p-2 -ml-2 rounded-full transition-colors flex items-center gap-1 ${
                isReport
                  ? 'hover:bg-slate-800 text-white'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Icon name={isReport ? "close" : "arrow_back"} className="text-[24px]" />
              {isReport && <span className="text-sm font-medium">Fechar</span>}
            </button>
          )}

          {!showBack && location.pathname === '/dashboard' && (
            <div className="bg-primary/10 p-2 rounded-lg">
              <Icon name="shield_with_heart" className="text-primary text-2xl" />
            </div>
          )}

          {/* Título Centralizado para Report, Esquerda para Padrão */}
          {isReport ? (
             <span className="absolute left-1/2 -translate-x-1/2 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
               {getTitle()}
             </span>
          ) : (
            <h1 className="text-lg font-bold tracking-tight truncate">
                {getTitle()}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 z-10">
          {rightActions}
        </div>
      </div>
    </header>
  );
};