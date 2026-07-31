import React from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Star, 
  Users, 
  Plus, 
  Folder, 
  LogOut,
  Layers,
  Briefcase,
  ShieldCheck,
  BarChart3,
  MessageSquare,
  X
} from 'lucide-react';
import { Category, ViewMode, User } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryName: string | null) => void;
  onOpenAddCategory: () => void;
  onOpenManageTaxonomy?: () => void;
  totalPresentationsCount: number;
  favoritesCount: number;
  unreadFeedbacksCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  currentUser?: User;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  categories,
  selectedCategory,
  onSelectCategory,
  onOpenAddCategory,
  onOpenManageTaxonomy,
  totalPresentationsCount,
  favoritesCount,
  unreadFeedbacksCount = 0,
  isMobileOpen = false,
  onCloseMobile,
  currentUser,
  onLogout,
}) => {
  const handleItemClick = (action: () => void) => {
    action();
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 lg:z-auto w-64 bg-[#0d1424] border-r border-slate-800/80 flex flex-col justify-between h-screen text-slate-300 select-none shrink-0 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:static`}
      >
        {/* Top Section */}
        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
          {/* Logo / Header */}
          <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-wide text-white leading-tight">
                  MAMUTHUB
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">Yönetim Paneli</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
              title="Menüyü Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="p-3 space-y-1">
            {/* Panel */}
            <button
              onClick={() =>
                handleItemClick(() => {
                  onSelectView('panel');
                  onSelectCategory(null);
                })
              }
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentView === 'panel' && selectedCategory === null
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Panel</span>
            </button>

            {/* Tüm Sunumlar */}
            <button
              onClick={() =>
                handleItemClick(() => {
                  onSelectView('all');
                  onSelectCategory(null);
                })
              }
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentView === 'all'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <FolderKanban className="w-4 h-4 shrink-0" />
                <span>Tüm Sunumlar</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/50">
                {totalPresentationsCount}
              </span>
            </button>

            {/* Favori Sunumlar */}
            <button
              onClick={() =>
                handleItemClick(() => {
                  onSelectView('favorites');
                  onSelectCategory(null);
                })
              }
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentView === 'favorites'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Star className="w-4 h-4 shrink-0" />
                <span>Favori Sunumlar</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/50">
                {favoritesCount}
              </span>
            </button>

            {/* Müşteri Yönetimi */}
            <button
              onClick={() =>
                handleItemClick(() => {
                  onSelectView('customers');
                  onSelectCategory(null);
                })
              }
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentView === 'customers'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Müşteri Yönetimi</span>
            </button>

            {/* Sunum Analitik & İzleme */}
            <button
              onClick={() =>
                handleItemClick(() => {
                  onSelectView('analytics');
                  onSelectCategory(null);
                })
              }
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentView === 'analytics'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Sunum Analitiği</span>
            </button>

            {/* Müşteri Geri Bildirimleri */}
            <button
              onClick={() =>
                handleItemClick(() => {
                  onSelectView('feedback');
                  onSelectCategory(null);
                })
              }
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentView === 'feedback'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Müşteri Notları</span>
              </div>
              {unreadFeedbacksCount !== undefined && unreadFeedbacksCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-bold">
                  {unreadFeedbacksCount}
                </span>
              )}
            </button>

            {/* Kullanıcı Yönetimi */}
            <button
              onClick={() =>
                handleItemClick(() => {
                  onSelectView('users');
                  onSelectCategory(null);
                })
              }
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentView === 'users'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-purple-400" />
              <span>Kullanıcı Yönetimi</span>
            </button>

            {/* Alan ve Hedef Kitle Yönetimi */}
            {onOpenManageTaxonomy && (
              <button
                onClick={() =>
                  handleItemClick(() => {
                    onOpenManageTaxonomy();
                  })
                }
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition-all border border-dashed border-slate-800 hover:border-slate-700 mt-1"
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Alan & Kitle Yönetimi</span>
                </div>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">
                  YÖNET
                </span>
              </button>
            )}
          </div>

          {/* Categories Section */}
          <div className="mt-4 px-3 pt-4 border-t border-slate-800/60">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                KATEGORİLER
              </span>
              <button
                onClick={() =>
                  handleItemClick(() => {
                    onOpenAddCategory();
                  })
                }
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                title="Kategorileri Yönet / Ekle"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.id}
                    onClick={() =>
                      handleItemClick(() => {
                        onSelectView('panel');
                        onSelectCategory(cat.name);
                      })
                    }
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                      <span className="truncate">{cat.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 ml-2">
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0a0f1c]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow">
                {currentUser ? currentUser.name.charAt(0) : 'M'}
              </div>
              <div className="truncate min-w-0">
                <div className="flex items-center gap-1.5 truncate">
                  <p className="text-xs font-semibold text-white leading-tight truncate">
                    {currentUser ? currentUser.name : 'Yönetici'}
                  </p>
                  {currentUser?.role && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-blue-300 border border-slate-700 font-mono shrink-0">
                      {currentUser.role === 'admin' ? 'YÖNETİCİ' : currentUser.role === 'editor' ? 'EDITÖR' : 'İZLEYİCİ'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {currentUser ? currentUser.email : 'admin@mamuthub.com'}
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Güvenli Çıkış Yap"
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
