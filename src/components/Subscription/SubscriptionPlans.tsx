import React from 'react';
import { SubscriptionPlan, User } from '../../types';
import { SUBSCRIPTION_PLANS, getUserPlan } from '../../utils/subscription';

interface SubscriptionPlansProps {
  user: User | null;
  onSelectPlan: (plan: SubscriptionPlan) => void;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ user, onSelectPlan }) => {
  const currentPlan = getUserPlan(user);
  
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
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 max-w-6xl mx-auto">
      <div className="text-center mb-10 animate-fade-in-down">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Abonelik Planları</h2>
        <p className="text-gray-600 dark:text-gray-300">İhtiyaçlarınıza en uygun planı seçin</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {Object.values(SUBSCRIPTION_PLANS).map((plan, index) => {
          const isCurrentPlan = plan.id === currentPlan;
          
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
                <div className="absolute -right-12 top-6 bg-gradient-to-r from-purple-600 to-purple-400 text-white px-12 py-1 transform rotate-45 shadow-md animate-pulse-slow">
                  Önerilen
                </div>
              )}
              
              {isCurrentPlan && (
                <div className="bg-blue-500 text-white text-center py-1 text-sm font-medium animate-shimmer bg-shimmer-light bg-shimmer bg-no-repeat">
                  Aktif Planınız
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{plan.name}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{plan.description}</p>
                
                <div className="mb-6 transition-all duration-300 transform hover:scale-110 hover:text-blue-600 dark:hover:text-blue-400">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price.toFixed(2)}</span>
                  <span className="text-gray-600 dark:text-gray-400"> ₺</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">/ay</span>
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
                  
                  {plan.id === 'enterprise' && (
                    <li className="flex items-center transition-all duration-200 hover:translate-x-1 hover:text-blue-600 dark:hover:text-blue-400">
                      {plan.features.has_team_features ? featureIcons.check : featureIcons.times}
                      <span className="ml-2 text-gray-600 dark:text-gray-300">Takım Özellikleri</span>
                    </li>
                  )}
                </ul>
                
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
                  {isCurrentPlan ? 'Mevcut Plan' : plan.id === 'free' ? 'Ücretsiz Başla' : 'Planı Seç'}
                </button>
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
              <tr>
                <td className="px-4 py-4 text-left text-gray-800 dark:text-white border-b dark:border-gray-600 font-medium">API Erişimi</td>
                {Object.values(SUBSCRIPTION_PLANS).map(plan => (
                  <td key={plan.id} className={`px-4 py-4 text-center border-b dark:border-gray-600 ${
                    plan.recommended ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''
                  }`}>
                    <div className="flex justify-center">
                      {plan.features.has_api_access ? (
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
                <td className="px-4 py-4 text-left text-gray-800 dark:text-white border-b dark:border-gray-600 font-medium">Takım Özellikleri</td>
                {Object.values(SUBSCRIPTION_PLANS).map(plan => (
                  <td key={plan.id} className={`px-4 py-4 text-center border-b dark:border-gray-600 ${
                    plan.recommended ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''
                  }`}>
                    <div className="flex justify-center">
                      {plan.features.has_team_features ? (
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
    </div>
  );
};

export default SubscriptionPlans; 