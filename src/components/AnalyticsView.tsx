import React, { useState } from 'react';
import { 
  BarChart3, 
  Clock, 
  Eye, 
  CheckCircle, 
  TrendingUp, 
  Building2, 
  FileText, 
  Search, 
  Calendar, 
  Monitor, 
  Smartphone, 
  Tablet, 
  MapPin, 
  Download,
  Filter
} from 'lucide-react';
import { ViewAnalyticsLog, Presentation, Client } from '../types';

interface AnalyticsViewProps {
  analyticsLogs: ViewAnalyticsLog[];
  presentations: Presentation[];
  clients: Client[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  analyticsLogs,
  presentations,
  clients,
}) => {
  const [selectedPresentationId, setSelectedPresentationId] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter logs
  const filteredLogs = analyticsLogs.filter((log) => {
    const matchesPres = selectedPresentationId === 'all' || log.presentationId === selectedPresentationId;
    const matchesClient = selectedClientId === 'all' || log.clientId === selectedClientId;
    const matchesSearch = 
      log.presentationTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.clientName && log.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      log.device.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesPres && matchesClient && matchesSearch;
  });

  // KPI Calculations
  const totalViews = filteredLogs.length;
  const totalSeconds = filteredLogs.reduce((acc, curr) => acc + curr.durationSeconds, 0);
  const avgDurationMinutes = totalViews > 0 ? (totalSeconds / totalViews / 60).toFixed(1) : '0';
  
  const avgCompletionRate = totalViews > 0 
    ? Math.round((filteredLogs.reduce((acc, curr) => acc + (curr.completedPages / curr.totalPages), 0) / totalViews) * 100)
    : 0;

  // Most viewed presentation
  const presViewCounts: Record<string, number> = {};
  filteredLogs.forEach(log => {
    presViewCounts[log.presentationTitle] = (presViewCounts[log.presentationTitle] || 0) + 1;
  });

  let topPresentation = 'Henüz veri yok';
  let topCount = 0;
  Object.entries(presViewCounts).forEach(([title, count]) => {
    if (count > topCount) {
      topCount = count;
      topPresentation = title;
    }
  });

  const getDeviceIcon = (deviceStr: string) => {
    if (deviceStr.includes('Mobil')) return <Smartphone className="w-3.5 h-3.5 text-emerald-400" />;
    if (deviceStr.includes('Tablet')) return <Tablet className="w-3.5 h-3.5 text-amber-400" />;
    return <Monitor className="w-3.5 h-3.5 text-blue-400" />;
  };

  return (
    <div className="space-y-6 select-none">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0d1424] p-5 rounded-2xl border border-slate-800/80 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">Müşteri Sunum İzleme & Analitik</h1>
            <p className="text-xs text-slate-400">
              Müşterilerinizin sunumları kaç kez okuduğunu, ne kadar süre geçirdiğini ve sayfa tamamlama oranlarını takip edin.
            </p>
          </div>
        </div>

        <button
          onClick={() => alert('Analitik verileri CSV formatında dışa aktarıldı.')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors shrink-0"
        >
          <Download className="w-4 h-4 text-blue-400" />
          <span>Raporu İndir (CSV)</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Views */}
        <div className="bg-[#0d1424] border border-slate-800/80 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Toplam Okunma</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{totalViews}</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> %24 Artış
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Müşteri portallarındaki oturumlar</p>
        </div>

        {/* Avg Duration */}
        <div className="bg-[#0d1424] border border-slate-800/80 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ort. Okuma Süresi</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white">{avgDurationMinutes}</span>
            <span className="text-xs font-semibold text-amber-400">Dakika</span>
          </div>
          <p className="text-[11px] text-slate-500">Oturum başına harcanan süre</p>
        </div>

        {/* Completion Rate */}
        <div className="bg-[#0d1424] border border-slate-800/80 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Slayt Tamamlama</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-400">%{avgCompletionRate}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
              style={{ width: `${avgCompletionRate}%` }} 
            />
          </div>
        </div>

        {/* Top Presentation */}
        <div className="bg-[#0d1424] border border-slate-800/80 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">En Çok İlgi Gören</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs font-bold text-white line-clamp-1">{topPresentation}</p>
          <span className="text-[11px] text-purple-300 font-semibold">{topCount} farklı müşteri inceledi</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0d1424] p-3.5 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sunum, müşteri veya cihaz ara..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {/* Presentation Filter */}
          <select
            value={selectedPresentationId}
            onChange={(e) => setSelectedPresentationId(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Tüm Sunumlar</option>
            {presentations.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>

          {/* Client Filter */}
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Tüm Müşteriler</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.companyName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Analytics Activity Table */}
      <div className="bg-[#0d1424] border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Müşteri İnceleme Günlüğü ({filteredLogs.length})</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0f1c] border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-3.5">Müşteri / Kurum</th>
                <th className="p-3.5">İncelenen Sunum</th>
                <th className="p-3.5">Okuma Süresi</th>
                <th className="p-3.5">Okunan Sayfa</th>
                <th className="p-3.5">Cihaz & Konum</th>
                <th className="p-3.5">Tarih / Saat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Seçilen filtrelere uygun izleme kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const minutes = Math.floor(log.durationSeconds / 60);
                  const seconds = log.durationSeconds % 60;
                  const completionPct = Math.round((log.completedPages / log.totalPages) * 100);

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Client */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="font-bold text-white">{log.clientName || 'Genel Bağlantı'}</span>
                        </div>
                      </td>

                      {/* Presentation Title */}
                      <td className="p-3.5 max-w-[240px]">
                        <p className="font-semibold text-slate-200 truncate">{log.presentationTitle}</p>
                      </td>

                      {/* Duration */}
                      <td className="p-3.5 font-mono text-amber-300 font-semibold">
                        {minutes > 0 ? `${minutes} dk ` : ''}{seconds} sn
                      </td>

                      {/* Completion Progress */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white font-bold">{log.completedPages}/{log.totalPages}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            completionPct === 100 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            %{completionPct}
                          </span>
                        </div>
                      </td>

                      {/* Device & Location */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                            {getDeviceIcon(log.device)}
                            <span className="truncate max-w-[160px]">{log.device}</span>
                          </div>
                          {log.location && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <MapPin className="w-3 h-3" />
                              <span>{log.location}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">
                        {log.viewedAt}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
