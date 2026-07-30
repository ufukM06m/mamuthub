import React, { useState } from 'react';
import { X, FolderPlus, Edit2, Trash2, Check, AlertCircle, Folders } from 'lucide-react';
import { Category } from '../types';

interface ManageCategoriesModalProps {
  categories: Category[];
  onClose: () => void;
  onAddCategory: (categoryName: string) => void;
  onEditCategory: (oldName: string, newName: string) => void;
  onDeleteCategory: (categoryName: string) => void;
}

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  categories,
  onClose,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const formatted = newCatName.trim().toUpperCase();
    if (categories.some((c) => c.name.toLowerCase() === formatted.toLowerCase())) {
      setError('Bu isimde bir kategori zaten mevcut.');
      return;
    }

    setError(null);
    onAddCategory(formatted);
    setNewCatName('');
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingValue(cat.name);
  };

  const handleSaveEdit = (cat: Category) => {
    if (!editingValue.trim()) return;
    const formatted = editingValue.trim().toUpperCase();
    if (formatted !== cat.name) {
      onEditCategory(cat.name, formatted);
    }
    setEditingId(null);
  };

  const handleDelete = (cat: Category) => {
    if (categories.length <= 1) {
      alert('Sistemde en az bir kategori kalmalıdır.');
      return;
    }

    if (
      window.confirm(
        `"${cat.name}" kategorisini silmek istediğinizden emin misiniz? Bu kategoriye ait sunumlar "GENEL SUNUMLAR" kategorisine taşınacaktır.`
      )
    ) {
      onDeleteCategory(cat.name);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#121929] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-[#0d1424] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold shrink-0">
              <Folders className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">Kategori Yönetimi</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">Sunum kategorilerini düzenleyin veya silin.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Add New Category Input */}
          <form onSubmit={handleCreate} className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Yeni Kategori Ekle</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => {
                  setNewCatName(e.target.value);
                  setError(null);
                }}
                placeholder="ör. AKADEMİ TEKLİFLERİ"
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 uppercase"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 shrink-0"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Ekle</span>
              </button>
            </div>
            {error && (
              <p className="text-[11px] text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{error}</span>
              </p>
            )}
          </form>

          {/* Existing Categories List */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 block">
              Mevcut Kategoriler ({categories.length})
            </label>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isEditing = editingId === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition-all"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="w-full bg-slate-950 border border-blue-500 rounded-md px-2.5 py-1 text-xs text-white uppercase focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(cat)}
                          className="p-1.5 rounded-md bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <div>
                          <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                            {cat.name}
                          </span>
                          <span className="text-[11px] text-slate-500 ml-2">
                            ({cat.count || 0} sunum)
                          </span>
                        </div>
                      </div>
                    )}

                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(cat)}
                          title="Kategori Adını Düzenle"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          title="Kategoriyi Sil"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0d1424] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
