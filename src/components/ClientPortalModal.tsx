import React, { useState, useRef } from 'react';
import {
  X,
  Building2,
  Play,
  Download,
  FileText,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Edit,
  MessageSquare,
  Send,
  Lock,
  Key,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Client, Presentation, ClientFeedback, ShareToken, ViewAnalyticsLog } from '../types';
import { generatePresentationPDF, createPresentationPdfDataUrl } from '../utils/pdfExport';
import { PdfViewer } from './PdfViewer';

interface ClientPortalModalProps {
  client: Client;
  assignedPresentations: Presentation[];
  shareToken?: ShareToken | null;
  isStandalone?: boolean;
  onClose: () => void;
  onEditClient?: (client: Client) => void;
  onSendFeedback?: (feedback: Omit<ClientFeedback, 'id' | 'createdAt' | 'status'>) => void;
  onLogAnalytics?: (log: Omit<ViewAnalyticsLog, 'id'>) => void;
}

function detectDevice(): string {
  const ua = navigator.userAgent || '';
  let deviceType = 'Masaüstü';
  if (/mobile/i.test(ua)) deviceType = 'Mobil';
  else if (/ipad|tablet/i.test(ua)) deviceType = 'Tablet';

  let os = '';
  if (/mac/i.test(ua)) os = 'macOS';
  else if (/win/i.test(ua)) os = 'Windows';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/linux/i.test(ua)) os = 'Linux';

  return os ? `${deviceType} (${os})` : deviceType;
}

