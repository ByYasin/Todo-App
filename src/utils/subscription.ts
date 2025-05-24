import { SubscriptionTier, SubscriptionPlan, User } from '../types';

// Abonelik planlarının tanımları
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionTier> = {
  free: {
    id: 'free',
    name: 'Ücretsiz',
    description: 'Temel özellikler ile sınırlı kullanım',
    price: 0,
    duration: 30, // Gün cinsinden süre (free plan için de 30 gün)
    features: {
      max_todos: 5,
      max_categories: 5,
      analytics_enabled: false,
      has_markdown_support: false,
      has_api_access: false,
      has_priority_support: false,
      has_advanced_features: false,
      max_attachments: 0,
      max_attachment_size: 0,
      has_team_features: false
    }
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Bireysel kullanıcılar için gelişmiş özellikler',
    price: 125.00,
    duration: 30, // Gün cinsinden süre (1 ay)
    recommended: true,
    features: {
      max_todos: 25,
      max_categories: 10,
      analytics_enabled: true,
      has_markdown_support: true,
      has_api_access: false,
      has_priority_support: false,
      has_advanced_features: true,
      max_attachments: 5,
      max_attachment_size: 10,
      has_team_features: false
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Kurumsal',
    description: 'Sınırsız özellikler ve takım desteği',
    price: 325.00,
    duration: 30, // Gün cinsinden süre (1 ay) - 365 günden 30 güne düşürüldü
    features: {
      max_todos: Infinity,
      max_categories: Infinity,
      analytics_enabled: true,
      has_markdown_support: true,
      has_api_access: true,
      has_priority_support: true,
      has_advanced_features: true,
      max_attachments: Infinity,
      max_attachment_size: 50,
      has_team_features: true,
      user_limit: 10
    }
  }
};


export const getUserPlan = (user: User | null): SubscriptionPlan => {
  if (!user) return 'free';
  
 
  if (!user.subscription_plan) return 'free';
  

  if (user.subscription_plan === 'free') return 'free';
  

  if (user.subscription_expires) {
    const expiryDate = new Date(user.subscription_expires);
    const today = new Date();
    
    // Süre dolmuşsa free döndür
    if (expiryDate < today) {
      return 'free';
    }
  }
  
  return user.subscription_plan;
};


export const getLastActivePlan = (user: User | null): SubscriptionPlan | null => {
  if (!user) return null;
  

  const currentPlan = getUserPlan(user);
  if (currentPlan !== 'free') return currentPlan;
  
 
  if (!user.subscription_plan) return null;
  
  
  if (user.subscription_plan === 'free') return null;

  return user.subscription_plan;
};


export const hasExpiredPremiumPlan = (user: User | null): boolean => {
  if (!user) return false;
  
  if (!user.subscription_plan) return false;

  // Eğer kullanıcının aktif bir abonelik süresi varsa ve dolmamışsa
  if (user.subscription_expires) {
    const expiryDate = new Date(user.subscription_expires);
    const today = new Date();
    
    // Abonelik süresi dolmamışsa, süresi dolmuş plan gösterme
    if (expiryDate >= today) {
      return false;
    }
  }
  
  // Mevcut plan premium veya enterprise değilse ve kaydedilmiş plan premium veya enterprise ise
  const currentPlan = getUserPlan(user);
  if (currentPlan === 'free' && (user.subscription_plan === 'premium' || user.subscription_plan === 'enterprise')) {
    return true;
  }
  
  return false;
};


export const getExpiredPremiumMessage = (user: User | null): string | null => {
  if (!hasExpiredPremiumPlan(user)) return null;
  

  if (user?.subscription_plan === 'premium') {
    return 'Premium planınız sona erdi. Ücretsiz plana geçiş yapıldı. Premium özelliklere erişmek için planınızı yenileyin.';
  } else if (user?.subscription_plan === 'enterprise') {
    return 'Kurumsal planınız sona erdi. Ücretsiz plana geçiş yapıldı. Kurumsal özelliklere erişmek için planınızı yenileyin.';
  }
  
  return 'Ücretli aboneliğiniz sona erdi. Ücretsiz plana geçiş yapıldı.';
};


export const canUseFeature = (
  user: User | null,
  feature: keyof SubscriptionTier['features']
): boolean => {
  const plan = getUserPlan(user);
  return !!SUBSCRIPTION_PLANS[plan].features[feature];
};


export const getRemainingLimit = (
  user: User | null,
  feature: 'max_todos' | 'max_categories' | 'max_attachments',
  currentCount: number
): number => {
  const plan = getUserPlan(user);
  const maxLimit = SUBSCRIPTION_PLANS[plan].features[feature];
  

  if (maxLimit === Infinity) return -1;
  
  return Math.max(0, maxLimit - currentCount);
};


export const getUpgradeUrl = (currentPlan: SubscriptionPlan): string => {
  return `/subscription/upgrade?current=${currentPlan}`;
};


export const getUpgradeMessage = (
  feature: 'todos' | 'categories' | 'attachments' | 'markdown'
): string => {
  const messages = {
    todos: 'Daha fazla görev oluşturmak için planınızı yükseltin.',
    categories: 'Daha fazla kategori oluşturmak için planınızı yükseltin.',
    attachments: 'Dosya eklemek için planınızı yükseltin.',
    markdown: 'Zengin metin biçimlendirme için Premium aboneliğe geçin.'
  };
  
  return messages[feature];
};

// Aboneliğin ne zaman sona ereceği hakkında bilgi döndürür
export const getSubscriptionExpiryInfo = (user: User | null) => {
  if (!user) {
    return {
      remainingDays: 0,
      isExpired: false,
      isFree: true
    };
  }

  // Kullanıcı ücretsiz plandaysa
  if (user.subscription_plan === 'free') {
    return {
      remainingDays: 0,
      isExpired: false,
      isFree: true
    };
  }

  // Abonelik bitiş tarihi tanımlı değilse
  if (!user.subscription_expires) {
    return {
      remainingDays: 0,
      isExpired: true,
      isFree: false
    };
  }

  // Kullanıcının abonelik bitiş tarihi
  const expiryDate = new Date(user.subscription_expires);
  
  // Şu anki tarih
  const now = new Date();
  
  // Kalan gün sayısı hesapla
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Enterprise planı için maksimum gösterim değeri 30 gün olarak sınırla
  // Bu şekilde 365 günlük abonelik olsa bile kullanıcıya 30 gün olarak gösteriliyor
  const remainingDays = user.subscription_plan === 'enterprise' 
    ? Math.min(diffDays, 30) 
    : diffDays;
  
  return {
    remainingDays: remainingDays > 0 ? remainingDays : 0,
    isExpired: diffDays <= 0,
    isFree: false
  };
};

// Abonelik durumuna göre renk kodu ve mesaj döndürür
export const getSubscriptionStatusInfo = (user: User | null) => {
  const info = getSubscriptionExpiryInfo(user);
  
  if (info.isFree) {
    return {
      colorClass: 'text-gray-500 dark:text-gray-400',
      statusText: 'Ücretsiz'
    };
  }
  
  if (info.isExpired) {
    return {
      colorClass: 'text-red-500 dark:text-red-400',
      statusText: 'Süresi Doldu'
    };
  }
  
  if (info.remainingDays <= 5) {
    return {
      colorClass: 'text-amber-500 dark:text-amber-400',
      statusText: `${info.remainingDays} gün kaldı`
    };
  }
  
  return {
    colorClass: 'text-green-500 dark:text-green-400',
    statusText: `${info.remainingDays} gün kaldı`
  };
}; 