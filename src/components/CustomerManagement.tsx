import React, { useState } from 'react';
import { 
  Users, 
  Building2, 
  Mail, 
  Phone, 
  Plus, 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileDown,
  Share2,
  FolderPlus,
  Play,
  Trash2,
  Edit,
  ExternalLink,
  ChevronRight,
  X,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { Client, Presentation, ShareToken, ViewAnalyticsLog } from '../types';
import { generatePresentationPDF } from '../utils/pdfExport';
import { AssignPresentationsModal } from './AssignPresentationsModal';
import { ShareLinkModal } from './ShareLinkModal';
import { ClientPortalModal } from './ClientPortalModal';

export const ClientAvatar: React.FC<{ logoUrl?: string; companyName: string; size?: 'sm' | 'md' | 'lg' }> = ({
  logoUrl,
  companyName,
  size = 'md',
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses =
    size === 'sm'
      ? 'w-8 h-8 rounded-lg'
      : size === 'lg'
      ? 'w-12 h-12 rounded-xl'
      : 'w-10 h-10 rounded-xl';

  const iconSize =
    size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  if (logoUrl && !hasError) {
    return (
      <div className={`${sizeClasses} bg-slate-900 border border-slate-700/80 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md group relative`}>
        <img
          src={logoUrl}
          alt={companyName}
          className="w-full h-full object-contain"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses} bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0 shadow-md`}>
      <Building2 className={iconSize} />
    </div>
  );
};

interface CustomerManagementProps {
  clients: Client[];
  presentations: Presentation[];
  shareTokens?: ShareToken[];
  onCreateShareToken?: (token: Omit<ShareToken, 'id' | 'createdAt' | 'viewCount'>) => Promise<ShareToken> | ShareToken;
  onDeleteShareToken?: (tokenId: string) => void;
  onLogAnalytics?: (log: Omit<ViewAnalyticsLog, 'id'>) => void;
  onAddClient: (newClient: Client) => void;
  onUpdateClient: (updatedClient: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onOpenStudio: (presentation: Presentation) => void;
  onSaveAssignments: (clientId: string, selectedPresentationIds: string[]) => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  clients,
  presentations,
  shareTokens = [],
  onCreateShareToken,
  onDeleteShareToken,
  onLogAnalytics,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onOpenStudio,
  onSaveAssignments,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Modals state
  const [assigningClient, setAssigningClient] = useState<Client | null>(null);
  const [sharingClient, setSharingClient] = useState<Client | null>(null);
  const [portalClient, setPortalClient] = useState<Client | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<Client['status']>('Aktif');
  const [notes, setNotes] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const filteredClients = clients.filter(
    (c) =>
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingClient(null);
    setCompanyName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setStatus('Aktif');
    setNotes('');
    setLogoUrl('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setEditingClient(client);
    setCompanyName(client.companyName);
    setContactPerson(client.contactPerson);
    setEmail(client.email);
    setPhone(client.phone);
    setStatus(client.status);
    setNotes(client.notes || '');
    setLogoUrl(client.logoUrl || '');
    setIsAddModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    if (editingClient) {
      const updated: Client = {
        ...editingClient,
        companyName,
        contactPerson,
        email,
        phone,
        status,
        notes,
        logoUrl: logoUrl.trim() || undefined,
      };
      onUpdateClient(updated);
    } else {
      const newClient: Client = {
        id: `cli-${Date.now()}`,
        companyName,
        contactPerson,
        email,
        phone,
        assignedPresentationsCount: 0,
        status,
        notes,
        logoUrl: logoUrl.trim() || undefined,
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddClient(newClient);
    }

    setIsAddModalOpen(false);
  };

  const handleDelete = (client: Client) => {
    if (
      window.confirm(
        `"${client.companyName}" adlı müşteriyi silmek istediğinizden emin misiniz?`
      )
    ) {
      onDeleteClient(client.id);
    }
  };

  const getStatusBadge = (st: Client['status']) => {
    switch (st) {
      case 'Aktif':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold shrink-0 whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            Aktif
          </span>
        );
      case 'Sözleşmeli':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[11px] font-semibold shrink-0 whitespace-nowrap">
            <Clock className="w-3 h-3 shrink-0" />
            Sözleşmeli
          </span>
        );
      case 'Teklif Aşamasında':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-semibold shrink-0 whitespace-nowrap" title="Teklif Aşamasında">
            <AlertCircle className="w-3 h-3 shrink-0" />
            Teklif
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/30 text-[11px] font-semibold shrink-0 whitespace-nowrap">
            Pasif
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span>Müşteri Yönetimi</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Müşterilerinize özel PDF sunumları atayın, paylaşım linkleri üretin ve canlı sunum yapın.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Müşteri Ekle</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Müşteri adı veya yetkili ara..."
          className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Client List Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClients.map((client) => {
          const clientPresentations = presentations.filter((p) => p.clientId === client.id);

          return (
            <div
              key={client.id}
              className="bg-[#121929] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all shadow-lg min-w-0"
            >
              <div className="space-y-3 min-w-0">
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <ClientAvatar logoUrl={client.logoUrl} companyName={client.companyName} size="md" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-white leading-tight truncate" title={client.companyName}>
                        {client.companyName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 truncate" title={client.contactPerson}>{client.contactPerson}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {getStatusBadge(client.status)}

                    <button
                      onClick={() => handleDelete(client)}
                      title="Müşteriyi Sil"
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contact details */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/60 text-xs text-slate-300 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate block min-w-0" title={client.email}>{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate block min-w-0">{client.phone}</span>
                  </div>
                </div>

                {/* Assigned Presentations List */}
                <div className="pt-2 border-t border-slate-800/60 space-y-2 min-w-0">
                  <div className="flex items-center justify-between min-w-0 gap-2">
                    <span className="text-[11px] font-semibold text-slate-400 block truncate min-w-0">
                      Atanmış Sunumlar ({clientPresentations.length})
                    </span>

                    <button
                      onClick={() => setAssigningClient(client)}
                      className="text-[11px] font-bold text-blue-400 hover:underline flex items-center gap-1 shrink-0"
                    >
                      <FolderPlus className="w-3 h-3" />
                      <span>Sunum Ata</span>
                    </button>
                  </div>

                  {clientPresentations.length === 0 ? (
                    <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 text-center">
                      <p className="text-xs text-slate-500 italic">Henüz bu müşteriye sunum atanmadı.</p>
                      <button
                        onClick={() => setAssigningClient(client)}
                        className="mt-1.5 text-xs text-blue-400 hover:underline font-semibold"
                      >
                        + Sunum Seç ve Ata
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {clientPresentations.map((pres) => (
                        <div
                          key={pres.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs transition-colors group/pres min-w-0 gap-2"
                        >
                          <div
                            onClick={() => onOpenStudio(pres)}
                            className="flex items-center gap-2 truncate cursor-pointer flex-1 min-w-0"
                            title={`${pres.code} - ${pres.title}`}
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="text-slate-200 font-bold font-mono shrink-0 group-hover/pres:text-blue-400">
                              {pres.code}
                            </span>
                            <span className="text-slate-400 truncate text-[11px] block min-w-0">
                              {pres.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => onOpenStudio(pres)}
                              title="Sunumu Başlat"
                              className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded transition-colors"
                            >
                              <Play className="w-3 h-3 fill-emerald-400" />
                            </button>
                            <button
                              onClick={() => generatePresentationPDF(pres)}
                              title="PDF İndir"
                              className="p-1 hover:text-blue-400 text-slate-400 transition-colors"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions for Client */}
              <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 min-w-0">
                {/* Edit Client Info */}
                <button
                  onClick={() => handleOpenEditModal(client)}
                  className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-blue-400 hover:text-blue-300 text-xs font-semibold transition-all min-w-0"
                  title="Müşteri Bilgilerini Düzenle"
                >
                  <Edit className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Düzenle</span>
                </button>

                {/* Portal View */}
                <button
                  onClick={() => setPortalClient(client)}
                  className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all min-w-0"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Portal</span>
                </button>

                {/* Share Link */}
                <button
                  onClick={() => setSharingClient(client)}
                  className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-all min-w-0"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Paylaş</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Client Modal */}
      {isAddModalOpen && (
        <div 
          onClick={() => setIsAddModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121929] border border-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-md space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto my-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingClient ? 'Müşteri Bilgilerini Düzenle' : 'Yeni Müşteri Ekle'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingClient ? 'Müşteri bilgilerini güncelleyin.' : 'Sisteme yeni müşteri ekleyin.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Şirket Adı</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="ör. Akbank T.A.Ş."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Müşteri Logosu Yükleme */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Müşteri Logosu
                </label>
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <div className="relative w-14 h-14 rounded-xl bg-slate-900 border border-slate-700/80 p-1 flex items-center justify-center shrink-0 group shadow-md">
                      <img src={logoUrl} alt="Logo Önizleme" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow hover:bg-red-500 transition-colors"
                        title="Logoyu Kaldır"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-900/80 border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 shrink-0">
                      <Building2 className="w-6 h-6 text-slate-600" />
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      <span>{logoUrl ? 'Logoyu Değiştir' : 'Logo Görseli Yükle'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setLogoUrl(ev.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="veya Logo bağlantısı (URL)..."
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-[11px] text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Yetkili Kişi</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="ör. Zeynep Yılmaz"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">E-Posta</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@sirket.com"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Telefon</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+90 555..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Durum</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Client['status'])}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Teklif Aşamasında">Teklif Aşamasında</option>
                  <option value="Sözleşmeli">Sözleşmeli</option>
                  <option value="Pasif">Pasif</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Notlar</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Müşteri ilişkileri notları..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  {editingClient ? 'Güncelle' : 'Müşteriyi Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Presentations Modal */}
      {assigningClient && (
        <AssignPresentationsModal
          client={assigningClient}
          presentations={presentations}
          onClose={() => setAssigningClient(null)}
          onSaveAssignments={onSaveAssignments}
        />
      )}

      {/* Share Link Modal */}
      {sharingClient && (
        <ShareLinkModal
          client={sharingClient}
          assignedPresentations={presentations.filter((p) => p.clientId === sharingClient.id)}
          shareTokens={shareTokens}
          onCreateShareToken={onCreateShareToken}
          onDeleteShareToken={onDeleteShareToken}
          onClose={() => setSharingClient(null)}
          onOpenPortal={(cli) => setPortalClient(cli)}
        />
      )}

      {/* Client Portal Modal */}
      {portalClient && (
        <ClientPortalModal
          client={portalClient}
          assignedPresentations={presentations.filter((p) => p.clientId === portalClient.id)}
          onClose={() => setPortalClient(null)}
          onEditClient={(cli) => {
            setPortalClient(null);
            handleOpenEditModal(cli);
          }}
          onLogAnalytics={onLogAnalytics}
        />
      )}
    </div>
  );
};
