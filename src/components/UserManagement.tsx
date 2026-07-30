import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  UserCog, 
  Eye, 
  Key, 
  Edit, 
  Trash2, 
  X, 
  CheckCircle2, 
  XCircle, 
  Building, 
  Lock, 
  Sparkles,
  Info,
  Activity
} from 'lucide-react';
import { User, UserRole, AuditLog } from '../types';
import { AuditLogView } from './AuditLogView';

interface UserManagementProps {
  users: User[];
  currentUser: User;
  auditLogs?: AuditLog[];
  onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteUser: (userId: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  currentUser,
  auditLogs = [],
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: UserRole;
    password?: string;
    department?: string;
    status: 'Aktif' | 'Pasif';
  }>({
    name: '',
    email: '',
    role: 'editor',
    password: '123',
    department: '',
    status: 'Aktif',
  });

  const [resetPassModalUser, setResetPassModalUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState<string>('123456');
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  // Filter logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Role counters
  const totalUsersCount = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const editorCount = users.filter((u) => u.role === 'editor').length;
  const viewerCount = users.filter((u) => u.role === 'viewer').length;

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'editor',
      password: '123',
      department: 'Yönetim',
      status: 'Aktif',
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      password: u.password || '123',
      department: u.department || '',
      status: u.status,
    });
    setIsAddEditModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        password: formData.password || editingUser.password,
        department: formData.department,
        status: formData.status,
      });
    } else {
      onAddUser({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        password: formData.password || '123',
        department: formData.department,
        status: formData.status,
      });
    }

    setIsAddEditModalOpen(false);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassModalUser || !newPassword) return;

    onUpdateUser({
      ...resetPassModalUser,
      password: newPassword,
    });

    setResetSuccess(true);
    setTimeout(() => {
      setResetPassModalUser(null);
      setResetSuccess(false);
    }, 1800);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Yönetici</span>
          </span>
        );
      case 'editor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
            <UserCog className="w-3.5 h-3.5 text-blue-400" />
            <span>Editör</span>
          </span>
        );
      case 'viewer':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>İzleyici</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Title & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0d1424] p-5 rounded-2xl border border-slate-800/80 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">Kullanıcı & Yetki Yönetimi</h1>
            <p className="text-xs text-slate-400">
              Yönetim paneline erişim yetkisi olan yöneticileri, editörleri ve işlem loglarını takip edin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'users'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Kullanıcılar ({totalUsersCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'audit'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>İşlem Logları ({auditLogs.length})</span>
            </button>
          </div>

          {activeTab === 'users' && currentUser.role === 'admin' && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Yeni Kullanıcı Ekle</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'audit' ? (
        <AuditLogView auditLogs={auditLogs} />
      ) : (
        <>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#0d1424] border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Toplam Kullanıcı</p>
            <p className="text-xl font-black text-white mt-0.5">{totalUsersCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#0d1424] border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Yöneticiler</p>
            <p className="text-xl font-black text-purple-400 mt-0.5">{adminCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-600/10 text-purple-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#0d1424] border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Editörler</p>
            <p className="text-xl font-black text-blue-400 mt-0.5">{editorCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center">
            <UserCog className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#0d1424] border border-slate-800/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">İzleyiciler</p>
            <p className="text-xl font-black text-slate-300 mt-0.5">{viewerCount}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Role Permission Guidance Note */}
      <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <div>
            <span className="font-bold text-white mr-2">Rol Yetki Seviyeleri:</span>
            <span className="text-slate-400">
              <strong className="text-purple-300">Yönetici</strong> (Tam Yetki),{' '}
              <strong className="text-blue-300">Editör</strong> (PDF & İçerik Yükleme / Atama),{' '}
              <strong className="text-slate-300">İzleyici</strong> (Sadece Görüntüleme & Sunum).
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="İsim, e-posta veya departman ara..."
            className="w-full pl-9 pr-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="all">Tüm Rollar</option>
            <option value="admin">Yöneticiler</option>
            <option value="editor">Editörler</option>
            <option value="viewer">İzleyiciler</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#0d1424] border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="Aktif">Aktif Hesaplar</option>
            <option value="Pasif">Pasif Hesaplar</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0d1424] border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0a0f1c] border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Kullanıcı Bilgisi</th>
                <th className="p-4">Departman</th>
                <th className="p-4">Rol / Yetki</th>
                <th className="p-4">Durum</th>
                <th className="p-4">Son Giriş</th>
                <th className="p-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Arama kriterlerine uygun kullanıcı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = currentUser.id === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name & Email */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">{u.name}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 text-[10px] font-mono font-bold">
                                  (SİZ)
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="p-4 text-slate-300 font-medium">
                        {u.department || 'Belirtilmedi'}
                      </td>

                      {/* Role */}
                      <td className="p-4">{getRoleBadge(u.role)}</td>

                      {/* Status */}
                      <td className="p-4">
                        <button
                          disabled={currentUser.role !== 'admin' || isSelf}
                          onClick={() =>
                            onUpdateUser({
                              ...u,
                              status: u.status === 'Aktif' ? 'Pasif' : 'Aktif',
                            })
                          }
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                            u.status === 'Aktif'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          } ${currentUser.role === 'admin' && !isSelf ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}`}
                        >
                          {u.status === 'Aktif' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          <span>{u.status}</span>
                        </button>
                      </td>

                      {/* Last Login */}
                      <td className="p-4 text-slate-400 font-mono text-[11px]">
                        {u.lastLogin || 'Henüz giriş yapmadı'}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Şifre Sıfırla */}
                          {currentUser.role === 'admin' && (
                            <button
                              onClick={() => setResetPassModalUser(u)}
                              title="Şifre Değiştir / Sıfırla"
                              className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                          )}

                          {/* Düzenle */}
                          {(currentUser.role === 'admin' || isSelf) && (
                            <button
                              onClick={() => handleOpenEdit(u)}
                              title="Kullanıcıyı Düzenle"
                              className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Sil */}
                          {currentUser.role === 'admin' && !isSelf && (
                            <button
                              onClick={() => {
                                if (confirm(`${u.name} kullanıcısını silmek istediğinize emin misiniz?`)) {
                                  onDeleteUser(u.id);
                                }
                              }}
                              title="Kullanıcıyı Sil"
                              className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-[#121929] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-0">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 bg-[#0d1424] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingUser ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Ekle'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sistem kullanıcısı için profil ve yetki tanımlayın.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Ad Soyad *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">E-Posta Adresi *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ahmet@mamuthub.com"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Rol & Yetki *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="admin">Yönetici (Tam Yetki)</option>
                    <option value="editor">Editör (İçerik)</option>
                    <option value="viewer">İzleyici (Salt Okunur)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Hesap Durumu</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Aktif' | 'Pasif' })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Pasif">Pasif</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Departman</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Örn: Pazarlama & Satış"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {!editingUser && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Giriş Şifresi</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Şifre"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all"
                >
                  {editingUser ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPassModalUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121929] border border-slate-800 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Şifre Yenileme ({resetPassModalUser.name})</span>
            </h3>

            {resetSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs text-emerald-300 font-bold">Şifre Başarıyla Güncellendi!</p>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                <p className="text-xs text-slate-400">
                  {resetPassModalUser.email} kullanıcısı için yeni bir giriş şifresi belirleyin:
                </p>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetPassModalUser(null)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg"
                  >
                    Şifreyi Güncelle
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
