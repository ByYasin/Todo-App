import { Todo, Category, Tag, User } from './types';


const STORAGE_KEYS = {
  TODOS: 'todo_app_todos',
  CATEGORIES: 'todo_app_categories',
  TAGS: 'todo_app_tags',
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  SYNC_TIMESTAMP: 'todo_app_last_sync',
  PENDING_CHANGES: 'todo_app_pending_changes',
  BACKUP: 'todo_app_backup',
  SETTINGS: 'todo_app_settings',
  LAST_SYNC_SUCCESS: 'todo_app_last_sync_success'
};


export enum ChangeType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

export enum SyncStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}


export interface PendingChange {
  id: string;
  type: ChangeType;
  entityType: 'todo' | 'category' | 'tag';
  data: any;
  timestamp: number;
  retryCount?: number;
  status?: SyncStatus;
  errorMessage?: string;
}

export interface BackupData {
  todos: Todo[];
  categories: Category[];
  tags: Tag[];
  timestamp: number;
  version: string;
}

export interface AppSettings {
  enableAutoSync: boolean;
  syncInterval: number; // Dakika cinsinden
  darkMode: boolean;
  language: string;
  autoBackup: boolean;
  backupInterval: number; // Gün cinsinden
  maxBackupCount: number;
}

// Varsayılan uygulama ayarları
const DEFAULT_SETTINGS: AppSettings = {
  enableAutoSync: true,
  syncInterval: 5, // 5 dakika
  darkMode: false,
  language: 'tr',
  autoBackup: true,
  backupInterval: 1, // 1 gün
  maxBackupCount: 5
};


export const saveToLocalStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`LocalStorage kaydetme hatası (${key}):`, error);
  }
};


export const getFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`LocalStorage okuma hatası (${key}):`, error);
    return defaultValue;
  }
};


// Veri boyutunu kontrol et
export const getStorageSize = (key: string): number => {
  try {
    const item = localStorage.getItem(key);
    return item ? new Blob([item]).size : 0;
  } catch (error) {
    console.error(`LocalStorage boyut hesaplama hatası (${key}):`, error);
    return 0;
  }
};


// Settings işlemleri
export const getSettings = (): AppSettings => {
  return getFromLocalStorage<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
};

export const saveSettings = (settings: Partial<AppSettings>): void => {
  const currentSettings = getSettings();
  saveToLocalStorage(STORAGE_KEYS.SETTINGS, { ...currentSettings, ...settings });
};


// Todo işlemleri
export const saveTodos = (todos: Todo[]): void => {
  saveToLocalStorage(STORAGE_KEYS.TODOS, todos);
  
  // Ayarlara göre otomatik yedekleme
  const settings = getSettings();
  if (settings.autoBackup) {
    const lastBackup = getLastBackupTimestamp();
    const daysSinceLastBackup = (Date.now() - lastBackup) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastBackup >= settings.backupInterval) {
      createBackup();
    }
  }
};


export const getTodos = (): Todo[] => {
  return getFromLocalStorage<Todo[]>(STORAGE_KEYS.TODOS, []);
};


// Kategori işlemleri
export const saveCategories = (categories: Category[]): void => {
  saveToLocalStorage(STORAGE_KEYS.CATEGORIES, categories);
};


export const getCategories = (): Category[] => {
  return getFromLocalStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);
};


// Etiket işlemleri
export const saveTags = (tags: Tag[]): void => {
  saveToLocalStorage(STORAGE_KEYS.TAGS, tags);
};


export const getTags = (): Tag[] => {
  return getFromLocalStorage<Tag[]>(STORAGE_KEYS.TAGS, []);
};


// Kullanıcı oturum işlemleri
export const saveAuthToken = (token: string): void => {
  saveToLocalStorage(STORAGE_KEYS.AUTH_TOKEN, token);
};

export const getAuthToken = (): string | null => {
  return getFromLocalStorage<string | null>(STORAGE_KEYS.AUTH_TOKEN, null);
};

export const saveUser = (user: User): void => {
  saveToLocalStorage(STORAGE_KEYS.USER, user);
};

export const getUser = (): User | null => {
  return getFromLocalStorage<User | null>(STORAGE_KEYS.USER, null);
};

