import { useState, useEffect, useMemo, createContext, useRef, useCallback } from 'react'
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
import SubscriptionHistoryPage from './pages/SubscriptionHistoryPage'
import SubscriptionNotifications from './components/Subscription/SubscriptionNotifications'
import { TodoProvider } from './context/TodoContext'
import { SUBSCRIPTION_PLANS, getUserPlan, canUseFeature, getRemainingLimit, getUpgradeMessage } from './utils/subscription'

// Gradient Arka Plan Komponenti
const GradientBackground = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
      {/* Modernize edilmiş arka plan gradientleri - şık gri-mavi tonları */}
      <div className="absolute w-full h-full bg-gradient-to-br from-slate-100/90 via-blue-50/85 to-slate-50/90 dark:from-[#111827]/80 dark:via-[#0f172a]/70 dark:to-[#0f1629]/75 opacity-95"></div>
      
      {/* Hareketli dekoratif daireler - şık tonlarla */}
      <div className="absolute top-[5%] left-[8%] w-80 h-80 rounded-full bg-gradient-to-r from-slate-300/20 to-blue-300/20 dark:from-slate-600/10 dark:to-blue-600/10 blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-[8%] right-[5%] w-96 h-96 rounded-full bg-gradient-to-r from-sky-300/20 to-indigo-300/20 dark:from-sky-700/8 dark:to-indigo-700/8 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[35%] right-[12%] w-52 h-52 rounded-full bg-gradient-to-r from-blue-300/15 to-slate-300/20 dark:from-blue-600/5 dark:to-slate-600/5 blur-2xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      <div className="absolute bottom-[25%] left-[10%] w-64 h-64 rounded-full bg-gradient-to-r from-indigo-300/20 to-slate-300/15 dark:from-indigo-700/5 dark:to-slate-700/5 blur-2xl animate-pulse-slow" style={{ animationDelay: '6s' }}></div>
      
      {/* İnce accent çizgi */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400/30 dark:via-blue-500/15 to-transparent"></div>
      
      {/* Nokta deseni */}
      <div className="absolute inset-0 opacity-[0.07] dark:opacity-[0.03] bg-[radial-gradient(#64748b_1px,transparent_1px)] dark:bg-[radial-gradient(#475569_1px,transparent_1px)] bg-[length:20px_20px]"></div>
    </div>
  );
};


const API_URL = 'http://localhost:5000/api'


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


export const TodoContext = createContext<TodoContextType | null>(null);


const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;

    const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    const { token, refreshToken: newRefreshToken, user } = response.data;
    
    
    localStorage.setItem('auth_token', token);
    
    
    if (newRefreshToken) {
      localStorage.setItem('refresh_token', newRefreshToken);
    }
    
    
    localStorage.setItem('user', JSON.stringify(user));
    
    console.log('Yenilenen kullanıcı bilgileri:', user);
    
    return { token, user };
  } catch (error) {
    console.error('Token yenileme hatası:', error);
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    return null;
  }
};


const checkApiStatus = async () => {
  try {
    const res = await axios.get(`${API_URL}/health`, { timeout: 2000 })
    return res.data
  } catch (error) {
    console.error('API kontrol hatası:', error)
    return { status: 'offline', dbConnected: false }
  }
}