export const ClientPortalModal: React.FC<ClientPortalModalProps> = ({
  client,
  assignedPresentations,
  shareToken,
  isStandalone = false,
  onClose,
  onEditClient,
  onSendFeedback,
  onLogAnalytics,
}) => {
  const [activePresentation, setActivePresentation] = useState<Presentation | null>(null);
  const [feedbackPres, setFeedbackPres] = useState<Presentation | null>(null);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<ClientFeedback['feedbackType']>('Revize Talebi');
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);

  // PIN Protection State
  const [inputPin, setInputPin] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [isPinUnlocked, setIsPinUnlocked] = useState<boolean>(() => {
    if (!shareToken || !shareToken.pinCode) return true;
    try {
      return sessionStorage.getItem(`unlocked_token_${shareToken.id}`) === 'true';
    } catch {
      return false;
    }
  });

  // Track session viewing time for analytics
  const viewStartTimeRef = useRef<number>(0);

  // Check Token Expiration
  const isExpired = shareToken?.expiresAt ? new Date(shareToken.expiresAt) < new Date() : false;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareToken || !shareToken.pinCode) return;

    if (inputPin.trim() === shareToken.pinCode.trim()) {
      setIsPinUnlocked(true);
      setPinError(false);
      try {
        sessionStorage.setItem(`unlocked_token_${shareToken.id}`, 'true');
      } catch {
        // ignore
      }
    } else {
      setPinError(true);
    }
  };

  const handleStartPresentation = (pres: Presentation) => {
    setActivePresentation(pres);
    viewStartTimeRef.current = Date.now();
  };

  const handleClosePresentation = () => {
    if (activePresentation && viewStartTimeRef.current > 0) {
      const durationSeconds = Math.max(3, Math.round((Date.now() - viewStartTimeRef.current) / 1000));
      if (onLogAnalytics) {
        onLogAnalytics({
          presentationId: activePresentation.id,
          presentationTitle: activePresentation.title,
          clientId: client.id,
          clientName: `${client.contactPerson} (${client.companyName})`,
          viewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          durationSeconds,
          completedPages: activePresentation.pageCount || 1,
          totalPages: activePresentation.pageCount || 1,
          device: detectDevice(),
          location: 'Türkiye (Müşteri Bağlantısı)',
        });
      }
    }
    setActivePresentation(null);
    viewStartTimeRef.current = 0;
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackPres || !feedbackComment || !onSendFeedback) return;

    onSendFeedback({
      presentationId: feedbackPres.id,
      presentationTitle: feedbackPres.title,
      clientId: client.id,
      clientName: `${client.contactPerson} (${client.companyName})`,
      clientEmail: client.email,
      feedbackType,
      comment: feedbackComment,
      rating: 5,
    });

    setFeedbackSuccess(true);
    setTimeout(() => {
      setFeedbackPres(null);
      setFeedbackComment('');
      setFeedbackSuccess(false);
    }, 1800);
  };

  // 1. Expired Link View
  if (isExpired) {
    return (
      <div className="fixed inset-0 z-50 bg-[#080d1a] flex items-center justify-center p-4 text-slate-100">
        <div className="bg-[#121929] border border-red-500/30 rounded-2xl p-8 w-full max-w-md text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white">Paylaşım Bağlantısının Süresi Doldu</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {client.companyName} için oluşturulan bu erişim bağlantısının geçerlilik süresi tamamlanmıştır.
              Lütfen Müşteri Temsilciniz ile iletişime geçerek yeni bir güncel erişim bağlantısı talep ediniz.
            </p>
          </div>
          <div className="p-3 bg-slate-900 rounded-xl text-xs text-slate-400 font-mono border border-slate-800">
            Firma: {client.companyName}
          </div>
        </div>
      </div>
    );
  }

  // 2. PIN Lock View
  if (shareToken?.pinCode && !isPinUnlocked) {
    return (
      <div className="fixed inset-0 z-50 bg-[#080d1a] flex items-center justify-center p-4 text-slate-100">
        <div className="bg-[#121929] border border-amber-500/30 rounded-2xl p-8 w-full max-w-md text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">Güvenli Portala Giriş</span>
            <h2 className="text-lg font-bold text-white">{client.companyName}</h2>
            <p className="text-xs text-slate-400">
              Bu sunum portalına erişmek için tarafınıza iletilen PIN kodunu giriniz.
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="space-y-2">
              <input
                type="password"
                maxLength={6}
                autoFocus
                value={inputPin}
                onChange={(e) => {
                  setInputPin(e.target.value);
                  setPinError(false);
                }}
                placeholder="PIN Kodu (ör: 1234)"
                className={`w-full bg-slate-950 border rounded-xl py-3 px-4 text-center text-lg font-mono tracking-widest text-amber-400 focus:outline-none transition-colors ${
                  pinError ? 'border-red-500 animate-pulse' : 'border-slate-700 focus:border-amber-400'
                }`}
              />
              {pinError && (
                <p className="text-xs text-red-400 font-semibold flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Girdiğiniz PIN Kodu Hatalı!
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              <span>Giriş Yap & Sunumları Göster</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. Standalone Portal View
  return (
    <div className="fixed inset-0 z-50 bg-[#080d1a] flex flex-col overflow-hidden text-slate-100 selection:bg-blue-600">
      {/* Header Bar */}
      <div className="min-h-16 py-2.5 px-4 sm:px-6 bg-[#0b1222] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          {!isStandalone && (
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
              title="Geri Dön"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3 min-w-0">
            {client.logoUrl ? (
              <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-slate-900 border border-slate-700/80 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                <img src={client.logoUrl} alt={client.companyName} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold text-white truncate">{client.companyName}</h1>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 shrink-0">
                  SUNUM PORTALI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">Müşteri Yetkilisi: {client.contactPerson}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onEditClient && !isStandalone && (
            <button
              onClick={() => onEditClient(client)}
              className="px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Bilgileri Düzenle</span>
            </button>
          )}

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Güvenli Müşteri Erişimi</span>
          </span>

          {!isStandalone && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              Portaldan Çık
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 space-y-8 max-w-7xl mx-auto w-full">
        {/* Banner */}
        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-blue-900/40 via-slate-900 to-indigo-950/40 border border-blue-500/20 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> MAMUTHUB Özel Yayın Portalı
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {client.companyName} İçin Hazırlanan Sunum ve Teklif Dokümanları
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Bu alanda şirketinize özel atanan tüm kurumsal PDF sunum belgelerini tarayıcınızda doğrudan inceleyebilir, tam ekran sunabilir, bilgisayarınıza indirebilir veya herhangi bir slayt hakkında not/revize iletebilirsiniz.
            </p>
          </div>
        </div>

        {/* Assigned Presentations List */}
        <div className="space-y-4">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <FileText className="w-5 h-5 text-blue-400" />
            <span>Atanmış Sunum Belgeleri ({assignedPresentations.length})</span>
          </h3>

          {assignedPresentations.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">
                Şu anda hesabınıza tanımlanmış aktif bir sunum belgesi bulunmuyor.
              </p>
              <p className="text-xs text-slate-500">
                Sunumlar eklendiğinde bu portalda otomatik olarak listelenecektir.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignedPresentations.map((pres) => {
                return (
                  <div
                    key={pres.id}
                    className="bg-[#101726] border border-slate-800/90 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all group flex flex-col shadow-xl"
                  >
                    {/* Header Card Preview */}
                    <div className="relative aspect-[16/10] bg-slate-950 p-4 flex flex-col justify-between overflow-hidden border-b border-slate-800/80">
                      {pres.thumbnailUrl ? (
                        <img
                          src={pres.thumbnailUrl}
                          alt={pres.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:opacity-45 transition-opacity"
                        />
                      ) : null}

                      <div className="relative z-10 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-md bg-blue-600 text-[10px] font-bold text-white uppercase tracking-wider">
                          {pres.category}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[11px] text-slate-300 font-mono border border-slate-700">
                          {pres.pageCount || 1} SF PDF
                        </span>
                      </div>

                      <div className="relative z-10 space-y-1">
                        <span className="text-[11px] font-mono text-blue-400 font-bold block">
                          {pres.code}
                        </span>
                        <h4 className="text-sm font-bold text-white line-clamp-1">
                          {pres.title}
                        </h4>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {pres.description || 'MAMUTHUB Kurumsal Sunum Dokümanı.'}
                      </p>

                      <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleStartPresentation(pres)}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Sunumu Başlat</span>
                          </button>

                          <button
                            onClick={() => generatePresentationPDF(pres)}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-all"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-400" />
                            <span>İndir</span>
                          </button>
                        </div>

                        {onSendFeedback && (
                          <button
                            onClick={() => setFeedbackPres(pres)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Not / Revize Bildir</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Client Feedback Modal */}
      {feedbackPres && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121929] border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Geri Bildirim / Not Gönder</h3>
              </div>
              <button onClick={() => setFeedbackPres(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedbackSuccess ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-emerald-300">Notunuz Ekibe İletildi!</p>
                <p className="text-xs text-slate-400">İlgili müşteri temsilciniz iletilere göz atıp dönüş yapacaktır.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Sunum:</span>
                  <p className="text-xs font-bold text-white truncate">{feedbackPres.title}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Geri Bildirim Türü</label>
                  <select
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Revize Talebi">Revize Talebi</option>
                    <option value="Fiyat Bilgisi">Fiyat Bilgisi / Teklif Sordurma</option>
                    <option value="Soru / Not">Soru / Not Ekleme</option>
                    <option value="Genel Görüş">Genel Görüş & Değerlendirme</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Mesajınız / Notunuz *</label>
                  <textarea
                    required
                    rows={4}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Lütfen değiştirmek istediğiniz detayları veya notunuzu yazınız..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackPres(null)}
                    className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/30 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gönder</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Active Fullscreen Presentation View */}
      {activePresentation && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="h-14 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-white font-mono shrink-0">{activePresentation.code}</span>
              <span className="text-xs text-slate-400 truncate">&bull; {activePresentation.title}</span>
            </div>

            <button
              onClick={handleClosePresentation}
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shrink-0"
            >
              Sunumu Kapat
            </button>
          </div>

          <div className="flex-1 w-full h-full bg-black p-2">
            <PdfViewer
              pdfUrl={activePresentation.pdfUrl || createPresentationPdfDataUrl(activePresentation)}
              title={activePresentation.title}
              fileName={activePresentation.pdfFileName || `${activePresentation.code}.pdf`}
              extractedImages={activePresentation.extractedImages}
            />
          </div>
        </div>
      )}
    </div>
  );
};
