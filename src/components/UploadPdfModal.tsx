import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Sparkles, Folder, Loader2, Briefcase, Users, Plus } from 'lucide-react';
import { Presentation, Category } from '../types';
import { DEFAULT_FIELDS, DEFAULT_TARGET_AUDIENCES } from '../data/mockData';
import { createPresentationPdfDataUrl } from '../utils/pdfExport';
import { convertPdfToImages } from '../utils/pdfRenderer';

interface UploadPdfModalProps {
  categories: Category[];
  allFields?: string[];
  allTargetAudiences?: string[];
  onClose: () => void;
  onAddPresentation: (newPres: Presentation) => void;
  onAddField?: (field: string) => void;
  onAddTargetAudience?: (audience: string) => void;
}

export const UploadPdfModal: React.FC<UploadPdfModalProps> = ({
  categories,
  allFields = DEFAULT_FIELDS,
  allTargetAudiences = DEFAULT_TARGET_AUDIENCES,
  onClose,
  onAddPresentation,
  onAddField,
  onAddTargetAudience,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [isProcessingPdf, setIsProcessingPdf] = useState<boolean>(false);

  const [code, setCode] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>(categories[1]?.name || categories[0]?.name || 'GENEL SUNUMLAR');
  const [pageCount, setPageCount] = useState<number>(1);
  const [isAutoPageCount, setIsAutoPageCount] = useState<boolean>(false);
  const [tagsInput, setTagsInput] = useState<string>('Kurumsal, Sunum, PDF');
  const [selectedFields, setSelectedFields] = useState<string[]>(['Eğitim & İK']);
  const [selectedTargetAudiences, setSelectedTargetAudiences] = useState<string[]>(['C-Level / Üst Düzey Yönetim']);
  const [customField, setCustomField] = useState<string>('');
  const [customAudience, setCustomAudience] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(
    'https://images.unsplash.com/photo-1542744094-3a31b272c490?auto=format&fit=crop&w=800&q=80'
  );

  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Lütfen sadece .pdf uzantılı bir sunum dosyası seçin.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setIsProcessingPdf(true);

    // Format file size
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    setFileSizeStr(`${sizeInMB} MB`);

    // Auto-fill code and title from filename
    const nameWithoutExt = file.name.replace(/\.pdf$/i, '');
    const formattedCode = nameWithoutExt.toUpperCase().replace(/\s+/g, '_');
    
    if (!code) setCode(formattedCode);
    if (!title) setTitle(nameWithoutExt.replace(/[-_]/g, ' '));

    // Convert PDF to Base64 Data URL for persistent storage
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setPdfDataUrl(dataUrl);

        try {
          // Process PDF pages to images in Ultra-HD 3.0 scale
          const result = await convertPdfToImages(file, 50, 3.0);
          if (result.images && result.images.length > 0) {
            setExtractedImages(result.images);
            setPageCount(result.pageCount);
            setIsAutoPageCount(true);
            setThumbnailUrl(result.images[0]); // Use page 1 as cover thumbnail!
          }
        } catch (err) {
          console.warn('PDF slayt dönüştürme hatası, varsayılan PDF modunda devam ediliyor:', err);
        } finally {
          setIsProcessingPdf(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !title.trim()) {
      setErrorMessage('Lütfen sunum kodu ve başlığını girin.');
      return;
    }

    let finalPdfUrl = pdfDataUrl || undefined;
    if (!finalPdfUrl) {
      finalPdfUrl = createPresentationPdfDataUrl({
        id: 'tmp',
        code,
        title,
        description: description || 'MAMUTHUB Yüklenen PDF Sunumu',
        category,
        pageCount,
        updatedAt: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString().split('T')[0],
        thumbnailUrl,
        isFavorite: false,
        slides: [],
        tags: tagsInput.split(',').map((t) => t.trim()),
      });
    }

    const newPres: Presentation = {
      id: `pres-${Date.now()}`,
      code: code.trim(),
      title: title.trim(),
      description: description.trim() || 'MAMUTHUB Yönetim Paneline Yüklenmiş PDF Sunumu',
      category,
      pageCount: Number(pageCount) || 1,
      updatedAt: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      thumbnailUrl: thumbnailUrl.trim(),
      pdfUrl: finalPdfUrl,
      pdfFileName: selectedFile ? selectedFile.name : `${code}.pdf`,
      pdfFileSize: fileSizeStr || '1.8 MB',
      isFavorite: false,
      extractedImages: extractedImages.length > 0 ? extractedImages : undefined,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      fields: selectedFields,
      targetAudiences: selectedTargetAudiences,
      slides: [
        {
          id: 'slide-1',
          title: title.trim(),
          subtitle: code.trim(),
          content: description.trim() || 'Yüklenen PDF Sunumu',
          layout: 'title',
        },
      ],
    };

    onAddPresentation(newPres);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#121929] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-[#0d1424] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
              <Upload className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight truncate">PDF Sunumu Yükle</h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">PDF dosyanızı panelinize ekleyin.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* PDF File Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
              isDragOver
                ? 'border-blue-500 bg-blue-500/10'
                : selectedFile
                ? 'border-emerald-500/60 bg-emerald-500/5'
                : 'border-slate-700 hover:border-blue-500/60 bg-slate-900/60'
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />

            {selectedFile ? (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-white">{selectedFile.name}</p>
                <p className="text-xs text-slate-400">
                  {fileSizeStr} &bull; PDF Belgesi Hazır
                </p>
                <span className="inline-block mt-1 text-[11px] text-blue-400 underline font-semibold">
                  Farklı PDF Dosyası Seç
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-white">
                  PDF Sunum Dosyanızı Sürükleyip Bırakın
                </p>
                <p className="text-xs text-slate-400">veya bilgisayarınızdan `.pdf` seçmek için tıklayın</p>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sunum Kodu */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Sunum Kodu <span className="text-blue-400">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ör. PS-008_AKADEMILER_PANEL"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Sunum Adı */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Sunum Adı / Başlık <span className="text-blue-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ör. Akademiler Kurumsal Gelişim Sunumu"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Kategori */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sayfa Sayısı (Otomatik Hesaplanır) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Sayfa Sayısı</label>
                {isAutoPageCount && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    &check; PDF'ten Otomatik Tespit Edildi
                  </span>
                )}
              </div>
              <input
                type="number"
                min={1}
                value={pageCount}
                onChange={(e) => {
                  setPageCount(parseInt(e.target.value) || 1);
                  setIsAutoPageCount(false);
                }}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Etiketler */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Etiketler (Virgülle ayırın)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="ör. Akademi, Teklif, 2026"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Alan / Sektör Seçimi (Multi-select) */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Alan / Sektör Tanımla (Çoklu Seçilebilir)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">{selectedFields.length} alan seçili</span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {Array.from(new Set([...allFields, ...selectedFields])).map((field) => {
                const isSelected = selectedFields.includes(field);
                return (
                  <button
                    key={field}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedFields(selectedFields.filter((f) => f !== field));
                      } else {
                        setSelectedFields([...selectedFields, field]);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-semibold shadow-sm'
                        : 'bg-slate-950/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{field}
                  </button>
                );
              })}
            </div>

            {/* Custom Field Add Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customField}
                onChange={(e) => setCustomField(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = customField.trim();
                    if (val) {
                      if (!selectedFields.includes(val)) {
                        setSelectedFields([...selectedFields, val]);
                      }
                      if (onAddField) onAddField(val);
                      setCustomField('');
                    }
                  }
                }}
                placeholder="Özel alan ekle (Enter)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  const val = customField.trim();
                  if (val) {
                    if (!selectedFields.includes(val)) {
                      setSelectedFields([...selectedFields, val]);
                    }
                    if (onAddField) onAddField(val);
                    setCustomField('');
                  }
                }}
                className="px-3 py-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ekle</span>
              </button>
            </div>
          </div>

          {/* Hedef Kitle Seçimi (Multi-select) */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" />
                <span>Hedef Kitle Tanımla (Çoklu Seçilebilir)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">{selectedTargetAudiences.length} kitle seçili</span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {Array.from(new Set([...allTargetAudiences, ...selectedTargetAudiences])).map((audience) => {
                const isSelected = selectedTargetAudiences.includes(audience);
                return (
                  <button
                    key={audience}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTargetAudiences(selectedTargetAudiences.filter((a) => a !== audience));
                      } else {
                        setSelectedTargetAudiences([...selectedTargetAudiences, audience]);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold shadow-sm'
                        : 'bg-slate-950/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{audience}
                  </button>
                );
              })}
            </div>

            {/* Custom Audience Add Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customAudience}
                onChange={(e) => setCustomAudience(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = customAudience.trim();
                    if (val) {
                      if (!selectedTargetAudiences.includes(val)) {
                        setSelectedTargetAudiences([...selectedTargetAudiences, val]);
                      }
                      if (onAddTargetAudience) onAddTargetAudience(val);
                      setCustomAudience('');
                    }
                  }
                }}
                placeholder="Özel hedef kitle ekle (Enter)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => {
                  const val = customAudience.trim();
                  if (val) {
                    if (!selectedTargetAudiences.includes(val)) {
                      setSelectedTargetAudiences([...selectedTargetAudiences, val]);
                    }
                    if (onAddTargetAudience) onAddTargetAudience(val);
                    setCustomAudience('');
                  }
                }}
                className="px-3 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ekle</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Açıklama / Özet</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sunum hakkında kısa özet notlar..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>PDF Sunumu Kaydet & Ekle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