export const clearAuth = (): void => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
};


// Senkronizasyon işlemleri
export const saveLastSyncTimestamp = (): void => {
  saveToLocalStorage(STORAGE_KEYS.SYNC_TIMESTAMP, Date.now());
};


export const getLastSyncTimestamp = (): number => {
  return getFromLocalStorage<number>(STORAGE_KEYS.SYNC_TIMESTAMP, 0);
};


export const saveLastSyncSuccess = (success: boolean): void => {
  saveToLocalStorage(STORAGE_KEYS.LAST_SYNC_SUCCESS, {
    success,
    timestamp: Date.now()
  });
};


export const getLastSyncSuccess = (): { success: boolean; timestamp: number } => {
  return getFromLocalStorage<{ success: boolean; timestamp: number }>(
    STORAGE_KEYS.LAST_SYNC_SUCCESS, 
    { success: true, timestamp: 0 }
  );
};


// Bekleyen değişiklik işlemleri
export const addPendingChange = (change: Omit<PendingChange, 'id' | 'timestamp' | 'status'>): string => {
  const pendingChanges = getPendingChanges();
  
  // Benzersiz ID oluştur
  const changeId = `${change.entityType}_${change.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newChange: PendingChange = {
    ...change,
    id: changeId,
    timestamp: Date.now(),
    retryCount: 0,
    status: SyncStatus.PENDING
  };
  
  pendingChanges.push(newChange);
  
  saveToLocalStorage(STORAGE_KEYS.PENDING_CHANGES, pendingChanges);
  
  return changeId;
};


export const getPendingChanges = (): PendingChange[] => {
  return getFromLocalStorage<PendingChange[]>(STORAGE_KEYS.PENDING_CHANGES, []);
};


export const updatePendingChange = (changeId: string, updates: Partial<PendingChange>): void => {
  const pendingChanges = getPendingChanges();
  const updatedChanges = pendingChanges.map(change => 
    change.id === changeId ? { ...change, ...updates } : change
  );
  
  saveToLocalStorage(STORAGE_KEYS.PENDING_CHANGES, updatedChanges);
};


export const clearPendingChange = (changeId: string): void => {
  const pendingChanges = getPendingChanges();
  const filteredChanges = pendingChanges.filter(change => change.id !== changeId);
  saveToLocalStorage(STORAGE_KEYS.PENDING_CHANGES, filteredChanges);
};


export const clearAllPendingChanges = (): void => {
  saveToLocalStorage(STORAGE_KEYS.PENDING_CHANGES, []);
};


// Veri senkronizasyonu
export const syncDataToLocalStorage = (
  todos: Todo[],
  categories: Category[],
  tags: Tag[] = []
): void => {
  saveTodos(todos);
  saveCategories(categories);
  saveTags(tags);
  saveLastSyncTimestamp();
  saveLastSyncSuccess(true);
};


// Todo işlemleri
export const addTodoOffline = (todo: Todo): Todo => {
  const todos = getTodos();
  
  // Geçici ID oluştur (sunucudan dönmediği için)
  const tempId = Date.now();
  const todoWithId = { ...todo, id: tempId };
  
  // Yerel listeye ekle
  todos.unshift(todoWithId);
  saveTodos(todos);
  
  // Bekleyen değişiklik olarak kaydet
  addPendingChange({
    type: ChangeType.CREATE,
    entityType: 'todo',
    data: todoWithId
  });
  
  return todoWithId;
};


export const updateTodoOffline = (todo: Todo): void => {
  if (!todo.id) return;
  
  const todos = getTodos();
  const updatedTodos = todos.map(t => t.id === todo.id ? todo : t);
  
  saveTodos(updatedTodos);
  
  // Bekleyen değişiklik olarak kaydet
  addPendingChange({
    type: ChangeType.UPDATE,
    entityType: 'todo',
    data: todo
  });
};


export const deleteTodoOffline = (id: number): void => {
  const todos = getTodos();
  const filteredTodos = todos.filter(todo => todo.id !== id);
  
  saveTodos(filteredTodos);
  
  // Bekleyen değişiklik olarak kaydet
  addPendingChange({
    type: ChangeType.DELETE,
    entityType: 'todo',
    data: { id }
  });
};


// Kategori işlemleri
export const addCategoryOffline = (category: Category): Category => {
  const categories = getCategories();
  
  // Geçici ID oluştur (sunucudan dönmediği için)
  const tempId = Date.now();
  const categoryWithId = { ...category, id: tempId };
  
  // Yerel listeye ekle
  categories.push(categoryWithId);
  saveCategories(categories);
  
  // Bekleyen değişiklik olarak kaydet
  addPendingChange({
    type: ChangeType.CREATE,
    entityType: 'category',
    data: categoryWithId
  });
  
  return categoryWithId;
};


export const updateCategoryOffline = (category: Category): void => {
  if (!category.id) return;
  
  const categories = getCategories();
  const updatedCategories = categories.map(c => c.id === category.id ? category : c);
  
  saveCategories(updatedCategories);
  
  // Bekleyen değişiklik olarak kaydet
  addPendingChange({
    type: ChangeType.UPDATE,
    entityType: 'category',
    data: category
  });
};


export const deleteCategoryOffline = (id: number): void => {
  const categories = getCategories();
  const filteredCategories = categories.filter(category => category.id !== id);
  
  saveCategories(filteredCategories);
  
  // Bekleyen değişiklik olarak kaydet
  addPendingChange({
    type: ChangeType.DELETE,
    entityType: 'category',
    data: { id }
  });
};


// Yedekleme ve geri yükleme
export const createBackup = (): string => {
  const backup: BackupData = {
    todos: getTodos(),
    categories: getCategories(),
    tags: getTags(),
    timestamp: Date.now(),
    version: '1.0.0'
  };
  
  // Yedekleme ID'si oluştur
  const backupId = `backup_${Date.now()}`;
  
  // Mevcut yedeklemeleri al
  const backups = getFromLocalStorage<Record<string, BackupData>>(STORAGE_KEYS.BACKUP, {});
  
  // Yeni yedeklemeyi ekle
  backups[backupId] = backup;
  
  // Yedekleme sayısını kontrol et ve eski yedeklemeleri temizle
  const settings = getSettings();
  const backupIds = Object.keys(backups).sort((a, b) => backups[b].timestamp - backups[a].timestamp);
  
  if (backupIds.length > settings.maxBackupCount) {
    const idsToRemove = backupIds.slice(settings.maxBackupCount);
    idsToRemove.forEach(id => {
      delete backups[id];
    });
  }
  
  // Yedeklemeleri kaydet
  saveToLocalStorage(STORAGE_KEYS.BACKUP, backups);
  
  return backupId;
};


export const getBackups = (): Record<string, BackupData> => {
  return getFromLocalStorage<Record<string, BackupData>>(STORAGE_KEYS.BACKUP, {});
};


export const getLastBackupTimestamp = (): number => {
  const backups = getBackups();
  const backupIds = Object.keys(backups);
  
  if (backupIds.length === 0) return 0;
  
  const lastBackup = backupIds
    .map(id => backups[id].timestamp)
    .sort((a, b) => b - a)[0];
  
  return lastBackup;
};


export const restoreBackup = (backupId: string): boolean => {
  const backups = getBackups();
  
  if (!backups[backupId]) return false;
  
  const backup = backups[backupId];
  
  // Veriyi geri yükle
  saveTodos(backup.todos);
  saveCategories(backup.categories);
  saveTags(backup.tags);
  
  return true;
};


export const deleteBackup = (backupId: string): boolean => {
  const backups = getBackups();
  
  if (!backups[backupId]) return false;
  
  delete backups[backupId];
  saveToLocalStorage(STORAGE_KEYS.BACKUP, backups);
  
  return true;
};


// Çevrimdışı değişiklikleri senkronize et
export const syncOfflineChanges = async (api: any): Promise<{
  success: number;
  failed: number;
  remaining: number;
}> => {
  const pendingChanges = getPendingChanges();
  
  if (pendingChanges.length === 0) {
    return { success: 0, failed: 0, remaining: 0 };
  }
  
  // Değişiklikleri sıralayarak işlem sırasını doğru tut
  // (önce oluşturma, sonra güncelleme, en son silme)
  const sortedChanges = [...pendingChanges].sort((a, b) => {
    const typeOrder = {
      [ChangeType.CREATE]: 0,
      [ChangeType.UPDATE]: 1,
      [ChangeType.DELETE]: 2
    };
    
    // Öncelikle durum sırasına göre
    if (a.status !== b.status) {
      if (a.status === SyncStatus.PENDING) return -1;
      if (b.status === SyncStatus.PENDING) return 1;
    }
    
    // Sonra işlem türüne göre
    return typeOrder[a.type] - typeOrder[b.type];
  });
  
  let success = 0;
  let failed = 0;
  let remaining = 0;
  
  // Maksimum işlenecek değişiklik sayısı (her seferinde çok fazla işlemi önlemek için)
  const MAX_CHANGES_PER_SYNC = 10;
  const changesToProcess = sortedChanges.slice(0, MAX_CHANGES_PER_SYNC);
  
  for (const change of changesToProcess) {
    // Başarısız olmuş ve çok fazla deneme yapılmışsa atla
    if (change.status === SyncStatus.FAILED && (change.retryCount || 0) >= 3) {
      failed++;
      continue;
    }
    
    // İşlemi güncelle - işleniyor durumuna getir
    updatePendingChange(change.id, { 
      status: SyncStatus.PENDING,
      retryCount: (change.retryCount || 0) + 1
    });
    
    try {
      switch (change.type) {
        case ChangeType.CREATE:
          if (change.entityType === 'todo') {
            await api.post('/todos', change.data);
          } else if (change.entityType === 'category') {
            await api.post('/categories', change.data);
          } else if (change.entityType === 'tag') {
            await api.post('/tags', change.data);
          }
          break;
          
        case ChangeType.UPDATE:
          if (change.entityType === 'todo' && change.data.id) {
            await api.put(`/todos/${change.data.id}`, change.data);
          } else if (change.entityType === 'category' && change.data.id) {
            await api.put(`/categories/${change.data.id}`, change.data);
          } else if (change.entityType === 'tag' && change.data.id) {
            await api.put(`/tags/${change.data.id}`, change.data);
          }
          break;
          
        case ChangeType.DELETE:
          if (change.entityType === 'todo' && change.data.id) {
            await api.delete(`/todos/${change.data.id}`);
          } else if (change.entityType === 'category' && change.data.id) {
            await api.delete(`/categories/${change.data.id}`);
          } else if (change.entityType === 'tag' && change.data.id) {
            await api.delete(`/tags/${change.data.id}`);
          }
          break;
      }
      
      // Başarılı işlenen değişikliği temizle
      clearPendingChange(change.id);
      success++;
      
    } catch (error) {
      console.error('Çevrimdışı değişiklik senkronizasyon hatası:', error);
      
      // Hata durumunu güncelle
      updatePendingChange(change.id, { 
        status: SyncStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Bilinmeyen hata'
      });
      
      failed++;
      // Hata olsa bile diğer değişiklikleri işlemeye devam et
    }
  }
  
  // Kalan değişiklik sayısını hesapla
  remaining = pendingChanges.length - success - failed;
  
  // Son senkronizasyon durumunu kaydet
  saveLastSyncTimestamp();
  saveLastSyncSuccess(failed === 0);
  
  return { success, failed, remaining };
};


// LocalStorage modülünü export et
export default {
  saveTodos,
  getTodos,
  saveCategories,
  getCategories,
  saveTags,
  getTags,
  saveAuthToken,
  getAuthToken,
  saveUser,
  getUser,
  clearAuth,
  saveLastSyncTimestamp,
  getLastSyncTimestamp,
  addPendingChange,
  getPendingChanges,
  updatePendingChange,
  clearPendingChange,
  clearAllPendingChanges,
  syncDataToLocalStorage,
  addTodoOffline,
  updateTodoOffline,
  deleteTodoOffline,
  addCategoryOffline,
  updateCategoryOffline,
  deleteCategoryOffline,
  createBackup,
  getBackups,
  restoreBackup,
  deleteBackup,
  syncOfflineChanges,
  getSettings,
  saveSettings,
  getStorageSize,
  getLastSyncSuccess,
  saveLastSyncSuccess,
  getLastBackupTimestamp
}; 