import React from 'react';
import { Search, Download, Upload, Plus, Menu, UserCheck } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  onAddNewPresentation: () => void;
  onOpenMobileMenu?: () => void;
  currentUser?: User;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onExportBackup,
  onImportBackup,
  onAddNewPresentation,
  onOpenMobileMenu,
  currentUser,
}) => {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0d1424]/80 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-20">
      <div className="flex items-center gap-2 flex-1 max-w-xl min-w-0">
        {/* Mobile Hamburger Toggle */}
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title="Menüyü Aç"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Search Input */}
        <div className="flex-1 relative min-w-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Sunum, kategori, etiket ara..."
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 bg-slate-900/90 border border-slate-700/60 rounded-lg text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all truncate"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Current User Badge (Desktop) */}
        {currentUser && (
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <span className="font-semibold text-slate-200 truncate max-w-[120px]">
              {currentUser.name.split(' ')[0]}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-mono font-bold uppercase">
              {currentUser.role}
            </span>
          </div>
        )}

        {/* Yedeği İndir */}
        <button
          onClick={onExportBackup}
          title="Yedeği İndir"
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="hidden md:inline">Yedeği İndir</span>
        </button>

        {/* Yedeği Yükle */}
        <button
          onClick={onImportBackup}
          title="Yedeği Yükle"
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
        >
          <Upload className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="hidden md:inline">Yedeği Yükle</span>
        </button>

        {/* Yeni Sunum Ekle */}
        <button
          onClick={onAddNewPresentation}
          title="PDF Sunum Yükle"
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">PDF Yükle</span>
        </button>
      </div>
    </header>
  );
};

