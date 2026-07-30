import React, { useState } from 'react';
import { X, Copy, Check, Share2, ExternalLink, Mail, MessageSquare, Building2, ShieldCheck } from 'lucide-react';
import { Client, Presentation } from '../types';

interface ShareLinkModalProps {
  client: Client;
  assignedPresentations: Presentation[];
  onClose: () => void;
  onOpenPortal: (client: Client) => void;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  client,
  assignedPresentations,
  onClose,
  onOpenPortal,
}) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}${window.location.pathname}?portal=${client.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleMailShare = () => {
    const subject = encodeURIComponent(`${client.companyName} - MAMUTHUB Kurumsal Sunum Portalı`);
    const body = encodeURIComponent(
      `Merhaba ${client.contactPerson},\n\nSizin için hazırladığımız kurumsal sunumlarımıza aşağıdaki bağlantıdan erişebilirsiniz:\n${shareUrl}\n\nİyi çalışmalar dileriz.\nMAMUTHUB Ekibi`
    );
    window.open(`mailto:${client.email}?subject=${subject}&body=${body}`);
  };

  const handleWhatsappShare = () => {
    const text = encodeURIComponent(
      `Merhaba ${client.contactPerson}, kurumsal sunum bağlantınız: ${shareUrl}`
    );
    window.open(`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${text}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#121929] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-[#0d1424] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              <Share2 className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">Müşteri Sunum Bağlantısı</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">{client.companyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Paylaşım Bağlantısı (Özel Erişim)</span>
              <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" /> Korumalı Link
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-blue-400 focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Kopyalandı!' : 'Kopyala'}</span>
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleMailShare}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 text-slate-200 text-xs font-semibold transition-all"
            >
              <Mail className="w-4 h-4 text-blue-400" />
              <span>E-Posta Gönder</span>
            </button>

            <button
              onClick={handleWhatsappShare}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 text-slate-200 text-xs font-semibold transition-all"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp'ta Paylaş</span>
            </button>
          </div>

          {/* Assigned summary */}
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">Atanmış Sunum Sayısı:</span>
            <span className="font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
              {assignedPresentations.length} Adet Sunum
            </span>
          </div>

          {/* Open Portal Live Preview */}
          <button
            onClick={() => {
              onClose();
              onOpenPortal(client);
            }}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Müşteri Sunum Portalını Aç (Canlı Görünüm)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
