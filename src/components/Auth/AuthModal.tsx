import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { User } from '../../types';

interface AuthModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onAuth?: (token: string, user: User) => void;
  onAuthChange?: (token: string, refreshToken: string, user: User) => void;
  apiUrl?: string;
  showLogin?: boolean;
  isForced?: boolean;
  initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen = true, 
  onClose, 
  onAuth, 
  onAuthChange,
  apiUrl = "http://localhost:5000/api",
  showLogin = true,
  isForced = false,
  initialMode = 'login'
}) => {
  const [isLoginForm, setIsLoginForm] = useState(initialMode === 'login');
  
  if (!isOpen) return null;
  
  const handleSwitchForm = () => {
    setIsLoginForm(!isLoginForm);
  };

  const handleLogin = (token: string, refreshToken: string, user: User) => {
    if (onAuth) {
      onAuth(token, user);
    }
    
    if (onAuthChange) {
      onAuthChange(token, refreshToken, user);
    }
    
    if (!isForced) {
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="relative">
        {!isForced && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        )}
        
        {isLoginForm ? (
          <LoginForm 
            onLogin={handleLogin}
            onSwitchToRegister={handleSwitchForm} 
            apiUrl={apiUrl} 
          />
        ) : (
          <RegisterForm 
            onRegister={handleLogin}
            onSwitchToLogin={handleSwitchForm}
            apiUrl={apiUrl}
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal; 