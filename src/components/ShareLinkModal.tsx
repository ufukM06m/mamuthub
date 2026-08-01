import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Mail,
  MessageSquare,
  Building2,
  ShieldCheck,
  Clock,
  Key,
  Trash2,
  Plus,
  AlertTriangle,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Client, Presentation, ShareToken } from '../types';

interface ShareLinkModalProps {
  client: Client;
  assignedPresentations: Presentation[];
  shareTokens?: ShareToken[];
  onCreateShareToken?: (token: Omit<ShareToken, 'id' | 'createdAt' | 'viewCount'>) => Promise<ShareToken> | ShareToken;
  onDeleteShareToken?: (tokenId: string) => void;
  onClose: () => void;
  onOpenPortal: (client: Client) => void;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  client,
  assignedPresentations,
  shareTokens = [],
  onCreateShareToken,
  onDeleteShareToken,
  onClose,
  onOpenPortal,
}) => {
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<'1' | '7' | '30' | 'unlimited'>('7');
  const [usePin, setUsePin] = useState<boolean>(false);
  const [pinCode, setPinCode] = useState<string>('1234');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [createdToken, setCreatedToken] = useState<ShareToken | null>(null);

  // Filter existing tokens for this client
  const clientTokens = shareTokens.filter((t) => t.clientId === client.id);

  // Create active default link if none exists
  const handleGenerateLink = async () => {
    if (!onCreateShareToken) return;
    setIsCreating(true);

    let expiresAt: string | null = null;
    const now = new Date();

    if (selectedDuration === '1') {
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    } else if (selectedDuration === '7') {
      expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (selectedDuration === '30') {
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      expiresAt = null;
    }

    const token = await onCreateShareToken({
      clientId: client.id,
      companyName: client.companyName,
      contactPerson: client.contactPerson,
      expiresInDays: selectedDuration,
      expiresAt,
      pinCode: usePin && pinCode.trim().length > 0 ? pinCode.trim() : undefined,
    });

    setCreatedToken(token);
    setIsCreating(false);
  };

  const activeLink = createdToken || (clientTokens.length > 0 ? clientTokens[0] : null);

  const getShareUrl = (token?: ShareToken | null) => {
    if (!token) {
      return `${window.location.origin}${window.location.pathname}?portal=${client.id}`;
    }
    return `${window.location.origin}${window.location.pathname}?token=${token.id}`;
  };

  const currentShareUrl = getShareUrl(activeLink);

  const handleCopy = (token?: ShareToken | null) => {
    const url = getShareUrl(token);
    navigator.clipboard.writeText(url);
    const key = token ? token.id : 'default';
    setCopiedTokenId(key);
    setTimeout(() => setCopiedTokenId(null), 2500);
  };

  const handleMailShare = () => {
    const subject = encodeURIComponent(`${client.companyName} - MAMUTHUB Kurumsal Sunum Portalı`);
    const pinText = activeLink?.pinCode ? `\n\nErişim PIN Kodu: ${activeLink.pinCode}` : '';
    const body = encodeURIComponent(
      `Merhaba ${client.contactPerson},\n\nSizin için özel hazırladığımız kurumsal sunumlarımıza aşağıdaki güvenli bağlantıdan erişebilirsiniz:\n${currentShareUrl}${pinText}\n\nİyi çalışmalar dileriz.\nMAMUTHUB Ekibi`
    );
    window.open(`mailto:${client.email}?subject=${subject}&body=${body}`);
  };

  const handleWhatsappShare = () => {
    const pinText = activeLink?.pinCode ? ` (Erişim PIN: ${activeLink.pinCode})` : '';
    const text = encodeURIComponent(
      `Merhaba ${client.contactPerson}, kurumsal sunum portali özel bağlantınız:${pinText}\n${currentShareUrl}`
    );
    window.open(`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${text}`);
  };

  const isExpired = (token: ShareToken) => {
    if (!token.expiresAt) return false;
    return new Date(token.expiresAt) < new Date();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#121929] border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-800 bg-[#0d1424] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                Müşteri Sunum Bağlantısı & Paylaşım
              </h3>
              <p className="text-xs text-slate-400 truncate">{client.companyName} &bull; {client.contactPerson}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Create New Link Section */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Yeni Süreli / Güvenli Müşteri Linki Oluştur</span>
              </span>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Şifresiz Doğrudan Müşteri Portalı
              </span>
            </div>

            {/* Duration Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Geçerlilik Süresi Seçimi:</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: '1', label: '1 Gün', desc: '24 Saat' },
                  { id: '7', label: '7 Gün', desc: 'Önerilen' },
                  { id: '30', label: '30 Gün', desc: '1 Ay' },
                  { id: 'unlimited', label: 'Sınırsız', desc: 'Süresiz' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedDuration(item.id as any)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      selectedDuration === item.id
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-600/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[10px] opacity-70">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* PIN Code Option */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={usePin}
                  onChange={(e) => setUsePin(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Erişim PIN Kodu İstensin</span>
                </span>
              </label>

              {usePin && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">PIN:</span>
                  <input
                    type="text"
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-24 bg-slate-950 border border-amber-500/50 rounded-lg px-2.5 py-1 text-center text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                    placeholder="1234"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerateLink}
                disabled={isCreating}
                className="ml-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{isCreating ? 'Üretiliyor...' : 'Yeni Link Üret'}</span>
              </button>
            </div>
          </div>

          {/* Active Generated Link */}
          {activeLink && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-white">Aktif Paylaşım Bağlantısı</span>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  {activeLink.expiresAt ? (
                    isExpired(activeLink) ? (
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Süresi Doldu
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                        Bitiş: {new Date(activeLink.expiresAt).toLocaleDateString('tr-TR')}
                      </span>
                    )
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                      Sınırsız Geçerlilik
                    </span>
                  )}

                  {activeLink.pinCode && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> PIN: {activeLink.pinCode}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentShareUrl}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-blue-400 focus:outline-none"
                />
                <button
                  onClick={() => handleCopy(activeLink)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                    copiedTokenId === activeLink.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {copiedTokenId === activeLink.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedTokenId === activeLink.id ? 'Kopyalandı!' : 'Kopyala'}</span>
                </button>
              </div>

              {/* Quick Actions for active link */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleMailShare}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-all"
                >
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span>E-Posta İle Gönder</span>
                </button>

                <button
                  onClick={handleWhatsappShare}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-all"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp İle Gönder</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Tokens List if multiple */}
          {clientTokens.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Müşteriye Ait Oluşturulmuş Bağlantı Geçmişi ({clientTokens.length})
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {clientTokens.map((tok) => {
                  const expired = isExpired(tok);
                  return (
                    <div
                      key={tok.id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs gap-2"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-blue-400 font-bold truncate">
                            {getShareUrl(tok)}
                          </span>
                          {expired ? (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-bold">
                              Süresi Doldu
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                              Aktif
                            </span>
                          )}
                          {tok.pinCode && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                              PIN: {tok.pinCode}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {tok.expiresAt
                            ? `Bitiş: ${new Date(tok.expiresAt).toLocaleDateString('tr-TR')}`
                            : 'Sınırsız Geçerlilik'}{' '}
                          &bull; Görüntülenme: {tok.viewCount || 0} Kez
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleCopy(tok)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="Kopyala"
                        >
                          {copiedTokenId === tok.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {onDeleteShareToken && (
                          <button
                            onClick={() => onDeleteShareToken(tok.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-300"
                            title="Bağlantıyı İptal Et / Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
            <span>Müşteri Sunum Portalını Önizle (Canlı Görünüm)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
