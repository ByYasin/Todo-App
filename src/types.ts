export interface Todo {
  id?: number;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  category_id: number | null;
  category_name?: string;
  category_color?: string;
  due_date: string | null;
  created_at?: string;
  user_id?: number;
  parent_id?: number | null;
  sub_tasks?: Todo[];
  tags?: Tag[];
  position?: number; // Sürükle-bırak sıralama için pozisyon
}

export interface Category {
  id: number;
  name: string;
  color: string;
  user_id?: number;
  is_public?: boolean;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  user_id?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  created_at?: string;
  subscription_plan?: SubscriptionPlan;
  subscription_expires?: string;
}

export type SubscriptionPlan = 'free' | 'premium' | 'enterprise';

export interface SubscriptionFeatures {
  max_todos: number;
  max_categories: number;
  analytics_enabled: boolean;
  has_markdown_support: boolean;
  has_api_access: boolean;
  has_priority_support: boolean;
  has_advanced_features: boolean;
  max_attachments: number;
  max_attachment_size: number; // MB cinsinden
  has_team_features: boolean;
  user_limit?: number; // Enterprise için takım üyesi limiti
}

export interface SubscriptionTier {
  id: SubscriptionPlan;
  name: string;
  description: string;
  price: number; // Aylık fiyat (TL)
  features: SubscriptionFeatures;
  recommended?: boolean;
  duration?: number; // Gün cinsinden abonelik süresi
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface SearchFilters {
  text: string;
  status: string[];
  priority: string[];
  categories: number[];
  tags: number[];
  startDate: string | null;
  endDate: string | null;
} 