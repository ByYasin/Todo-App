import { useState, useEffect } from 'react';
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
  const [animateOut, setAnimateOut] = useState(false);
  
  // Sayfa yüklendiğinde animasyon efekti
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
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
      handleClose();
    }
  };
  
  const handleClose = () => {
    setAnimateOut(true);
    
    // Animasyon süresini bekleyip sonra kapat
    setTimeout(() => {
      setAnimateOut(false);
      onClose();
    }, 300);
  };
  
  return (
    <div className="fixed inset-0 z-50">
      {/* Bulanık arka plan overlay */}
      <div 
        className={`fixed inset-0 transition-opacity duration-300 ${animateOut ? 'opacity-0' : 'opacity-100'}`}
        onClick={!isForced ? handleClose : undefined}
      >
        {/* Arka plan gradient */}
        <div className="absolute inset-0 bg-gray-900/70 dark:bg-black/80 backdrop-blur-sm"></div>
        
        {/* Arka plan dekoratif elementler */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-700/10 dark:to-purple-700/10 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-tr from-indigo-500/10 to-pink-500/10 dark:from-indigo-700/10 dark:to-pink-700/10 blur-3xl"></div>
      </div>
      
      {/* Modal içeriği */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          className={`relative bg-white dark:bg-[#1c2732] rounded-xl shadow-2xl shadow-gray-700/20 dark:shadow-black/40 border border-gray-200/70 dark:border-gray-700/30 max-w-md w-full transform transition-all duration-300 ${
            animateOut ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          {/* Modal kapatma butonu */}
          {!isForced && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white transition-colors z-10"
              type="button"
              aria-label="Kapat"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          )}
          
          {/* Modal üst kısmı süsü */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-xl"></div>
          
          {/* Form içeriği */}
          <div className="transition-opacity duration-300 ease-in-out">
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
      </div>
    </div>
  );
};

export default AuthModal; 