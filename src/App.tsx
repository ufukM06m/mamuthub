import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PresentationCard } from './components/PresentationCard';
import { PresentationListView } from './components/PresentationListView';
import { PresentationStudioModal } from './components/PresentationStudioModal';
import { CustomerManagement } from './components/CustomerManagement';
import { UserManagement } from './components/UserManagement';
import { LoginScreen } from './components/LoginScreen';
import { ManageCategoriesModal } from './components/ManageCategoriesModal';
import { ManageTaxonomyModal } from './components/ManageTaxonomyModal';
import { BackupModal } from './components/BackupModal';
import { UploadPdfModal } from './components/UploadPdfModal';
import { ClientPortalModal } from './components/ClientPortalModal';
import { FilterBar } from './components/FilterBar';
import { AnalyticsView } from './components/AnalyticsView';
import { ClientFeedbackView } from './components/ClientFeedbackView';
import { AuditLogView } from './components/AuditLogView';

import { 
  initialCategories, 
  initialPresentations, 
  initialClients, 
  initialUsers, 
  initialAnalyticsLogs, 
  initialFeedbacks, 
  initialAuditLogs, 
  DEFAULT_FIELDS, 
  DEFAULT_TARGET_AUDIENCES 
} from './data/mockData';
import { Presentation, Category, Client, ViewMode, User, ViewAnalyticsLog, ClientFeedback, AuditLog } from './types';
import { generatePresentationPDF } from './utils/pdfExport';
import { FileText, Plus, LayoutGrid, List, Folders, Briefcase } from 'lucide-react';
import { subscribeToCollection, upsertItem, removeItem, replaceCollection, savePresentationAssets, loadPresentationAssets } from './lib/firestoreService';
import { deletePresentationFromStorage } from './lib/firebaseStorageService';
import { 
  saveLocalPresentation, 
  getLocalPresentations, 
  deleteLocalPresentation, 
  sanitizePresentationForFirestore,
  getDeletedPresIds,
  addDeletedPresId,
  clearDeletedPresIds
} from './lib/storageService';

interface TaxonomyDoc {
  id: string;
  fields: string[];
  targetAudiences: string[];
}

