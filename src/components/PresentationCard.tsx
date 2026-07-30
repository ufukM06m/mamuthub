import React from 'react';
import { Star, Trash2, Folder, Clock, Eye, Download, FileText, Briefcase, Users } from 'lucide-react';
import { Presentation } from '../types';

interface PresentationCardProps {
  presentation: Presentation;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenStudio: (presentation: Presentation) => void;
  onDownloadPDF: (presentation: Presentation) => void;
  onSelectField?: (field: string) => void;
  onSelectTargetAudience?: (audience: string) => void;
}

export const PresentationCard: React.FC<PresentationCardProps> = ({
  presentation,
  onToggleFavorite,
  onDelete,
  onOpenStudio,
  onDownloadPDF,
  onSelectField,
  onSelectTargetAudience,
}) => {
  return (
    <div className="bg-[#121929] border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-200 group flex flex-col shadow-xl shadow-slate-950/40 min-w-0">
      {/* Document Cover Box */}
      <div 
        onClick={() => onOpenStudio(presentation)}
        className="relative aspect-[16/9] bg-slate-950 overflow-hidden cursor-pointer select-none p-4 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/40 border-b border-slate-800 group-hover:border-blue-500/30 transition-colors min-w-0"
      >
        {/* Top Bar: Category Badge & Actions */}
        <div className="flex items-center justify-between relative z-10 min-w-0 gap-2">
          <span className="px-2.5 py-1 rounded-md bg-blue-600/90 backdrop-blur-md border border-blue-400/40 text-[10px] font-bold text-white uppercase tracking-wider shadow-md truncate max-w-[130px]" title={presentation.category}>
            {presentation.category}
          </span>

          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onToggleFavorite(presentation.id)}
              title={presentation.isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
              className={`p-1.5 rounded-lg backdrop-blur-md transition-all ${
                presentation.isFavorite
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                  : 'bg-slate-900/70 text-slate-300 hover:bg-slate-900 hover:text-white border border-slate-700/60'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${presentation.isFavorite ? 'fill-amber-400' : ''}`} />
            </button>

            <button
              onClick={() => onDelete(presentation.id)}
              title="Sunumu Sil"
              className="p-1.5 rounded-lg bg-slate-900/70 text-slate-300 hover:bg-red-600/80 hover:text-white border border-slate-700/60 transition-all backdrop-blur-md"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center Vector Deck Icon */}
        <div className="my-auto py-2 flex flex-col items-center justify-center gap-1.5 text-slate-500 group-hover:text-blue-400 transition-colors">
          <div className="w-11 h-11 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400">
            PDF DECK
          </span>
        </div>

        {/* Bottom Bar: Tags & Page Count */}
        <div className="flex items-center justify-between relative z-10 min-w-0 gap-2">
          <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold truncate max-w-[100px]">
            MAMUTHUB
          </span>
          <span className="px-2.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[11px] font-mono text-slate-200 border border-slate-700/80 shrink-0">
            {presentation.pageCount || presentation.slides?.length || 1} sayfa
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 min-w-0">
        <div className="space-y-1.5 min-w-0">
          <h3 
            onClick={() => onOpenStudio(presentation)}
            className="text-sm font-bold text-white tracking-wide leading-snug truncate group-hover:text-blue-400 transition-colors cursor-pointer font-mono block min-w-0"
            title={presentation.code}
          >
            {presentation.code}
          </h3>

          <p className="text-xs text-slate-300 truncate block min-w-0" title={presentation.title}>
            {presentation.title}
          </p>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 min-w-0">
            <div className="flex items-center gap-1 text-[11px] text-slate-500 min-w-0">
              <Clock className="w-3 h-3 shrink-0" />
              <span className="truncate">Güncelleme: {presentation.updatedAt}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 min-w-0">
          <button
            onClick={() => onOpenStudio(presentation)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all min-w-0"
          >
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Sunuma Git</span>
          </button>

          <button
            onClick={() => onDownloadPDF(presentation)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-all min-w-0"
          >
            <Download className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">İndir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
