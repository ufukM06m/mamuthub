import React, { useState } from 'react';
import { X, Building2, Search, Check, FileText, CheckSquare, Square, Folder } from 'lucide-react';
import { Client, Presentation } from '../types';

interface AssignPresentationsModalProps {
  client: Client;
  presentations: Presentation[];
  onClose: () => void;
  onSaveAssignments: (clientId: string, selectedPresentationIds: string[]) => void;
}

export const AssignPresentationsModal: React.FC<AssignPresentationsModalProps> = ({
  client,
  presentations,
  onClose,
  onSaveAssignments,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    presentations.filter((p) => p.clientId === client.id).map((p) => p.id)
  );
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');

  // Categories list for filter
  const categoriesList = Array.from(new Set(presentations.map((p) => p.category)));

  const filtered = presentations.filter((p) => {
    if (selectedCat !== 'ALL' && p.category !== selectedCat) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.code.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filtered.map((f) => f.id);
    const allSelected = filteredIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds(selectedIds.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds(Array.from(new Set([...selectedIds, ...filteredIds])));
    }
  };

  const handleSave = () => {
    onSaveAssignments(client.id, selectedIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#121929] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-[#0d1424] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
              <Building2 className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">Müşteriye Sunum Ata</h3>
              <p className="text-[11px] sm:text-xs text-blue-400 font-semibold truncate">{client.companyName} ({client.contactPerson})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex flex-col sm:flex-row gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sunum kodu veya adı ara..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Tüm Kategoriler</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              onClick={handleSelectAllFiltered}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 rounded-lg whitespace-nowrap"
            >
              Tümünü Seç / Kaldır
            </button>
          </div>
        </div>

        {/* Presentations List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">Arama kriterlerinize uygun sunum bulunamadı.</p>
          ) : (
            filtered.map((pres) => {
              const isChecked = selectedIds.includes(pres.id);

              return (
                <div
                  key={pres.id}
                  onClick={() => handleToggle(pres.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-blue-600/15 border-blue-500/50 text-white'
                      : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className={`text-lg transition-colors ${
                        isChecked ? 'text-blue-400' : 'text-slate-600'
                      }`}
                    >
                      {isChecked ? <CheckSquare className="w-5 h-5 text-blue-400" /> : <Square className="w-5 h-5 text-slate-600" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs">{pres.code}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold uppercase">
                          {pres.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{pres.title}</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500 shrink-0">
                    {pres.pageCount || 1} sayfa
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#0d1424] flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400 font-semibold">
            {selectedIds.length} sunum seçildi
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Atamaları Kaydet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
