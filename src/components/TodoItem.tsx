import { Todo } from '../types'
import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { useTodoContext } from '../context/TodoContext'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

// Emoji tip tanımları
interface EmojiData {
  id: string;
  name: string;
  native: string;
  unified: string;
  keywords: string[];
  shortcodes: string;
}

interface TodoItemProps {
  todo: Todo
  onDelete: (id: number) => void
  onEdit: (todo: Todo) => void
  categories?: { id: number; name: string; color: string }[]
}

const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onDelete,
  onEdit,
  categories,
}) => {
  const { canUseFeature, openUpgradeModal } = useTodoContext();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const { title, description, status, priority, category_id, due_date } = todo;

  // Markdown desteğini kontrol et
  const hasMarkdownSupport = canUseFeature('has_markdown_support');
  // Emoji desteğini kontrol et - premium özellik olarak belirle
  const hasEmojiSupport = canUseFeature('has_advanced_features');

  // Kategori bilgisini bul
  const category = categories?.find((c) => c.id === category_id);

  // Önceliklere göre renk sınıfları - Dark mode uyumlu
  const priorityClasses = {
    high: 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300',
    low: 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300',
  };

  // Durumlara göre renk sınıfları - Dark mode uyumlu
  const statusClasses = {
    pending: 'bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300',
    'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300',
  };

  // Açıklama metnini kısalt
  const shortenDescription = (text: string | undefined) => {
    if (!text) return '';
    // HTML etiketlerini temizle
    const plainText = text.replace(/<[^>]*>?/gm, '');
    return plainText.length > 50 ? `${plainText.substring(0, 50)}...` : plainText;
  };

  // Açıklama gösterimini değiştir
  const toggleDescription = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setShowFullDescription((prev) => !prev);
    } catch (error) {
      console.error('Açıklama gösterme durumu değiştirilirken hata:', error);
    }
  };

  // Tarihi formatlama
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    } catch (error) {
      console.error('Tarih biçimlendirme hatası:', error);
      return dateString;
    }
  };

  // Bugünün tarihi ile kıyaslama ve renk belirleme
  const getDateColor = (dateString: string | undefined) => {
    if (!dateString) return '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    
    const differenceInDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (differenceInDays < 0) {
      return 'text-red-600 dark:text-red-400'; // Geçmiş
    } else if (differenceInDays === 0) {
      return 'text-orange-600 dark:text-orange-400'; // Bugün
    } else if (differenceInDays <= 2) {
      return 'text-yellow-600 dark:text-yellow-400'; // 2 gün içinde
    }
    return 'text-gray-600 dark:text-gray-400'; // Daha sonra
  };

  // Emoji seçici göster/gizle
  const toggleEmojiPicker = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!hasEmojiSupport) {
      openUpgradeModal();
      return;
    }
    
    setShowEmojiPicker((prev) => !prev);
  };

  // Emoji seçildiğinde
  const handleEmojiSelect = (emoji: EmojiData) => {
    if (!hasEmojiSupport) return;
    
    // Görevi düzenleme moduna geçirmek için onEdit'i çağır
    // Varsayılan olarak açıklamaya emojiyi ekle
    const updatedTodo = {
      ...todo,
      description: `${todo.description || ''} ${emoji.native}`
    };
    
    onEdit(updatedTodo);
    setShowEmojiPicker(false);
  };

  // Premium özellik açıklaması gösterme
  const handlePremiumFeatureClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openUpgradeModal();
  };

  // Emoji picker pozisyonunu hesapla - görünümden taşmasını önle
  const getEmojiPickerPosition = (): React.CSSProperties => {
    if (!descriptionRef.current) return {};
    
    const rect = descriptionRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Emoji picker'ın alttan taşıp taşmadığını kontrol et
    const pickerHeight = 350; // Yaklaşık emoji picker yüksekliği
    const bottomSpace = viewportHeight - rect.bottom;
    
    if (bottomSpace < pickerHeight) {
      // Üstte göster
      return { bottom: '2rem' };
    }
    
    // Altta göster (varsayılan)
    return { top: '2rem' };
  };

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-4 hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-500/50 overflow-hidden group">
      <div className="flex flex-col sm:flex-row justify-between">
        <div className="flex-1 min-w-0">
          {/* Başlık ve Emoji Butonu */}
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate max-w-full sm:max-w-[300px] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</h3>
            {hasEmojiSupport && (
              <button
                onClick={toggleEmojiPicker}
                className="text-gray-400 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors focus:outline-none"
                aria-label="Emoji Ekle"
                title="Emoji Ekle"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Açıklama */}
          {description && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 relative" ref={descriptionRef}>
              {showFullDescription ? (
                <div className="whitespace-pre-wrap break-words animate-fade-in markdown-content">
                  {hasMarkdownSupport ? (
                    <ReactMarkdown>
                      {description}
                    </ReactMarkdown>
                  ) : (
                    <div>
                      {description}
                      {description.includes('**') || description.includes('*') || description.includes('#') || description.includes('[') ? (
                        <div className="mt-2 text-xs bg-yellow-50 dark:bg-yellow-900/30 p-2 rounded border border-yellow-200 dark:border-yellow-800 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <span>Markdown desteği 
                            <button 
                              onClick={handlePremiumFeatureClick}
                              className="ml-1 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:underline"
                            >
                              Premium abonelik
                            </button> gerektirir.
                          </span>
                        </div>
                      ) : null}
                    </div>
                  )}
                  <button
                    onClick={toggleDescription}
                    className="inline-flex items-center mt-2 text-blue-600 dark:text-blue-400 text-sm cursor-pointer hover:underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors focus:outline-none"
                    aria-label="Daha az göster"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    <span>Daha az göster</span>
                  </button>
                </div>
              ) : (
                <div>
                  <div className="truncate-3-lines">{shortenDescription(description)}</div>
                  <button
                    onClick={toggleDescription}
                    className="inline-flex items-center mt-2 text-blue-600 dark:text-blue-400 text-sm cursor-pointer hover:underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors focus:outline-none"
                    aria-label="Devamını göster"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span>Devamını göster</span>
                  </button>
                </div>
              )}
              
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div 
                  className="absolute z-50 shadow-xl rounded-lg border border-gray-200 dark:border-gray-600"
                  style={getEmojiPickerPosition()}
                >
                  <div className="absolute top-0 right-0 p-1">
                    <button
                      onClick={toggleEmojiPicker}
                      className="text-gray-400 hover:text-red-500 dark:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Kapat"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <Picker 
                    data={data}
                    onEmojiSelect={handleEmojiSelect}
                    theme={document.documentElement.classList.contains('dark') ? "dark" : "light"}
                    emojiButtonSize={28}
                    emojiSize={20}
                    previewPosition="none"
                    perLine={8}
                    locale="tr"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* İşlem Butonları - mobilde aşağıda, masaüstünde sağda */}
        <div className="flex items-center space-x-1 mt-3 sm:mt-0">
          <button
            onClick={() => onEdit(todo)}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-400/50 touch-target transform hover:scale-105"
            aria-label="Düzenle"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(todo.id!)}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-400/50 touch-target transform hover:scale-105"
            aria-label="Sil"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Alt Bilgiler */}
      <div className="flex flex-wrap gap-2 mt-3">
        {/* Kategori */}
        {category && (
          <span
            className="px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 shadow-sm dark:shadow-none transition-all duration-200 hover:shadow md:hover:scale-105"
            style={{ 
              background: `linear-gradient(135deg, ${category.color}15, ${category.color}30)`, 
              color: category.color,
              boxShadow: `0 0 0 1px ${category.color}30`
            }}
          >
            {category.name}
          </span>
        )}

        {/* Öncelik */}
        {priority && (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 shadow-sm dark:shadow-none transition-all duration-200 hover:shadow md:hover:scale-105 ${priorityClasses[priority]}`}>
            {priority === 'high' ? 'Yüksek' : priority === 'medium' ? 'Orta' : 'Düşük'}
          </span>
        )}

        {/* Durum */}
        {status && (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 shadow-sm dark:shadow-none transition-all duration-200 hover:shadow md:hover:scale-105 ${statusClasses[status]}`}>
            {status === 'pending' ? 'Bekliyor' : status === 'in-progress' ? 'Devam Ediyor' : 'Tamamlandı'}
          </span>
        )}

        {/* Tarih */}
        {due_date && (
          <span className={`flex items-center ${getDateColor(due_date)} ml-auto text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 transition-all duration-200 hover:shadow-sm md:hover:scale-105`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(due_date)}
          </span>
        )}
      </div>
    </div>
  );
};

export default TodoItem; 