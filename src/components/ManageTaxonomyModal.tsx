import React, { useState } from 'react';
import { X, Briefcase, Users, Plus, Edit2, Trash2, Check, AlertCircle } from 'lucide-react';
import { Presentation } from '../types';

interface ManageTaxonomyModalProps {
  allFields: string[];
  allTargetAudiences: string[];
  presentations: Presentation[];
  onClose: () => void;
  onAddField: (field: string) => void;
  onEditField: (oldName: string, newName: string) => void;
  onDeleteField: (field: string) => void;
  onAddTargetAudience: (audience: string) => void;
  onEditTargetAudience: (oldName: string, newName: string) => void;
  onDeleteTargetAudience: (audience: string) => void;
}

export const ManageTaxonomyModal: React.FC<ManageTaxonomyModalProps> = ({
  allFields,
  allTargetAudiences,
  presentations,
  onClose,
  onAddField,
  onEditField,
  onDeleteField,
  onAddTargetAudience,
  onEditTargetAudience,
  onDeleteTargetAudience,
}) => {
  const [activeTab, setActiveTab] = useState<'fields' | 'audiences'>('fields');
  
  // New input states
  const [newFieldInput, setNewFieldInput] = useState('');
  const [newAudienceInput, setNewAudienceInput] = useState('');

  // Editing states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingFieldValue, setEditingFieldValue] = useState('');

  const [editingAudience, setEditingAudience] = useState<string | null>(null);
  const [editingAudienceValue, setEditingAudienceValue] = useState('');

  // Count helpers
  const getFieldUsageCount = (field: string) =>
    presentations.filter((p) => p.fields?.includes(field)).length;

  const getAudienceUsageCount = (audience: string) =>
    presentations.filter((p) => p.targetAudiences?.includes(audience)).length;

  // Add Field Handler
  const handleCreateField = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFieldInput.trim();
    if (!trimmed) return;
    if (allFields.includes(trimmed)) {
      alert('Bu alan zaten mevcut.');
      return;
    }
    onAddField(trimmed);
    setNewFieldInput('');
  };

  // Add Audience Handler
  const handleCreateAudience = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newAudienceInput.trim();
    if (!trimmed) return;
    if (allTargetAudiences.includes(trimmed)) {
      alert('Bu hedef kitle zaten mevcut.');
      return;
    }
    onAddTargetAudience(trimmed);
    setNewAudienceInput('');
  };

  // Save Field Edit
  const handleSaveFieldEdit = (oldName: string) => {
    const trimmed = editingFieldValue.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingField(null);
      return;
    }
    if (allFields.includes(trimmed)) {
      alert('Bu isimde bir alan zaten var.');
      return;
    }
    onEditField(oldName, trimmed);
    setEditingField(null);
  };

  // Save Audience Edit
  const handleSaveAudienceEdit = (oldName: string) => {
    const trimmed = editingAudienceValue.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingAudience(null);
      return;
    }
    if (allTargetAudiences.includes(trimmed)) {
      alert('Bu isimde bir hedef kitle zaten var.');
      return;
    }
    onEditTargetAudience(oldName, trimmed);
    setEditingAudience(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#0d1424] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0a0f1c]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Briefcase className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">Alan ve Kitle Yönetimi</h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">Sektör ve kitle tanımlarını düzenleyin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-slate-800 bg-[#121929] px-3 sm:px-5 pt-3 gap-1 sm:gap-3 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('fields')}
            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'fields'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Alanlar / Sektörler ({allFields.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audiences')}
            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'audiences'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Hedef Kitleler ({allTargetAudiences.length})</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: ALANLAR / SEKTÖRLER */}
          {activeTab === 'fields' && (
            <div className="space-y-4">
              {/* Add New Field Form */}
              <form onSubmit={handleCreateField} className="flex gap-2">
                <input
                  type="text"
                  value={newFieldInput}
                  onChange={(e) => setNewFieldInput(e.target.value)}
                  placeholder="Yeni Alan / Sektör adı girin (ör. Enerji & Madencilik)..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Alan Ekle</span>
                </button>
              </form>

              {/* List of Fields */}
              <div className="space-y-2">
                {allFields.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/40 rounded-xl border border-slate-800">
                    Henüz tanımlı alan bulunmuyor.
                  </div>
                ) : (
                  allFields.map((field) => {
                    const usageCount = getFieldUsageCount(field);
                    const isEditing = editingField === field;

                    return (
                      <div
                        key={field}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all"
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <input
                              type="text"
                              value={editingFieldValue}
                              onChange={(e) => setEditingFieldValue(e.target.value)}
                              className="flex-1 bg-slate-950 border border-blue-500 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveFieldEdit(field)}
                              className="p-1.5 rounded bg-blue-600 text-white hover:bg-blue-500"
                              title="Kaydet"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingField(null)}
                              className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white"
                              title="İptal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <Briefcase className="w-4 h-4 text-blue-400 shrink-0" />
                            <span className="text-xs font-semibold text-slate-200">{field}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-900/40 border border-blue-500/20 text-blue-300">
                              {usageCount} sunum
                            </span>
                          </div>
                        )}

                        {!isEditing && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingField(field);
                                setEditingFieldValue(field);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                              title="Düzenle"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `"${field}" alanını silmek istediğinize emin misiniz? (${usageCount} sunum etkilenecek)`
                                  )
                                ) {
                                  onDeleteField(field);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: HEDEF KİTLELER */}
          {activeTab === 'audiences' && (
            <div className="space-y-4">
              {/* Add New Audience Form */}
              <form onSubmit={handleCreateAudience} className="flex gap-2">
                <input
                  type="text"
                  value={newAudienceInput}
                  onChange={(e) => setNewAudienceInput(e.target.value)}
                  placeholder="Yeni Hedef Kitle adı girin (ör. Yazılım Mimarları)..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Kitle Ekle</span>
                </button>
              </form>

              {/* List of Target Audiences */}
              <div className="space-y-2">
                {allTargetAudiences.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/40 rounded-xl border border-slate-800">
                    Henüz tanımlı hedef kitle bulunmuyor.
                  </div>
                ) : (
                  allTargetAudiences.map((audience) => {
                    const usageCount = getAudienceUsageCount(audience);
                    const isEditing = editingAudience === audience;

                    return (
                      <div
                        key={audience}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all"
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <input
                              type="text"
                              value={editingAudienceValue}
                              onChange={(e) => setEditingAudienceValue(e.target.value)}
                              className="flex-1 bg-slate-950 border border-amber-500 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveAudienceEdit(audience)}
                              className="p-1.5 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                              title="Kaydet"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingAudience(null)}
                              className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white"
                              title="İptal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <Users className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="text-xs font-semibold text-slate-200">{audience}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-900/40 border border-amber-500/20 text-amber-300">
                              {usageCount} sunum
                            </span>
                          </div>
                        )}

                        {!isEditing && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingAudience(audience);
                                setEditingAudienceValue(audience);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                              title="Düzenle"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `"${audience}" hedef kitlesini silmek istediğinize emin misiniz? (${usageCount} sunum etkilenecek)`
                                  )
                                ) {
                                  onDeleteTargetAudience(audience);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0a0f1c] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <AlertCircle className="w-4 h-4 text-blue-400" />
            <span>Burada yapılan değişiklikler tüm filtrelerde ve sunum künyelerinde anında güncellenir.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
