import { SubscriptionTier, SubscriptionPlan, User } from '../types';

// Abonelik planlarının tanımları
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionTier> = {
  free: {
    id: 'free',
    name: 'Ücretsiz',
    description: 'Temel özellikler ile sınırlı kullanım',
    price: 0,
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

// Kullanıcının abonelik planını kontrol et
export const getUserPlan = (user: User | null): SubscriptionPlan => {
  if (!user) return 'free';
  return user.subscription_plan || 'free';
};

// Kullanıcı belirli bir özelliği kullanabilir mi?
export const canUseFeature = (
  user: User | null,
  feature: keyof SubscriptionTier['features']
): boolean => {
  const plan = getUserPlan(user);
  return !!SUBSCRIPTION_PLANS[plan].features[feature];
};

// Kullanıcının kalan limiti hesapla (görevler, kategoriler, vs.)
export const getRemainingLimit = (
  user: User | null,
  feature: 'max_todos' | 'max_categories' | 'max_attachments',
  currentCount: number
): number => {
  const plan = getUserPlan(user);
  const maxLimit = SUBSCRIPTION_PLANS[plan].features[feature];
  
  // Sonsuz limit için özel bir değer döndür
  if (maxLimit === Infinity) return -1;
  
  return Math.max(0, maxLimit - currentCount);
};

// Abonelik planı yükseltme sayfasına yönlendirme URL'i oluştur
export const getUpgradeUrl = (currentPlan: SubscriptionPlan): string => {
  return `/subscription/upgrade?current=${currentPlan}`;
};

// Abonelik planı limit aşımı mesajı oluştur
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