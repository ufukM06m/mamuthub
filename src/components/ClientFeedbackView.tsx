import React, { useState } from 'react';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  Mail, 
  Star, 
  Send, 
  FileText, 
  Trash2, 
  Sparkles,
  User
} from 'lucide-react';
import { ClientFeedback } from '../types';

interface ClientFeedbackViewProps {
  feedbacks: ClientFeedback[];
  onUpdateFeedbackStatus: (id: string, status: 'Yeni' | 'İnceleniyor' | 'Tamamlandı') => void;
  onDeleteFeedback: (id: string) => void;
}

export const ClientFeedbackView: React.FC<ClientFeedbackViewProps> = ({
  feedbacks,
  onUpdateFeedbackStatus,
  onDeleteFeedback,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredFeedbacks = feedbacks.filter((fb) => {
    const matchesSearch = 
      fb.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fb.presentationTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fb.comment.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || fb.status === statusFilter;
    const matchesType = typeFilter === 'all' || fb.feedbackType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const newCount = feedbacks.filter((f) => f.status === 'Yeni').length;
  const inProgressCount = feedbacks.filter((f) => f.status === 'İnceleniyor').length;
  const completedCount = feedbacks.filter((f) => f.status === 'Tamamlandı').length;

  const getTypeBadge = (type: ClientFeedback['feedbackType']) => {
    switch (type) {
      case 'Revize Talebi':
        return <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold whitespace-nowrap">Revize Talebi</span>;
      case 'Fiyat Bilgisi':
        return <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold whitespace-nowrap">Fiyat Bilgisi</span>;
      case 'Soru / Not':
        return <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-bold whitespace-nowrap">Soru / Not</span>;
      default:
        return <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold whitespace-nowrap">Genel Görüş</span>;
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0d1424] p-5 rounded-2xl border border-slate-800/80 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">Müşteri Notları & Geri Bildirimler</h1>
            <p className="text-xs text-slate-400">
              Müşterilerin sunum sayfalarına bıraktığı revize isteklerini, fiyat sorularını ve notlarını inceleyin.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0d1424] border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Yeni Talepler</p>
            <p className="text-2xl font-black text-amber-400 mt-0.5">{newCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0d1424] border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">İncelenenler</p>
            <p className="text-2xl font-black text-blue-400 mt-0.5">{inProgressCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0d1424] border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tamamlananlar</p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">{completedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Müşteri adı, sunum veya yorum ara..."
            className="w-full pl-9 pr-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="Yeni">Yeni</option>
            <option value="İnceleniyor">İnceleniyor</option>
            <option value="Tamamlandı">Tamamlandı</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Tüm Türler</option>
            <option value="Revize Talebi">Revize Talebi</option>
            <option value="Fiyat Bilgisi">Fiyat Bilgisi</option>
            <option value="Soru / Not">Soru / Not</option>
            <option value="Genel Görüş">Genel Görüş</option>
          </select>
        </div>
      </div>

      {/* Feedback List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFeedbacks.length === 0 ? (
          <div className="col-span-full bg-[#0d1424] border border-slate-800 p-8 rounded-2xl text-center text-slate-500">
            Filtrelere uygun müşteri geri bildirimi bulunmuyor.
          </div>
        ) : (
          filteredFeedbacks.map((fb) => (
            <div key={fb.id} className="bg-[#0d1424] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 space-y-4 shadow-lg transition-all min-w-0 overflow-hidden">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 min-w-0">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="font-bold text-white text-sm truncate max-w-[220px]">{fb.clientName}</span>
                    {getTypeBadge(fb.feedbackType)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate font-semibold text-slate-300 min-w-0 flex-1">{fb.presentationTitle}</span>
                    {fb.slideIndex && (
                      <span className="shrink-0 px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-mono text-[10px] whitespace-nowrap">
                        (Slayt {fb.slideIndex})
                      </span>
                    )}
                  </div>
                </div>

                {/* Rating */}
                {fb.rating && (
                  <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                    {Array.from({ length: fb.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                )}
              </div>

              {/* Comment Content */}
              <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 leading-relaxed font-sans break-words whitespace-pre-wrap overflow-hidden">
                "{fb.comment}"
              </div>

              {/* Footer Meta & Actions */}
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs min-w-0">
                <span className="font-mono text-[11px] text-slate-500 shrink-0">{fb.createdAt}</span>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={fb.status}
                    onChange={(e) => onUpdateFeedbackStatus(fb.id, e.target.value as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold focus:outline-none ${
                      fb.status === 'Yeni'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : fb.status === 'İnceleniyor'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    <option value="Yeni" className="bg-slate-900 text-white">Yeni</option>
                    <option value="İnceleniyor" className="bg-slate-900 text-white">İnceleniyor</option>
                    <option value="Tamamlandı" className="bg-slate-900 text-white">Tamamlandı</option>
                  </select>

                  <button
                    onClick={() => onDeleteFeedback(fb.id)}
                    title="Sil"
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
