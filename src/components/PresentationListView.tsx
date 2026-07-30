import React from 'react';
import { 
  FileText, 
  Star, 
  Trash2, 
  Eye, 
  Download, 
  Clock, 
  Layers,
  Briefcase,
  Users
} from 'lucide-react';
import { Presentation } from '../types';

interface PresentationListViewProps {
  presentations: Presentation[];
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenStudio: (presentation: Presentation) => void;
  onDownloadPDF: (presentation: Presentation) => void;
}

export const PresentationListView: React.FC<PresentationListViewProps> = ({
  presentations,
  onToggleFavorite,
  onDelete,
  onOpenStudio,
  onDownloadPDF,
}) => {
  return (
    <div className="bg-[#121929] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#0d1424] text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4 w-10"></th>
              <th className="py-3.5 px-4">Sunum Kodu / Başlık</th>
              <th className="py-3.5 px-4">Kategori</th>
              <th className="py-3.5 px-4">Alan / Sektör</th>
              <th className="py-3.5 px-4">Hedef Kitle</th>
              <th className="py-3.5 px-4">Sayfa</th>
              <th className="py-3.5 px-4">Güncelleme</th>
              <th className="py-3.5 px-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {presentations.map((presentation) => (
              <tr
                key={presentation.id}
                className="hover:bg-slate-900/60 transition-colors group cursor-pointer"
                onClick={() => onOpenStudio(presentation)}
              >
                {/* Favorite Star */}
                <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleFavorite(presentation.id)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-amber-400 transition-colors"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        presentation.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </button>
                </td>

                {/* Code & Title */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono font-bold text-white block group-hover:text-blue-400 transition-colors">
                        {presentation.code}
                      </span>
                      <span className="text-[11px] text-slate-400 line-clamp-1">
                        {presentation.title}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="py-3 px-4">
                  <span className="px-2.5 py-1 rounded-md bg-blue-600/15 text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider">
                    {presentation.category}
                  </span>
                </td>

                {/* Fields (Alan) */}
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1 max-w-[160px]">
                    {presentation.fields && presentation.fields.length > 0 ? (
                      presentation.fields.map((field) => (
                        <span
                          key={field}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30 text-[10px] font-medium"
                        >
                          <Briefcase className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                          <span className="truncate max-w-[100px]">{field}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-600 text-[10px]">-</span>
                    )}
                  </div>
                </td>

                {/* Target Audiences (Hedef Kitle) */}
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1 max-w-[170px]">
                    {presentation.targetAudiences && presentation.targetAudiences.length > 0 ? (
                      presentation.targetAudiences.map((audience) => (
                        <span
                          key={audience}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-medium"
                        >
                          <Users className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                          <span className="truncate max-w-[110px]">{audience}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-600 text-[10px]">-</span>
                    )}
                  </div>
                </td>

                {/* Page Count */}
                <td className="py-3 px-4 font-mono text-slate-400">
                  <div className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>{presentation.pageCount || presentation.slides?.length || 1} sf</span>
                  </div>
                </td>

                {/* Date */}
                <td className="py-3 px-4 text-slate-400 text-[11px]">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{presentation.updatedAt}</span>
                  </div>
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {/* View Studio */}
                    <button
                      onClick={() => onOpenStudio(presentation)}
                      title="Sunumu Aç & İncele"
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-blue-600 hover:border-blue-500 hover:text-white text-slate-300 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Download PDF */}
                    <button
                      onClick={() => onDownloadPDF(presentation)}
                      title="PDF İndir"
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDelete(presentation.id)}
                      title="Sil"
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-red-600/80 hover:border-red-500 hover:text-white text-slate-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
