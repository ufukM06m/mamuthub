import React, { useState } from 'react';
import { Upload, X, Check, FileJson, AlertCircle, Download, Trash2, Settings } from 'lucide-react';
import { Presentation, Category, Client } from '../types';

interface BackupModalProps {
  onClose: () => void;
  onRestoreData: (restored: {
    presentations?: Presentation[];
    categories?: Category[];
    clients?: Client[];
  }) => void;
  onExportData?: () => void;
  onPurgeTestData?: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  onClose,
  onRestoreData,
  onExportData,
  onPurgeTestData,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Geçersiz yedekleme dosyası formatı.');
        }

        onRestoreData(parsed);
        setSuccessMsg(true);
        setTimeout(() => {
          onClose();
        }, 1200);
      } catch (err) {
        setErrorMsg('Dosya ayrıştırılamadı. Geçerli bir MAMUTHUB .json yedeği yükleyin.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#121929] border border-slate-800 rounded-xl p-4 sm:p-6 w-full max-w-lg space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            <span>Sistem Ayarları & Yedekleme Yönetimi</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action 1: Export Backup */}
        {onExportData && (
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Sistem Yedeğini İndir</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Mevcut tüm sunumları, kategorileri ve verileri `.json` olarak bilgisayarınıza indirin.
              </p>
            </div>
            <button
              type="button"
              onClick={onExportData}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shrink-0 transition-all shadow-md shadow-emerald-600/20"
            >
              Yedeği İndir
            </button>
          </div>
        )}

        {/* Action 2: Import / Restore */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">Yedekleme Yükle & Geri Yükle</label>
          <div className="p-5 border-2 border-dashed border-slate-700/80 hover:border-blue-500/80 rounded-xl bg-slate-900/50 flex flex-col items-center justify-center text-center space-y-2 cursor-pointer relative transition-all">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Yedekleme dosyanızı buraya bırakın veya tıklayın</p>
              <p className="text-[11px] text-slate-400 mt-0.5">`.json` formatındaki sistem yedeğini yükleyin</p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Yedekleme başarıyla geri yüklendi!</span>
          </div>
        )}

        {/* Action 3: Danger Zone - Purge All Data */}
        {onPurgeTestData && (
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Tüm Sunum Verilerini Sıfırla (Sıfır Temiz Yükleme)</span>
                </p>
                <p className="text-[11px] text-rose-300/70 mt-1">
                  Veritabanı (Firestore), Bulut Depolama (Firebase Storage) ve Yerel Önbellekteki (IndexedDB) TÜM sunumları kalıcı olarak siler.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onPurgeTestData();
                  onClose();
                }}
                className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all border border-rose-500/40 shrink-0 shadow-lg shadow-rose-600/20"
              >
                Tüm Verileri Sil
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

