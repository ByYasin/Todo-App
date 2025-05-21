import { useState, useEffect, useRef } from 'react';
import { SearchFilters, Category, Tag } from '../types';

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  categories: Category[];
  tags?: Tag[];
  initialFilters?: SearchFilters;
}

const SearchBar = ({ onSearch, categories, tags = [], initialFilters }: SearchBarProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(
    initialFilters || {
      text: '',
      status: [],
      priority: [],
      categories: [],
      tags: [],
      startDate: null,
      endDate: null
    }
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    // LocalStorage'dan arama geçmişini yükle
    const savedHistory = localStorage.getItem('search_history');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchHistoryRef = useRef<HTMLDivElement>(null);
  
  // İlk değerler değişirse güncelle
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);
  
  // Belge tıklamalarını dinleyerek açık bölümleri kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Arama geçmişi dışında bir yere tıklanırsa kapat
      if (showSearchHistory && 
          searchHistoryRef.current && 
          searchInputRef.current &&
          !searchHistoryRef.current.contains(event.target as Node) &&
          !searchInputRef.current.contains(event.target as Node)) {
        setShowSearchHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchHistory]);
  
  // Filtreler değiştiğinde arama fonksiyonunu çağır
  useEffect(() => {
    setIsSearching(true);
    const debounceTimer = setTimeout(() => {
      try {
        onSearch(filters);
        // Arama metni varsa ve geçmişte yoksa ekle
        if (filters.text && filters.text.trim() !== '' && !searchHistory.includes(filters.text)) {
          const newHistory = [filters.text, ...searchHistory.slice(0, 9)]; // En fazla 10 kayıt tut
          setSearchHistory(newHistory);
          localStorage.setItem('search_history', JSON.stringify(newHistory));
        }
      } catch (error) {
        console.error('Arama sırasında hata:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [filters, onSearch]);
  
  // Metin araması değiştiğinde filtreleri güncelle
  const handleTextSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      text: e.target.value
    }));
  };
  
  // Arama geçmişinden bir öğeye tıklandığında
  const handleSelectHistory = (text: string) => {
    setFilters(prev => ({ ...prev, text }));
    setShowSearchHistory(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  // Arama geçmişini temizle
  const clearSearchHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory([]);
    localStorage.removeItem('search_history');
  };
  
  // Arama geçmişinden bir öğeyi sil
  const removeHistoryItem = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newHistory = [...searchHistory];
    newHistory.splice(index, 1);
    setSearchHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };
  
  // Checkbox değişimlerini işle
  const handleCheckboxChange = (field: 'status' | 'priority', value: string) => {
    setFilters(prev => {
      // Değer zaten varsa kaldır, yoksa ekle
      const values = prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value];
      
      return { ...prev, [field]: values };
    });
  };
  
  // Kategori seçimi değiştiğinde
  const handleCategoryChange = (categoryId: number) => {
    setFilters(prev => {
      const categories = prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId];
      
      return { ...prev, categories };
    });
  };
  
  // Etiket seçimi değiştiğinde
  const handleTagChange = (tagId: number) => {
    setFilters(prev => {
      const tags = prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId];
      
      return { ...prev, tags };
    });
  };
  
  // Tarih filtresi değiştiğinde
  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || null
    }));
  };
  
  // Filtreleri temizle
  const handleClearFilters = () => {
    setFilters({
      text: '',
      status: [],
      priority: [],
      categories: [],
      tags: [],
      startDate: null,
      endDate: null
    });
  };

  // Aktif filtre sayısı (arama metni hariç)
  const activeFilterCount = 
    (filters.status?.length || 0) + 
    (filters.priority?.length || 0) + 
    (filters.categories?.length || 0) + 
    (filters.tags?.length || 0) + 
    (filters.startDate ? 1 : 0) + 
    (filters.endDate ? 1 : 0);

  return (
    <div className="w-full mb-6">
      {/* Ana arama çubuğu */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isSearching ? (
            <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          )}
        </div>
        
        <input
          ref={searchInputRef}
          type="text"
          value={filters.text}
          onChange={handleTextSearch}
          onFocus={() => setShowSearchHistory(searchHistory.length > 0)}
          className="w-full pl-10 pr-24 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200 focus:shadow-lg"
          placeholder="Görev ara (başlık, açıklama veya kategori)"
          aria-label="Görevleri ara"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
          {filters.text && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, text: '' }))}
              className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              aria-label="Arama metnini temizle"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center p-2 rounded-full ${activeFilterCount > 0 
              ? 'bg-blue-500 text-white dark:bg-blue-600' 
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'} transition-all duration-200`}
            aria-label="Filtre seçenekleri"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
            </svg>
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-white text-blue-600 dark:bg-gray-800 dark:text-blue-400 text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Arama geçmişi */}
      {showSearchHistory && (
        <div 
          ref={searchHistoryRef}
          className="absolute z-10 mt-2 bg-white dark:bg-gray-800 w-full max-w-md border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl overflow-hidden animate-fade-in"
        >
          <div className="p-3 flex justify-between border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Arama Geçmişi
            </h3>
            <button 
              onClick={clearSearchHistory}
              className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              Geçmişi Temizle
            </button>
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {searchHistory.map((item, index) => (
              <li 
                key={index} 
                className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex justify-between items-center cursor-pointer transition-colors"
                onClick={() => handleSelectHistory(item)}
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-gray-800 dark:text-gray-200">{item}</span>
                </div>
                <button 
                  onClick={(e) => removeHistoryItem(e, index)}
                  className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Gelişmiş filtre paneli */}
      {showFilters && (
        <div className="mt-3 bg-white dark:bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in divide-y divide-gray-100 dark:divide-gray-700">
          <div className="flex justify-between items-center mb-4 pb-3">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
              </svg>
              Gelişmiş Filtreler
            </h3>
            <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium">
              {activeFilterCount} aktif filtre
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {/* Durum filtreleri */}
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Durum
              </h4>
              <div className="space-y-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                {['pending', 'in-progress', 'completed'].map(status => {
                  const statusLabels: Record<string, string> = {
                    'pending': 'Bekleyen',
                    'in-progress': 'Devam Eden',
                    'completed': 'Tamamlandı'
                  };
                  
                  const statusColors: Record<string, string> = {
                    'pending': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
                    'in-progress': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
                    'completed': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                  };
                  
                  return (
                    <label key={status} className="flex items-center p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.status?.includes(status) || false}
                        onChange={() => handleCheckboxChange('status', status)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${statusColors[status]} font-medium`}>
                        {statusLabels[status]}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            
            {/* Öncelik filtreleri */}
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Öncelik
              </h4>
              <div className="space-y-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                {['low', 'medium', 'high'].map(priority => {
                  const priorityLabels: Record<string, string> = {
                    'low': 'Düşük',
                    'medium': 'Orta',
                    'high': 'Yüksek'
                  };
                  
                  const priorityColors: Record<string, string> = {
                    'low': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
                    'medium': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
                    'high': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                  };
                  
                  return (
                    <label key={priority} className="flex items-center p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.priority?.includes(priority) || false}
                        onChange={() => handleCheckboxChange('priority', priority)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${priorityColors[priority]} font-medium`}>
                        {priorityLabels[priority]}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            
            {/* Kategori filtreleri */}
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Kategoriler
              </h4>
              <div className="space-y-2 max-h-36 overflow-y-auto bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {categories.map(category => (
                  <label key={category.id} className="flex items-center p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.categories?.includes(category.id) || false}
                      onChange={() => handleCategoryChange(category.id)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <span className="ml-2 flex items-center">
                      <span 
                        className="inline-block w-3 h-3 rounded-full mr-1" 
                        style={{ backgroundColor: category.color }}
                      ></span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        {category.name}
                      </span>
                    </span>
                  </label>
                ))}
                {categories.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Kategori bulunamadı
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Tarih filtreleri */}
          <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Tarih Aralığı
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={filters.startDate || ''}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={filters.endDate || ''}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Filtre işlem butonları */}
          <div className="flex justify-end mt-6 space-x-3">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Filtreleri Temizle
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md flex items-center transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Uygula ({activeFilterCount + (filters.text ? 1 : 0)})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar; 