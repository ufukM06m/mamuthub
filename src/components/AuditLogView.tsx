import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  User, 
  Clock, 
  Key, 
  FileText, 
  UserCheck, 
  AlertTriangle, 
  Download,
  Activity,
  Calendar
} from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogViewProps {
  auditLogs: AuditLog[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ auditLogs }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action.includes(actionFilter);

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('Giriş')) {
      return <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">Giriş Yapıldı</span>;
    }
    if (action.includes('PDF') || action.includes('Sunum')) {
      return <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">Sunum İşlemi</span>;
    }
    if (action.includes('Şifre')) {
      return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">Güvenlik / Şifre</span>;
    }
    return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold">{action}</span>;
  };

  return (
    <div className="space-y-6 select-none">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0d1424] p-5 rounded-2xl border border-slate-800/80 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">Sistem İşlem & Güvenlik Logları (Audit Log)</h1>
            <p className="text-xs text-slate-400">
              Paneldaki tüm kullanıcı hareketlerini, erişim kayıtlarını ve içerik değişikliklerini anlık takip edin.
            </p>
          </div>
        </div>

        <button
          onClick={() => alert('Güvenlik log raporu başarıyla indirildi.')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors shrink-0"
        >
          <Download className="w-4 h-4 text-purple-400" />
          <span>Log Raporu İndir</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kullanıcı, eylem veya detay ara..."
            className="w-full pl-9 pr-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-purple-500 w-full sm:w-auto"
        >
          <option value="all">Tüm İşlem Türleri</option>
          <option value="Giriş">Kullanıcı Girişleri</option>
          <option value="Sunum">Sunum Atama / Yükleme</option>
          <option value="Şifre">Güvenlik İşlemleri</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#0d1424] border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Kayıt Geçmişi ({filteredLogs.length})</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0f1c] border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-3.5">Kullanıcı</th>
                <th className="p-3.5">Rol</th>
                <th className="p-3.5">İşlem</th>
                <th className="p-3.5">Açıklama / Detay</th>
                <th className="p-3.5">IP Adresi</th>
                <th className="p-3.5">Tarih / Saat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Sistem işlem kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-[10px]">
                          {log.userName.charAt(0)}
                        </div>
                        <span className="font-bold text-white">{log.userName}</span>
                      </div>
                    </td>
                    <td className="p-3.5 uppercase font-mono text-[10px] text-slate-400 font-bold">
                      {log.userRole}
                    </td>
                    <td className="p-3.5">{getActionBadge(log.action)}</td>
                    <td className="p-3.5 text-slate-300 font-medium max-w-xs">{log.details}</td>
                    <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                      {log.timestamp}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