const api = axios.create({
  baseURL: API_URL,
  timeout: 5000
})


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
  const [showSubscriptionHistory, setShowSubscriptionHistory] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [showCategoriesPage, setShowCategoriesPage] = useState(false);
  
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
      
      // Periyodik token yenileme kontrolü - optimize edilmiş sıklık
      const tokenCheckInterval = setInterval(() => {
        checkTokenValidity();
      }, 3 * 60 * 1000); // 3 dakikada bir - sunucu yükünü azaltmak için
      
      return () => clearInterval(tokenCheckInterval);
    } else {
      setAuthState(prev => ({
        ...prev,
        loading: false
      }))
    }
  }, [])
  
  // Abonelik değişikliklerini otomatik olarak izleyen fonksiyon - optimize edilmiş
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.user) return;
    
    // İlk yüklenmede verileri kontrol et
    const checkCurrentSubscription = async () => {
      await checkSubscriptionStatus(authState, setAuthState, setApiError, showSubscriptionPage);
    };
    
    checkCurrentSubscription();
    
    // Periyodik kontrol için interval - sunucu yükünü azaltmak için
    const subscriptionCheckInterval = setInterval(() => {
      checkCurrentSubscription();
    }, 5 * 60 * 1000); // 5 dakikada bir
    
    return () => clearInterval(subscriptionCheckInterval);
  }, [authState, showSubscriptionPage]);

  // Abonelik durumunu kontrol eden bağımsız fonksiyon
  const checkSubscriptionStatus = async (
    currentAuthState: AuthState, 
    updateAuthState: React.Dispatch<React.SetStateAction<AuthState>>,
    setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>,
    isSubscriptionPageOpen: boolean
  ) => {
    try {
      // Sunucudan güncel kullanıcı bilgilerini al 
      const response = await api.get('/auth/validate');
      
      if (response.data && response.data.user) {
        const serverUser = response.data.user;
        
        // Hem planı hem de bitiş tarihini kontrol et ve her zaman sunucu verisini öncelikli tut
        if (serverUser.subscription_plan !== currentAuthState.user?.subscription_plan ||
            serverUser.subscription_expires !== currentAuthState.user?.subscription_expires) {
          
          console.log('Abonelik değişikliği tespit edildi:', {
            eski: {
              plan: currentAuthState.user?.subscription_plan,
              expires: currentAuthState.user?.subscription_expires
            },
            yeni: {
              plan: serverUser.subscription_plan,
              expires: serverUser.subscription_expires
            }
          });
          
          // Kullanıcı bilgilerini güncelle
          const updatedUser = {
            ...currentAuthState.user,
            subscription_plan: serverUser.subscription_plan as SubscriptionPlan,
            subscription_expires: serverUser.subscription_expires
          };
          
          // State'i güncelle
          updateAuthState(prev => ({
            ...prev,
            user: updatedUser as User
          }));
          
          // localStorage'ı güncelle
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Kullanıcıyı bilgilendir - ekranda 3 saniye yerine 5 saniye göster
          const planName = serverUser.subscription_plan && SUBSCRIPTION_PLANS[serverUser.subscription_plan as SubscriptionPlan]?.name || 'Bilinmeyen';
          setErrorMessage(`Abonelik bilgileriniz güncellendi. Yeni plan: ${planName}`);
          setTimeout(() => setErrorMessage(null), 5000);
          
          // Abonelik sayfası açıksa sayfayı yenile
          if (isSubscriptionPageOpen) {
            // Kısa bir gecikme sonrası sayfayı yenile
            setTimeout(() => window.location.reload(), 1500);
          }
        }
      }
    } catch (error) {
      console.error('Abonelik otomatik kontrol hatası:', error);
    }
  };

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
      // Kullanıcı bilgilerini doğrula ve güncel durumu al
      const validateResponse = await api.get('/auth/validate');
      
      // Eğer sunucudan dönen kullanıcı bilgileri varsa, güncel kullanıcı bilgilerini al
      if (validateResponse && validateResponse.data && validateResponse.data.user) {
        const currentUser = validateResponse.data.user;
        
        // localStorage ve state'deki kullanıcı bilgilerini güncelle
        const localUserStr = localStorage.getItem('user');
        if (localUserStr) {
          const localUser = JSON.parse(localUserStr);
          
          // Sunucudan ve lokalden gelen bilgileri birleştir (sunucu bilgisi öncelikli)
          const updatedUser = {
            ...localUser,
            ...currentUser
          };
          
          // Güncel kullanıcı bilgilerini kaydet
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // AuthState güncelle
          setAuthState(prev => ({
            ...prev,
            user: updatedUser
          }));
          
          console.log('Kullanıcı bilgileri güncellendi:', updatedUser);
        }
      }
      
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

  // Çevrimdışı değişiklikleri senkronize et
  const syncOfflineChanges = async () => {
    if (!apiConnected) {
      setApiError('Sunucu bağlantısı kurulamadı, değişiklikler yerel olarak saklandı');
      return;
    }
    
    try {
      // Senkronizasyon başladı bildirimi
      setApiError('Değişiklikler senkronize ediliyor...');
      
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
      setTimeout(() => setApiError(null), 3000);
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
        setTimeout(() => setApiError(null), 5000);
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

  // Tarayıcının çevrimiçi/çevrimdışı durumunu dinle
  useEffect(() => {
    // İlk yükleme kontrolü
    checkApiConnection();
    
    // Çevrimiçi/Çevrimdışı durumunu dinle
    const handleOnline = () => {
      console.log("Ağ bağlantısı yeniden sağlandı");
      // Kısa bir gecikme ile sunucu durumunu kontrol et
      setTimeout(async () => {
        const isConnected = await checkApiConnection();
        if (isConnected) {
          console.log("API bağlantısı sağlandı, değişiklikler senkronize ediliyor");
          syncOfflineChanges();
        }
      }, 1000);
    };
    
    const handleOffline = () => {
      console.log("Ağ bağlantısı kesildi");
      setApiConnected(false);
      setIsOfflineMode(true);
      setApiError('İnternet bağlantısı kesildi, çevrimdışı modda çalışılıyor');
      setTimeout(() => setApiError(null), 5000);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Düzenli aralıklarla sunucu durumunu kontrol et (yalnızca sayfada aktif olduğunda)
    let apiCheckInterval: number | null = null;
    
    // API durumunu otomatik olarak kontrol etmek için akıllı mekanizma
    // Sadece çevrimdışı modda daha sık kontrol et, çevrimiçiyse daha seyrek
    const checkFrequency = isOfflineMode ? 30000 : 120000; // Çevrimdışı: 30s, Çevrimiçi: 2dk
    
    apiCheckInterval = window.setInterval(async () => {
      // Sayfa görünür durumdaysa kontrol et
      if (!document.hidden) {
        const isConnected = await checkApiConnection();
        
        // Bağlantı varsa ve bekleyen değişiklikler varsa senkronize et
        if (isConnected && LocalStorage.getPendingChanges().length > 0) {
          syncOfflineChanges();
        }
      }
    }, checkFrequency);
    
    // visibility değişimini dinle - sayfa arka plandan geri geldiğinde durumu kontrol et
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        const isConnected = await checkApiConnection();
        if (isConnected && LocalStorage.getPendingChanges().length > 0) {
          syncOfflineChanges();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (apiCheckInterval) clearInterval(apiCheckInterval);
    };
  }, [isOfflineMode, syncOfflineChanges, checkApiConnection, setApiConnected, setIsOfflineMode, setApiError]);

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
            plan: plan,
            duration: 30 // Her plan için sabit 30 günlük süre belirt
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
      // Tüm planlar için süreyi 30 gün olarak standardize ediyoruz
      const durationInDays = 30; // Tüm planlar için sabit 30 gün olarak ayarla (Enterprise de dahil)
      
      // Bitiş tarihini hesapla - tam 30 gün sonrası
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + durationInDays);
      
      // Kullanıcı bilgisini güncelle
      const updatedUser: User = {
        ...authState.user,
        subscription_plan: plan,
        subscription_expires: expiryDate.toISOString(),
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
  
  // Abonelik geçmişi sayfasını aç/kapat
  const toggleSubscriptionHistory = () => {
    setShowSubscriptionHistory(!showSubscriptionHistory);
    // Diğer sayfaları kapat
    if (!showSubscriptionHistory) {
      setShowSubscriptionPage(false);
      setShowStatsPanel(false);
      setShowCategoriesPage(false);
    }
  };
  
  // Kullanıcı şu anda etkin olan abonelik planı
  const subscriptionPlan = useMemo(() => {
    // Kullanıcının subscription_plan bilgisini doğrudan kullanır ve localStorage'dan taze bilgiyi alır
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        if (parsedUser && parsedUser.subscription_plan) {
          // Hem localStorage hem state içindeki kullanıcı bilgileri varsa ve farklıysa, state'i güncelle
          if (authState.user && authState.user.subscription_plan !== parsedUser.subscription_plan) {
            console.log("Abonelik planı farklılığı tespit edildi. State güncelleniyor.");
            console.log("State'deki plan:", authState.user.subscription_plan);
            console.log("localStorage'daki plan:", parsedUser.subscription_plan);
            
            // authState içindeki user'ı localStorage'daki bilgilerle güncelle
            setAuthState(prev => ({
              ...prev,
              user: {
                ...prev.user!,
                subscription_plan: parsedUser.subscription_plan,
                subscription_expires: parsedUser.subscription_expires
              } as User
            }));
          }
          
          // localStorage'dan alınan plan bilgisini döndür
          return parsedUser.subscription_plan;
        }
      } catch (e) {
        console.error('Kullanıcı bilgisi çözümlenirken hata oluştu:', e);
      }
    }
    // Eğer localStorage'dan alınamazsa state'ten almaya çalışır
    return getUserPlan(authState.user);
  }, [authState.user, authState.user?.subscription_plan]);

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
    if (!isOfflineMode && pendingChanges === 0 && 
        !(authState.isAuthenticated && subscriptionPlan !== 'premium' && 
        authState.user?.subscription_plan === 'premium')) return null;

  return (
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {/* Abonelik düzeltme butonu */}
        {authState.isAuthenticated && subscriptionPlan !== 'premium' && 
          authState.user?.subscription_plan === 'premium' && (
          <button
            onClick={async () => {
              try {
                // Kullanıcı bilgisini yenile
                await refreshToken();
                
                // Sayfayı yenile
                window.location.reload();
                
                setApiError('Abonelik bilgisi güncellendi');
                setTimeout(() => setApiError(null), 3000);
              } catch (error) {
                console.error('Abonelik düzeltme hatası:', error);
                setApiError('Abonelik bilgisi güncellenirken hata oluştu');
                setTimeout(() => setApiError(null), 3000);
              }
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Abonelik Bilgisini Güncelle</span>
          </button>
        )}
        
        {/* Senkronizasyon durumu */}
        {(isOfflineMode || pendingChanges > 0) && (
          <div className={`px-4 py-2 rounded-lg shadow-lg ${
            isOfflineMode ? 'bg-red-500 dark:bg-red-700' : 'bg-yellow-500 dark:bg-yellow-700'
          } text-white flex items-center gap-2`}>
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
        )}
      </div>
    );
  };

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
      <div className={`App min-h-screen flex flex-col relative ${isDarkMode ? 'dark' : ''}`}>
        {/* Tüm sayfalarda görünecek gradient arka plan */}
        <GradientBackground />
        
        <Header
          darkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          isAuthenticated={authState.isAuthenticated}
          user={authState.user}
          pendingChanges={pendingChanges}
          syncOfflineChanges={syncOfflineChanges}
          onShowStats={() => setShowStatsPanel(true)}
          onShowCategories={() => setShowCategoriesPage(true)}
          apiConnected={apiConnected}
          onLogin={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          onToggleSubscription={toggleSubscriptionPage}
          onShowSubscriptionHistory={toggleSubscriptionHistory}
          subscriptionPlan={subscriptionPlan}
        />

        <main className="px-4 mx-auto container pb-8">
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
                    
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800/60 shadow-sm relative">
                      <div className="absolute -right-1 top-1 bg-gradient-to-r from-purple-600 to-purple-500 px-2 py-0.5 text-xs text-white rounded-md shadow-sm">
                        Önerilen
                      </div>
                      <div className="font-medium text-purple-800 dark:text-purple-300 mb-1 mt-6">Önerilen Plan</div>
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
              
              {/* Farklı sayfalar arasında geçiş yap */}
              {showSubscriptionPage ? (
                <div className="mt-4 animate-fade-in">
                  <SubscriptionPage 
                    user={authState.user}
                    onSubscriptionChange={handleSubscriptionChange}
                  />
                </div>
              ) : showStatsPanel ? (
                <div className="mt-4 animate-fade-in">
                  <div className="bg-white dark:bg-[#1c2732] rounded-xl p-5 border border-gray-200 dark:border-[#2d3741] shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">Detaylı İstatistikler</h2>
                      <button 
                        onClick={() => setShowStatsPanel(false)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <StatsPanel 
                      todos={todos} 
                      categories={categories}
                      user={authState.user}
                    />
                  </div>
                </div>
              ) : showCategoriesPage ? (
                <div className="mt-4 animate-fade-in">
                  <div className="bg-white dark:bg-[#1c2732] rounded-xl p-5 border border-gray-200 dark:border-[#2d3741] shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">Kategori Yönetimi</h2>
                      <button 
                        onClick={() => setShowCategoriesPage(false)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <CategoryManagement 
                      categories={categories} 
                      onCategoriesUpdate={(updatedCategories: Category[]) => {
                        api.put('/categories', updatedCategories)
                          .then(() => {
                            updateCategories(updatedCategories);
                          })
                          .catch(error => {
                            console.error('Kategoriler güncellenirken hata:', error);
                          });
                      }}
                      onClose={() => setShowCategoriesPage(false)}
                    />
                  </div>
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
                    
                    {/* Yeni Görev Ekle Butonu - Sidebar'da yatay sabitlenmiş */}
                    <div className="fixed bottom-5 left-4 right-4 lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:mt-6 z-20">
                      <div className="p-1.5 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl">
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
                          className="w-full flex items-center justify-center py-4 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg hover:shadow-blue-500/40 transition-all duration-300 transform hover:-translate-y-1 border border-white/10 dark:border-white/5"
                        >
                          <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-200" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            <span className="tracking-wide">Yeni Görev Ekle</span>
                          </div>
                        </button>
                      </div>
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
                      {/* Yeni Görev Ekle butonu buradan kaldırıldı */}
                    </div>
  
                    {/* Modallar */}
                    {showCategories && (
                      <CategoryManagement 
                        categories={categories} 
                        onCategoriesUpdate={(updatedCategories: Category[]) => {
                          api.put('/categories', updatedCategories)
                            .then(() => {
                              updateCategories(updatedCategories);
                            })
                            .catch(error => {
                              console.error('Kategoriler güncellenirken hata:', error);
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
              {/* Ana içerik */}
              <div className="relative z-10 max-w-7xl mx-auto w-full">
                <div className="text-center mb-12 animate-fade-in">
                  <div className="inline-block mb-6 p-3 bg-white/80 dark:bg-[#2a3544]/90 rounded-2xl shadow-xl transform transition-all duration-500 hover:scale-105">
                    <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl p-4 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                  </div>
                  
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-800 dark:text-white mb-6 animate-fade-in leading-tight">
                    <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                      Todo Uygulamasına
                    </span>
                    <br className="md:hidden" /> Hoş Geldiniz
                  </h1>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-lg md:text-xl mb-10 max-w-3xl mx-auto animate-fade-in leading-relaxed">
                    Modern ve kullanışlı arayüzü ile görevlerinizi kolayca yönetin, kategorilere ayırın ve her zaman organize kalın.
                  </p>
                </div>
                
                {/* Özellik Kartları */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 lg:gap-8 mb-16 w-full max-w-7xl mx-auto">
                  {/* Özellik Kartı 1: Görev Yönetimi */}
                  <div className="relative group overflow-hidden bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-slate-900/10 border border-slate-200/60 dark:border-slate-700/50 hover:shadow-xl dark:hover:shadow-slate-900/20 transition-all duration-300 hover:translate-y-[-8px] animate-fade-in-up p-0 flex flex-col" style={{ animationDelay: '0.1s' }}>
                    {/* Kart Başlık Alanı ve İkon - Ortalandı */}
                    <div className="p-6 pb-3 flex flex-col items-center text-center">
                      <div className="relative">
                        <div className="absolute -top-2 -left-1/2 w-24 h-24 rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-2xl transform group-hover:scale-150 group-hover:opacity-100 transition-all duration-700"></div>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-5 shadow-md shadow-blue-500/20 dark:shadow-blue-500/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative mx-auto">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                        </div>
                        
                        <div className="relative">
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-center">Görev Yönetimi</h3>
                          <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-blue-500 dark:bg-blue-400 group-hover:w-20 transition-all duration-300 mx-auto"></span>
                        </div>
                      </div>
                    </div>

                    {/* Kart İçeriği - Ortalandı */}
                    <div className="p-6 pt-2 flex-grow flex flex-col items-center text-center">
                      <p className="text-gray-600 dark:text-gray-300 text-[15px] mb-4">
                        Yapılacak görevlerinizi ekleyin, düzenleyin, önceliklendirebilirsin ve tamamlandığında işaretleyin.
                      </p>
                      <ul className="mt-2 space-y-3 text-sm w-full">
                        <li className="flex items-center text-gray-600 dark:text-gray-400 justify-center">
                          <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 mr-3">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </div>
                          <span>Sürükle-bırak ile kolay düzenleme</span>
                        </li>
                        <li className="flex items-center text-gray-600 dark:text-gray-400 justify-center">
                          <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 mr-3">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </div>
                          <span>Yüksek, orta, düşük önceliklendirme</span>
                        </li>
                      </ul>
                    </div>
                    
                    {/* Kart Alt Kısmı - Vurgu Çizgisi */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-500 mt-auto"></div>
                  </div>
                  
                  {/* Özellik Kartı 2: Kategori Sistemi */}
                  <div className="relative group overflow-hidden bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-slate-900/10 border border-slate-200/60 dark:border-slate-700/50 hover:shadow-xl dark:hover:shadow-slate-900/20 transition-all duration-300 hover:translate-y-[-8px] animate-fade-in-up p-0 flex flex-col" style={{ animationDelay: '0.2s' }}>
                    {/* Kart Başlık Alanı ve İkon - Ortalandı */}
                    <div className="p-6 pb-3 flex flex-col items-center text-center">
                      <div className="relative">
                        <div className="absolute -top-2 -left-1/2 w-24 h-24 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-2xl transform group-hover:scale-150 group-hover:opacity-100 transition-all duration-700"></div>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-5 shadow-md shadow-emerald-500/20 dark:shadow-emerald-500/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative mx-auto">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        </div>
                        
                        <div className="relative">
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-center">Kategori Sistemi</h3>
                          <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-emerald-500 dark:bg-emerald-400 group-hover:w-20 transition-all duration-300 mx-auto"></span>
                        </div>
                      </div>
                    </div>

                    {/* Kart İçeriği - Ortalandı */}
                    <div className="p-6 pt-2 flex-grow flex flex-col items-center text-center">
                      <p className="text-gray-600 dark:text-gray-300 text-[15px] mb-4">
                        Görevlerinizi kategorilere ayırarak daha düzenli bir çalışma ortamı oluşturun ve odaklanın.
                      </p>
                      <ul className="mt-2 space-y-3 text-sm w-full">
                        <li className="flex items-center text-gray-600 dark:text-gray-400 justify-center">
                          <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 mr-3">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </div>
                          <span>Özel renkli kategoriler oluşturma</span>
                        </li>
                        <li className="flex items-center text-gray-600 dark:text-gray-400 justify-center">
                          <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 mr-3">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </div>
                          <span>Kategori bazlı filtreleme ve arama</span>
                        </li>
                      </ul>
                    </div>
                    
                    {/* Kart Alt Kısmı - Vurgu Çizgisi */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-green-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-500 mt-auto"></div>
                  </div>
                  
                  {/* Özellik Kartı 3: İstatistikler */}
                  <div className="relative group overflow-hidden bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-slate-900/10 border border-slate-200/60 dark:border-slate-700/50 hover:shadow-xl dark:hover:shadow-slate-900/20 transition-all duration-300 hover:translate-y-[-8px] animate-fade-in-up p-0 flex flex-col" style={{ animationDelay: '0.3s' }}>
                    {/* Kart Başlık Alanı ve İkon - Ortalandı */}
                    <div className="p-6 pb-3 flex flex-col items-center text-center">
                      <div className="relative">
                        <div className="absolute -top-2 -left-1/2 w-24 h-24 rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-2xl transform group-hover:scale-150 group-hover:opacity-100 transition-all duration-700"></div>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mb-5 shadow-md shadow-purple-500/20 dark:shadow-purple-500/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative mx-auto">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        
                        <div className="relative">
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors text-center">İstatistikler</h3>
                          <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-purple-500 dark:bg-purple-400 group-hover:w-20 transition-all duration-300 mx-auto"></span>
                        </div>
                      </div>
                    </div>

                    {/* Kart İçeriği - Ortalandı */}
                    <div className="p-6 pt-2 flex-grow flex flex-col items-center text-center">
                      <p className="text-gray-600 dark:text-gray-300 text-[15px] mb-4">
                        Görev tamamlama performansınızı ve iş dağılımını görsel grafiklerle analiz edin.
                      </p>
                      <ul className="mt-2 space-y-3 text-sm w-full">
                        <li className="flex items-center text-gray-600 dark:text-gray-400 justify-center">
                          <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 dark:text-purple-400 mr-3">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </div>
                          <span>Detaylı tamamlanma istatistikleri</span>
                        </li>
                        <li className="flex items-center text-gray-600 dark:text-gray-400 justify-center">
                          <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 dark:text-purple-400 mr-3">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </div>
                          <span>Kategori bazlı iş dağılım analizi</span>
                        </li>
                      </ul>
                    </div>
                    
                    {/* Kart Alt Kısmı - Vurgu Çizgisi */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 to-violet-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-500 mt-auto"></div>
                  </div>
                  
                  {/* Özellik Kartı 4: Hatırlatmalar */}
                  <div className="relative group overflow-hidden bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-slate-900/10 border border-slate-200/60 dark:border-slate-700/50 hover:shadow-xl dark:hover:shadow-slate-900/20 transition-all duration-300 hover:translate-y-[-8px] animate-fade-in-up p-0 flex flex-col" style={{ animationDelay: '0.4s' }}>
                    {/* Kart Başlık Alanı ve İkon - Ortalandı */}
                    <div className="p-6 pb-3 flex flex-col items-center text-center">
                      <div className="relative">
                        <div className="absolute -top-2 -left-1/2 w-24 h-24 rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-2xl transform group-hover:scale-150 group-hover:opacity-100 transition-all duration-700"></div>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-5 shadow-md shadow-amber-500/20 dark:shadow-amber-500/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative mx-auto">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        </div>
                        
                        <div className="relative">
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors text-center">Hatırlatmalar</h3>
                          <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-amber-500 dark:bg-amber-400 group-hover:w-20 transition-all duration-300 mx-auto"></span>
                        </div>
                      </div>
                    </div>

                    {/* Kart İçeriği - Ortalandı */}
                    <div className="p-6 pt-2 flex-grow flex flex-col items-center text-center">
                      <p className="text-gray-600 dark:text-gray-300 text-[15px] mb-4">
                        Görevleriniz için son tarih belirleyin ve zamanında tamamlandığından emin olun.
                      </p>
                      <ul className="mt-2 space-y-3 text-sm w-full">
                        <li className="flex items-center text-gray-600 dark:text-gray-400 justify-center">
                          <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400 mr-3">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </div>
                          <span>Son tarih yaklaşan görevleri görüntüleme</span>
                        </li>
                        <li className="flex items-center text-gray-600 dark:text-gray-400 justify-center">
                          <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400 mr-3">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </div>
                          <span>Akıllı tarih ve zaman seçicisi</span>
                        </li>
                      </ul>
                    </div>
                    
                    {/* Kart Alt Kısmı - Vurgu Çizgisi */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 to-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-500 mt-auto"></div>
                  </div>
                </div>

                {/* Giriş/Kayıt Butonları */}
                <div className="text-center relative animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                  <div className="relative z-10 inline-flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 bg-white/80 dark:bg-[#2a3544]/90 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-[#384352]/50">
                    <div className="text-center sm:text-left mb-4 sm:mb-0 sm:mr-4">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Hemen Başlayın</h3>
                      <p className="text-base text-gray-600 dark:text-gray-300">Hesabınıza giriş yapın veya yeni bir hesap oluşturun</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
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
                
                {/* Ek dekoratif elementler */}
                <div className="absolute -top-20 right-0 w-72 h-72 bg-gradient-to-bl from-indigo-200/30 to-blue-200/30 dark:from-indigo-900/10 dark:to-blue-900/10 rounded-full blur-3xl -z-10 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-10 left-0 w-64 h-64 bg-gradient-to-tr from-purple-200/30 to-pink-200/30 dark:from-purple-900/10 dark:to-pink-900/10 rounded-full blur-3xl -z-10 animate-pulse-slow" style={{ animationDelay: '0s' }}></div>
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Abonelik Geçmişi Sayfası - Modal tarzında gösteriliyor */}
      {showSubscriptionHistory && (
        <div 
          className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] overflow-auto p-4"
          onClick={(e) => {
            // Modal dışına tıklandığında modalı kapat
            if (e.target === e.currentTarget) {
              toggleSubscriptionHistory();
            }
          }}
        >
          <div className="max-w-5xl w-full my-8">
            <SubscriptionHistoryPage
              user={authState.user}
              onClose={toggleSubscriptionHistory}
            />
          </div>
        </div>
      )}
      
      {/* Abonelik Bildirimleri */}
      {authState.isAuthenticated && !showSubscriptionPage && (
        <SubscriptionNotifications 
          user={authState.user} 
          onRenew={() => setShowSubscriptionPage(true)} 
        />
      )}
    </TodoProvider>
  )
}

export default App
