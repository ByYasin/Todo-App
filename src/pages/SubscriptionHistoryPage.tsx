import React, { useState, useEffect } from 'react';
import { User, SubscriptionPlan } from '../types';

// Ödeme geçmişi tipi
interface PaymentHistory {
  id: number;
  subscription_plan: SubscriptionPlan;
  plan_name: string;
  amount: number;
  payment_date: string;
  status: string;
  payment_method: string;
}

// Abonelik sürelerini tanımla (gün cinsinden)
const SUBSCRIPTION_DURATIONS = {
  'free': 30,      // Ücretsiz plan 30 gün
  'premium': 30,   // Premium plan 30 gün
  'enterprise': 30 // Enterprise plan 30 gün
};

// Süreyi okunabilir formata dönüştür
const formatDuration = (days: number): string => {
  if (days >= 30) {
    return `${Math.floor(days / 30)} ay`;
  } else {
    return `${days} gün`;
  }
};

interface SubscriptionHistoryPageProps {
  user: User | null;
  onClose: () => void;
}

const SubscriptionHistoryPage: React.FC<SubscriptionHistoryPageProps> = ({ user, onClose }) => {
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tümü' | 'aktif' | 'geçmiş'>('tümü');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // JWT token'ı localStorage'dan al
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setError('Oturum bilgisi bulunamadı');
          setLoading(false);
          return;
        }

        // API olmadığı için doğrudan test verisini göster (gerçek API entegre edildiğinde değiştirilecek)
        // Test verisi oluştur (geçici)
        const testData: PaymentHistory[] = [
          {
            id: 1,
            subscription_plan: 'premium',
            plan_name: 'Premium',
            amount: Number(149.99),
            payment_date: new Date().toISOString(),
            status: 'completed',
            payment_method: 'credit_card'
          },
          {
            id: 2,
            subscription_plan: 'enterprise',
            plan_name: 'Kurumsal',
            amount: Number(325.00),
            payment_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 gün önce
            status: 'completed',
            payment_method: 'credit_card'
          },
          {
            id: 3,
            subscription_plan: 'free',
            plan_name: 'Ücretsiz',
            amount: Number(0),
            payment_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 gün önce
            status: 'completed',
            payment_method: 'credit_card'
          }
        ];
        
        // Gecikmeli yükleme için kısa bir gecikme ekle (yalnızca UI gösterimi için)
        setTimeout(() => {
          setPaymentHistory(testData);
          setLoading(false);
        }, 700);
      } catch (error) {
        console.error('Ödeme geçmişi alınırken hata:', error);
        setError('Ödeme geçmişi yüklenirken bir hata oluştu');
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, [user]);

  // Ödeme durumunu Türkçeye çevir
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'completed': 'Tamamlandı',
      'pending': 'Bekliyor',
      'failed': 'Başarısız',
      'refunded': 'İade Edildi',
      'cancelled': 'İptal Edildi'
    };
    
    return statusMap[status] || status;
  };
  
  // Ödeme durumuna göre renk sınıfı
  const getStatusColorClass = (status: string) => {
    const colorMap: Record<string, string> = {
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'failed': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'refunded': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'cancelled': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    
    return colorMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };
  
  // Ödeme yöntemini simge ile göster
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
    }
  };

  // Plan ikonlarını göster
  const getPlanIcon = (plan: SubscriptionPlan) => {
    switch(plan) {
      case 'premium':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      case 'enterprise':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // Filtreli veriyi al
  const filteredHistory = paymentHistory.filter(payment => {
    // Tüm alanlar içinde arama yap
    const searchText = filter.toLowerCase();
    const matchesSearch = 
      payment.plan_name.toLowerCase().includes(searchText) ||
      payment.amount.toString().includes(searchText) ||
      getStatusText(payment.status).toLowerCase().includes(searchText);
    
    // Aktif sekme filtrelemesi
    if (activeTab === 'tümü') return matchesSearch;
    if (activeTab === 'aktif') {
      // Son 30 gün içindeki ödemeler aktif kabul edilsin
      const paymentDate = new Date(payment.payment_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return paymentDate >= thirtyDaysAgo && matchesSearch;
    }
    if (activeTab === 'geçmiş') {
      // 30 günden eski ödemeler geçmiş kabul edilsin
      const paymentDate = new Date(payment.payment_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return paymentDate < thirtyDaysAgo && matchesSearch;
    }
    return matchesSearch;
  });

  return (
    <div className="bg-white dark:bg-[#1c2732] rounded-2xl shadow-2xl p-6 w-full max-w-5xl mx-auto border border-gray-200 dark:border-gray-700/50 animate-fade-scale-in overflow-hidden">
      {/* Üst Başlık ve Kapatma */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Abonelik Geçmişi</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tüm ödeme işlemlerinizin kaydı ve abonelik yenileme detayları</p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Arama ve Filtreleme Seçenekleri */}
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 mb-6">
        {/* Arama Kutusu */}
        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Ödeme geçmişinde ara..."
            className="block w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        
        {/* Sekme Filtreleri */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('tümü')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'tümü' 
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setActiveTab('aktif')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'aktif' 
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            Aktif
          </button>
          <button
            onClick={() => setActiveTab('geçmiş')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'geçmiş' 
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            Geçmiş
          </button>
        </div>
      </div>
      
      {/* İçerik Alanı */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/50">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="w-16 h-16 relative">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              <div className="absolute top-[4px] left-[4px] w-[calc(100%-8px)] h-[calc(100%-8px)] border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" style={{animationDuration: '1.2s', animationDirection: 'reverse'}}></div>
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Ödeme geçmişiniz yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{error}</h3>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Yeniden Dene
            </button>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {filter ? 'Arama kriterlerine uygun işlem bulunamadı' : 'Henüz ödeme geçmişiniz bulunmuyor'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filter ? 'Lütfen farklı bir arama terimi deneyin veya tüm işlemleri görüntüleyin' : 'Abonelik planı satın aldığınızda işlemleriniz burada görünecek'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 divide-y divide-gray-200 dark:divide-gray-700/70">
            {filteredHistory.map((payment) => {
              // Tarih objesini oluştur
              const paymentDate = new Date(payment.payment_date);
              
              // Türkçe tarih formatı
              const dateOptions: Intl.DateTimeFormatOptions = { 
                day: '2-digit',
                month: 'long', 
                year: 'numeric'
              };
              
              // Saat formatı
              const timeOptions: Intl.DateTimeFormatOptions = {
                hour: '2-digit',
                minute: '2-digit'
              };
              
              const formattedDate = new Intl.DateTimeFormat('tr-TR', dateOptions).format(paymentDate);
              const formattedTime = new Intl.DateTimeFormat('tr-TR', timeOptions).format(paymentDate);
              
              return (
                <div key={payment.id} className="p-5 hover:bg-gray-100/50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Sol Alan - Plan Bilgileri */}
                    <div className="flex items-center">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mr-4 ${
                        payment.subscription_plan === 'premium' 
                          ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
                          : payment.subscription_plan === 'enterprise'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                            : 'bg-gradient-to-br from-gray-400 to-gray-600'
                      }`}>
                        <div className="text-white">
                          {getPlanIcon(payment.subscription_plan)}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {payment.plan_name}
                          </h3>
                          <span className={`ml-3 px-3 py-1 text-xs font-medium rounded-full ${getStatusColorClass(payment.status)}`}>
                            {getStatusText(payment.status)}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formattedDate} - {formattedTime}
                        </div>
                      </div>
                    </div>
                    
                    {/* Orta Alan - Abonelik Süresi */}
                    <div className="flex items-center md:ml-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Süre</div>
                        <div className="text-base font-semibold text-gray-900 dark:text-white">
                          {formatDuration(SUBSCRIPTION_DURATIONS[payment.subscription_plan] || 30)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Sağ Alan - Fiyat ve Ödeme Bilgileri */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:ml-auto">
                      {/* Tutar */}
                      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Tutar</div>
                        <div className={`text-lg font-bold ${payment.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          {typeof payment.amount === 'number' ? payment.amount.toFixed(2) : payment.amount} ₺
                        </div>
                      </div>
                      
                      {/* Ödeme Yöntemi */}
                      <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                        <div className="mr-3">
                          {getPaymentMethodIcon(payment.payment_method)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Ödeme Yöntemi</div>
                          <div className="text-base font-semibold text-gray-900 dark:text-white">
                            {payment.payment_method === 'credit_card' ? 'Kredi Kartı' : payment.payment_method}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Alt Bilgi */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Son güncelleme: <span className="font-medium ml-1 text-gray-700 dark:text-gray-300">{new Date().toLocaleDateString('tr-TR')}</span>
        </div>
        
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-gray-700 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-all duration-300 inline-flex items-center shadow-sm hover:shadow transform hover:-translate-y-0.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Kapat
        </button>
      </div>
    </div>
  );
};

export default SubscriptionHistoryPage; 