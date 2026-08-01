export interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  content: string; // Markdown or paragraph body
  bulletPoints?: string[];
  imageUrl?: string;
  layout: 'title' | 'content-left' | 'content-right' | 'full-image' | 'two-column' | 'quote' | 'stats';
  backgroundColor?: string;
  textColor?: string;
  stats?: { label: string; value: string }[];
}

export interface Presentation {
  id: string;
  code: string; // e.g. PS-008_AKADEMİLER_PANEL
  title: string;
  description: string;
  category: string;
  pageCount: number;
  updatedAt: string;
  createdAt: string;
  thumbnailUrl: string;
  pdfUrl?: string;
  pdfFileName?: string;
  pdfFileSize?: string;
  isFavorite: boolean;
  clientId?: string;
  clientName?: string;
  slides: Slide[];
  extractedImages?: string[];
  tags: string[];
  fields?: string[]; // Alanlar (e.g. ['Eğitim & İK', 'Teknoloji & Yazılım'])
  targetAudiences?: string[]; // Hedef Kitleler (e.g. ['C-Level / Üst Düzey Yönetim', 'Girişimciler'])
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
  color?: string;
}

export interface Client {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  assignedPresentationsCount: number;
  status: 'Aktif' | 'Teklif Aşamasında' | 'Sözleşmeli' | 'Pasif';
  notes?: string;
  logoUrl?: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  avatarUrl?: string;
  status: 'Aktif' | 'Pasif';
  department?: string;
  createdAt: string;
  lastLogin?: string;
}

export type ViewMode = 'panel' | 'all' | 'favorites' | 'customers' | 'users' | 'analytics' | 'feedback' | 'presentation-editor' | 'presentation-view';

export interface ViewAnalyticsLog {
  id: string;
  presentationId: string;
  presentationTitle: string;
  clientId?: string;
  clientName?: string;
  viewedAt: string;
  durationSeconds: number;
  completedPages: number;
  totalPages: number;
  device: string;
  location?: string;
}

export interface ClientFeedback {
  id: string;
  presentationId: string;
  presentationTitle: string;
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  slideIndex?: number;
  feedbackType: 'Revize Talebi' | 'Fiyat Bilgisi' | 'Soru / Not' | 'Genel Görüş';
  comment: string;
  rating?: number;
  status: 'Yeni' | 'İnceleniyor' | 'Tamamlandı';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface ShareToken {
  id: string;
  clientId: string;
  companyName: string;
  contactPerson: string;
  createdAt: string;
  expiresInDays: '1' | '7' | '30' | 'unlimited';
  expiresAt: string | null;
  pinCode?: string;
  createdById?: string;
  viewCount: number;
  lastViewedAt?: string;
}
