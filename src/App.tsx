import React, { useState, useEffect, useMemo, createContext } from 'react'
import axios from 'axios'
import './App.css'
import DraggableTodoList from './components/DraggableTodoList'
import TodoForm from './components/TodoForm'
import CategorySelector from './components/CategorySelector'
import CategoryManagement from './components/CategoryManagement'
import SearchBar from './components/SearchBar'
import StatsPanel from './components/Stats/StatsPanel'
import Header from './components/Header'
import { Todo, Category, User, AuthState, SearchFilters, SubscriptionPlan } from './types'
import AuthModal from './components/Auth/AuthModal'
import * as LocalStorage from './LocalStorage'
import SubscriptionPage from './pages/SubscriptionPage'
import { TodoProvider, TodoContextType } from './context/TodoContext'
import { SUBSCRIPTION_PLANS, getUserPlan, canUseFeature, getRemainingLimit, getUpgradeMessage } from './utils/subscription'

// Backend API URL
const API_URL = 'http://localhost:5000/api'

// Todo Context tipini tanımla
export type TodoContextType = {
  todos: Todo[];
  categories: Category[];
  user: User | null;
  isAuthenticated: boolean;
  addTodo: (todo: Todo) => Promise<void>;
  updateTodo: (todo: Todo) => Promise<void>;
  deleteTodo: (id: number) => Promise<void>;
  editTodo: (todo: Todo) => void;
  updateTodoStatus: (id: number, status: string) => Promise<void>;
  updateCategories: (categories: Category[]) => void;
  searchFilters: SearchFilters;
  handleSearch: (filters: SearchFilters) => void;
  subscriptionPlan: SubscriptionPlan;
  canUseFeature: (feature: string) => boolean;
  getRemainingTodoLimit: () => number;
  openUpgradeModal: () => void;
  isUpgradeModalOpen: boolean;
  closeUpgradeModal: () => void;
  handleSubscriptionChange: (plan: SubscriptionPlan) => void;
}

// Todo Context'i oluştur
export const TodoContext = createContext<TodoContextType | null>(null);

// Token yenileme fonksiyonu
const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;

    const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    const { token, user } = response.data;
    
    // Yeni token'ı kaydet
    localStorage.setItem('auth_token', token);
    
    return { token, user };
  } catch (error) {
    console.error('Token yenileme hatası:', error);
    // Hata durumunda oturumu sonlandır
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    return null;
  }
};

// API durumunu kontrol eden fonksiyon
const checkApiStatus = async () => {
  try {
    const res = await axios.get(`${API_URL}/health`, { timeout: 2000 })
    return res.data
  } catch (error) {
    console.error('API kontrol hatası:', error)
    return { status: 'offline', dbConnected: false }
  }
}

// API istekleri için axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 5000
})

// Axios interceptor ile her istekte token ekle
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// Axios response interceptor ile 401 hatalarında token yenileme
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Eğer 401 hatası alındıysa ve bu istek daha önce yenilenmemişse
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Token'ı yenilemeyi dene
      const authData = await refreshToken();
      
      // Token yenilendi ise, isteği tekrarla
      if (authData) {
        originalRequest.headers['Authorization'] = `Bearer ${authData.token}`;
        return api(originalRequest);
      }
    }
    
    return Promise.reject(error);
  }
);

