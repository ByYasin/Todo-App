import React, { useState } from 'react';
import SubscriptionPlans from '../components/Subscription/SubscriptionPlans';
import { SubscriptionPlan, User } from '../types';
import { SUBSCRIPTION_PLANS, getUserPlan } from '../utils/subscription';

interface SubscriptionPageProps {
  user: User | null;
  onSubscriptionChange: (plan: SubscriptionPlan) => void;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ user, onSubscriptionChange }) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  // Ödeme bilgileri
  const [paymentData, setPaymentData] = useState({
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });
  
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
      // Kullanıcının zaten bu plana sahip olup olmadığını kontrol et
      if (user && user.subscription_plan === plan) {
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
      
      // Başarılı ödeme
      onSubscriptionChange(plan);
      setPaymentSuccess(true);
      setSelectedPlan(plan);
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
        
        {/* Mevcut abonelik bilgisi */}
        {user && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-medium text-blue-800 dark:text-blue-300">Mevcut Aboneliğiniz</h2>
              <div className="flex items-center mt-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">
                  {SUBSCRIPTION_PLANS[getUserPlan(user)].name} Plan
                </span>
                <span className="ml-3 bg-blue-100 dark:bg-blue-800/40 px-3 py-1 rounded-full text-sm text-blue-700 dark:text-blue-300 font-medium">
                  {SUBSCRIPTION_PLANS[getUserPlan(user)].price.toFixed(2)} ₺/ay
                </span>
              </div>
            </div>
            {user.subscription_expires && (
              <div className="bg-white dark:bg-[#1c2732] shadow-sm rounded-lg p-3 border border-blue-100 dark:border-blue-800/60">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Yenileme tarihi</div>
                <div className="text-blue-600 dark:text-blue-400 font-medium">
                  {new Date(user.subscription_expires).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Mevcut plan özellikleri */}
        {user && !selectedPlan && !paymentSuccess && renderCurrentPlanFeatures()}
        
        {/* Abonelik planları */}
        {!selectedPlan && !paymentSuccess && (
          <SubscriptionPlans 
            user={user} 
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
                
                // Sonra abonelik değişikliğini uygula (ana sayfaya dönüş otomatik olacak)
                setTimeout(() => {
                  if (selectedPlan) {
                    onSubscriptionChange(selectedPlan);
                  } else {
                    // Eğer plan seçilmemişse (hata durumu) manuel olarak ana sayfaya dön
                    // Buradaki kodu App.tsx'deki toggleSubscriptionPage'e benzer yapacağız
                    // onSubscriptionChange kullanıcıyı ana sayfaya yönlendirecek
                    onSubscriptionChange(user?.subscription_plan || 'free');
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