export default function App() {
  // Users & Auth State
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('mamuthub_users');
      return saved ? JSON.parse(saved) : initialUsers;
    } catch {
      return initialUsers;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedLocal = localStorage.getItem('mamuthub_auth_user');
      if (savedLocal) return JSON.parse(savedLocal);
      const savedSession = sessionStorage.getItem('mamuthub_auth_user');
      if (savedSession) return JSON.parse(savedSession);
      return null;
    } catch {
      return null;
    }
  });

  // Save users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mamuthub_users', JSON.stringify(users));
    } catch {
      // ignore
    }
  }, [users]);

  // Clean up storage on logout & purge legacy mock test data
  useEffect(() => {
    try {
      if (!currentUser) {
        localStorage.removeItem('mamuthub_auth_user');
        sessionStorage.removeItem('mamuthub_auth_user');
      }
    } catch {
      // ignore
    }

    // Purge old mock test items once from Firestore and local storage
    const mockIds = ['pres-1', 'pres-2', 'pres-3', 'pres-4'];
    for (const mockId of mockIds) {
      removeItem('presentations', mockId).catch(() => {});
      deleteLocalPresentation(mockId).catch(() => {});
      addDeletedPresId(mockId);
    }
  }, [currentUser]);

  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [clients, setClients] = useState<Client[]>(initialClients);

  // New modules state
  const [analyticsLogs, setAnalyticsLogs] = useState<ViewAnalyticsLog[]>(initialAnalyticsLogs);
  const [feedbacks, setFeedbacks] = useState<ClientFeedback[]>(initialFeedbacks);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);

  const [allFields, setAllFields] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mamuthub_fields');
      return saved ? JSON.parse(saved) : DEFAULT_FIELDS;
    } catch {
      return DEFAULT_FIELDS;
    }
  });

  const [allTargetAudiences, setAllTargetAudiences] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mamuthub_target_audiences');
      return saved ? JSON.parse(saved) : DEFAULT_TARGET_AUDIENCES;
    } catch {
      return DEFAULT_TARGET_AUDIENCES;
    }
  });

  // Load IndexedDB presentations on startup to preserve large PDF data URLs and images
  useEffect(() => {
    getLocalPresentations<Presentation>().then((localPres) => {
      const deletedIds = getDeletedPresIds();
      const mockIds = ['pres-1', 'pres-2', 'pres-3', 'pres-4'];
      if (localPres && localPres.length > 0) {
        setPresentations((prev) => {
          const map = new Map<string, Presentation>();
          prev.forEach((p) => {
            if (!deletedIds.includes(p.id) && !mockIds.includes(p.id)) map.set(p.id, p);
          });
          localPres.forEach((lp) => {
            if (deletedIds.includes(lp.id) || mockIds.includes(lp.id)) return;
            const existing = map.get(lp.id);
            if (existing) {
              map.set(lp.id, {
                ...existing,
                ...lp,
                extractedImages: lp.extractedImages || existing.extractedImages,
                pdfUrl: lp.pdfUrl || existing.pdfUrl,
              });
            } else {
              map.set(lp.id, lp);
            }
          });
          return Array.from(map.values());
        });
      }
    });
  }, []);

  // Firestore Subscriptions
  useEffect(() => {
    const unsubPres = subscribeToCollection<Presentation>('presentations', [], (firestorePres) => {
      getLocalPresentations<Presentation>().then(async (localPres) => {
        const deletedIds = getDeletedPresIds();
        const mockIds = ['pres-1', 'pres-2', 'pres-3', 'pres-4'];
        const map = new Map<string, Presentation>();

        const validFirestore = firestorePres.filter((fp) => !deletedIds.includes(fp.id) && !mockIds.includes(fp.id));
        const validLocal = localPres.filter((lp) => !deletedIds.includes(lp.id) && !mockIds.includes(lp.id));

        // 1. First add local user presentations from IndexedDB (they hold complete binary PDF data and local edits)
        validLocal.forEach((lp) => {
          map.set(lp.id, lp);
        });

        // 2. Merge Firestore documents (ensuring local edits and local PDF/images override Firestore sanitized data)
        await Promise.all(
          validFirestore.map(async (fp) => {
            const lp = map.get(fp.id);

            // If pdfUrl or extractedImages are missing in both Firestore doc and local storage, attempt loading from presentation_assets
            if (
              (!fp.pdfUrl || !fp.extractedImages || fp.extractedImages.length === 0) &&
              (!lp || !lp.pdfUrl || !lp.extractedImages || lp.extractedImages.length === 0)
            ) {
              try {
                const assets = await loadPresentationAssets(fp.id);
                if (assets.pdfUrl) fp.pdfUrl = fp.pdfUrl || assets.pdfUrl;
                if (assets.extractedImages && assets.extractedImages.length > 0) {
                  fp.extractedImages = assets.extractedImages;
                }
              } catch {
                // ignore
              }
            }

            if (lp) {
              const merged = {
                ...fp,
                ...lp, // local user edits take priority
                pdfUrl: lp.pdfUrl || fp.pdfUrl,
                extractedImages:
                  lp.extractedImages && lp.extractedImages.length > 0
                    ? lp.extractedImages
                    : fp.extractedImages,
              };
              map.set(fp.id, merged);
              saveLocalPresentation(merged).catch(() => {});
            } else {
              map.set(fp.id, fp);
              saveLocalPresentation(fp).catch(() => {});
            }
          })
        );

        const merged = Array.from(map.values()).sort((a, b) => {
          const getTimestamp = (p: Presentation) => {
            if (p.updatedAt) {
              const parsed = Date.parse(p.updatedAt);
              if (!isNaN(parsed) && parsed > 0) return parsed;
            }
            if (p.createdAt) {
              const parsed = Date.parse(p.createdAt);
              if (!isNaN(parsed) && parsed > 0) return parsed;
            }
            if (p.id.startsWith('pres-')) {
              const num = parseInt(p.id.replace('pres-', ''), 10);
              if (!isNaN(num) && num > 100000) return num;
            }
            return 0;
          };
          return getTimestamp(b) - getTimestamp(a);
        });

        setPresentations(merged);

        const activeId = sessionStorage.getItem('mamuthub_active_pres_id');
        if (activeId) {
          const found = merged.find((p) => p.id === activeId);
          if (found) {
            setActiveStudioPresentationState(found);
          }
        }
      });
    });

    const unsubCats = subscribeToCollection<Category>('categories', [], (cats) => {
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
    });
    const unsubCli = subscribeToCollection<Client>('clients', [], (clis) => {
      if (clis && clis.length > 0) {
        setClients(clis);
      }
    });
    const unsubUsers = subscribeToCollection<User>('users', [], (usr) => {
      if (usr && usr.length > 0) {
        setUsers(usr);
      }
    });
    const unsubAnalytics = subscribeToCollection<ViewAnalyticsLog>('analytics', [], setAnalyticsLogs);
    const unsubFeedbacks = subscribeToCollection<ClientFeedback>('feedbacks', [], setFeedbacks);
    const unsubAudit = subscribeToCollection<AuditLog>('auditLogs', [], setAuditLogs);

    const unsubTaxonomy = subscribeToCollection<TaxonomyDoc>(
      'taxonomy',
      [],
      (data) => {
        if (data && data.length > 0 && data[0].fields && data[0].fields.length > 0) {
          setAllFields(data[0].fields);
          setAllTargetAudiences(data[0].targetAudiences || []);
          try {
            localStorage.setItem('mamuthub_fields', JSON.stringify(data[0].fields));
            localStorage.setItem('mamuthub_target_audiences', JSON.stringify(data[0].targetAudiences || []));
          } catch {
            // ignore
          }
        }
      }
    );

    return () => {
      unsubPres();
      unsubCats();
      unsubCli();
      unsubUsers();
      unsubAnalytics();
      unsubFeedbacks();
      unsubAudit();
      unsubTaxonomy();
    };
  }, []);

  const handleSendFeedback = (newFb: Omit<ClientFeedback, 'id' | 'createdAt' | 'status'>) => {
    const created: ClientFeedback = {
      ...newFb,
      id: `fb-${Date.now()}`,
      status: 'Yeni',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setFeedbacks((prev) => [created, ...prev]);
    upsertItem('feedbacks', created);

    // Add audit log for feedback
    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      userId: 'client-portal',
      userName: newFb.clientName,
      userRole: 'viewer',
      action: 'Müşteri Not / Geri Bildirim İletti',
      details: `"${newFb.presentationTitle}" sunumu için ${newFb.feedbackType} gönderildi.`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setAuditLogs((prev) => [audit, ...prev]);
    upsertItem('auditLogs', audit);
  };

  const handleUpdateFeedbackStatus = (id: string, status: 'Yeni' | 'İnceleniyor' | 'Tamamlandı') => {
    setFeedbacks((prev) => {
      const updated = prev.map((f) => f.id === id ? { ...f, status } : f);
      const target = updated.find((f) => f.id === id);
      if (target) upsertItem('feedbacks', target);
      return updated;
    });
  };

  const handleDeleteFeedback = (id: string) => {
    setFeedbacks((prev) => prev.filter((f) => f.id !== id));
    removeItem('feedbacks', id);
  };

  const unreadFeedbacksCount = useMemo(() => {
    return feedbacks.filter((f) => f.status === 'Yeni').length;
  }, [feedbacks]);

  const [currentView, setCurrentView] = useState<ViewMode>('panel');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedTargetAudiences, setSelectedTargetAudiences] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');

  // Modals state
  // Active Studio presentation state with session persistence
  const [activeStudioPresentation, setActiveStudioPresentationState] = useState<Presentation | null>(null);

  const setActiveStudioPresentation = (p: Presentation | null) => {
    setActiveStudioPresentationState(p);
    if (p) {
      sessionStorage.setItem('mamuthub_active_pres_id', p.id);
    } else {
      sessionStorage.removeItem('mamuthub_active_pres_id');
    }
  };
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState<boolean>(false);
  const [isManageTaxonomyOpen, setIsManageTaxonomyOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isUploadPdfModalOpen, setIsUploadPdfModalOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Check URL parameters for standalone Client Portal link (?portal=CLIENT_ID or ?id=CLIENT_ID)
  const [standalonePortalClient, setStandalonePortalClient] = useState<Client | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const portalId = params.get('portal') || params.get('id');
      if (portalId) {
        const found = initialClients.find((c) => c.id === portalId);
        return found || null;
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Dynamic Category count update
  const categoriesWithCounts = useMemo(() => {
    return categories.map((cat) => {
      const count = presentations.filter(
        (p) => p.category.toLowerCase() === cat.name.toLowerCase()
      ).length;
      return { ...cat, count };
    });
  }, [categories, presentations]);

  // Favorites count
  const favoritesCount = useMemo(() => {
    return presentations.filter((p) => p.isFavorite).length;
  }, [presentations]);

  // Filtered Presentations
  const filteredPresentations = useMemo(() => {
    return presentations.filter((p) => {
      // Category filter
      if (selectedCategory) {
        if (p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // View filter
      if (currentView === 'favorites') {
        if (!p.isFavorite) return false;
      }

      // Field (Alan) filter (if any field selected, presentation must have at least one matching field)
      if (selectedFields.length > 0) {
        if (!p.fields || !p.fields.some((f) => selectedFields.includes(f))) {
          return false;
        }
      }

      // Target Audience (Hedef Kitle) filter (if any audience selected, presentation must match at least one)
      if (selectedTargetAudiences.length > 0) {
        if (!p.targetAudiences || !p.targetAudiences.some((a) => selectedTargetAudiences.includes(a))) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = p.code.toLowerCase().includes(q);
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        const matchesTags = p.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesFields = p.fields?.some((f) => f.toLowerCase().includes(q));
        const matchesAudiences = p.targetAudiences?.some((a) => a.toLowerCase().includes(q));

        if (!matchesCode && !matchesTitle && !matchesCategory && !matchesTags && !matchesFields && !matchesAudiences) {
          return false;
        }
      }

      return true;
    });
  }, [presentations, currentView, selectedCategory, selectedFields, selectedTargetAudiences, searchQuery]);

  // Filter Handlers
  const handleToggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleToggleTargetAudience = (audience: string) => {
    setSelectedTargetAudiences((prev) =>
      prev.includes(audience) ? prev.filter((a) => a !== audience) : [...prev, audience]
    );
  };

  const handleClearFilters = () => {
    setSelectedFields([]);
    setSelectedTargetAudiences([]);
    setSelectedCategory(null);
  };

  // Helper to persist taxonomy changes (Fields & Target Audiences)
  const persistTaxonomy = (fields: string[], audiences: string[]) => {
    setAllFields(fields);
    setAllTargetAudiences(audiences);
    try {
      localStorage.setItem('mamuthub_fields', JSON.stringify(fields));
      localStorage.setItem('mamuthub_target_audiences', JSON.stringify(audiences));
    } catch {
      // ignore
    }
    upsertItem('taxonomy', { id: 'main', fields, targetAudiences: audiences });
  };

  // Handlers
  const handleToggleFavorite = async (id: string) => {
    let targetItem: Presentation | null = null;
    setPresentations((prev) => {
      const updated = prev.map((p) => {
        if (p.id === id) {
          const item = { ...p, isFavorite: !p.isFavorite };
          targetItem = item;
          saveLocalPresentation(item);
          return item;
        }
        return p;
      });
      return updated;
    });
    if (targetItem) {
      const sanitized = await sanitizePresentationForFirestore(targetItem);
      await upsertItem('presentations', sanitized);
    }
  };

  const handleDeletePresentation = async (id: string) => {
    if (window.confirm('Bu sunumu silmek istediğinizden emin misiniz?')) {
      addDeletedPresId(id);
      setPresentations((prev) => prev.filter((p) => p.id !== id));
      await deleteLocalPresentation(id);
      await removeItem('presentations', id);
      deletePresentationFromStorage(id).catch(() => {});
    }
  };


  const handleAddNewPresentation = () => {
    setIsUploadPdfModalOpen(true);
  };

  const handleAddUploadedPresentation = async (newPres: Presentation) => {
    const timeStamped: Presentation = {
      ...newPres,
      createdAt: newPres.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPresentations((prev) => [timeStamped, ...prev.filter((p) => p.id !== timeStamped.id)]);
    setActiveStudioPresentation(timeStamped);
    await saveLocalPresentation(timeStamped);
    await savePresentationAssets(timeStamped.id, timeStamped.pdfUrl, timeStamped.extractedImages);
    const sanitized = await sanitizePresentationForFirestore(timeStamped);
    await upsertItem('presentations', sanitized);
  };

  const handleSavePresentation = async (updated: Presentation) => {
    const timeStamped: Presentation = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    setPresentations((prev) => prev.map((p) => (p.id === timeStamped.id ? timeStamped : p)));
    if (activeStudioPresentation?.id === timeStamped.id) {
      setActiveStudioPresentationState(timeStamped);
    }
    await saveLocalPresentation(timeStamped);
    await savePresentationAssets(timeStamped.id, timeStamped.pdfUrl, timeStamped.extractedImages);
    const sanitized = await sanitizePresentationForFirestore(timeStamped);
    await upsertItem('presentations', sanitized);
  };

  // Category Handlers
  const handleAddCategory = (categoryName: string) => {
    const formatted = categoryName.trim().toUpperCase();
    const exists = categories.some((c) => c.name.toLowerCase() === formatted.toLowerCase());
    if (exists) return;

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: formatted,
      slug: formatted.toLowerCase().replace(/\s+/g, '-'),
      count: 0,
    };
    setCategories([...categories, newCat]);
    upsertItem('categories', newCat);
  };

  // Taxonomy Handlers for Fields & Target Audiences
  const handleAddField = (field: string) => {
    const trimmed = field.trim();
    if (!trimmed || allFields.includes(trimmed)) return;
    const updated = [...allFields, trimmed];
    persistTaxonomy(updated, allTargetAudiences);
  };

  const handleEditField = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;

    const updatedFields = allFields.map((f) => (f === oldName ? trimmed : f));
    setSelectedFields((prev) => prev.map((f) => (f === oldName ? trimmed : f)));
    persistTaxonomy(updatedFields, allTargetAudiences);

    setPresentations((prev) => {
      const updated = prev.map((p) => {
        if (!p.fields || !p.fields.includes(oldName)) return p;
        const newPres = {
          ...p,
          fields: p.fields.map((f) => (f === oldName ? trimmed : f)),
        };
        saveLocalPresentation(newPres);
        sanitizePresentationForFirestore(newPres).then((s) => upsertItem('presentations', s));
        return newPres;
      });
      return updated;
    });
  };

  const handleDeleteField = (field: string) => {
    const updatedFields = allFields.filter((f) => f !== field);
    setSelectedFields((prev) => prev.filter((f) => f !== field));
    persistTaxonomy(updatedFields, allTargetAudiences);

    setPresentations((prev) => {
      const updated = prev.map((p) => {
        if (!p.fields || !p.fields.includes(field)) return p;
        const newPres = {
          ...p,
          fields: p.fields.filter((f) => f !== field),
        };
        saveLocalPresentation(newPres);
        sanitizePresentationForFirestore(newPres).then((s) => upsertItem('presentations', s));
        return newPres;
      });
      return updated;
    });
  };

  const handleAddTargetAudience = (audience: string) => {
    const trimmed = audience.trim();
    if (!trimmed || allTargetAudiences.includes(trimmed)) return;
    const updated = [...allTargetAudiences, trimmed];
    persistTaxonomy(allFields, updated);
  };

  const handleEditTargetAudience = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;

    const updatedAudiences = allTargetAudiences.map((a) => (a === oldName ? trimmed : a));
    setSelectedTargetAudiences((prev) => prev.map((a) => (a === oldName ? trimmed : a)));
    persistTaxonomy(allFields, updatedAudiences);

    setPresentations((prev) => {
      const updated = prev.map((p) => {
        if (!p.targetAudiences || !p.targetAudiences.includes(oldName)) return p;
        const newPres = {
          ...p,
          targetAudiences: p.targetAudiences.map((a) => (a === oldName ? trimmed : a)),
        };
        saveLocalPresentation(newPres);
        sanitizePresentationForFirestore(newPres).then((s) => upsertItem('presentations', s));
        return newPres;
      });
      return updated;
    });
  };

  const handleDeleteTargetAudience = (audience: string) => {
    const updatedAudiences = allTargetAudiences.filter((a) => a !== audience);
    setSelectedTargetAudiences((prev) => prev.filter((a) => a !== audience));
    persistTaxonomy(allFields, updatedAudiences);

    setPresentations((prev) => {
      const updated = prev.map((p) => {
        if (!p.targetAudiences || !p.targetAudiences.includes(audience)) return p;
        const newPres = {
          ...p,
          targetAudiences: p.targetAudiences.filter((a) => a !== audience),
        };
        saveLocalPresentation(newPres);
        sanitizePresentationForFirestore(newPres).then((s) => upsertItem('presentations', s));
        return newPres;
      });
      return updated;
    });
  };

  const handleEditCategory = (oldName: string, newName: string) => {
    setCategories((prev) => {
      const updated = prev.map((c) => {
        if (c.name === oldName) {
          const item = { ...c, name: newName };
          upsertItem('categories', item);
          return item;
        }
        return c;
      });
      return updated;
    });

    // Update category name on all presentations
    setPresentations((prev) => {
      const updated = prev.map((p) => {
        if (p.category === oldName) {
          const item = { ...p, category: newName };
          saveLocalPresentation(item);
          sanitizePresentationForFirestore(item).then((s) => upsertItem('presentations', s));
          return item;
        }
        return p;
      });
      return updated;
    });

    if (selectedCategory === oldName) {
      setSelectedCategory(newName);
    }
  };

  const handleDeleteCategory = (catName: string) => {
    const foundCat = categories.find((c) => c.name === catName);
    if (foundCat) removeItem('categories', foundCat.id);
    setCategories((prev) => prev.filter((c) => c.name !== catName));

    // Move presentations to GENEL SUNUMLAR
    setPresentations((prev) => {
      const updated = prev.map((p) => {
        if (p.category === catName) {
          const item = { ...p, category: 'GENEL SUNUMLAR' };
          saveLocalPresentation(item);
          sanitizePresentationForFirestore(item).then((s) => upsertItem('presentations', s));
          return item;
        }
        return p;
      });
      return updated;
    });

    if (selectedCategory === catName) {
      setSelectedCategory(null);
    }
  };

  // Client Handlers
  const handleAddClient = (newClient: Client) => {
    setClients([newClient, ...clients]);
    upsertItem('clients', newClient);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients((prev) => prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
    upsertItem('clients', updatedClient);

    // Sync companyName to assigned presentations if changed
    setPresentations((prev) => {
      const updated = prev.map((p) => {
        if (p.clientId === updatedClient.id) {
          const item = { ...p, clientName: updatedClient.companyName };
          upsertItem('presentations', item);
          return item;
        }
        return p;
      });
      return updated;
    });
  };

  const handleDeleteClient = (clientId: string) => {
    setClients((prev) => prev.filter((c) => c.id !== clientId));
    removeItem('clients', clientId);

    // Remove client reference from assigned presentations
    setPresentations((prev) => {
      const updated = prev.map((p) => {
        if (p.clientId === clientId) {
          const item = { ...p, clientId: undefined, clientName: undefined };
          upsertItem('presentations', item);
          return item;
        }
        return p;
      });
      return updated;
    });
  };

  const handleSaveAssignments = (clientId: string, selectedPresentationIds: string[]) => {
    const client = clients.find((c) => c.id === clientId);

    setPresentations((prev) => {
      const updated = prev.map((p) => {
        if (selectedPresentationIds.includes(p.id)) {
          const item = {
            ...p,
            clientId: client?.id,
            clientName: client?.companyName,
          };
          upsertItem('presentations', item);
          return item;
        } else if (p.clientId === clientId) {
          const item = {
            ...p,
            clientId: undefined,
            clientName: undefined,
          };
          upsertItem('presentations', item);
          return item;
        }
        return p;
      });
      return updated;
    });
  };

  const handleExportBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      presentations,
      categories,
      clients,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MAMUTHUB_Yedek_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePurgeTestData = async () => {
    if (window.confirm('Veritabanındaki ve önbellekteki tüm varsayılan örnek/test sunumları silinsin mi? Yalnızca sizin eklediğiniz gerçek sunumlar kalacaktır.')) {
      const mockIds = ['pres-1', 'pres-2', 'pres-3', 'pres-4'];
      mockIds.forEach((id) => addDeletedPresId(id));
      setPresentations((prev) => prev.filter((p) => !mockIds.includes(p.id)));
      for (const id of mockIds) {
        await deleteLocalPresentation(id);
        await removeItem('presentations', id);
      }
    }
  };

  const handleRestoreData = (restored: {
    presentations?: Presentation[];
    categories?: Category[];
    clients?: Client[];
  }) => {
    if (restored.presentations && Array.isArray(restored.presentations)) {
      clearDeletedPresIds();
      setPresentations(restored.presentations);
      restored.presentations.forEach((p) => saveLocalPresentation(p));
      Promise.all(restored.presentations.map((p) => sanitizePresentationForFirestore(p))).then((sanitizedList) => {
        replaceCollection('presentations', sanitizedList);
      });
    }
    if (restored.categories && Array.isArray(restored.categories)) {
      setCategories(restored.categories);
      replaceCollection('categories', restored.categories);
    }
    if (restored.clients && Array.isArray(restored.clients)) {
      setClients(restored.clients);
      replaceCollection('clients', restored.clients);
    }
  };

  // User Management Handlers
  const handleAddUser = (newUser: Omit<User, 'id' | 'createdAt'>) => {
    const user: User = {
      ...newUser,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => [user, ...prev]);
    upsertItem('users', user);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    upsertItem('users', updatedUser);
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    removeItem('users', userId);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('mamuthub_auth_user');
      sessionStorage.removeItem('mamuthub_auth_user');
    } catch {
      // ignore
    }
    setCurrentView('panel');
    setSelectedCategory(null);
    setSelectedFields([]);
    setSelectedTargetAudiences([]);
    setSearchQuery('');
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: User, remember: boolean = false) => {
    setCurrentView('panel');
    setSelectedCategory(null);
    setSelectedFields([]);
    setSelectedTargetAudiences([]);
    setSearchQuery('');
    setCurrentUser(user);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
    try {
      if (remember) {
        localStorage.setItem('mamuthub_auth_user', JSON.stringify(user));
        sessionStorage.removeItem('mamuthub_auth_user');
      } else {
        sessionStorage.setItem('mamuthub_auth_user', JSON.stringify(user));
        localStorage.removeItem('mamuthub_auth_user');
      }
    } catch {
      // ignore
    }

    // Force reload presentations from local IndexedDB on login
    getLocalPresentations<Presentation>().then((localPres) => {
      if (localPres && localPres.length > 0) {
        const deletedIds = getDeletedPresIds();
        const mockIds = ['pres-1', 'pres-2', 'pres-3', 'pres-4'];
        setPresentations((prev) => {
          const map = new Map<string, Presentation>();
          prev.forEach((p) => {
            if (!deletedIds.includes(p.id) && !mockIds.includes(p.id)) map.set(p.id, p);
          });
          localPres.forEach((lp) => {
            if (deletedIds.includes(lp.id) || mockIds.includes(lp.id)) return;
            const existing = map.get(lp.id);
            if (existing) {
              map.set(lp.id, {
                ...existing,
                ...lp,
                extractedImages: lp.extractedImages || existing.extractedImages,
                pdfUrl: lp.pdfUrl || existing.pdfUrl,
              });
            } else {
              map.set(lp.id, lp);
            }
          });
          return Array.from(map.values());
        });
      }
    });
  };

  const getViewTitle = () => {
    if (selectedCategory) return selectedCategory;
    switch (currentView) {
      case 'all':
        return 'Tüm Sunumlar';
      case 'favorites':
        return 'Favori Sunumlar';
      case 'customers':
        return 'Müşteri Yönetimi';
      case 'analytics':
        return 'Sunum Analitiği';
      case 'feedback':
        return 'Müşteri Notları & Geri Bildirimler';
      case 'users':
        return 'Kullanıcı & Yetki Yönetimi';
      default:
        return 'Panel';
    }
  };

  if (standalonePortalClient) {
    return (
      <ClientPortalModal
        client={standalonePortalClient}
        assignedPresentations={presentations.filter((p) => p.clientId === standalonePortalClient.id)}
        onClose={() => {
          window.history.replaceState({}, '', window.location.pathname);
          setStandalonePortalClient(null);
        }}
        onSendFeedback={handleSendFeedback}
      />
    );
  }

  // Unauthenticated screen
  if (!currentUser) {
    return <LoginScreen users={users} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-[#0b0f19] text-slate-100 font-sans overflow-hidden antialiased selection:bg-blue-600 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        categories={categoriesWithCounts}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenAddCategory={() => setIsManageCategoriesOpen(true)}
        onOpenManageTaxonomy={() => setIsManageTaxonomyOpen(true)}
        totalPresentationsCount={presentations.length}
        favoritesCount={favoritesCount}
        unreadFeedbacksCount={unreadFeedbacksCount}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onExportBackup={handleExportBackup}
          onImportBackup={() => setIsBackupModalOpen(true)}
          onAddNewPresentation={handleAddNewPresentation}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          currentUser={currentUser}
        />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
          {currentView === 'customers' ? (
            <CustomerManagement
              clients={clients}
              presentations={presentations}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
              onOpenStudio={(pres) => setActiveStudioPresentation(pres)}
              onSaveAssignments={handleSaveAssignments}
            />
          ) : currentView === 'analytics' ? (
            <AnalyticsView
              analyticsLogs={analyticsLogs}
              presentations={presentations}
              clients={clients}
            />
          ) : currentView === 'feedback' ? (
            <ClientFeedbackView
              feedbacks={feedbacks}
              onUpdateFeedbackStatus={handleUpdateFeedbackStatus}
              onDeleteFeedback={handleDeleteFeedback}
            />
          ) : currentView === 'users' ? (
            <UserManagement
              users={users}
              currentUser={currentUser}
              auditLogs={auditLogs}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          ) : (
            <>
              {/* View Control & Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold tracking-tight text-white">{getViewTitle()}</h1>
                  {(selectedCategory || selectedFields.length > 0 || selectedTargetAudiences.length > 0) && (
                    <button
                      onClick={handleClearFilters}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      (Tüm Filtreleri Temizle)
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Category Management Button */}
                  <button
                    onClick={() => setIsManageCategoriesOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all"
                  >
                    <Folders className="w-3.5 h-3.5 text-blue-400" />
                    <span>Kategorileri Yönet</span>
                  </button>

                  {/* Grid vs List View Mode Switcher */}
                  <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
                    <button
                      onClick={() => setDisplayMode('grid')}
                      title="Kart Görünümü"
                      className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                        displayMode === 'grid'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Kartlar</span>
                    </button>
                    <button
                      onClick={() => setDisplayMode('list')}
                      title="Liste Görünümü"
                      className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                        displayMode === 'list'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Liste</span>
                    </button>
                  </div>

                  <span className="text-xs font-semibold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    {filteredPresentations.length} belge
                  </span>
                </div>
              </div>

              {/* Alan & Hedef Kitle Filter Bar */}
              <FilterBar
                presentations={presentations}
                selectedFields={selectedFields}
                selectedTargetAudiences={selectedTargetAudiences}
                allFields={allFields}
                allTargetAudiences={allTargetAudiences}
                onToggleField={handleToggleField}
                onToggleTargetAudience={handleToggleTargetAudience}
                onClearFilters={handleClearFilters}
                onOpenManageTaxonomy={() => setIsManageTaxonomyOpen(true)}
              />

              {/* Presentation Display: Grid or List */}
              {filteredPresentations.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-[#121929]/50 border border-slate-800/80 rounded-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Sunum Bulunamadı</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Arama kriterlerinize veya seçili kategoriye uygun sunum bulunmuyor. Yeni PDF sunumu yükleyebilirsiniz.
                    </p>
                  </div>
                  <button
                    onClick={handleAddNewPresentation}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>PDF Sunum Yükle</span>
                  </button>
                </div>
              ) : displayMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPresentations.map((presentation) => (
                    <PresentationCard
                      key={presentation.id}
                      presentation={presentation}
                      onToggleFavorite={handleToggleFavorite}
                      onDelete={handleDeletePresentation}
                      onOpenStudio={(p) => setActiveStudioPresentation(p)}
                      onDownloadPDF={(p) => generatePresentationPDF(p)}
                      onSelectField={handleToggleField}
                      onSelectTargetAudience={handleToggleTargetAudience}
                    />
                  ))}
                </div>
              ) : (
                <PresentationListView
                  presentations={filteredPresentations}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDeletePresentation}
                  onOpenStudio={(p) => setActiveStudioPresentation(p)}
                  onDownloadPDF={(p) => generatePresentationPDF(p)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Presentation Studio / Viewer Modal */}
      {activeStudioPresentation && (
        <PresentationStudioModal
          presentation={activeStudioPresentation}
          categories={categories}
          clients={clients}
          allFields={allFields}
          allTargetAudiences={allTargetAudiences}
          onClose={() => setActiveStudioPresentation(null)}
          onSave={handleSavePresentation}
          onAddField={handleAddField}
          onAddTargetAudience={handleAddTargetAudience}
        />
      )}

      {/* Manage Categories Modal */}
      {isManageCategoriesOpen && (
        <ManageCategoriesModal
          categories={categories}
          onClose={() => setIsManageCategoriesOpen(false)}
          onAddCategory={handleAddCategory}
          onEditCategory={handleEditCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      )}

      {/* Manage Taxonomy Modal (Alan ve Hedef Kitle Yönetimi) */}
      {isManageTaxonomyOpen && (
        <ManageTaxonomyModal
          allFields={allFields}
          allTargetAudiences={allTargetAudiences}
          presentations={presentations}
          onClose={() => setIsManageTaxonomyOpen(false)}
          onAddField={handleAddField}
          onEditField={handleEditField}
          onDeleteField={handleDeleteField}
          onAddTargetAudience={handleAddTargetAudience}
          onEditTargetAudience={handleEditTargetAudience}
          onDeleteTargetAudience={handleDeleteTargetAudience}
        />
      )}

      {/* Backup Upload Modal */}
      {isBackupModalOpen && (
        <BackupModal
          onClose={() => setIsBackupModalOpen(false)}
          onRestoreData={handleRestoreData}
          onPurgeTestData={handlePurgeTestData}
        />
      )}

      {/* Upload PDF Modal */}
      {isUploadPdfModalOpen && (
        <UploadPdfModal
          categories={categories}
          allFields={allFields}
          allTargetAudiences={allTargetAudiences}
          onClose={() => setIsUploadPdfModalOpen(false)}
          onAddPresentation={handleAddUploadedPresentation}
          onAddField={handleAddField}
          onAddTargetAudience={handleAddTargetAudience}
        />
      )}
    </div>
  );
}