// API hata durumunda tekrar deneme mekanizması
const apiRequestWithRetry = async (requestFn: () => Promise<any>) => {
  let retries = 3;
  
  while (retries > 0) {
    try {
      return await requestFn();
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await new Promise(r => setTimeout(r, 1000)); // 1 saniye bekle
    }
  }
};

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentTodo, setCurrentTodo] = useState<Todo | null>(null)
  const [apiConnected, setApiConnected] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<number>(0)
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
    error: null
  })
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // localStorage'dan dark mode tercihini oku, yoksa varsayılan olarak true
    const savedTheme = localStorage.getItem('theme')
    return savedTheme ? savedTheme === 'dark' : true
  })
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    text: '',
    status: [],
    priority: [],
    categories: [],
    tags: [],
    startDate: null,
    endDate: null
  });
  const [showStats, setShowStats] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [sortMethod, setSortMethod] = useState<string>('default');
  const [showSubscriptionPage, setShowSubscriptionPage] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Zorunlu giriş modalını kontrol etmek için state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  
  // Giriş mi Kayıt mı olduğunu belirleyen state
  const [isInitialLogin, setIsInitialLogin] = useState(true)

  // Dark mode değiştiğinde localStorage'a kaydet
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  // Tema değiştirme
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev)
  }

  // Kullanıcı kimlik kontrolü
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const user = localStorage.getItem('user')
    
    if (token && user) {
      setAuthState({
        isAuthenticated: true,
        user: JSON.parse(user),
        token,
        loading: false,
        error: null
      })
      
      // Token geçerliliğini kontrol et
      checkTokenValidity();
      
      // Periyodik token yenileme kontrolü (her 10 dakikada bir)
      const tokenCheckInterval = setInterval(() => {
        checkTokenValidity();
      }, 10 * 60 * 1000);
      
      return () => clearInterval(tokenCheckInterval);
    } else {
      setAuthState(prev => ({
        ...prev,
        loading: false
      }))
    }
  }, [])

  // Bekleyen değişiklikleri kontrol et
  useEffect(() => {
    const checkPendingChanges = () => {
      const changes = LocalStorage.getPendingChanges();
      setPendingChanges(changes.length);
    };
    
    checkPendingChanges();
    const interval = setInterval(checkPendingChanges, 10000); // Her 10 saniyede kontrol et
    return () => clearInterval(interval);
  }, []);

  // Kullanıcı kimlik değişimi olduğunda
  const handleAuthChange = (token: string, refreshToken: string, user: User) => {
    // Tokenları ve kullanıcı bilgisini sakla
    localStorage.setItem('auth_token', token);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    setAuthState({
      isAuthenticated: true,
      user,
      token,
      loading: false,
      error: null
    })
    
    // Auth modalını kapat
    setIsAuthModalOpen(false);
    
    // Kullanıcıya özel verileri güncelle
    fetchData();
    
    // Başarılı giriş mesajı
    setApiError(`Hoş geldiniz, ${user.username}! Başarıyla giriş yaptınız.`);
    setTimeout(() => setApiError(null), 3000);
  }

  // Token'ın geçerliliğini kontrol et
  const checkTokenValidity = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;
    
    try {
      // Kullanıcı bilgilerini doğrula
      await api.get('/auth/validate');
      return true;
    } catch (error) {
      console.log('Token geçersiz, yenileniyor...');
      
      // Token yenilemeyi dene
      const authData = await refreshToken();
      if (authData) {
        // Kullanıcı state'ini güncelle
        setAuthState({
          isAuthenticated: true,
          user: authData.user,
          token: authData.token,
          loading: false,
          error: null
        });
        return true;
      }
      
      // Token yenilenemezse oturumu sonlandır
      handleLogout();
      return false;
    }
  };

  // Kullanıcı çıkış yaptığında
  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null
    })
    
    // Genel verileri güncelle
    fetchData()
  }

  // Offline değişiklikleri senkronize et
  const syncOfflineChanges = async () => {
    if (!apiConnected) {
      setApiError('Sunucu bağlantısı kurulamadı, değişiklikler yerel olarak saklandı');
      return;
    }
    
    try {
      await LocalStorage.syncOfflineChanges(api);
      setPendingChanges(LocalStorage.getPendingChanges().length);
      
      if (pendingChanges > 0 && LocalStorage.getPendingChanges().length === 0) {
        setApiError('Çevrimdışı değişiklikler başarıyla senkronize edildi');
        setTimeout(() => setApiError(null), 3000);
      }
      
      // Sunucudan en güncel verileri çek
      fetchData();
    } catch (error) {
      console.error('Değişiklikleri senkronize etme hatası:', error);
      setApiError('Değişiklikler senkronize edilemedi, daha sonra tekrar deneyin');
    }
  };

  // API'ye bağlanma durumunu kontrol et
  const checkApiConnection = async () => {
    try {
      const apiStatus = await checkApiStatus();
      const isConnected = apiStatus.status === 'online';
      
      // Offline mod değiştiyse kullanıcıya bildir
      if (isOfflineMode && isConnected) {
        setApiError('İnternet bağlantısı yeniden sağlandı, değişiklikler senkronize ediliyor...');
        setTimeout(() => setApiError(null), 3000);
        syncOfflineChanges();
      } else if (!isOfflineMode && !isConnected) {
        setApiError('İnternet bağlantısı kesildi, çevrimdışı modda çalışılıyor');
      }
      
      setApiConnected(isConnected);
      setIsOfflineMode(!isConnected);
      
      return isConnected;
    } catch (error) {
      setApiConnected(false);
      setIsOfflineMode(true);
      return false;
    }
  };

  // Fetch todos and categories on component mount
  useEffect(() => {
    fetchData()
    
    // API durumunu periyodik olarak kontrol et
    const apiCheckInterval = setInterval(async () => {
      const isConnected = await checkApiConnection();
      
      // Bağlantı varsa ve bekleyen değişiklikler varsa senkronize et
      if (isConnected && LocalStorage.getPendingChanges().length > 0) {
        syncOfflineChanges();
      }
    }, 30000) // Her 30 saniyede bir kontrol et
    
    return () => clearInterval(apiCheckInterval)
  }, [])

  // Verileri yeniden çekme fonksiyonu
  const fetchData = async () => {
    setApiError(null)
    
    try {
      // API durumunu kontrol et
      const isConnected = await checkApiConnection();
      
      // API bağlıysa veri çek
      if (isConnected) {
        try {
          // Kullanıcıya göre filtrele
          const userId = authState.user?.id;
          
          // Fetch categories - kullanıcının kendi kategorileri + herkese açık kategorileri getir
          const categoryRes = await apiRequestWithRetry(() => 
            api.get('/categories', {
              params: { user_id: userId, include_public: true }
            })
          );
          
          if (categoryRes.data && Array.isArray(categoryRes.data)) {
            setCategories(categoryRes.data);
            // Kategorileri locale kaydet
            LocalStorage.saveCategories(categoryRes.data);
          } else {
            console.error('Kategori verisi geçersiz:', categoryRes.data);
            // LocalStorage'dan yedekleri yükle
            const localCategories = LocalStorage.getCategories();
            if (localCategories.length > 0) {
              setCategories(localCategories);
            } else {
              setCategories([
                { id: 1, name: 'İş', color: '#ef4444' },
                { id: 2, name: 'Kişisel', color: '#3b82f6' },
                { id: 3, name: 'Öğrenim', color: '#10b981' },
                { id: 4, name: 'Diğer', color: '#f59e0b' }
              ]);
            }
          }
          
          // Fetch todos - sadece kullanıcının kendisine ait görevleri getir
          const todoRes = await apiRequestWithRetry(() => 
            api.get('/todos', {
              params: { user_id: userId }
            })
          );
          
          setTodos(todoRes.data);
          // Todoları locale kaydet
          LocalStorage.saveTodos(todoRes.data);
          
          // Son senkronizasyon zamanını kaydet
          LocalStorage.saveLastSyncTimestamp();
        } catch (error) {
          console.error('Veri çekme hatası:', error);
          setApiError('Veriler sunucudan yüklenemedi, yerel veriler kullanılıyor');
          
          // Yerel veri ile devam et
          const localTodos = LocalStorage.getTodos();
          const localCategories = LocalStorage.getCategories();
          
          if (localCategories.length > 0) {
            setCategories(localCategories);
          } else {
            setCategories([
              { id: 1, name: 'İş', color: '#ef4444' },
              { id: 2, name: 'Kişisel', color: '#3b82f6' },
              { id: 3, name: 'Öğrenim', color: '#10b981' },
              { id: 4, name: 'Diğer', color: '#f59e0b' }
            ]);
          }
          
          if (localTodos.length > 0) {
            setTodos(localTodos);
          }
        }
      } else {
        // Çevrimdışı: Yerel veriyi kullan
        const localTodos = LocalStorage.getTodos();
        const localCategories = LocalStorage.getCategories();
        
        if (localCategories.length > 0) {
          setCategories(localCategories);
        } else {
          setCategories([
            { id: 1, name: 'İş', color: '#ef4444' },
            { id: 2, name: 'Kişisel', color: '#3b82f6' },
            { id: 3, name: 'Öğrenim', color: '#10b981' },
            { id: 4, name: 'Diğer', color: '#f59e0b' }
          ]);
        }
        
        if (localTodos.length > 0) {
          setTodos(localTodos);
        }
        
        setApiError('Sunucu bağlantısı kurulamadı, çevrimdışı modda çalışılıyor');
      }
    } catch (error) {
      console.error('Veri çekme veya API durumu hatası:', error);
      setApiError('Bir hata oluştu, çevrimdışı modda çalışılıyor');
      
      // Çevrimdışı moda geç
      setApiConnected(false);
      setIsOfflineMode(true);
      
      // Yerel veri ile devam et
      const localTodos = LocalStorage.getTodos();
      const localCategories = LocalStorage.getCategories();
      
      if (localCategories.length > 0) {
        setCategories(localCategories);
      } else {
        setCategories([
          { id: 1, name: 'İş', color: '#ef4444' },
          { id: 2, name: 'Kişisel', color: '#3b82f6' },
          { id: 3, name: 'Öğrenim', color: '#10b981' },
          { id: 4, name: 'Diğer', color: '#f59e0b' }
        ]);
      }
      
      if (localTodos.length > 0) {
        setTodos(localTodos);
      }
    } finally {
      // Veri yükleme işlemi tamamlandı
    }
  };

  // Abonelik planını değiştirme fonksiyonu
  const handleSubscriptionChange = async (plan: SubscriptionPlan) => {
    try {
      console.log("Abonelik değişiyor:", plan);
      
      if (!authState.user) {
        setApiError('Oturum açmanız gerekiyor');
        setTimeout(() => setApiError(null), 3000);
        return;
      }

      // Aynı planı seçtiyse zaten o planda olduğunu bildir
      if (authState.user.subscription_plan === plan) {
        setApiError(`Zaten ${SUBSCRIPTION_PLANS[plan].name} planındasınız.`);
        setTimeout(() => setApiError(null), 3000);
        
        // Abonelik sayfasını kapat
        setShowSubscriptionPage(false);
        return;
      }
      
      // Önce API'ye istek gönder
      if (apiConnected) {
        try {
          const response = await api.put(`/users/${authState.user.id}/subscription`, {
            plan: plan
          });
          
          if (response && response.data && response.data.user) {
            // API başarılı cevap verirse, dönen kullanıcı bilgisi ile state'i güncelle
            const updatedUser: User = response.data.user;
            
            // Kullanıcı bilgilerini localStorage'a kaydet
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // AuthState güncelle
            setAuthState(prev => ({
              ...prev,
              user: updatedUser
            }));
            
            // Başarı mesajını göster
            setApiError(`${SUBSCRIPTION_PLANS[plan].name} planına geçiş başarılı! Yeni özellikler aktif.`);
            
            // Ana sayfaya dön (abonelik sayfasını kapat)
            // Daha uzun bir gecikme ile abonelik sayfasını kapat
            setTimeout(() => {
              setShowSubscriptionPage(false);
              setIsUpgradeModalOpen(false);
              console.log("Abonelik sayfası kapatıldı");
            }, 1000);
            
            // Bildirim mesajını daha sonra temizle
            setTimeout(() => setApiError(null), 4000);
            
            return;
          }
        } catch (error) {
          console.error('Abonelik güncellenirken API hatası:', error);
          // Eğer API hatası varsa, kullanıcıya bildir ama yine de devam et
          setApiError('Sunucu hatası: Plan güncelleme işlemi yerel olarak yapıldı, bağlantı sağlandığında senkronize edilecek');
          setTimeout(() => setApiError(null), 3000);
        }
      }
      
      // API bağlantısı yoksa veya API hatası varsa, yerel olarak güncelle
      const updatedUser: User = {
        ...authState.user,
        subscription_plan: plan,
        // Bugünden 30 gün sonra
        subscription_expires: new Date(
          new Date().setDate(new Date().getDate() + 30)
        ).toISOString(),
      };
      
      // Kullanıcı bilgilerini localStorage'a kaydet
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // AuthState güncelle
      setAuthState(prev => ({
        ...prev,
        user: updatedUser
      }));
      
      // Başarı mesajını göster
      setApiError(`${SUBSCRIPTION_PLANS[plan].name} planına geçiş başarılı! Yeni özellikler aktif.`);
      
      // Ana sayfaya dön (abonelik sayfasını kapat)
      // Daha uzun bir gecikme ile abonelik sayfasını kapat
      setTimeout(() => {
        setShowSubscriptionPage(false);
        setIsUpgradeModalOpen(false);
        console.log("Abonelik sayfası kapatıldı");
      }, 1000);
      
      // Bildirim mesajını daha sonra temizle
      setTimeout(() => setApiError(null), 4000);
      
    } catch (error) {
      console.error('Abonelik değiştirme hatası:', error);
      setApiError('Abonelik değiştirilirken bir hata oluştu. Lütfen tekrar deneyin.');
      setTimeout(() => setApiError(null), 3000);
    }
  };
  
  // Özellik kullanılabilir mi kontrolü
  const canUserUseFeature = (feature: string) => {
    return canUseFeature(authState.user, feature as any);
  };
  
  // Kalan görev limiti
  const getRemainingTodoLimit = () => {
    return getRemainingLimit(authState.user, 'max_todos', todos.length);
  };
  
  // Yükseltme modalını aç
  const openUpgradeModal = () => {
    setIsUpgradeModalOpen(true);
  };
  
  // Yükseltme modalını kapat
  const closeUpgradeModal = () => {
    setIsUpgradeModalOpen(false);
  };
  
  // Abonelik sayfasını göster/gizle
  const toggleSubscriptionPage = () => {
    // Önce olası hataları temizleyelim
    setApiError(null);
    
    // Önceki state'in tersini ayarlayarak toggle işlemi yapılıyor
    setShowSubscriptionPage(prev => {
      console.log("Abonelik sayfası durumu değişiyor:", !prev);
      return !prev;
    });
    
    // Eğer yükseltme modalı açıksa onu kapatalım
    if (isUpgradeModalOpen) {
      setIsUpgradeModalOpen(false);
    }
  };
  
  // Kullanıcı şu anda etkin olan abonelik planı
  const subscriptionPlan = useMemo(() => {
    return getUserPlan(authState.user);
  }, [authState.user]);

  // Görev ekleme fonksiyonu - abonelik sınırlamaları ile güncellendi
  const addTodo = async (todo: Todo) => {
    try {
      // Görev limitini kontrol et
      const remainingLimit = getRemainingTodoLimit();
      // Enterprise planında sınırsız görev oluşturma hakkı (-1 değeri) 
      if (remainingLimit === 0) {
        // Limit aşılmışsa, kullanıcıya bildir ve yükseltme öner
        setApiError(getUpgradeMessage('todos'));
        openUpgradeModal();
        return;
      }

      if (!apiConnected) {
        // Çevrimdışı mod: LocalStorage'a kaydet
        LocalStorage.addTodoOffline(todo);
        const localTodos = LocalStorage.getTodos();
        setTodos(localTodos);
        setPendingChanges(LocalStorage.getPendingChanges().length);
        setApiError('Görev çevrimdışı olarak eklendi, internet bağlantısı sağlandığında senkronize edilecek');
        setTimeout(() => setApiError(null), 3000);
        return;
      }
      
      const res = await apiRequestWithRetry(() => api.post('/todos', todo));
      setTodos(prev => [res.data, ...prev]);
      
      // Localden de güncelle
      LocalStorage.saveTodos([res.data, ...todos]);
      
      setApiError('Görev başarıyla eklendi');
      setTimeout(() => setApiError(null), 3000);
    } catch (error) {
      console.error('Todo ekleme hatası:', error);
      
      // API hatası: LocalStorage'a kaydet
      LocalStorage.addTodoOffline(todo);
      const localTodos = LocalStorage.getTodos();
      setTodos(localTodos);
      setPendingChanges(LocalStorage.getPendingChanges().length);
      
      setApiError('Sunucu hatası: Görev yerel olarak kaydedildi, internet bağlantısı sağlandığında senkronize edilecek');
      setTimeout(() => setApiError(null), 3000);
      
      // API bağlantısını kontrol et
      checkApiConnection();
    }
  };

  // Todo güncelle
  const updateTodo = async (updatedTodo: Todo) => {
    if (!updatedTodo.id) return;
    
    if (!apiConnected) {
      // Çevrimdışı mod: LocalStorage'a kaydet
      LocalStorage.updateTodoOffline(updatedTodo);
      const localTodos = LocalStorage.getTodos();
      setTodos(localTodos);
      setPendingChanges(LocalStorage.getPendingChanges().length);
      setApiError('Görev çevrimdışı olarak güncellendi, internet bağlantısı sağlandığında senkronize edilecek');
      setTimeout(() => setApiError(null), 3000);
      return;
    }
    
    try {
      await apiRequestWithRetry(() => api.put(`/todos/${updatedTodo.id}`, updatedTodo));
      
      setTodos(prev => 
        prev.map(todo => todo.id === updatedTodo.id ? updatedTodo : todo)
      );
      
      // Localden de güncelle
      LocalStorage.saveTodos(todos.map(todo => todo.id === updatedTodo.id ? updatedTodo : todo));
      
      setApiError('Görev başarıyla güncellendi');
      setTimeout(() => setApiError(null), 3000);
    } catch (error) {
      console.error('Todo güncelleme hatası:', error);
      
      // API hatası: LocalStorage'a kaydet
      LocalStorage.updateTodoOffline(updatedTodo);
      const localTodos = LocalStorage.getTodos();
      setTodos(localTodos);
      setPendingChanges(LocalStorage.getPendingChanges().length);
      
      setApiError('Sunucu hatası: Görev yerel olarak güncellendi, internet bağlantısı sağlandığında senkronize edilecek');
      setTimeout(() => setApiError(null), 3000);
      
      // API bağlantısını kontrol et
      checkApiConnection();
    }
  };

  // Todo sil
  const deleteTodo = async (id: number) => {
    if (!apiConnected) {
      // Çevrimdışı mod: LocalStorage'a kaydet
      LocalStorage.deleteTodoOffline(id);
      const localTodos = LocalStorage.getTodos();
      setTodos(localTodos);
      setPendingChanges(LocalStorage.getPendingChanges().length);
      setApiError('Görev çevrimdışı olarak silindi, internet bağlantısı sağlandığında senkronize edilecek');
      setTimeout(() => setApiError(null), 3000);
      return;
    }
    
    try {
      await apiRequestWithRetry(() => api.delete(`/todos/${id}`));
      
      setTodos(prev => prev.filter(todo => todo.id !== id));
      
      // Localden de güncelle
      LocalStorage.saveTodos(todos.filter(todo => todo.id !== id));
      
      setApiError('Görev başarıyla silindi');
      setTimeout(() => setApiError(null), 3000);
    } catch (error) {
      console.error('Todo silme hatası:', error);
      
      // API hatası: LocalStorage'a kaydet
      LocalStorage.deleteTodoOffline(id);
      const localTodos = LocalStorage.getTodos();
      setTodos(localTodos);
      setPendingChanges(LocalStorage.getPendingChanges().length);
      
      setApiError('Sunucu hatası: Görev yerel olarak silindi, internet bağlantısı sağlandığında senkronize edilecek');
      setTimeout(() => setApiError(null), 3000);
      
      // API bağlantısını kontrol et
      checkApiConnection();
    }
  };

  // Edit todo (open modal with current todo)
  const editTodo = (todo: Todo) => {
    setCurrentTodo(todo)
    setIsModalOpen(true)
  }

  // Filter todos by search criteria
  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
  };

  // Metin araması için yardımcı fonksiyon
  const todoMatchesText = (todo: Todo, text: string): boolean => {
    try {
      if (!text) return true;
      const lowerText = text.toLowerCase();
      return Boolean(
        (todo.title?.toLowerCase().includes(lowerText)) || 
        (todo.description?.toLowerCase().includes(lowerText)) ||
        (todo.category_name?.toLowerCase().includes(lowerText))
      );
    } catch (error) {
      console.error('Metin araması sırasında hata:', error);
      return false;
    }
  };

  // Filtre ve sıralamayı uygula
  const filteredAndSortedTodos = useMemo(() => {
    try {
      // Hiç todo yoksa boş dizi döndür
      if (!todos || todos.length === 0) {
        return [];
      }
      
      const filtered = todos.filter(todo => {
        if (!todo) return false;
        
        try {
          // Kategori filtresi
          if (selectedCategory && todo.category_id !== selectedCategory) {
            return false;
          }
          
          // Metin araması
          if (searchFilters.text && !todoMatchesText(todo, searchFilters.text)) {
            return false;
          }
          
          // Durum filtresi
          if (searchFilters.status && searchFilters.status.length > 0 && 
              !searchFilters.status.includes(todo.status)) {
            return false;
          }
          
          // Öncelik filtresi
          if (searchFilters.priority && searchFilters.priority.length > 0 && 
              !searchFilters.priority.includes(todo.priority)) {
            return false;
          }
          
          // Kategori filtresi (çoklu seçim)
          if (searchFilters.categories && searchFilters.categories.length > 0 && 
              todo.category_id && 
              !searchFilters.categories.includes(todo.category_id)) {
            return false;
          }
          
          // Etiket filtresi
          if (searchFilters.tags && searchFilters.tags.length > 0 && 
              (!todo.tags || !todo.tags.some(tag => searchFilters.tags.includes(tag.id)))) {
            return false;
          }
          
          // Tarih filtresi
          if (searchFilters.startDate && todo.due_date) {
            const dueDate = new Date(todo.due_date);
            const startDate = new Date(searchFilters.startDate);
            if (dueDate < startDate) {
              return false;
            }
          }
          
          if (searchFilters.endDate && todo.due_date) {
            const dueDate = new Date(todo.due_date);
            const endDate = new Date(searchFilters.endDate);
            if (dueDate > endDate) {
              return false;
            }
          }
          
          return true;
        } catch (error) {
          console.error('Todo filtrelerken hata:', error, todo);
          return false;
        }
      });

      // Sıralama uygula
      try {
        if (!sortMethod || sortMethod === 'default') {
          return filtered;
        } else if (sortMethod === 'title-asc') {
          return [...filtered].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'tr'));
        } else if (sortMethod === 'title-desc') {
          return [...filtered].sort((a, b) => (b.title || '').localeCompare(a.title || '', 'tr'));
        } else if (sortMethod === 'description-asc') {
          return [...filtered].sort((a, b) => {
            const descA = a.description || '';
            const descB = b.description || '';
            return descA.localeCompare(descB, 'tr');
          });
        } else if (sortMethod === 'description-desc') {
          return [...filtered].sort((a, b) => {
            const descA = a.description || '';
            const descB = b.description || '';
            return descB.localeCompare(descA, 'tr');
          });
        } else if (sortMethod === 'date-asc') {
          return [...filtered].sort((a, b) => {
            const dateA = a.due_date ? new Date(a.due_date).getTime() : 0;
            const dateB = b.due_date ? new Date(b.due_date).getTime() : 0;
            return dateA - dateB;
          });
        } else if (sortMethod === 'date-desc') {
          return [...filtered].sort((a, b) => {
            const dateA = a.due_date ? new Date(a.due_date).getTime() : 0;
            const dateB = b.due_date ? new Date(b.due_date).getTime() : 0;
            return dateB - dateA;
          });
        } else {
          return filtered;
        }
      } catch (error) {
        console.error('Sıralama sırasında hata:', error);
        return filtered;
      }
    } catch (error) {
      console.error('Filtreleme ve sıralama sırasında hata:', error);
      return [];
    }
  }, [todos, selectedCategory, searchFilters, sortMethod]);

  // Update todo status
  const updateTodoStatus = async (id: number, status: string) => {
    try {
      // Güncellenecek todo'yu bul
      const todoToUpdate = todos.find(todo => todo.id === id);
      if (!todoToUpdate) return;
      
      // Status'u doğru tipte belirle
      const typedStatus = status as "pending" | "in-progress" | "completed";
      
      const updatedTodo = { ...todoToUpdate, status: typedStatus };
      
      // API çalışıyorsa
      if (apiConnected) {
        try {
          await api.put(`/todos/${id}`, updatedTodo);
          setApiError('Görev durumu başarıyla güncellendi');
          setTimeout(() => setApiError(null), 3000);
        } catch (error) {
          console.error('Todo durumu güncellenirken hata:', error);
          
          // API hatası varsa çevrimdışı güncelleme yap
          LocalStorage.updateTodoOffline(updatedTodo);
          setPendingChanges(LocalStorage.getPendingChanges().length);
          setApiError('Sunucu hatası: Görev durumu yerel olarak güncellendi, internet bağlantısı sağlandığında senkronize edilecek');
          setTimeout(() => setApiError(null), 3000);
        }
      } else {
        // Çevrimdışıysa çevrimdışı güncelleme yap
        LocalStorage.updateTodoOffline(updatedTodo);
        setPendingChanges(LocalStorage.getPendingChanges().length);
        setApiError('Görev durumu çevrimdışı olarak güncellendi, internet bağlantısı sağlandığında senkronize edilecek');
        setTimeout(() => setApiError(null), 3000);
      }
      
      // State'i güncelle
      setTodos(prevTodos => {
        const updatedTodos = prevTodos.map(todo => 
          todo.id === id ? { ...todo, status: typedStatus } : todo
        );
        
        // LocalStorage'a kaydet
        LocalStorage.saveTodos(updatedTodos);
        
        return updatedTodos;
      });
    } catch (error) {
      console.error('Todo durumu güncellenirken hata:', error);
      setApiError('Görev durumu güncellenirken bir hata oluştu');
      setTimeout(() => setApiError(null), 3000);
    }
  };

  // Kategorileri güncelleme fonksiyonu
  const updateCategories = (updatedCategories: Category[]) => {
    // Kategorileri state'e kaydet
    setCategories(updatedCategories);
    
    // Eğer bir kategori silindiyse veya güncellendiyse todo'ları da güncelle
    const updatedTodos = todos.map(todo => {
      // Eğer todo'nun kategorisi hala varsa, adını ve rengini güncelle
      const category = updatedCategories.find(c => c.id === todo.category_id);
      if (category) {
        return {
          ...todo,
          category_name: category.name,
          category_color: category.color
        };
      } 
      // Eğer todo'nun kategorisi silinmişse
      else if (todo.category_id && !updatedCategories.some(c => c.id === todo.category_id)) {
        return {
          ...todo,
          category_id: null,
          category_name: undefined,
          category_color: undefined
        };
      }
      return todo;
    });
    
    setTodos(updatedTodos);
  };

  // Senkronizasyon durumu bildirimi
  const SyncStatus = () => {
    if (!isOfflineMode && pendingChanges === 0) return null;

  return (
      <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg ${
        isOfflineMode ? 'bg-red-500 dark:bg-red-700' : 'bg-yellow-500 dark:bg-yellow-700'
      } text-white z-50 flex items-center gap-2`}>
        {isOfflineMode ? (
          <>
            <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
            Çevrimdışı mod
          </>
        ) : pendingChanges > 0 ? (
          <>
            <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
            {pendingChanges} değişiklik senkronize edilecek
            <button 
              onClick={syncOfflineChanges} 
              className="ml-2 bg-white text-yellow-700 px-2 py-1 rounded text-xs"
            >
              Şimdi Senkronize Et
            </button>
          </>
        ) : null}
      </div>
    );
  };

  // Markdown desteği kontrolü - zengin metin formatı kullanılabilir mi?
  const canUseMarkdown = useMemo(() => {
    return canUserUseFeature('has_markdown_support');
  }, [authState.user]);

  // Context değeri
  const todoContextValue = useMemo((): TodoContextType => ({
    todos,
    categories,
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    addTodo,
    updateTodo,
    deleteTodo,
    editTodo,
    updateTodoStatus,
    updateCategories,
    searchFilters,
    handleSearch,
    subscriptionPlan,
    canUseFeature: canUserUseFeature,
    getRemainingTodoLimit,
    openUpgradeModal,
    isUpgradeModalOpen,
    closeUpgradeModal,
    handleSubscriptionChange
  }), [
    todos, 
    categories, 
    authState.user, 
    authState.isAuthenticated, 
    searchFilters,
    subscriptionPlan,
    isUpgradeModalOpen
  ]);

  return (
    <TodoProvider value={todoContextValue}>
      <div className={`App min-h-screen flex flex-col ${isDarkMode ? 'dark bg-[#1e2837]' : 'bg-gray-50'}`}>
        <Header 
          isAuthenticated={authState.isAuthenticated}
          user={authState.user}
          onLogout={handleLogout}
          onLogin={() => setIsAuthModalOpen(true)}
          darkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          onShowStats={() => setShowStats(!showStats)}
          onShowCategories={() => setShowCategories(!showCategories)}
          syncOfflineChanges={syncOfflineChanges}
          pendingChanges={pendingChanges}
          apiConnected={apiConnected}
          onToggleSubscription={toggleSubscriptionPage}
          subscriptionPlan={subscriptionPlan}
        />

        <main className="flex-grow container mx-auto px-4 py-6">
          {/* Zorunlu Giriş Modalı */}
          {isAuthModalOpen ? (
            <AuthModal
              isOpen={true}
              onClose={() => setIsAuthModalOpen(false)}
              onAuthChange={handleAuthChange}
              apiUrl={API_URL}
              initialMode={isInitialLogin ? "login" : "register"}
              isForced={false}
            />
          ) : null}

          {/* Abonelik İyileştirme Modalı */}
          {isUpgradeModalOpen && (
            <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white dark:bg-[#1c2732] rounded-2xl shadow-xl p-6 w-full max-w-md transform transition-all animate-fade-scale-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Özellik Sınırlaması</h3>
                  <button 
                    onClick={closeUpgradeModal}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
        </button>
                </div>
                
                <div className="mb-6">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-lg p-4 text-amber-800 dark:text-amber-300 mb-4">
                    <p>{apiError || getUpgradeMessage('todos')}</p>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Daha fazla özelliğe erişmek için abonelik planınızı yükseltin ve Todo uygulamasının tüm avantajlarından yararlanın.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-[#22303c] p-3 rounded-lg border border-gray-200 dark:border-[#2d3741] shadow-sm">
                      <div className="font-medium text-gray-800 dark:text-gray-100 mb-1">Mevcut Plan</div>
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{SUBSCRIPTION_PLANS[subscriptionPlan].name}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">{SUBSCRIPTION_PLANS[subscriptionPlan].price.toFixed(2)} ₺/ay</div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800/60 shadow-sm">
                      <div className="font-medium text-purple-800 dark:text-purple-300 mb-1">Önerilen</div>
                      <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{SUBSCRIPTION_PLANS.premium.name}</div>
                      <div className="text-purple-500 dark:text-purple-400 text-sm mt-1">{SUBSCRIPTION_PLANS.premium.price.toFixed(2)} ₺/ay</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={closeUpgradeModal}
                    className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-[#22303c] dark:hover:bg-[#2d3741] text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Daha Sonra
                  </button>
                  <button
                    onClick={() => {
                      closeUpgradeModal();
                      setShowSubscriptionPage(true);
                    }}
                    className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-500 hover:to-purple-300 text-white rounded-lg font-medium shadow-lg hover:shadow-purple-500/30 transition-all"
                  >
                    Planları Gör
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ana İçerik */}
          {authState.isAuthenticated ? (
            <>
              {/* Başarı ve hata mesajları */}
              {apiError && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 p-4 rounded-lg mb-6 animate-fade-in">
                  {apiError}
                </div>
              )}
              
              {/* Abonelik sayfası veya görevler sayfası */}
              {showSubscriptionPage ? (
                <div className="mt-4 animate-fade-in">
                  <SubscriptionPage 
                    user={authState.user}
                    onSubscriptionChange={handleSubscriptionChange}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Sol kenar çubuğu - Kategoriler */}
                  <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-[#1c2732] rounded-xl p-4 shadow-sm border border-gray-200 dark:border-[#2d3741]">
                      <CategorySelector 
                        categories={categories} 
                        selectedCategory={selectedCategory}
                        onSelectCategory={setSelectedCategory}
                        onAddCategory={() => setShowCategories(true)}
                      />
                    </div>
  
                    {/* Sıralama Seçeneği */}
                    <div className="mt-6 bg-white dark:bg-[#1c2732] rounded-xl p-4 shadow-sm border border-gray-200 dark:border-[#2d3741]">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-gray-800 dark:text-white text-lg flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                          </svg>
                          Sıralama
                        </h2>
                      </div>
                      <select 
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#22303c] border border-gray-200 dark:border-[#2d3741] rounded-lg text-gray-700 dark:text-gray-300"
                        value={sortMethod}
                        onChange={(e) => setSortMethod(e.target.value)}
                      >
                        <option value="default">Varsayılan</option>
                        <option value="date-asc">Tarih (Önce Eski)</option>
                        <option value="date-desc">Tarih (Önce Yeni)</option>
                        <option value="title-asc">Başlık (A-Z)</option>
                        <option value="title-desc">Başlık (Z-A)</option>
                      </select>
                    </div>
  
                    {/* İstatistikler Butonu */}
                    <div className="mt-6">
                      <button
                        onClick={() => setShowStats(!showStats)}
                        className={`w-full flex items-center justify-center py-3 px-4 rounded-xl border transition-all ${
                          showStats
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400'
                          : 'bg-white dark:bg-[#1c2732] border-gray-200 dark:border-[#2d3741] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#22303c]'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        {showStats ? 'İstatistikleri Gizle' : 'İstatistikleri Göster'}
                      </button>
                    </div>
                  </div>
  
                  {/* Ana içerik - Görevler */}
                  <div className="lg:col-span-9">
                    <div className="flex justify-between items-center mb-4">
                      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        {selectedCategory === null 
                          ? 'Tüm Görevler' 
                          : `${categories.find(c => c.id === selectedCategory)?.name || 'Kategori'} Görevleri`
                        }
                        <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                          ({
                            selectedCategory === null 
                              ? todos.length 
                              : todos.filter(t => t.category_id === selectedCategory).length
                          } görev)
                        </span>
                      </h1>
  
                      <SearchBar 
                        onSearch={handleSearch}
                        categories={categories}
                      />
                    </div>
                    
                    {/* İstatistikler - Ana içerikte gösteriliyor */}
                    {showStats && (
                      <div className="mb-6 bg-white dark:bg-[#1c2732] rounded-xl p-5 border border-gray-200 dark:border-[#2d3741] shadow-sm">
                        <StatsPanel 
                          todos={todos} 
                          categories={categories}
                          user={authState.user}
                        />
                      </div>
                    )}
                    
                    <div className="bg-white dark:bg-[#1c2732] rounded-xl overflow-hidden border border-gray-200 dark:border-[#2d3741] shadow-sm">
                      <DraggableTodoList 
                        todos={filteredAndSortedTodos}
                        categories={categories}
                        onDeleteTodo={deleteTodo}
                        onEditTodo={editTodo}
                        onStatusChange={updateTodoStatus}
                      />
                    </div>
  
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={() => {
                          const remainingLimit = getRemainingTodoLimit();
                          // Enterprise planında sınırsız görev oluşturma hakkı (-1 değeri)
                          if (remainingLimit === 0) {
                            openUpgradeModal();
                            return;
                          }
                          setCurrentTodo(null);
                          setIsModalOpen(true);
                        }}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2 rounded-full shadow-md hover:shadow-lg transition transform hover:-translate-y-1 flex items-center font-medium"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Yeni Görev Ekle
                      </button>
                    </div>
  
                    {/* Modallar */}
                    {showCategories && (
                      <CategoryManagement 
                        categories={categories} 
                        onAddCategory={(category) => {
                          api.post('/categories', category)
                            .then(response => {
                              setCategories([...categories, response.data]);
                            })
                            .catch(error => {
                              console.error('Kategori eklenirken hata:', error);
                            });
                        }}
                        onUpdateCategory={(updatedCategory) => {
                          api.put(`/categories/${updatedCategory.id}`, updatedCategory)
                            .then(() => {
                              const updatedCategories = categories.map(c => 
                                c.id === updatedCategory.id ? updatedCategory : c
                              );
                              updateCategories(updatedCategories);
                            })
                            .catch(error => {
                              console.error('Kategori güncellenirken hata:', error);
                            });
                        }}
                        onDeleteCategory={(id) => {
                          api.delete(`/categories/${id}`)
                            .then(() => {
                              const newCategories = categories.filter(c => c.id !== id);
                              updateCategories(newCategories);
                            })
                            .catch(error => {
                              console.error('Kategori silinirken hata:', error);
                            });
                        }}
                        onClose={() => setShowCategories(false)}
                      />
                    )}
  
                    {isModalOpen && (
                      <TodoForm
                        todo={currentTodo}
                        categories={categories}
                        onSubmit={(todo) => {
                          if (todo.id) {
                            updateTodo(todo);
                          } else {
                            addTodo(todo);
                          }
                          setIsModalOpen(false);
                        }}
                        onCancel={() => setIsModalOpen(false)}
                      />
                    )}
                    
                    {/* Senkronizasyon durumu bildirimi */}
                    <SyncStatus />
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Giriş yapmamış kullanıcılar için görüntülenecek içerik */
            <div className="relative flex flex-col items-center min-h-[80vh] py-12 px-4 overflow-hidden">
              {/* Dekoratif arka plan elementleri */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                {/* Arka plan deseni */}
                <div className="absolute w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-[#1e2e41]/30 dark:to-[#202d40]/30 opacity-70"></div>
                {/* Dekoratif daireler */}
                <div className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full bg-gradient-to-r from-blue-300/20 to-purple-300/20 dark:from-blue-500/15 dark:to-purple-500/15 blur-3xl"></div>
                <div className="absolute bottom-[10%] right-[5%] w-72 h-72 rounded-full bg-gradient-to-r from-green-300/20 to-cyan-300/20 dark:from-green-500/15 dark:to-cyan-500/15 blur-3xl"></div>
                <div className="absolute top-[40%] right-[15%] w-40 h-40 rounded-full bg-gradient-to-r from-amber-300/20 to-pink-300/20 dark:from-amber-500/15 dark:to-pink-500/15 blur-2xl"></div>
                <div className="absolute bottom-[30%] left-[15%] w-56 h-56 rounded-full bg-gradient-to-r from-purple-300/20 to-indigo-300/20 dark:from-purple-500/15 dark:to-indigo-500/15 blur-3xl"></div>
                {/* Nokta deseni */}
                <div className="absolute inset-0 opacity-10 dark:opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] bg-[length:24px_24px]"></div>
              </div>

              {/* Ana içerik */}
              <div className="relative z-10 max-w-7xl mx-auto w-full">
                <div className="text-center mb-12 animate-fade-in">
                  <div className="inline-block mb-4 p-2 bg-white dark:bg-[#2a3544]/90 rounded-2xl shadow-xl">
                    <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl p-3 transform transition-transform hover:scale-105">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                  </div>
                  
                  <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-white mb-4 animate-fade-in">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                      Todo Uygulamasına
                    </span> Hoş Geldiniz
                  </h1>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-lg md:text-xl mb-8 max-w-3xl mx-auto animate-fade-in">
                    Modern ve kullanışlı arayüzü ile görevlerinizi kolayca yönetin, kategorilere ayırın ve her zaman organize kalın.
                  </p>
                </div>
                
                {/* Özellik Kartları */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 mb-12 w-full px-4">
                  {/* Özellik Kartı 1 */}
                  <div className="bg-white/80 dark:bg-[#2a3544]/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg dark:shadow-black/10 border border-gray-100 dark:border-[#384352]/50 hover:shadow-xl transition-all duration-300 hover:translate-y-[-8px] hover:border-blue-200 dark:hover:border-blue-500/30 group animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-md dark:shadow-blue-500/20 group-hover:scale-110 transition-all duration-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Görev Yönetimi</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Yapılacak görevlerinizi ekleyin, düzenleyin, önceliklendirebilirsin ve tamamlandığında işaretleyin.
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Sürükle-bırak ile kolay düzenleme
                      </li>
                      <li className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Yüksek, orta, düşük önceliklendirme
                      </li>
                    </ul>
                  </div>
                  
                  {/* Özellik Kartı 2 */}
                  <div className="bg-white/80 dark:bg-[#2a3544]/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg dark:shadow-black/10 border border-gray-100 dark:border-[#384352]/50 hover:shadow-xl transition-all duration-300 hover:translate-y-[-8px] hover:border-green-200 dark:hover:border-green-500/30 group animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 shadow-md dark:shadow-green-600/20 group-hover:scale-110 transition-all duration-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Kategori Sistemi</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Görevlerinizi kategorilere ayırarak daha düzenli bir çalışma ortamı oluşturun ve odaklanın.
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Özel renkli kategoriler oluşturma
                      </li>
                      <li className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Kategori bazlı filtreleme ve arama
                      </li>
                    </ul>
                  </div>
                  
                  {/* Özellik Kartı 3 */}
                  <div className="bg-white/80 dark:bg-[#2a3544]/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg dark:shadow-black/10 border border-gray-100 dark:border-[#384352]/50 hover:shadow-xl transition-all duration-300 hover:translate-y-[-8px] hover:border-purple-200 dark:hover:border-purple-500/30 group animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center mb-6 shadow-md dark:shadow-purple-600/20 group-hover:scale-110 transition-all duration-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">İstatistikler</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Görev tamamlama performansınızı ve iş dağılımını görsel grafiklerle analiz edin.
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Detaylı tamamlanma istatistikleri
                      </li>
                      <li className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Kategori bazlı iş dağılım analizi
                      </li>
                    </ul>
                  </div>
                  
                  {/* Özellik Kartı 4 */}
                  <div className="bg-white/80 dark:bg-[#2a3544]/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg dark:shadow-black/10 border border-gray-100 dark:border-[#384352]/50 hover:shadow-xl transition-all duration-300 hover:translate-y-[-8px] hover:border-amber-200 dark:hover:border-amber-500/30 group animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-6 shadow-md dark:shadow-amber-600/20 group-hover:scale-110 transition-all duration-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Hatırlatmalar</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Görevleriniz için son tarih belirleyin ve zamanında tamamlandığından emin olun.
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Son tarih yaklaşan görevleri görüntüleme
                      </li>
                      <li className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Akıllı tarih ve zaman seçicisi
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Giriş/Kayıt Butonları */}
                <div className="text-center relative animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                  <div className="relative z-10 inline-flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 bg-white/80 dark:bg-[#2a3544]/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-[#384352]/50">
                    <div className="text-center sm:text-left mb-4 sm:mb-0 sm:mr-4">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Hemen Başlayın</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Hesabınıza giriş yapın veya yeni bir hesap oluşturun</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                      <button
                        onClick={() => {
                          setIsInitialLogin(true);
                          setIsAuthModalOpen(true);
                        }}
                        className="relative overflow-hidden group text-lg px-8 py-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-[1.02] focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium"
                      >
                        <span className="relative z-10 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Giriş Yap
                        </span>
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full ease-out duration-700 transition-all"></div>
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsInitialLogin(false);
                          setIsAuthModalOpen(true);
                        }}
                        className="text-lg px-8 py-3 rounded-xl border-2 border-gray-200 dark:border-[#384352] hover:border-blue-300 dark:hover:border-blue-600/50 bg-white dark:bg-[#283040] hover:bg-gray-50 dark:hover:bg-[#323d4d] text-gray-800 dark:text-gray-200 shadow-sm hover:shadow transition-all duration-300 transform hover:scale-[1.02] font-medium"
                      >
                        <span className="flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          Kaydol
                        </span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Dekoratif daireler */}
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-r from-blue-400/20 to-indigo-400/20 dark:from-blue-600/10 dark:to-indigo-600/10 blur-2xl -z-10"></div>
                  <div className="absolute -bottom-4 -right-10 w-32 h-32 rounded-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 dark:from-purple-600/10 dark:to-pink-600/10 blur-2xl -z-10"></div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </TodoProvider>
  )
}

export default App
