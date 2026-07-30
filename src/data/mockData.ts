import { Presentation, Category, Client, User, ViewAnalyticsLog, ClientFeedback, AuditLog } from '../types';

export const DEFAULT_FIELDS: string[] = [
  'Eğitim & İK',
  'Teknoloji & Yazılım',
  'Finans & Bankacılık',
  'Pazarlama & İletişim',
  'Girişimcilik & İnovasyon',
  'Hukuk & Mevzuat',
  'Operasyon & Lojistik',
  'Sağlık & Biyoteknoloji',
  'Sürdürülebilirlik & ESG',
  'Satış & Müşteri İlişkileri',
];

export const DEFAULT_TARGET_AUDIENCES: string[] = [
  'C-Level / Üst Düzey Yönetim',
  'Girişimciler & Kurucular',
  'İnsan Kaynakları & Eğitmenler',
  'Yatırımcılar & Fonlar',
  'Yöneticiler & Takım Liderleri',
  'Müşteriler & Hizmet Alanlar',
  'Çalışanlar & Ekip Üyeleri',
  'Genel Kamuoyu & Öğrenciler',
];

export const initialCategories: Category[] = [
  { id: 'cat-1', name: 'General', slug: 'general', count: 0 },
  { id: 'cat-2', name: 'GENEL SUNUMLAR', slug: 'genel-sunumlar', count: 1 },
  { id: 'cat-3', name: 'ÖZEL SUNUMLAR', slug: 'ozel-sunumlar', count: 1 },
  { id: 'cat-4', name: 'MÜŞTERİ TEKLİFLERİ', slug: 'musteri-teklifleri', count: 1 },
  { id: 'cat-5', name: 'EĞİTİM & AKADEMİ', slug: 'egitim-akademi', count: 1 },
];

export const initialClients: Client[] = [
  {
    id: 'cli-1',
    companyName: 'Akbank T.A.Ş.',
    contactPerson: 'Zeynep Yılmaz',
    email: 'zeynep.yilmaz@akbank.com',
    phone: '+90 (212) 555 0123',
    assignedPresentationsCount: 2,
    status: 'Aktif',
    notes: 'Dijital Dönüşüm Sunumu gönderildi.',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
    createdAt: '2026-06-15',
  },
  {
    id: 'cli-2',
    companyName: 'Turkcell İletişim Hizmetleri',
    contactPerson: 'Mehmet Demir',
    email: 'm.demir@turkcell.com.tr',
    phone: '+90 (212) 555 0456',
    assignedPresentationsCount: 1,
    status: 'Sözleşmeli',
    notes: 'Kurumsal akademi eğitimi talep ediyorlar.',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
    createdAt: '2026-07-01',
  },
  {
    id: 'cli-3',
    companyName: 'Trendyol Group',
    contactPerson: 'Selin Aydın',
    email: 'selin.aydin@trendyol.com',
    phone: '+90 (212) 555 0789',
    assignedPresentationsCount: 1,
    status: 'Teklif Aşamasında',
    notes: 'Yıllık pazarlama stratejisi teklifi.',
    createdAt: '2026-07-20',
  },
];

