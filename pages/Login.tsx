import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setErrorMsg('As senhas não coincidem.');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      setLoading(false);

      if (error) {
        setErrorMsg("Erro ao cadastrar: " + error.message);
      } else if (data.user) {
        navigate('/dashboard');
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setLoading(false);

      if (error) {
        setErrorMsg("Erro ao entrar: " + error.message);
      } else if (data.user) {
        navigate('/dashboard');
      }
    }
  };

  const handleResetPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Por favor, digite seu e-mail no campo acima para recuperar a senha.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/#/login',
    });
    setLoading(false);

    if (error) {
      setErrorMsg('Erro ao enviar e-mail de recuperação: ' + error.message);
    } else {
      setSuccessMsg('Instruções de recuperação enviadas! Verifique sua caixa de entrada.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-dark text-white">
      <div className="flex flex-col items-center pt-12 pb-6 px-4">
        <div className="bg-primary/10 p-4 rounded-full mb-4">
          <Icon name="shield_lock" className="text-primary text-[48px]" />
        </div>
        <h1 className="text-white tracking-tight text-[32px] font-bold leading-tight text-center">
          EPI Pro-Compare II
        </h1>
        <p className="text-[#93adc8] text-center mt-2 font-normal">
          Análise comparativa de EPIs com foco em viabilidade
        </p>
      </div>

      <main className="flex-1 px-6 max-w-[480px] mx-auto w-full">
        <form onSubmit={handleAuth} className="flex flex-col gap-1 py-3">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-4">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-lg text-sm mb-4">
              {successMsg}
            </div>
          )}
          <label className="flex flex-col w-full">
            <p className="text-white text-sm font-medium leading-normal pb-2">E-mail</p>
            <div className="flex w-full items-stretch rounded-lg group">
              <input
                className="form-input flex w-full min-w-0 flex-1 rounded-lg text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-[#344d65] bg-[#1a2632] h-14 placeholder:text-[#93adc8] p-[15px] rounded-r-none border-r-0 text-base font-normal leading-normal"
                placeholder="Digite seu e-mail corporativo"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="text-[#93adc8] flex border border-[#344d65] bg-[#1a2632] items-center justify-center pr-[15px] rounded-r-lg border-l-0">
                <Icon name="mail" className="text-xl" />
              </div>
            </div>
          </label>

          <div className="flex flex-col gap-1 py-3">
            <label className="flex flex-col w-full">
              <p className="text-white text-sm font-medium leading-normal pb-2">Senha</p>
              <div className="flex w-full items-stretch rounded-lg">
                <input
                  className="form-input flex w-full min-w-0 flex-1 rounded-lg text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-[#344d65] bg-[#1a2632] h-14 placeholder:text-[#93adc8] p-[15px] rounded-r-none border-r-0 text-base font-normal leading-normal"
                  placeholder="Digite sua senha"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div 
                  className="text-[#93adc8] flex border border-[#344d65] bg-[#1a2632] items-center justify-center pr-[15px] rounded-r-lg border-l-0 cursor-pointer hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Icon name={showPassword ? "visibility_off" : "visibility"} className="text-xl" />
                </div>
              </div>
            </label>
            {mode === 'login' && (
              <div className="flex justify-end pt-1">
                <button 
                  type="button"
                  onClick={handleResetPassword}
                  className="text-primary text-sm font-medium leading-normal hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}
          </div>

          {mode === 'register' && (
            <div className="flex flex-col gap-1 py-3">
              <label className="flex flex-col w-full">
                <p className="text-white text-sm font-medium leading-normal pb-2">Confirmar Senha</p>
                <div className="flex w-full items-stretch rounded-lg">
                  <input
                    className="form-input flex w-full min-w-0 flex-1 rounded-lg text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-[#344d65] bg-[#1a2632] h-14 placeholder:text-[#93adc8] p-[15px] rounded-r-none border-r-0 text-base font-normal leading-normal"
                    placeholder="Confirme sua senha"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <div 
                    className="text-[#93adc8] flex border border-[#344d65] bg-[#1a2632] items-center justify-center pr-[15px] rounded-r-lg border-l-0 cursor-pointer hover:text-white transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Icon name={showConfirmPassword ? "visibility_off" : "visibility"} className="text-xl" />
                  </div>
                </div>
              </label>
            </div>
          )}

          <div className="py-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-xl transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (mode === 'register' ? 'Cadastrando...' : 'Entrando...') : (mode === 'register' ? 'Cadastrar' : 'Entrar')}
            </button>
          </div>
        </form>

        {mode === 'register' ? (
          <div className="flex justify-center pt-4 pb-8">
            <p className="text-[#93adc8] text-sm">
              Já tem uma conta?{' '}
              <button type="button" onClick={() => setMode('login')} className="text-primary hover:underline font-medium">
                Faça login
              </button>
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 py-4">
              <div className="h-[1px] flex-1 bg-[#344d65]"></div>
              <p className="text-[#93adc8] text-sm">ou continue com</p>
              <div className="h-[1px] flex-1 bg-[#344d65]"></div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4">
              <button type="button" className="flex items-center justify-center gap-3 h-12 border border-[#344d65] bg-[#1a2632] rounded-xl hover:bg-[#243444] transition-colors">
                <img
                  alt="Google"
                  className="w-5 h-5"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcVRSiiD7DXRSMw29RujAZBKpPqkvFiavohPyGOhzwyKiOZakFYfC6ehOSLEo-p1xeBD-BXAcLN8okfxGAZzt-oTosMgxKwE6k9OoeQwv9uu-fBsjdO3Q0v7YVmENJOl5PqqoytD7wT2S2-pDQ7toiqzM1yMKF__wHNdyS4mpHEYqIqBIvf6np7FEWF4GIFmFv2O29ZJeiLzv8ef92fc89fZuqHrAcL95xgDG94Xsw4GX2C1CQyiVka4Ol4NtfLRygrGpPZQ6Y4mU"
                />
                <span className="text-sm font-medium">Google</span>
              </button>
              <button type="button" onClick={() => setMode('register')} className="flex items-center justify-center gap-3 h-12 border border-[#344d65] bg-[#1a2632] rounded-xl hover:bg-[#243444] transition-colors">
                <Icon name="mail" className="text-xl" />
                <span className="text-sm font-medium">E-mail</span>
              </button>
            </div>
          </>
        )}
      </main>

      <footer className="pb-10 pt-6 px-4">
        <div className="flex flex-col items-center gap-2">
          <p className="text-[#93adc8] text-xs font-medium uppercase tracking-widest">By TCS</p>
          <div className="flex gap-4 mt-4">
            <a className="text-[#93adc8] text-xs hover:text-white" href="#">
              Termos de Uso
            </a>
            <a className="text-[#93adc8] text-xs hover:text-white" href="#">
              Privacidade
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;