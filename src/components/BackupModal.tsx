import React, { useState } from 'react';
import { Upload, X, Check, FileJson, AlertCircle } from 'lucide-react';
import { Presentation, Category, Client } from '../types';

interface BackupModalProps {
  onClose: () => void;
  onRestoreData: (restored: {
    presentations?: Presentation[];
    categories?: Category[];
    clients?: Client[];
  }) => void;
  onPurgeTestData?: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ onClose, onRestoreData, onPurgeTestData }) => {
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

        if (!parsed || (typeof parsed !== 'object')) {
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
      <div className="bg-[#121929] border border-slate-800 rounded-xl p-4 sm:p-6 w-full max-w-md space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-500" />
            <span>Yedeği Yükle & Geri Yükle</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 border-2 border-dashed border-slate-700/80 hover:border-blue-500/80 rounded-xl bg-slate-900/50 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer relative transition-all">
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <FileJson className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Yedekleme dosyanızı buraya sürükleyin</p>
            <p className="text-[11px] text-slate-400 mt-1">veya bilgisayarınızdan `.json` seçin</p>
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

        {onPurgeTestData && (
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Veritabanındaki tüm test/örnek sunumları temizle</span>
            <button
              type="button"
              onClick={() => {
                onPurgeTestData();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold transition-all border border-red-500/30"
            >
              Test Verilerini Sil
            </button>
          </div>
        )}

        <div className="flex justify-end pt-2">
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
