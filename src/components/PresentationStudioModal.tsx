import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Download, 
  Play, 
  ChevronLeft, 
  Save, 
  ExternalLink,
  Upload,
  FileText,
  Building,
  Tag,
  Clock,
  Layers,
  Folder,
  Briefcase,
  Users,
  Plus
} from 'lucide-react';
import { Presentation, Category, Client } from '../types';
import { DEFAULT_FIELDS, DEFAULT_TARGET_AUDIENCES } from '../data/mockData';
import { generatePresentationPDF, createPresentationPdfDataUrl, openPdfInNewTab } from '../utils/pdfExport';
import { PdfViewer } from './PdfViewer';
import { PresenterModeModal } from './PresenterModeModal';

interface PresentationStudioModalProps {
  presentation: Presentation;
  categories: Category[];
  clients: Client[];
  allFields?: string[];
  allTargetAudiences?: string[];
  onClose: () => void;
  onSave: (updated: Presentation) => void;
  onAddField?: (field: string) => void;
  onAddTargetAudience?: (audience: string) => void;
}

export const PresentationStudioModal: React.FC<PresentationStudioModalProps> = ({
  presentation: initialPresentation,
  categories,
  clients,
  allFields = DEFAULT_FIELDS,
  allTargetAudiences = DEFAULT_TARGET_AUDIENCES,
  onClose,
  onSave,
  onAddField,
  onAddTargetAudience,
}) => {
  const [presentation, setPresentation] = useState<Presentation>(initialPresentation);
  const [isPresenting, setIsPresenting] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [newCustomField, setNewCustomField] = useState<string>('');
  const [newCustomAudience, setNewCustomAudience] = useState<string>('');

  // Combined available lists
  const availableFieldsList = useMemo(() => {
    return Array.from(new Set([...allFields, ...(presentation.fields || [])])).sort();
  }, [allFields, presentation.fields]);

  const availableAudiencesList = useMemo(() => {
    return Array.from(new Set([...allTargetAudiences, ...(presentation.targetAudiences || [])])).sort();
  }, [allTargetAudiences, presentation.targetAudiences]);

  // Compute active PDF URL (or generate standard fallback PDF if needed)
  const activePdfUrl = useMemo(() => {
    if (presentation.pdfUrl) {
      return presentation.pdfUrl;
    }
    return createPresentationPdfDataUrl(presentation);
  }, [presentation]);

  useEffect(() => {
    if (!isPresenting) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPresenting(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting]);

  const handleDownloadPDF = async () => {
    try {
      setIsExportingPDF(true);
      await generatePresentationPDF(presentation);
    } catch (err) {
      console.error('PDF indirme hatası:', err);
      alert('PDF indirilirken hata oluştu.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleReplacePdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Lütfen geçerli bir PDF dosyası seçin.');
      return;
    }

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setPresentation((prev) => ({
          ...prev,
          pdfUrl: ev.target!.result as string,
          pdfFileName: file.name,
          pdfFileSize: `${sizeInMB} MB`,
          updatedAt: new Date().toISOString().split('T')[0],
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAndClose = () => {
    onSave(presentation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col overflow-hidden">
      {/* Top Header Bar */}
      <div className="min-h-16 py-2 px-3 sm:px-6 bg-[#0d1424] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title="Geri Dön"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="truncate min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-white font-mono truncate">{presentation.code}</h2>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-blue-600/30 text-blue-400 border border-blue-500/40 font-semibold shrink-0 truncate max-w-[120px]">
                {presentation.category}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">{presentation.title}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Yeni Sekmede Aç */}
          <button
            onClick={() => openPdfInNewTab(activePdfUrl, presentation.pdfFileName)}
            title="Yeni Sekmede Aç"
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="hidden md:inline">Yeni Sekmede Aç</span>
          </button>

          {/* Sunumu Başlat / Fullscreen Present */}
          <button
            onClick={() => setIsPresenting(true)}
            title="Sunumu Başlat"
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/30 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Sunumu Başlat</span>
          </button>

          {/* PDF İndir */}
          <button
            onClick={handleDownloadPDF}
            disabled={isExportingPDF}
            title="PDF İndir"
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">İndir</span>
          </button>

          {/* Kaydet & Kapat */}
          <button
            onClick={handleSaveAndClose}
            title="Kaydet ve Kapat"
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition-all"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Kaydet</span>
          </button>
        </div>
      </div>

      {/* Studio Body: PDF Viewer + Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden min-h-0">
        {/* Main PDF Viewer Frame */}
        <div className="flex-1 bg-slate-950 p-3 sm:p-6 flex flex-col justify-center items-center relative min-h-[380px] lg:min-h-0 overflow-hidden">
          <PdfViewer
            pdfUrl={activePdfUrl}
            title={presentation.title}
            fileName={presentation.pdfFileName || `${presentation.code}.pdf`}
            extractedImages={presentation.extractedImages}
          />
        </div>

        {/* Right Sidebar: Details & Metadata Editor */}
        <div className="w-full lg:w-80 bg-[#0d1424] border-t lg:border-t-0 lg:border-l border-slate-800/80 p-4 sm:p-5 flex flex-col justify-between shrink-0 space-y-6 overflow-y-auto max-h-full min-h-0">
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>SUNUM DETAYLARI</span>
              </h3>
            </div>

            {/* Code */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Sunum Kodu</label>
              <input
                type="text"
                value={presentation.code}
                onChange={(e) => setPresentation({ ...presentation, code: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Sunum Adı</label>
              <input
                type="text"
                value={presentation.title}
                onChange={(e) => setPresentation({ ...presentation, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Kategori</label>
              <select
                value={presentation.category}
                onChange={(e) => setPresentation({ ...presentation, category: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Page Count */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Sayfa Sayısı</label>
              <input
                type="number"
                value={presentation.pageCount || 1}
                onChange={(e) =>
                  setPresentation({ ...presentation, pageCount: parseInt(e.target.value) || 1 })
                }
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Açıklama</label>
              <textarea
                rows={3}
                value={presentation.description || ''}
                onChange={(e) => setPresentation({ ...presentation, description: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Alan / Sektör (Fields) Editor */}
            <div className="pt-2 space-y-2 border-t border-slate-800">
              <label className="text-xs font-bold text-blue-400 flex items-center justify-between uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Alan / Sektör</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {presentation.fields?.length || 0} Alan
                </span>
              </label>

              <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto p-1.5 bg-slate-900/60 rounded-xl border border-slate-800">
                {availableFieldsList.map((field) => {
                  const isSelected = presentation.fields?.includes(field);
                  return (
                    <button
                      key={field}
                      type="button"
                      onClick={() => {
                        const current = presentation.fields || [];
                        const updated = isSelected
                          ? current.filter((f) => f !== field)
                          : [...current, field];
                        setPresentation({ ...presentation, fields: updated });
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-all ${
                        isSelected
                          ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{field}
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Field */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newCustomField}
                  onChange={(e) => setNewCustomField(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = newCustomField.trim();
                      if (val) {
                        const current = presentation.fields || [];
                        if (!current.includes(val)) {
                          setPresentation({ ...presentation, fields: [...current, val] });
                        }
                        if (onAddField) onAddField(val);
                        setNewCustomField('');
                      }
                    }
                  }}
                  placeholder="Özel alan yaz (Enter)..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = newCustomField.trim();
                    if (val) {
                      const current = presentation.fields || [];
                      if (!current.includes(val)) {
                        setPresentation({ ...presentation, fields: [...current, val] });
                      }
                      if (onAddField) onAddField(val);
                      setNewCustomField('');
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-semibold hover:bg-blue-600/30 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ekle</span>
                </button>
              </div>
            </div>

            {/* Hedef Kitle (Target Audience) Editor */}
            <div className="pt-2 space-y-2 border-t border-slate-800">
              <label className="text-xs font-bold text-amber-400 flex items-center justify-between uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Hedef Kitle</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {presentation.targetAudiences?.length || 0} Kitle
                </span>
              </label>

              <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto p-1.5 bg-slate-900/60 rounded-xl border border-slate-800">
                {availableAudiencesList.map((audience) => {
                  const isSelected = presentation.targetAudiences?.includes(audience);
                  return (
                    <button
                      key={audience}
                      type="button"
                      onClick={() => {
                        const current = presentation.targetAudiences || [];
                        const updated = isSelected
                          ? current.filter((a) => a !== audience)
                          : [...current, audience];
                        setPresentation({ ...presentation, targetAudiences: updated });
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{audience}
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Audience */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newCustomAudience}
                  onChange={(e) => setNewCustomAudience(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = newCustomAudience.trim();
                      if (val) {
                        const current = presentation.targetAudiences || [];
                        if (!current.includes(val)) {
                          setPresentation({ ...presentation, targetAudiences: [...current, val] });
                        }
                        if (onAddTargetAudience) onAddTargetAudience(val);
                        setNewCustomAudience('');
                      }
                    }
                  }}
                  placeholder="Özel kitle yaz (Enter)..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = newCustomAudience.trim();
                    if (val) {
                      const current = presentation.targetAudiences || [];
                      if (!current.includes(val)) {
                        setPresentation({ ...presentation, targetAudiences: [...current, val] });
                      }
                      if (onAddTargetAudience) onAddTargetAudience(val);
                      setNewCustomAudience('');
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/30 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ekle</span>
                </button>
              </div>
            </div>
          </div>

          {/* Replace PDF File Section */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <span className="text-[11px] font-semibold text-slate-400 block">
              PDF Dosyasını Güncelle
            </span>

            <label className="flex items-center justify-center gap-2 p-3 rounded-lg bg-slate-900 border border-slate-700 hover:border-blue-500 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer transition-all">
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Yeni PDF Yükle</span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleReplacePdf}
                className="hidden"
              />
            </label>

            {presentation.pdfFileName && (
              <p className="text-[11px] text-slate-500 truncate">
                Dosya: {presentation.pdfFileName} ({presentation.pdfFileSize || 'N/A'})
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Live Presentation Mode */}
      {isPresenting && (
        <PresenterModeModal
          presentation={presentation}
          onClose={() => setIsPresenting(false)}
        />
      )}
    </div>
  );
};
