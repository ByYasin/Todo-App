import React, { createContext, useContext, ReactNode } from 'react';
import { Todo, Category, User, SearchFilters, SubscriptionPlan } from '../types';

// Context tipi tanımı
export interface TodoContextType {
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

// Context'i oluştur
const TodoContext = createContext<TodoContextType | undefined>(undefined);

// Context Provider props
interface TodoProviderProps {
  children: ReactNode;
  value: TodoContextType;
}

// Context Provider bileşeni
export const TodoProvider: React.FC<TodoProviderProps> = ({ children, value }) => {
  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
};

// Custom hook - context kullanımı için
export const useTodoContext = (): TodoContextType => {
  const context = useContext(TodoContext);
  
  if (context === undefined) {
    throw new Error('useTodoContext hook must be used within a TodoProvider');
  }
  
  return context;
};

export default TodoContext; 