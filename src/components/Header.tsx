import { useState, useEffect, useRef } from 'react'
import UserProfile from './UserProfile'
import AuthModal from './Auth/AuthModal'
import { User, SubscriptionPlan } from '../types'
import { getSubscriptionStatusInfo } from '../utils/subscription'

interface HeaderProps {
  darkMode: boolean
  toggleDarkMode: () => void
  isAuthenticated: boolean
  user: User | null
  pendingChanges: number
  syncOfflineChanges: () => Promise<void>
  onShowStats: () => void
  onShowCategories: () => void
  apiConnected: boolean
  onLogin: () => void
  onLogout: () => void
  onToggleSubscription: () => void
  onShowSubscriptionHistory?: () => void
  subscriptionPlan: SubscriptionPlan
}

const Header = ({
  darkMode,
  toggleDarkMode,
  isAuthenticated,
  user,
  pendingChanges,
  syncOfflineChanges,
  onShowStats,
  onShowCategories,
  apiConnected,
  onLogin,
  onLogout,
  onToggleSubscription,
  onShowSubscriptionHistory,
  subscriptionPlan
}: HeaderProps) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  
  // Mobil menüyü aç kapa
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Modal dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // ESC tuşu ile menüyü kapatma
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false)
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscapeKey)
    return () => document.removeEventListener('keydown', handleEscapeKey)
  }, [])

  // Ana sayfaya yönlendirme
  const goToHomePage = () => {
    // Abonelik sayfasını kapat (gerekirse)
    onToggleSubscription();
    
    // Ana sayfaya dön (gerekirse)
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
  }

  // Abonelik durumu bilgisi
  const subscriptionStatus = getSubscriptionStatusInfo(user);

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300 bg-white/90 dark:bg-[#15202b] backdrop-blur-md mb-4 shadow-sm border-b border-gray-200 dark:border-[#2d3741]">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo ve Başlık */}
          <div className="flex items-center">
            <a 
              href="/" 
              onClick={(e) => {
                e.preventDefault();
                goToHomePage();
              }}
              className="flex items-center cursor-pointer transition-transform hover:scale-105"
              title="Ana Sayfaya Git"
            >
              <div className="flex-shrink-0 bg-blue-500 dark:bg-blue-500 rounded-full p-2 shadow-md">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 text-white" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                  />
                </svg>
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900 dark:text-gray-100">Todo App</h1>
            </a>
            
            {/* API Durumu */}
            <span 
              className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${apiConnected 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}
            >
              <span 
                className={`h-2 w-2 rounded-full mr-1.5 ${apiConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                aria-hidden="true"
              ></span>
              {apiConnected ? 'Çevrimiçi' : 'Çevrimdışı'}
            </span>
          </div>
          
          {/* Masaüstü Menüsü */}
          <div className="hidden sm:flex sm:items-center sm:space-x-3">
            {/* Abonelik Planı Butonu */}
            {isAuthenticated && (
              <button
                onClick={onToggleSubscription}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:ring-opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span className="mr-1">{subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1)}</span>
                {subscriptionPlan !== 'free' && (
                  <span className={`text-xs ml-1 ${subscriptionStatus.colorClass}`}>
                    {subscriptionStatus.statusText}
                  </span>
                )}
              </button>
            )}
            
            {/* Karanlık Mod Düğmesi */}
            <button
              onClick={toggleDarkMode}
              className="inline-flex items-center justify-center p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-[#2d3741] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-50"
              aria-label={darkMode ? 'Açık temaya geç' : 'Koyu temaya geç'}
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            {/* Eşitleme Butonu */}
            {isAuthenticated && pendingChanges > 0 && (
              <button
                onClick={syncOfflineChanges}
                className="inline-flex items-center justify-center p-2 rounded-full text-blue-500 hover:text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-opacity-50 relative"
                aria-label="Değişiklikleri senkronize et"
              >
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs justify-center items-center">
                    {pendingChanges}
                  </span>
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            
            {/* Kullanıcı Menüsü */}
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="relative flex rounded-full bg-white dark:bg-[#1c2732] h-9 w-9 text-sm border border-gray-300 dark:border-[#2d3741] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  aria-expanded={isProfileOpen}
                  aria-haspopup="true"
                >
                  <span className="sr-only">Kullanıcı menüsünü aç</span>
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-semibold">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </button>
                
                {isProfileOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-64 origin-top-right animate-fade-in-up rounded-xl bg-white dark:bg-[#1c2732] border border-gray-200 dark:border-[#2d3741] py-1 shadow-lg">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2d3741]">
                      <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{user?.username}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                      <div className="mt-2 flex items-center">
                        <div className="flex flex-col">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/20">
                          {subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1)} Plan
                        </span>
                          {subscriptionPlan !== 'free' && (
                            <span className={`text-xs mt-1 ${subscriptionStatus.colorClass}`}>
                              {subscriptionStatus.statusText}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsProfileOpen(false);
                            onToggleSubscription();
                          }}
                          className="ml-auto text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          Yükselt
                        </button>
                      </div>
                    </div>
                    
                    <div className="py-1">
                      <button
                        onClick={onShowStats}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d3741]"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        İstatistikler
                      </button>
                      
                      <button
                        onClick={onShowCategories}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d3741]"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Kategorileri Yönet
                      </button>
                      
                      {onShowSubscriptionHistory && (
                        <button
                          onClick={onShowSubscriptionHistory}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d3741]"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Ödeme Geçmişi
                        </button>
                      )}
                    </div>
                    
                    <div className="py-1 border-t border-gray-200 dark:border-[#2d3741]">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false)
                          onLogout()
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Giriş Yap
              </button>
            )}
          </div>
          
          {/* Mobil Menü Butonu */}
          <div className="flex sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-[#2d3741] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Menüyü aç</span>
              <svg
                className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobil Menü */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white dark:bg-[#15202b] pt-2 pb-3 border-b border-gray-200 dark:border-[#2d3741]">
          <div className="space-y-1 px-4">
            {isAuthenticated && (
              <button
                onClick={() => { onToggleSubscription(); setMobileMenuOpen(false); }}
                className="flex w-full items-center px-3 py-2 text-base font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span className="mr-1">{subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1)}</span>
                {subscriptionPlan !== 'free' && (
                  <span className={`text-xs ml-2 ${subscriptionStatus.colorClass}`}>
                    {subscriptionStatus.statusText}
                  </span>
                )}
                  </button>
            )}
            
            {/* API Status Mobile */}
            <div className="px-3 py-2 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">API Durumu:</span>
              <span 
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${apiConnected 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}
              >
                <span 
                  className={`h-2 w-2 rounded-full mr-1.5 ${apiConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                  aria-hidden="true"
                ></span>
                {apiConnected ? 'Çevrimiçi' : 'Çevrimdışı'}
              </span>
            </div>
            
            {/* Abonelik Geçmişi Butonu Mobile */}
            {isAuthenticated && onShowSubscriptionHistory && (
              <button
                onClick={() => { onShowSubscriptionHistory(); setMobileMenuOpen(false); }}
                className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d3741] hover:text-gray-900 dark:hover:text-white rounded-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ödeme Geçmişi
              </button>
            )}
            
            {/* İstatistik Butonu Mobile */}
            {isAuthenticated && (
              <button
                onClick={() => {
                  onShowStats();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d3741] hover:text-gray-900 dark:hover:text-white rounded-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                İstatistikler
              </button>
            )}
            
            {/* Kategoriler Butonu Mobile */}
            {isAuthenticated && (
              <button
                onClick={() => {
                  onShowCategories();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d3741] hover:text-gray-900 dark:hover:text-white rounded-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Kategorileri Yönet
              </button>
            )}
            
            {/* Karanlık Mod Düğmesi Mobile */}
            <button
              onClick={() => {
                toggleDarkMode();
                setMobileMenuOpen(false);
              }}
              className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d3741] hover:text-gray-900 dark:hover:text-white rounded-md"
            >
              {darkMode ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Açık Tema
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  Koyu Tema
                </>
              )}
            </button>
            
            {/* Eşitleme Butonu Mobile */}
            {isAuthenticated && pendingChanges > 0 && (
              <button
                onClick={() => {
                  syncOfflineChanges();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 text-base font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-800 dark:hover:text-blue-300 rounded-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Değişiklikleri Senkronize Et ({pendingChanges})
              </button>
            )}
            
            {/* Çıkış Butonu veya Giriş Butonu Mobile */}
            {isAuthenticated ? (
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-800 dark:hover:text-red-300 rounded-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Çıkış Yap
              </button>
            ) : (
              <button
                onClick={() => {
                  onLogin();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center w-full px-3 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md mt-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Giriş Yap
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header 