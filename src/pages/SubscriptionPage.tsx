import React, { useState, useMemo, useEffect } from 'react';
import SubscriptionPlans from '../components/Subscription/SubscriptionPlans';
import { SubscriptionPlan, User } from '../types';
import { SUBSCRIPTION_PLANS, getUserPlan, hasExpiredPremiumPlan, getExpiredPremiumMessage } from '../utils/subscription';
import axios from 'axios';

interface SubscriptionPageProps {
  user: User | null;
  onSubscriptionChange: (plan: SubscriptionPlan) => void;
}

// API URL'ini ortam değişkeninden al veya varsayılanı kullan
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ user, onSubscriptionChange }) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [refreshedUser, setRefreshedUser] = useState<User | null>(user);
  const [apiConnected, setApiConnected] = useState(true); // API bağlantı durumu
  
  // Sayfa açıldığında güncel kullanıcı bilgilerini sunucudan al
  useEffect(() => {
    const fetchCurrentUserData = async () => {
      if (!user) return;
      
      try {
        // JWT token'ı localStorage'dan al
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        
        // Sunucudan en güncel kullanıcı bilgilerini al
        const response = await axios.get(`${API_URL}/auth/validate`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.user) {
          console.log('Güncel kullanıcı verileri alındı:', response.data.user);
          
          // Güncel kullanıcı bilgilerini state'e kaydet
          setRefreshedUser(response.data.user);
          
          // Ayrıca localStorage'daki kullanıcı bilgilerini güncelle
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          // Abonelik sayfasını güncel verilerle otomatik olarak güncelle
          if (response.data.user.subscription_plan !== user.subscription_plan) {
            console.log('Abonelik planı değişikliği tespit edildi:', 
              user.subscription_plan, ' -> ', response.data.user.subscription_plan);

            // Ana sayfadaki state'i de güncellememiz gerekiyor
            // Bu sebeple onSubscriptionChange'i çağırıyoruz
            onSubscriptionChange(response.data.user.subscription_plan as SubscriptionPlan);
          }
        }
      } catch (error) {
        console.error('Kullanıcı bilgileri güncellenirken hata:', error);
      }
    };
    
    fetchCurrentUserData();
  }, [user, onSubscriptionChange]);
  
  // Ödeme bilgileri
  const [paymentData, setPaymentData] = useState({
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });
  
  // Abonelik sona erme bilgisini hesapla
  const subscriptionInfo = useMemo(() => {
    if (!user?.subscription_expires) return null;
    
    // Free plan için özel kontrol - free planın son kullanma tarihini kontrol etme
    if (user.subscription_plan === 'free') {
      return {
        expiryDate: new Date(),
        remainingDays: 0,
        isExpired: false,
        isFree: true
      };
    }
    
    const expiryDate = new Date(user.subscription_expires);
    const today = new Date();
    
    // Kalan gün sayısı
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      expiryDate,
      remainingDays: diffDays,
      isExpired: diffDays <= 0,
      isFree: false
    };
  }, [user?.subscription_expires, user?.subscription_plan]);
  
  // Form alanlarını güncelle
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };
  
  // Plan seçildiğinde çalışır
  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setPaymentSuccess(false);
    setPaymentError(null);
    
    // Eğer ücretsiz plan seçildiyse ödeme formunu atla
    if (plan === 'free') {
      handleCompleteSubscription(plan);
    } else {
      // Kullanıcının aktif plan kontrolü
      // Süresi dolmuş planları yenilemek için özel durum kontrolü
      const currentActivePlan = getUserPlan(refreshedUser);
      const isRenewingExpiredPlan = hasExpiredPremiumPlan(refreshedUser) && refreshedUser?.subscription_plan === plan;
      
      // Eğer kullanıcı süresi dolmuş planı yenilemiyorsa ve zaten bu plana sahipse hata göster
      if (currentActivePlan === plan && !isRenewingExpiredPlan) {
        setPaymentError(`Zaten ${SUBSCRIPTION_PLANS[plan].name} planını kullanıyorsunuz.`);
        return;
      }
    }
  };
  
  // Ödeme işlemini tamamla
  const handleCompleteSubscription = async (plan: SubscriptionPlan) => {
    try {
      setIsProcessing(true);

      // Gerçek bir ödeme sistemi olacağından, burada sadece simülasyon yapıyoruz
      // Normalde burada ödeme işlemini gerçekleştirir ve sonucu bekleriz
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (!user) {
        setPaymentError('Kullanıcı bilgisi bulunamadı.');
        setIsProcessing(false);
        return;
      }
      
      // API'ye abonelik güncelleme isteği gönder
      if (apiConnected) {
        try {
          // JWT token'ı localStorage'dan al
          const token = localStorage.getItem('auth_token');
          if (!token) {
            setPaymentError('Oturum bilgisi bulunamadı.');
            setIsProcessing(false);
            return;
          }
          
          // Veritabanında abonelik planını güncelle
          const response = await axios.put(
            `${API_URL}/users/${user.id}/subscription`, 
            { plan },
            { headers: { Authorization: `Bearer ${token}` }}
          );
          
          // Sunucudan güncel kullanıcı bilgilerini al
          if (response.data && response.data.user) {
            console.log('Abonelik güncellendi:', response.data);
            
            // Güncel kullanıcı bilgilerini state'e kaydet
            setRefreshedUser(response.data.user);
            
            // LocalStorage'ı güncelle
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            // Ana sayfadaki state'i güncelle
            onSubscriptionChange(plan);
            
            setPaymentSuccess(true);
            setSelectedPlan(plan);
            setIsProcessing(false);
            return;
          }
        } catch (error) {
          console.error('API ile abonelik güncellenirken hata:', error);
          setPaymentError('Abonelik güncelleme sırasında bir hata oluştu. Lütfen tekrar deneyin.');
          setIsProcessing(false);
          return;
        }
      } else {
        // API bağlantısı yoksa yerel olarak güncelle
        // Abonelik sona erme tarihini güncelle
        const today = new Date();
        // Plan süresini al (gün cinsinden)
        const planDuration = SUBSCRIPTION_PLANS[plan].duration || 30;
        
        // Yeni sona erme tarihini hesapla
        const newExpiryDate = new Date(today);
        newExpiryDate.setDate(today.getDate() + planDuration);
        
        // Kullanıcı bilgilerini güncelle
        const updatedUser = {
          ...user,
          subscription_plan: plan,
          subscription_expires: newExpiryDate.toISOString()
        };
        
        // LocalStorage'ı güncelle
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // State'i güncelle
        setRefreshedUser(updatedUser);
      
      // Başarılı ödeme
      onSubscriptionChange(plan);
      setPaymentSuccess(true);
      setSelectedPlan(plan);
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Abonelik işlemi sırasında hata:', error);
      setPaymentError('Ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.');
      setIsProcessing(false);
    }
  };
  
  // Ödeme formunu gönder
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basit doğrulama
    if (!selectedPlan) {
      setPaymentError('Lütfen bir abonelik planı seçin.');
      return;
    }
    
    if (selectedPlan === 'free') {
      handleCompleteSubscription(selectedPlan);
      return;
    }
    
    // Kart bilgilerini doğrula
    if (!paymentData.cardName.trim()) {
      setPaymentError('Kart üzerindeki isim alanı boş olamaz.');
      return;
    }
    
    if (!paymentData.cardNumber.trim() || paymentData.cardNumber.replace(/\s/g, '').length !== 16) {
      setPaymentError('Geçerli bir kart numarası girin (16 haneli).');
      return;
    }
    
    if (!paymentData.expiryDate.trim() || !/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) {
      setPaymentError('Geçerli bir son kullanma tarihi girin (AA/YY).');
      return;
    }
    
    if (!paymentData.cvv.trim() || !/^\d{3}$/.test(paymentData.cvv)) {
      setPaymentError('Geçerli bir CVV kodu girin (3 haneli).');
      return;
    }
    
    // Ödeme işlemini başlat
    handleCompleteSubscription(selectedPlan);
  };
  
  // Kart numarasını formatlama (her 4 rakamdan sonra boşluk)
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };
  
  // Son kullanma tarihini formatlama (AA/YY)
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return v;
  };
  
  // Mevcut plan özelliklerini listele
  const renderCurrentPlanFeatures = () => {
    if (!user) return null;
    
    const currentPlan = getUserPlan(user);
    const features = SUBSCRIPTION_PLANS[currentPlan].features;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 shadow-md border border-gray-200 dark:border-gray-600 transition-all duration-300">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Mevcut Plan Özellikleri
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/60">
            <div className="font-medium text-gray-700 dark:text-gray-200 mb-1">Maksimum Görev</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {features.max_todos === Infinity ? 'Sınırsız' : features.max_todos}
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/60">
            <div className="font-medium text-gray-700 dark:text-gray-200 mb-1">Maksimum Kategori</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {features.max_categories === Infinity ? 'Sınırsız' : features.max_categories}
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/60">
            <div className="font-medium text-gray-700 dark:text-gray-200 mb-1">Markdown Desteği</div>
            <div className="text-xl font-bold flex items-center">
              {features.has_markdown_support ? (
                <span className="text-green-600 dark:text-green-400 flex items-center">
                  <svg className="h-6 w-6 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  Aktif
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-400 flex items-center">
                  <svg className="h-6 w-6 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                  </svg>
                  Pasif
                </span>
              )}
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/60">
            <div className="font-medium text-gray-700 dark:text-gray-200 mb-1">Gelişmiş Analitik</div>
            <div className="text-xl font-bold flex items-center">
              {features.analytics_enabled ? (
                <span className="text-green-600 dark:text-green-400 flex items-center">
                  <svg className="h-6 w-6 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  Aktif
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-400 flex items-center">
                  <svg className="h-6 w-6 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                  </svg>
                  Pasif
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Plan karşılaştırma göstergesi
  const renderPlanComparison = () => {
    if (!selectedPlan || selectedPlan === 'free' || !user || !user.subscription_plan) return null;
    
    const currentPlanFeatures = SUBSCRIPTION_PLANS[getUserPlan(user)].features;
    const newPlanFeatures = SUBSCRIPTION_PLANS[selectedPlan].features;
    
    const getComparisonResult = (currentValue: any, newValue: any) => {
      if (currentValue === newValue) return 'same';
      if (newValue === Infinity || (typeof newValue === 'number' && typeof currentValue === 'number' && newValue > currentValue)) return 'better';
      if (newValue === true && currentValue === false) return 'better';
      return 'worse';
    };
    
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-5">
        <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Plan Karşılaştırması</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Görevler</div>
            <div className={`font-bold ${
              getComparisonResult(currentPlanFeatures.max_todos, newPlanFeatures.max_todos) === 'better' 
                ? 'text-green-600 dark:text-green-400' 
                : getComparisonResult(currentPlanFeatures.max_todos, newPlanFeatures.max_todos) === 'worse' 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-gray-800 dark:text-gray-200'
            }`}>
              {currentPlanFeatures.max_todos === Infinity ? '∞' : currentPlanFeatures.max_todos} → {newPlanFeatures.max_todos === Infinity ? '∞' : newPlanFeatures.max_todos}
              {getComparisonResult(currentPlanFeatures.max_todos, newPlanFeatures.max_todos) === 'better' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Kategoriler</div>
            <div className={`font-bold ${
              getComparisonResult(currentPlanFeatures.max_categories, newPlanFeatures.max_categories) === 'better' 
                ? 'text-green-600 dark:text-green-400' 
                : getComparisonResult(currentPlanFeatures.max_categories, newPlanFeatures.max_categories) === 'worse' 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-gray-800 dark:text-gray-200'
            }`}>
              {currentPlanFeatures.max_categories === Infinity ? '∞' : currentPlanFeatures.max_categories} → {newPlanFeatures.max_categories === Infinity ? '∞' : newPlanFeatures.max_categories}
              {getComparisonResult(currentPlanFeatures.max_categories, newPlanFeatures.max_categories) === 'better' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Markdown Desteği</div>
            <div className={`font-bold ${
              getComparisonResult(currentPlanFeatures.has_markdown_support, newPlanFeatures.has_markdown_support) === 'better' 
                ? 'text-green-600 dark:text-green-400' 
                : getComparisonResult(currentPlanFeatures.has_markdown_support, newPlanFeatures.has_markdown_support) === 'worse' 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-gray-800 dark:text-gray-200'
            }`}>
              {currentPlanFeatures.has_markdown_support ? 'Var' : 'Yok'} → {newPlanFeatures.has_markdown_support ? 'Var' : 'Yok'}
              {getComparisonResult(currentPlanFeatures.has_markdown_support, newPlanFeatures.has_markdown_support) === 'better' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Gelişmiş Analitik</div>
            <div className={`font-bold ${
              getComparisonResult(currentPlanFeatures.analytics_enabled, newPlanFeatures.analytics_enabled) === 'better' 
                ? 'text-green-600 dark:text-green-400' 
                : getComparisonResult(currentPlanFeatures.analytics_enabled, newPlanFeatures.analytics_enabled) === 'worse' 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-gray-800 dark:text-gray-200'
            }`}>
              {currentPlanFeatures.analytics_enabled ? 'Var' : 'Yok'} → {newPlanFeatures.analytics_enabled ? 'Var' : 'Yok'}
              {getComparisonResult(currentPlanFeatures.analytics_enabled, newPlanFeatures.analytics_enabled) === 'better' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Başlık ve açıklama */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4">Aboneliğinizi Yönetin</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            İhtiyaçlarınıza en uygun planı seçerek Todo uygulamasının tüm özelliklerinden yararlanın.
            Dilediğiniz zaman aboneliğinizi değiştirebilir veya iptal edebilirsiniz.
          </p>
        </div>
        
        {/* Mevcut abonelik bilgisi - refreshedUser kullanılıyor */}
        {refreshedUser && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium text-blue-800 dark:text-blue-300">Mevcut Aboneliğiniz</h2>
              <div className="flex items-center mt-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">
                    {SUBSCRIPTION_PLANS[getUserPlan(refreshedUser)].name} Plan
                </span>
                <span className="ml-3 bg-blue-100 dark:bg-blue-800/40 px-3 py-1 rounded-full text-sm text-blue-700 dark:text-blue-300 font-medium">
                    {SUBSCRIPTION_PLANS[getUserPlan(refreshedUser)].price.toFixed(2)} ₺/ay
                </span>
                  
                  {/* Yenile butonu */}
                  <button
                    onClick={() => {
                      // Sayfayı yenile ve localStorage'dan taze bilgileri al
                      window.location.reload();
                    }}
                    className="ml-3 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full flex items-center justify-center transition-all duration-300" 
                    title="Abonelik bilgilerini yenile"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {subscriptionInfo && (
                <div className="bg-white dark:bg-[#1c2732] shadow-sm rounded-lg p-4 border border-blue-100 dark:border-blue-800/60">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {subscriptionInfo.isFree ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        )}
                      </svg>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {subscriptionInfo.isFree ? 'Plan Durumu' : 'Yenileme Tarihi'}
                      </span>
            </div>
                    
                    <div className="text-blue-600 dark:text-blue-400 font-medium mb-2">
                      {subscriptionInfo.isFree ? (
                        'Süresiz Kullanım'
                      ) : (
                        subscriptionInfo.expiryDate.toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                        })
                      )}
                    </div>
                    
                    <div className={`text-sm font-medium ${
                      subscriptionInfo.isFree ? 'text-blue-500 dark:text-blue-400' :
                      subscriptionInfo.isExpired ? 'text-red-500 dark:text-red-400' : 
                      subscriptionInfo.remainingDays <= 5 ? 'text-orange-500 dark:text-orange-400' : 
                      'text-green-600 dark:text-green-400'
                    }`}>
                      {subscriptionInfo.isFree
                        ? 'Ücretsiz Plan Aktif'
                        : subscriptionInfo.isExpired 
                          ? 'Aboneliğiniz sona erdi!' 
                          : `${subscriptionInfo.remainingDays} gün kaldı`
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Süresi dolmuş premium planlar için özel bildirim */}
            {hasExpiredPremiumPlan(refreshedUser) && (
              <div className="mt-4 px-4 py-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p>
                    <span className="font-medium block mb-1">Önceden {refreshedUser.subscription_plan === 'premium' ? 'Premium' : 'Kurumsal'} plan kullanıcısıydınız</span>
                    <span className="text-sm">{getExpiredPremiumMessage(refreshedUser)}</span>
                  </p>
                </div>
                <button 
                  onClick={() => handlePlanSelect(refreshedUser.subscription_plan as SubscriptionPlan)}
                  className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium"
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Planı Yenile
                  </span>
                </button>
              </div>
            )}
            
            {/* Abonelik durumu bilgisi */}
            {subscriptionInfo && !hasExpiredPremiumPlan(refreshedUser) && (
              <div className={`mt-4 px-4 py-3 rounded-lg text-sm ${
                subscriptionInfo.isFree ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' :
                subscriptionInfo.isExpired ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' :
                subscriptionInfo.remainingDays <= 5 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
              }`}>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {subscriptionInfo.isFree ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    ) : subscriptionInfo.isExpired ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : subscriptionInfo.remainingDays <= 5 ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                  {subscriptionInfo.isFree 
                    ? 'Ücretsiz plan aktif durumda.'
                    : subscriptionInfo.isExpired 
                      ? 'Ücretli aboneliğiniz sona ermiş. Lütfen planınızı yenileyiniz.' 
                      : subscriptionInfo.remainingDays <= 5 
                        ? `Aboneliğinizin bitmesine ${subscriptionInfo.remainingDays} gün kaldı.` 
                        : 'Aboneliğiniz aktif durumda.'}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Mevcut plan özellikleri */}
        {refreshedUser && !selectedPlan && !paymentSuccess && renderCurrentPlanFeatures()}
        
        {/* Abonelik planları */}
        {!selectedPlan && !paymentSuccess && (
          <SubscriptionPlans 
            user={refreshedUser} 
            onSelectPlan={handlePlanSelect} 
          />
        )}
        
        {/* Ödeme formu - sadece ücretli planlar için ve ödeme başarılı değilse göster */}
        {selectedPlan && selectedPlan !== 'free' && !paymentSuccess && (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 max-w-2xl mx-auto animate-fade-scale-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Ödeme Bilgileri</h2>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">{SUBSCRIPTION_PLANS[selectedPlan].name}</span> planı için ödeme bilgilerinizi girin
              </p>
              <div className="mt-3 text-2xl font-bold text-blue-600 dark:text-blue-400">
                {SUBSCRIPTION_PLANS[selectedPlan].price.toFixed(2)} ₺<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/ay</span>
              </div>
            </div>
            
            {/* Plan karşılaştırma göstergesi */}
            {renderPlanComparison()}
            
            {/* Süresi dolmuş plan yenileme mesajı */}
            {hasExpiredPremiumPlan(refreshedUser) && refreshedUser?.subscription_plan === selectedPlan && (
              <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 p-3 rounded-lg mb-4 text-sm border border-amber-200 dark:border-amber-800">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Süresi dolmuş <strong>{SUBSCRIPTION_PLANS[selectedPlan].name}</strong> planınızı yeniliyorsunuz. Ödeme sonrası tüm premium özellikler tekrar aktif olacaktır.</span>
                </div>
              </div>
            )}
            
            {paymentError && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4 text-sm border border-red-200 dark:border-red-800">
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                  </svg>
                  {paymentError}
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              {/* Kart önizleme */}
              <div className="mb-8 perspective-1000">
                <div className={`credit-card relative w-full h-48 rounded-xl overflow-hidden shadow-lg transition-all duration-500 transform ${paymentData.cardNumber ? 'card-filled' : ''}`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-800 dark:from-blue-700 dark:to-indigo-900 p-5 flex flex-col justify-between">
                    {/* Kart Logosu */}
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div className="text-white text-sm font-light uppercase tracking-widest">
                        Credit Card
                      </div>
                    </div>
                    
                    {/* Kart Numarası */}
                    <div className="text-white text-xl font-medium tracking-widest mt-4">
                      {paymentData.cardNumber ? paymentData.cardNumber : "•••• •••• •••• ••••"}
                    </div>
                    
                    {/* Kart Detayları */}
                    <div className="flex justify-between mt-4">
                      <div>
                        <div className="text-white/60 text-xs uppercase">Kart Sahibi</div>
                        <div className="text-white font-medium tracking-wider mt-1">
                          {paymentData.cardName || "AD SOYAD"}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/60 text-xs uppercase">Son Kul. Tar.</div>
                        <div className="text-white font-medium tracking-wider mt-1">
                          {paymentData.expiryDate || "AA/YY"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="cardName" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Kart Üzerindeki İsim
                </label>
                <input
                  type="text"
                  id="cardName"
                  name="cardName"
                  value={paymentData.cardName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Ad Soyad"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="cardNumber" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                  Kart Numarası
                </label>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  value={paymentData.cardNumber}
                  onChange={(e) => {
                    const formattedValue = formatCardNumber(e.target.value);
                    setPaymentData(prev => ({ ...prev, cardNumber: formattedValue }));
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  required
                />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label htmlFor="expiryDate" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Son Kullanma
                  </label>
                  <input
                    type="text"
                    id="expiryDate"
                    name="expiryDate"
                    value={paymentData.expiryDate}
                    onChange={(e) => {
                      const formattedValue = formatExpiryDate(e.target.value);
                      setPaymentData(prev => ({ ...prev, expiryDate: formattedValue }));
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="AA/YY"
                    maxLength={5}
                    required
                  />
                </div>
                
                <div className="flex-1">
                  <label htmlFor="cvv" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                    CVV
                  </label>
                  <input
                    type="text"
                    id="cvv"
                    name="cvv"
                    value={paymentData.cvv}
                    onChange={(e) => {
                      // Sadece sayıları kabul et
                      const value = e.target.value.replace(/\D/g, '');
                      setPaymentData(prev => ({ ...prev, cvv: value }));
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="123"
                    maxLength={3}
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors duration-200"
                >
                  Geri Dön
                </button>
                
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 text-white rounded-lg font-medium shadow-lg hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      İşleniyor...
                    </>
                  ) : (
                    'Ödemeyi Tamamla'
                  )}
                </button>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                Ödeme bilgileriniz güvenli bir şekilde işlenir. Aboneliğinizi istediğiniz zaman iptal edebilirsiniz.
              </div>
            </form>
          </div>
        )}
        
        {/* Başarılı ödeme mesajı */}
        {paymentSuccess && (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8 max-w-2xl mx-auto text-center animate-fade-scale-in">
            <div className="mb-6 text-green-500 flex justify-center">
              <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Aboneliğiniz Başarıyla Güncellendi!</h2>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {selectedPlan === 'free' 
                ? 'Ücretsiz plana geçişiniz tamamlandı. İstediğiniz zaman ücretli planlara geçiş yapabilirsiniz.'
                : `${SUBSCRIPTION_PLANS[selectedPlan!].name} planınız aktif edildi. Tüm premium özellikleri kullanmaya başlayabilirsiniz.`
              }
            </p>
            
            <button
              onClick={() => {
                console.log("Anasayfaya Dön butonuna tıklandı");
                // Önce durum değişkenlerini sıfırla
                setSelectedPlan(null);
                setPaymentSuccess(false);
                
                // Sayfayı yenile ve güncel verileri al
                window.location.reload();
                
                // Sonra abonelik değişikliğini uygula (ana sayfaya dönüş otomatik olacak)
                setTimeout(() => {
                  if (selectedPlan) {
                    onSubscriptionChange(selectedPlan);
                  } else {
                    // Eğer plan seçilmemişse (hata durumu) manuel olarak ana sayfaya dön
                    // Buradaki kodu App.tsx'deki toggleSubscriptionPage'e benzer yapacağız
                    // onSubscriptionChange kullanıcıyı ana sayfaya yönlendirecek
                    onSubscriptionChange(refreshedUser?.subscription_plan || 'free');
                  }
                }, 100);
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Anasayfaya Dön
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage; 