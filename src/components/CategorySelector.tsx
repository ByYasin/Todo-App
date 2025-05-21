import { useState } from 'react'
import { Category } from '../types'

interface CategorySelectorProps {
  categories: Category[]
  selectedCategory: number | null
  onSelectCategory: (id: number | null) => void
  onAddCategory: () => void
}

const CategorySelector = ({ categories, selectedCategory, onSelectCategory, onAddCategory }: CategorySelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Mobil görünümde kategorileri genişlet/daralt
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-800 dark:text-white text-lg flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Kategoriler
        </h2>
        
        <div className="flex space-x-2">
          {/* Mobil için genişletme butonu */}
          <button 
            className="md:hidden rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
            onClick={toggleExpand}
            aria-expanded={isExpanded}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Kategori ekle butonu */}
          <button 
            onClick={onAddCategory}
            className="rounded-lg p-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30 transition-colors"
            title="Yeni kategori ekle"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className={`space-y-1.5 transition-all ${!isExpanded && 'md:block hidden'}`}>
        <button
          className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
            selectedCategory === null
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          onClick={() => onSelectCategory(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Tümü
        </button>
        
        {categories.map(category => (
          <button
            key={category.id}
            className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
              selectedCategory === category.id
                ? 'bg-gray-100 dark:bg-gray-700 font-medium'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => onSelectCategory(category.id)}
          >
            <span
              className="h-3 w-3 rounded-full mr-2 flex-shrink-0"
              style={{ backgroundColor: category.color }}
            ></span>
            <span className="truncate">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default CategorySelector 