export const initialPresentations: Presentation[] = [
  {
    id: 'pres-1',
    code: 'PS-008_AKADEMİLER_PANEL',
    title: 'Akademiler Kurumsal Gelişim Programı',
    description: 'Bilgi ve vizyonu kurum içi yeteneklere aktarma, modüler gelişim programları ve dijital akademi yapısı.',
    category: 'GENEL SUNUMLAR',
    pageCount: 15,
    updatedAt: '2026-07-29',
    createdAt: '2026-07-29',
    thumbnailUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    isFavorite: true,
    clientId: 'cli-1',
    clientName: 'Akbank T.A.Ş.',
    tags: ['Akademi', 'Gelişim', 'Kurumsal', 'Eğitim'],
    fields: ['Eğitim & İK', 'Teknoloji & Yazılım'],
    targetAudiences: ['C-Level / Üst Düzey Yönetim', 'İnsan Kaynakları & Eğitmenler', 'Çalışanlar & Ekip Üyeleri'],
    slides: [
      {
        id: 's1',
        title: 'MAMUTHUB AKADEMİLER',
        subtitle: 'Kurumsal Yetenek & Gelişim Dönüşümü',
        content: 'Bilgi uygulandıkça vizyona dönüşür. Kurum içi akademiler ile çalışanlarınızın potansiyelini en üst seviyeye çıkarın.',
        layout: 'title',
        bulletPoints: [
          'Modüler Öğrenme Mimarisi',
          'Ölçülebilir Yetkinlik Analizi',
          'Sertifikasyon ve Kariyer Yolları'
        ]
      },
      {
        id: 's2',
        title: 'Akademi Modülleri',
        subtitle: 'İhtiyaca Özel İçerik Mimarisi',
        content: 'Liderlik, dijital teknolojiler ve operasyonel mükemmellik alanlarında özelleştirilmiş eğitim yolları.',
        layout: 'two-column',
        bulletPoints: [
          'Liderlik & Yönetim Becerileri',
          'Veri Analitiği ve Yapay Zeka',
          'Proje Yönetimi ve Çevik Çalışma'
        ],
        stats: [
          { label: 'Başarı Oranı', value: '%94' },
          { label: 'Aktif Katılımcı', value: '1,200+' }
        ]
      },
      {
        id: 's3',
        title: 'Süreç ve Takvim',
        subtitle: '4 Adımda Akademi Kurulumu',
        content: '1. İhtiyaç Analizi -> 2. Müfretad Tasarımı -> 3. Dijital İçerik Üretimi -> 4. Lansman & Ölçümleme',
        layout: 'content-left',
        bulletPoints: [
          'Haftalık İlerleme Raporları',
          'Canlı Webinar ve Atölye Çalışmaları',
          'Sürekli Dönüt ve Değerlendirme'
        ]
      }
    ]
  },
  {
    id: 'pres-2',
    code: 'OU-001_KENDİ_İŞİNİ_KENDİ_GÖREN_KADINLAR_PANEL',
    title: 'Kendi İşini Kendi Gören Kadınlar Programı',
    description: 'Birleşmiş Milletler Sürdürülebilir Kalkınma Amaçları kapsamında Kadın Girişimciliği Dönüştürme Programı.',
    category: 'ÖZEL SUNUMLAR',
    pageCount: 9,
    updatedAt: '2026-07-29',
    createdAt: '2026-07-29',
    thumbnailUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    isFavorite: false,
    clientId: 'cli-2',
    clientName: 'Turkcell İletişim Hizmetleri',
    tags: ['Kadın Girişimciliği', 'Sosyal Sorumluluk', 'Sürdürülebilirlik'],
    fields: ['Girişimcilik & İnovasyon', 'Sürdürülebilirlik & ESG', 'Finans & Bankacılık'],
    targetAudiences: ['Girişimciler & Kurucular', 'Müşteriler & Hizmet Alanlar'],
    slides: [
      {
        id: 's201',
        title: 'KENDİ İŞİNİ KENDİ GÖREN KADINLAR',
        subtitle: 'Sürdürülebilir Kalkınma ve Kadın Emeği',
        content: 'Toplumsal ve ekonomik kalkınmada kadın liderliğini güçlendiren mikro-finansman ve eğitim projesi.',
        layout: 'title',
        bulletPoints: [
          'E-Ticaret Entegrasyonu',
          'Finansal Okuryazarlık',
          'Mentörlük Destek Ağı'
        ]
      },
      {
        id: 's202',
        title: 'Program Etkisi',
        subtitle: 'Sayılarla Başarı Hikayemiz',
        content: 'Türkiye genelinde 50+ ilde kadın kooperatifleri ve girişimcilerle buluştuk.',
        layout: 'stats',
        stats: [
          { label: 'Eğitilen Kadın Sayısı', value: '5,000+' },
          { label: 'Kurulan İş Sayısı', value: '850+' },
          { label: 'Gelir Artışı', value: '%180' }
        ]
      }
    ]
  },
  {
    id: 'pres-3',
    code: 'MT-012_TRENDYOL_TEKLİF_PANEL',
    title: 'Trendyol Kurumsal Marka Stratejisi & Dijital Sunum Deck',
    description: 'Q3 - Q4 Dijital Pazarlama ve Kurumsal İletişim Sunumu',
    category: 'MÜŞTERİ TEKLİFLERİ',
    pageCount: 12,
    updatedAt: '2026-07-28',
    createdAt: '2026-07-28',
    thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    isFavorite: true,
    clientId: 'cli-3',
    clientName: 'Trendyol Group',
    tags: ['Pazarlama', 'Teklif', 'E-Ticaret'],
    fields: ['Pazarlama & İletişim', 'Satış & Müşteri İlişkileri'],
    targetAudiences: ['C-Level / Üst Düzey Yönetim', 'Yatırımcılar & Fonlar'],
    slides: [
      {
        id: 's301',
        title: 'TRENDYOL DİJİTAL PAZARLAMA STRATEJİSİ',
        subtitle: '2026 H2 Yol Haritası',
        content: 'Pazar liderliğini pekiştirecek yenilikçi içerik ve sunum stratejileri.',
        layout: 'title',
        bulletPoints: ['Veri Odaklı Pazarlama', 'Kullanıcı Deneyimi (UX)', 'B2B İşbirlikleri']
      }
    ]
  }
];

