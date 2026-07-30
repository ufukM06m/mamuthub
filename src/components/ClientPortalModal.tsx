import React, { useState } from 'react';
import { X, Building2, Play, Download, Eye, FileText, CheckCircle2, ShieldCheck, ArrowLeft, Edit, MessageSquare, Send, Star } from 'lucide-react';
import { Client, Presentation, ClientFeedback } from '../types';
import { generatePresentationPDF, createPresentationPdfDataUrl } from '../utils/pdfExport';
import { PdfViewer } from './PdfViewer';

interface ClientPortalModalProps {
  client: Client;
  assignedPresentations: Presentation[];
  onClose: () => void;
  onEditClient?: (client: Client) => void;
  onSendFeedback?: (feedback: Omit<ClientFeedback, 'id' | 'createdAt' | 'status'>) => void;
}

export const ClientPortalModal: React.FC<ClientPortalModalProps> = ({
  client,
  assignedPresentations,
  onClose,
  onEditClient,
  onSendFeedback,
}) => {
  const [activePresentation, setActivePresentation] = useState<Presentation | null>(null);
  const [feedbackPres, setFeedbackPres] = useState<Presentation | null>(null);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<ClientFeedback['feedbackType']>('Revize Talebi');
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);

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

  return (
    <div className="fixed inset-0 z-50 bg-[#080d1a] flex flex-col overflow-hidden text-slate-100 selection:bg-blue-600">
      {/* Header Bar */}
      <div className="min-h-16 py-2 px-3 sm:px-6 bg-[#0b1222] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
            title="Geri Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            {client.logoUrl ? (
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-xl bg-slate-900 border border-slate-700/80 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                <img src={client.logoUrl} alt={client.companyName} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
                <Building2 className="w-4 sm:w-5 h-4 sm:h-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-xs sm:text-sm font-bold text-white truncate">{client.companyName}</h1>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] sm:text-[10px] font-bold border border-emerald-500/30 shrink-0">
                  PORTAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">Yetkili: {client.contactPerson}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onEditClient && (
            <button
              onClick={() => onEditClient(client)}
              className="px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Bilgileri Düzenle</span>
            </button>
          )}

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Güvenli Kurumsal Yayın</span>
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Portaldan Çık
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 max-w-7xl mx-auto w-full">
        {/* Welcome Banner */}
        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-blue-900/40 via-slate-900 to-indigo-950/40 border border-blue-500/20 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl space-y-2 relative z-10">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
              MAMUTHUB Sunum Portalı
            </span>
            <h2 className="text-2xl font-black text-white">
              {client.companyName} İçin Özel Hazırlanan Sunumlar
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Bu panelde şirketinize özel atanan tüm PDF kurumsal sunumları ve teklif belgelerini doğrudan tarayıcınızda inceleyebilir, tam ekran sunabilir veya indirebilirsiniz.
            </p>
          </div>
        </div>

        {/* Assigned Presentations Grid */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <FileText className="w-5 h-5 text-blue-400" />
            <span>Atanmış Sunum Belgeleri ({assignedPresentations.length})</span>
          </h3>

          {assignedPresentations.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">
                Bu müşteriye henüz sunum atanmamış.
              </p>
              <p className="text-xs text-slate-500">
                Paneldeki "Müşteriye Sunum Ata" butonundan istediğiniz sunumları bu müşteri hesabına bağlayabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignedPresentations.map((pres) => {
                const pdfDataUrl = pres.pdfUrl || createPresentationPdfDataUrl(pres);

                return (
                  <div
                    key={pres.id}
                    className="bg-[#101726] border border-slate-800/90 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all group flex flex-col shadow-xl"
                  >
                    {/* PDF Document Preview Header */}
                    <div className="relative aspect-[16/10] bg-slate-950 p-4 flex flex-col justify-between overflow-hidden border-b border-slate-800/80">
                      {pres.thumbnailUrl ? (
                        <img
                          src={pres.thumbnailUrl}
                          alt={pres.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity"
                        />
                      ) : null}

                      <div className="relative z-10 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-md bg-blue-600 text-[10px] font-bold text-white uppercase tracking-wider">
                          {pres.category}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[11px] text-slate-300 font-mono border border-slate-700">
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

                    {/* Footer Actions */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {pres.description || 'MAMUTHUB Kurumsal Sunum Dokümanı.'}
                      </p>

                      <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setActivePresentation(pres)}
                            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Sunumu Başlat</span>
                          </button>

                          <button
                            onClick={() => generatePresentationPDF(pres)}
                            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-all"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-400" />
                            <span>İndir</span>
                          </button>
                        </div>

                        {onSendFeedback && (
                          <button
                            onClick={() => setFeedbackPres(pres)}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Not / Revize İlet</span>
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
                <p className="text-sm font-bold text-emerald-300">Notunuz Ekibe Başarıyla İletildi!</p>
                <p className="text-xs text-slate-400">İlgili yönetici ve editör arkadaşlarımız sizinle iletişime geçecektir.</p>
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
                    placeholder="Lütfen değiştirmek istediğiniz slayt veya detaylı görüşlerinizi yazın..."
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

      {/* Active Presentation Fullscreen Mode */}
      {activePresentation && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-white font-mono">{activePresentation.code}</span>
              <span className="text-xs text-slate-400">&bull; {activePresentation.title}</span>
            </div>

            <button
              onClick={() => setActivePresentation(null)}
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all"
            >
              Kapat
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
