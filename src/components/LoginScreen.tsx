import React, { useState } from 'react';
import { Layers, Lock, Mail, Eye, EyeOff, ShieldCheck, UserCheck, ArrowRight, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { User } from '../types';

interface LoginScreenProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLoginSuccess }) => {
  const [email, setEmail] = useState<string>('admin@mamuthub.com');
  const [password, setPassword] = useState<string>('123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forgotModalOpen, setForgotModalOpen] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const formattedEmail = email.trim().toLowerCase();
    const foundUser = users.find(u => u.email.toLowerCase() === formattedEmail);

    if (!foundUser) {
      setErrorMsg('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.');
      return;
    }

    if (foundUser.status === 'Pasif') {
      setErrorMsg('Hesabınız pasif durumdadır. Lütfen sistem yöneticisi ile iletişime geçin.');
      return;
    }

    // Check password (accept "123" or matched password)
    if (foundUser.password && foundUser.password !== password && password !== '123') {
      setErrorMsg('Hatalı şifre girdiniz. Lütfen tekrar deneyin.');
      return;
    }

    // Update lastLogin
    const updatedUser: User = {
      ...foundUser,
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    onLoginSuccess(updatedUser);
  };

  const handleQuickLogin = (demoUser: User) => {
    setEmail(demoUser.email);
    setPassword(demoUser.password || '123');
    const updatedUser: User = {
      ...demoUser,
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    onLoginSuccess(updatedUser);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setResetSuccess(true);
    setTimeout(() => {
      setForgotModalOpen(false);
      setResetSuccess(false);
      setForgotEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Login Card Container */}
      <div className="w-full max-w-md bg-[#0d1424]/90 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative z-10 space-y-6">
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-600/30 mb-1">
            <Layers className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">MAMUTHUB</h1>
          <p className="text-xs text-slate-400 font-medium">Sunum & Müşteri Yönetim Paneline Giriş Yapın</p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">E-Posta Adresi</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@mamuthub.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 block">Şifre</label>
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Şifremi Unuttum?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
            />
            <label htmlFor="remember" className="text-xs text-slate-400 cursor-pointer">
              Beni bu cihazda hatırla
            </label>
          </div>

          {/* Login Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 mt-2 hover:scale-[1.01] active:scale-[0.99]"
          >
            <span>Panele Giriş Yap</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Login Preset Section */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>Hızlı Test Giriş Seçenekleri</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {users.map((u) => {
              const roleBadge = 
                u.role === 'admin' ? { label: 'Yönetici (Tam Yetki)', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' } :
                u.role === 'editor' ? { label: 'Editör (İçerik Yönetimi)', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' } :
                { label: 'İzleyici (Salt Okunur)', bg: 'bg-slate-500/10 text-slate-300 border-slate-500/20' };

              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0 group-hover:bg-blue-600 transition-colors">
                      {u.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                        {u.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold shrink-0 ${roleBadge.bg}`}>
                    {roleBadge.label.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <p className="mt-8 text-xs text-slate-500 text-center">
        © 2026 MAMUTHUB Presentation System. Tüm hakları saklıdır.
      </p>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121929] border border-slate-800 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Şifre Sıfırlama Talebi</span>
            </h3>
            {resetSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs text-emerald-300 font-semibold">
                  Sıfırlama bağlantısı e-posta adresinize gönderildi!
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <p className="text-xs text-slate-400">
                  Hesabınıza bağlı e-posta adresinizi girin, sıfırlama talimatlarını iletelim.
                </p>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="E-Posta adresiniz"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg"
                  >
                    Gönder
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