export const initialUsers: User[] = [
  {
    id: 'user-1',
    name: 'Ufuk Karakullukçu',
    email: 'admin@mamuthub.com',
    role: 'admin',
    password: '123',
    status: 'Aktif',
    department: 'Yönetim & Strateji',
    createdAt: '2026-01-10',
    lastLogin: '2026-07-29 16:20',
  },
  {
    id: 'user-2',
    name: 'Zeynep Yılmaz',
    email: 'editor@mamuthub.com',
    role: 'editor',
    password: '123',
    status: 'Aktif',
    department: 'İçerik & Tasarım',
    createdAt: '2026-03-15',
    lastLogin: '2026-07-28 11:45',
  },
  {
    id: 'user-3',
    name: 'Caner Demir',
    email: 'satis@mamuthub.com',
    role: 'viewer',
    password: '123',
    status: 'Aktif',
    department: 'Satış & Müşteri İlişkileri',
    createdAt: '2026-05-01',
    lastLogin: '2026-07-25 09:15',
  },
];

export const initialAnalyticsLogs: ViewAnalyticsLog[] = [
  {
    id: 'log-1',
    presentationId: 'pres-1',
    presentationTitle: 'MamutHub Şirket Tanıtım & Hizmet Kataloğu',
    clientId: 'client-1',
    clientName: 'Turkcell Akademi',
    viewedAt: '2026-07-29 14:32',
    durationSeconds: 420,
    completedPages: 12,
    totalPages: 12,
    device: 'Masaüstü (Chrome / macOS)',
    location: 'İstanbul, Türkiye',
  },
  {
    id: 'log-2',
    presentationId: 'pres-1',
    presentationTitle: 'MamutHub Şirket Tanıtım & Hizmet Kataloğu',
    clientId: 'client-2',
    clientName: 'Garanti BBVA Teknoloji',
    viewedAt: '2026-07-29 11:15',
    durationSeconds: 310,
    completedPages: 10,
    totalPages: 12,
    device: 'Tablet (Safari / iPadOS)',
    location: 'İstanbul, Türkiye',
  },
  {
    id: 'log-3',
    presentationId: 'pres-2',
    presentationTitle: 'SaaS Platform Dijital Dönüşüm Sunumu',
    clientId: 'client-3',
    clientName: 'Trendyol Group',
    viewedAt: '2026-07-28 16:50',
    durationSeconds: 580,
    completedPages: 18,
    totalPages: 18,
    device: 'Masaüstü (Windows / Edge)',
    location: 'Ankara, Türkiye',
  },
  {
    id: 'log-4',
    presentationId: 'pres-1',
    presentationTitle: 'MamutHub Şirket Tanıtım & Hizmet Kataloğu',
    clientId: 'client-1',
    clientName: 'Turkcell Akademi',
    viewedAt: '2026-07-27 09:40',
    durationSeconds: 180,
    completedPages: 5,
    totalPages: 12,
    device: 'Mobil (Safari / iOS)',
    location: 'İzmir, Türkiye',
  },
];

export const initialFeedbacks: ClientFeedback[] = [
  {
    id: 'fb-1',
    presentationId: 'pres-1',
    presentationTitle: 'MamutHub Şirket Tanıtım & Hizmet Kataloğu',
    clientId: 'client-1',
    clientName: 'Selin Yılmaz (Turkcell)',
    clientEmail: 'selin@turkcell.com.tr',
    slideIndex: 3,
    feedbackType: 'Revize Talebi',
    comment: '3. slayttaki eğitim paket fiyatlarına kurumsal indirim opsiyonunu ekleyebilir misiniz?',
    rating: 5,
    status: 'Yeni',
    createdAt: '2026-07-29 14:40',
  },
  {
    id: 'fb-2',
    presentationId: 'pres-2',
    presentationTitle: 'SaaS Platform Dijital Dönüşüm Sunumu',
    clientId: 'client-3',
    clientName: 'Murat Şahin (Trendyol)',
    clientEmail: 'murat.sahin@trendyol.com',
    slideIndex: 7,
    feedbackType: 'Fiyat Bilgisi',
    comment: 'Eşzamanlı 500+ kullanıcı lisanslama detayları için görüşmek istiyoruz.',
    rating: 4,
    status: 'İnceleniyor',
    createdAt: '2026-07-28 17:02',
  },
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'audit-1',
    userId: 'user-1',
    userName: 'Ufuk Karakullukçu',
    userRole: 'admin',
    action: 'Kullanıcı Girişi',
    details: 'Sistem paneline başarıyla giriş yapıldı.',
    timestamp: '2026-07-29 16:20',
    ipAddress: '195.175.22.10',
  },
  {
    id: 'audit-2',
    userId: 'user-1',
    userName: 'Ufuk Karakullukçu',
    userRole: 'admin',
    action: 'Müşteriye Sunum Atama',
    details: 'Turkcell Akademi firmasına "MamutHub Şirket Tanıtım" sunumu atandı.',
    timestamp: '2026-07-29 15:10',
    ipAddress: '195.175.22.10',
  },
  {
    id: 'audit-3',
    userId: 'user-2',
    userName: 'Zeynep Yılmaz',
    userRole: 'editor',
    action: 'PDF Yükleme',
    details: 'Trendyol_Pazarlama_Stratejisi_2026.pdf sunumu sisteme eklendi.',
    timestamp: '2026-07-28 11:50',
    ipAddress: '88.241.10.5',
  },
];
