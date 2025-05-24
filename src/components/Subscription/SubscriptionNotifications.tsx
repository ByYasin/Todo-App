import React, { useEffect, useState } from 'react';
import { User } from '../../types';
import { getSubscriptionExpiryInfo } from '../../utils/subscription';

interface SubscriptionNotificationsProps {
  user: User | null;
  onRenew: () => void;
}

const SubscriptionNotifications: React.FC<SubscriptionNotificationsProps> = ({ user, onRenew }) => {
  const [showNotification, setShowNotification] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Bildirim durumunu kontrol et
    if (!user || !user.subscription_expires || user.subscription_plan === 'free') {
      setShowNotification(false);
      return;
    }

    const { remainingDays, isExpired } = getSubscriptionExpiryInfo(user);
    
    // Süresi dolmuş veya 7 günden az kalmışsa ve kullanıcı bildirimi kapatmamışsa göster
    if ((isExpired || remainingDays <= 7) && !dismissed) {
      setShowNotification(true);
    } else {
      setShowNotification(false);
    }
  }, [user, dismissed]);

  if (!showNotification) return null;

  const { remainingDays, isExpired } = getSubscriptionExpiryInfo(user!);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-fade-in-up">
      <div className={`p-4 rounded-lg shadow-lg border ${
        isExpired 
          ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-800' 
          : remainingDays <= 3
          ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800'
          : 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-800'
      }`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className={`p-2 rounded-full mr-3 ${
              isExpired 
                ? 'bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-400' 
                : remainingDays <= 3
                ? 'bg-amber-100 dark:bg-amber-800/40 text-amber-600 dark:text-amber-400'
                : 'bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-400'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className={`font-bold ${
                isExpired 
                  ? 'text-red-800 dark:text-red-300' 
                  : remainingDays <= 3
                  ? 'text-amber-800 dark:text-amber-300'
                  : 'text-blue-800 dark:text-blue-300'
              }`}>
                {isExpired ? 'Aboneliğiniz Sona Erdi' : `Aboneliğinizin Sona Ermesine ${remainingDays} Gün Kaldı`}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                {isExpired 
                  ? 'Premium özellikleri kullanmaya devam etmek için aboneliğinizi yenileyin.'
                  : 'Kesintisiz hizmet almaya devam etmek için aboneliğinizi yenileyin.'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setDismissed(true)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="mt-3 flex space-x-2">
          <button
            onClick={onRenew}
            className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
              isExpired 
                ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800' 
                : remainingDays <= 3
                ? 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800'
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
            }`}
          >
            Aboneliği Yenile
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-gray-800 dark:text-gray-200 text-sm font-medium"
          >
            Daha Sonra
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionNotifications; 