import React, { useState } from 'react';
import { SubscriptionPlan, User } from '../../types';
import { SUBSCRIPTION_PLANS, getUserPlan } from '../../utils/subscription';

// Abonelik sürelerini tanımla (gün cinsinden)
const SUBSCRIPTION_DURATIONS = {
  'free': 30,      // Ücretsiz plan 30 gün
  'premium': 30,   // Premium plan 30 gün
  'enterprise': 30 // Enterprise plan 30 gün (365 günden düşürüldü)
};

// Süreyi okunabilir formata dönüştür
const formatDuration = (days: number): string => {
  if (days >= 30) {
    return `${Math.floor(days / 30)} ay`;
  } else {
    return `${days} gün`;
  }
};

interface SubscriptionPlansProps {
  user: User | null;
  onSelectPlan: (plan: SubscriptionPlan) => void;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ user, onSelectPlan }) => {
  const currentPlan = getUserPlan(user);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPlan, setComparisonPlan] = useState<SubscriptionPlan | null>(null);
  
  // Özellik gösterge ikonları
  const featureIcons = {
    check: (
      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
      </svg>
    ),
    times: (
      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
      </svg>
    ),
    infinity: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
      </svg>
    )
  };
  
  // Plan özelliklerini göstermek için
  const renderFeature = (planId: SubscriptionPlan, feature: string, value: any) => {
    if (value === true) {
      return featureIcons.check;
    } else if (value === false) {
      return featureIcons.times;
    } else if (value === Infinity) {
      return featureIcons.infinity;
    } else {
      return <span className="text-gray-700 dark:text-gray-300">{value}</span>;
    }
  };
  
  // Plan değişikliği bilgilerini hesapla
  const getPlanChangeInfo = (targetPlan: SubscriptionPlan) => {
    if (currentPlan === targetPlan) return null;
    
    const currentPlanData = SUBSCRIPTION_PLANS[currentPlan];
    const targetPlanData = SUBSCRIPTION_PLANS[targetPlan];
    
    const priceDifference = targetPlanData.price - currentPlanData.price;
    const isUpgrade = priceDifference > 0;
    
    // Özellik değişimlerini hesapla
    const featureChanges = {
      max_todos: targetPlanData.features.max_todos - currentPlanData.features.max_todos,
      max_categories: targetPlanData.features.max_categories - currentPlanData.features.max_categories,
      markdown_support: !currentPlanData.features.has_markdown_support && targetPlanData.features.has_markdown_support,
      analytics: !currentPlanData.features.analytics_enabled && targetPlanData.features.analytics_enabled,
      advanced_features: !currentPlanData.features.has_advanced_features && targetPlanData.features.has_advanced_features
    };
    
    return {
      isUpgrade,
      priceDifference: Math.abs(priceDifference),
      featureChanges
    };
  };
  
  // Plan karşılaştırma modalını göster
  const handleCompare = (plan: SubscriptionPlan) => {
    if (plan === currentPlan) return;
    setComparisonPlan(plan);
    setShowComparison(true);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 max-w-6xl mx-auto">
      <div className="text-center mb-10 animate-fade-in-down">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Abonelik Planları</h2>
        <p className="text-gray-600 dark:text-gray-300">İhtiyaçlarınıza en uygun planı seçin</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {Object.values(SUBSCRIPTION_PLANS).map((plan, index) => {
          const isCurrentPlan = plan.id === currentPlan;
          const planDuration = SUBSCRIPTION_DURATIONS[plan.id] || 30;
          const planChangeInfo = getPlanChangeInfo(plan.id);
          
          return (
            <div 
              key={plan.id} 
              className={`relative bg-white dark:bg-gray-700 rounded-xl overflow-hidden transition-all duration-500 animate-fade-in-up border-2 ${
                isCurrentPlan 
                  ? 'border-blue-500 dark:border-blue-400 ring-4 ring-blue-500/20 dark:ring-blue-400/20 transform scale-105 z-10 shadow-glow-md'
                  : plan.recommended 
                    ? 'border-purple-400 dark:border-purple-500 hover:shadow-xl transform hover:scale-105 hover:shadow-glow-sm' 
                    : 'border-gray-200 dark:border-gray-600 hover:shadow-xl hover:shadow-glow-sm'
              }`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0 bg-purple-500 text-white text-sm px-4 py-1 font-medium">
                  Önerilen
                </div>
              )}
              
              {isCurrentPlan && (
                <div className="bg-blue-500 text-white text-center py-1 text-sm font-medium animate-shimmer bg-shimmer-light bg-shimmer bg-no-repeat">
                  Aktif Planınız
                </div>
              )}
              
              <div className={`p-4 md:p-6 ${plan.recommended ? 'pt-6' : ''}`}>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{plan.name}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{plan.description}</p>
                
                <div className="mb-6 transition-all duration-300 transform hover:scale-110 hover:text-blue-600 dark:hover:text-blue-400">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price.toFixed(2)}</span>
                  <span className="text-gray-600 dark:text-gray-400"> ₺</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">/ay</span>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatDuration(planDuration)} süreli abonelik
                  </div>
                  
                  {/* Plan değişimi bilgisi */}
                  {!isCurrentPlan && planChangeInfo && (
                    <div className={`mt-2 text-sm font-medium ${
                      planChangeInfo.isUpgrade 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {planChangeInfo.isUpgrade 
                        ? `+${planChangeInfo.priceDifference.toFixed(2)} ₺/ay` 
                        : `-${planChangeInfo.priceDifference.toFixed(2)} ₺/ay`}
                    </div>
                  )}
                </div>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center transition-all duration-200 hover:translate-x-1 hover:text-blue-600 dark:hover:text-blue-400">
                    {plan.features.max_todos === Infinity 
                      ? featureIcons.infinity 
                      : <span className="text-blue-500 font-medium">{plan.features.max_todos}</span>}
                    <span className="ml-2 text-gray-600 dark:text-gray-300">Görev</span>
                  </li>
                  
                  <li className="flex items-center transition-all duration-200 hover:translate-x-1 hover:text-blue-600 dark:hover:text-blue-400">
                    {plan.features.max_categories === Infinity 
                      ? featureIcons.infinity 
                      : <span className="text-blue-500 font-medium">{plan.features.max_categories}</span>}
                    <span className="ml-2 text-gray-600 dark:text-gray-300">Kategori</span>
                  </li>
                  
                  <li className="flex items-center transition-all duration-200 hover:translate-x-1 hover:text-blue-600 dark:hover:text-blue-400">
                    {plan.features.has_markdown_support ? featureIcons.check : featureIcons.times}
                    <span className="ml-2 text-gray-600 dark:text-gray-300">Zengin Metin Formatı</span>
                  </li>
                  
                  <li className="flex items-center transition-all duration-200 hover:translate-x-1 hover:text-blue-600 dark:hover:text-blue-400">
                    {plan.features.analytics_enabled ? featureIcons.check : featureIcons.times}
                    <span className="ml-2 text-gray-600 dark:text-gray-300">Gelişmiş Analitik</span>
                  </li>
                  
                  <li className="flex items-center transition-all duration-200 hover:translate-x-1 hover:text-blue-600 dark:hover:text-blue-400">
                    {plan.features.has_advanced_features ? featureIcons.check : featureIcons.times}
                    <span className="ml-2 text-gray-600 dark:text-gray-300">Gelişmiş Özellikler</span>
                  </li>
                </ul>
                
                <div className="flex flex-col gap-2">
                <button
                  onClick={() => onSelectPlan(plan.id)}
                  disabled={isCurrentPlan}
                  className={`w-full py-3 rounded-lg font-semibold transition-all duration-500 transform hover:translate-y-[-3px] ${
                    isCurrentPlan
                      ? 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400 cursor-not-allowed'
                      : plan.id === 'free'
                        ? 'bg-gray-800 hover:bg-gray-700 text-white dark:bg-gray-600 dark:hover:bg-gray-500 hover:shadow-lg'
                        : plan.id === 'premium'
                          ? 'bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-500 hover:to-purple-300 text-white shadow-lg hover:shadow-purple-500/30 animate-pulse-slow'
                          : 'bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 text-white shadow-lg hover:shadow-blue-500/30'
                  }`}
                >
                    {isCurrentPlan 
                      ? 'Mevcut Plan' 
                      : planChangeInfo?.isUpgrade 
                        ? 'Planı Yükselt' 
                        : plan.id === 'free' 
                          ? 'Ücretsiz Başla' 
                          : 'Planı Düşür'}
                  </button>
                  
                  {!isCurrentPlan && (
                    <button
                      onClick={() => handleCompare(plan.id)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                    >
                      Mevcut planla karşılaştır
                </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Planları Karşılaştır */}
      <div className="mt-12 bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Tüm Planları Karşılaştır</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-4 py-4 text-left text-gray-800 dark:text-white border-b dark:border-gray-600">Özellik</th>
                {Object.values(SUBSCRIPTION_PLANS).map(plan => (
                  <th key={plan.id} className={`px-4 py-4 text-center text-gray-800 dark:text-white border-b dark:border-gray-600 ${
                    plan.recommended ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                  }`}>
                    <div className="font-bold text-lg mb-1 transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400">{plan.name}</div>
                    <div className={`text-sm font-medium ${
                      plan.recommended 
                        ? 'text-purple-600 dark:text-purple-400' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {plan.price.toFixed(2)} ₺/ay
                    </div>
                    {plan.recommended && (
                      <div className="mt-1 inline-block px-2 py-1 bg-purple-100 dark:bg-purple-800/40 text-purple-700 dark:text-purple-300 text-xs rounded-full animate-pulse-slow">
                        Önerilen
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Abonelik Süresi */}
              <tr>
                <td className="px-4 py-4 text-left text-gray-800 dark:text-white border-b dark:border-gray-600 font-medium">Abonelik Süresi</td>
                {Object.values(SUBSCRIPTION_PLANS).map(plan => (
                  <td key={plan.id} className={`px-4 py-4 text-center border-b dark:border-gray-600 ${
                    plan.recommended ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''
                  }`}>
                    <span className={`text-lg font-medium transition-all duration-300 hover:scale-110 hover:text-blue-600 dark:hover:text-blue-400 inline-block ${
                      plan.recommended 
                        ? 'text-purple-600 dark:text-purple-400' 
                        : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {formatDuration(SUBSCRIPTION_DURATIONS[plan.id] || 30)}
                    </span>
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="px-4 py-4 text-left text-gray-800 dark:text-white border-b dark:border-gray-600 font-medium">Maksimum Görev</td>
                {Object.values(SUBSCRIPTION_PLANS).map(plan => (
                  <td key={plan.id} className={`px-4 py-4 text-center border-b dark:border-gray-600 ${
                    plan.recommended ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''
                  }`}>
                    <span className={`text-lg font-medium transition-all duration-300 hover:scale-110 hover:text-blue-600 dark:hover:text-blue-400 inline-block ${
                      plan.recommended 
                        ? 'text-purple-600 dark:text-purple-400' 
                        : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {plan.features.max_todos === Infinity ? '∞' : plan.features.max_todos}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-4 text-left text-gray-800 dark:text-white border-b dark:border-gray-600 font-medium">Maksimum Kategori</td>
                {Object.values(SUBSCRIPTION_PLANS).map(plan => (
                  <td key={plan.id} className={`px-4 py-4 text-center border-b dark:border-gray-600 ${
                    plan.recommended ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''
                  }`}>
                    <span className={`text-lg font-medium transition-all duration-300 hover:scale-110 hover:text-blue-600 dark:hover:text-blue-400 inline-block ${
                      plan.recommended 
                        ? 'text-purple-600 dark:text-purple-400' 
                        : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {plan.features.max_categories === Infinity ? '∞' : plan.features.max_categories}
                    </span>
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="px-4 py-4 text-left text-gray-800 dark:text-white border-b dark:border-gray-600 font-medium">Markdown Desteği</td>
                {Object.values(SUBSCRIPTION_PLANS).map(plan => (
                  <td key={plan.id} className={`px-4 py-4 text-center border-b dark:border-gray-600 ${
                    plan.recommended ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''
                  }`}>
                    <div className="flex justify-center">
                      {plan.features.has_markdown_support ? (
                        <span className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800/30 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-green-200 dark:hover:bg-green-700/50">
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </span>
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-800/30 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-red-200 dark:hover:bg-red-700/50">
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                          </svg>
                        </span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-4 text-left text-gray-800 dark:text-white border-b dark:border-gray-600 font-medium">Gelişmiş Analitik</td>
                {Object.values(SUBSCRIPTION_PLANS).map(plan => (
                  <td key={plan.id} className={`px-4 py-4 text-center border-b dark:border-gray-600 ${
                    plan.recommended ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''
                  }`}>
                    <div className="flex justify-center">
                      {plan.features.analytics_enabled ? (
                        <span className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800/30 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-green-200 dark:hover:bg-green-700/50">
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </span>
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-800/30 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-red-200 dark:hover:bg-red-700/50">
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                          </svg>
                        </span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Teşvik edici mesaj */}
      <div className="mt-10 text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl animate-fade-in-up" style={{ animationDelay: '450ms' }}>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Hemen Başlayın</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-4">Görev yönetiminizi bir üst seviyeye taşımak için bugün bir plan seçin!</p>
        <button 
          onClick={() => onSelectPlan('premium')}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:translate-y-[-3px] animate-pulse-slow hover:animate-none"
        >
          Premium Plana Geç
        </button>
      </div>
      
      {/* Plan Karşılaştırma Modalı */}
      {showComparison && comparisonPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowComparison(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto relative animate-scale-in border border-gray-200 dark:border-gray-700">
            {/* Dekoratif arka plan elementleri */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-full blur-2xl -z-10 pointer-events-none"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-tl from-purple-200/30 to-blue-200/30 dark:from-purple-900/10 dark:to-blue-900/10 rounded-full blur-2xl -z-10 pointer-events-none"></div>
            
            {/* Başlık */}
            <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Plan Karşılaştırması
              </h3>
              <button 
                onClick={() => setShowComparison(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 h-9 w-9 rounded-full flex items-center justify-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              {/* Plan Geçiş Gösterimi */}
              <div className="flex items-center justify-center mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-4 rounded-xl">
                <div className="text-center px-4 py-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                  <div className="text-lg font-medium text-gray-800 dark:text-white mb-1">{SUBSCRIPTION_PLANS[currentPlan].name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Mevcut Plan</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{SUBSCRIPTION_PLANS[currentPlan].price.toFixed(2)} ₺</div>
                </div>
                
                <div className="mx-4 flex flex-col items-center">
                  <div className="h-0.5 w-16 bg-gradient-to-r from-blue-500 to-indigo-500 mb-2"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                  <div className="h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-purple-500 mt-2"></div>
                </div>
                
                <div className="text-center px-4 py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 rounded-lg shadow-md border border-blue-200 dark:border-blue-700/50 transform scale-110 relative">
                  <div className="text-lg font-medium text-blue-700 dark:text-blue-300 mb-1">{SUBSCRIPTION_PLANS[comparisonPlan].name}</div>
                  <div className="text-sm text-blue-500 dark:text-blue-400">Hedef Plan</div>
                  <div className="text-2xl font-bold text-blue-800 dark:text-blue-200 mt-2">{SUBSCRIPTION_PLANS[comparisonPlan].price.toFixed(2)} ₺</div>
                  
                  {SUBSCRIPTION_PLANS[comparisonPlan].price > SUBSCRIPTION_PLANS[currentPlan].price ? (
                    <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                      +{(SUBSCRIPTION_PLANS[comparisonPlan].price - SUBSCRIPTION_PLANS[currentPlan].price).toFixed(2)} ₺
                    </div>
                  ) : (
                    <div className="absolute -top-3 -right-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                      -{(SUBSCRIPTION_PLANS[currentPlan].price - SUBSCRIPTION_PLANS[comparisonPlan].price).toFixed(2)} ₺
                    </div>
                  )}
                </div>
              </div>
              
              {/* Abonelik Süresi Karşılaştırması */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Abonelik Süresi
                </h4>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="text-center flex-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Mevcut</span>
                    <div className="text-lg font-medium text-gray-800 dark:text-white">
                      {formatDuration(SUBSCRIPTION_DURATIONS[currentPlan] || 30)}
                    </div>
                  </div>
                  
                  <div className="text-center flex-1">
                    <span className="text-sm text-blue-600 dark:text-blue-400">Yeni</span>
                    <div className="text-lg font-medium text-blue-700 dark:text-blue-300">
                      {formatDuration(SUBSCRIPTION_DURATIONS[comparisonPlan] || 30)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Özellik Karşılaştırması */}
              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                {/* Tablo Başlığı */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4">
                  <h4 className="text-md font-medium">Özellik Karşılaştırması</h4>
                </div>
                
                {/* Özellikler Listesi */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {/* Görev Limiti */}
                  <div className="grid grid-cols-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="p-4 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-gray-800 dark:text-white font-medium">Görev Limiti</span>
                    </div>
                    <div className="p-4 text-center">
                      <span className="text-gray-800 dark:text-white font-medium">
                        {SUBSCRIPTION_PLANS[currentPlan].features.max_todos === Infinity 
                          ? <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs font-bold">Sınırsız</span>
                          : <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs font-bold">{SUBSCRIPTION_PLANS[currentPlan].features.max_todos}</span>}
                      </span>
                    </div>
                    <div className="p-4 text-center">
                      <span className="text-blue-700 dark:text-blue-300 font-medium">
                        {SUBSCRIPTION_PLANS[comparisonPlan].features.max_todos === Infinity 
                          ? <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-bold">Sınırsız</span>
                          : <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-bold">{SUBSCRIPTION_PLANS[comparisonPlan].features.max_todos}</span>}
                      </span>
                    </div>
                  </div>
                  
                  {/* Kategori Limiti */}
                  <div className="grid grid-cols-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="p-4 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="text-gray-800 dark:text-white font-medium">Kategori Limiti</span>
                    </div>
                    <div className="p-4 text-center">
                      <span className="text-gray-800 dark:text-white font-medium">
                        {SUBSCRIPTION_PLANS[currentPlan].features.max_categories === Infinity 
                          ? <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs font-bold">Sınırsız</span>
                          : <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs font-bold">{SUBSCRIPTION_PLANS[currentPlan].features.max_categories}</span>}
                      </span>
                    </div>
                    <div className="p-4 text-center">
                      <span className="text-blue-700 dark:text-blue-300 font-medium">
                        {SUBSCRIPTION_PLANS[comparisonPlan].features.max_categories === Infinity 
                          ? <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-bold">Sınırsız</span>
                          : <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-bold">{SUBSCRIPTION_PLANS[comparisonPlan].features.max_categories}</span>}
                      </span>
                    </div>
                  </div>
                  
                  {/* Markdown Desteği */}
                  <div className="grid grid-cols-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="p-4 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                      </svg>
                      <span className="text-gray-800 dark:text-white font-medium">Markdown Desteği</span>
                    </div>
                    <div className="p-4 text-center">
                      {SUBSCRIPTION_PLANS[currentPlan].features.has_markdown_support ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30">
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30">
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="p-4 text-center">
                      {SUBSCRIPTION_PLANS[comparisonPlan].features.has_markdown_support ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30">
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30">
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Gelişmiş Analitik */}
                  <div className="grid grid-cols-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="p-4 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="text-gray-800 dark:text-white font-medium">Gelişmiş Analitik</span>
                    </div>
                    <div className="p-4 text-center">
                      {SUBSCRIPTION_PLANS[currentPlan].features.analytics_enabled ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30">
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30">
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="p-4 text-center">
                      {SUBSCRIPTION_PLANS[comparisonPlan].features.analytics_enabled ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30">
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30">
                          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Tablo Altlığı */}
                <div className="bg-gray-50 dark:bg-gray-700/50 py-3 px-4 grid grid-cols-3">
                  <div className="text-gray-500 dark:text-gray-400 text-sm">Özellik</div>
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm">Mevcut</div>
                  <div className="text-center text-blue-500 dark:text-blue-400 text-sm">Yeni</div>
                </div>
              </div>
              
              {/* Düğmeler */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowComparison(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
                >
                  İptal
                </button>
                
                <button
                  onClick={() => {
                    onSelectPlan(comparisonPlan);
                    setShowComparison(false);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                  {SUBSCRIPTION_PLANS[comparisonPlan].price > SUBSCRIPTION_PLANS[currentPlan].price 
                    ? 'Planı Yükselt'
                    : comparisonPlan === 'free'
                      ? 'Ücretsiz Plana Geç'
                      : 'Planı Değiştir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans; 