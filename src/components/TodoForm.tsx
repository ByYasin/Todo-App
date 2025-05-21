import { useState, useEffect, useRef } from 'react'
import { Todo, Category, Tag } from '../types'
import TagSelector from './Tags/TagSelector'
import { Picker } from 'emoji-mart'

interface TodoFormProps {
  todo: Todo | null
  categories: Category[]
  tags?: Tag[]
  onSubmit: (todo: Todo) => void
  onCancel: () => void
  onCreateTag?: (name: string, color: string) => Promise<Tag | undefined>
}

const TodoForm = ({ todo, categories, tags = [], onSubmit, onCancel, onCreateTag }: TodoFormProps) => {
  // Form state
  const [formData, setFormData] = useState<Todo>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    category_id: null,
    due_date: null,
    tags: [],
    sub_tasks: []
  })
  
  // Seçili etiketler
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  
  // Alt görevler
  const [subTasks, setSubTasks] = useState<Array<{id?: number; title: string; completed: boolean}>>([])
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('')
  
  // Emoji seçici
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMarkdownGuide, setShowMarkdownGuide] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Formun düzenleme modu mu yoksa ekleme modu mu olduğunu belirle
  const isEditMode = !!todo?.id
  
  // Eğer düzenleme moduysa, form verilerini mevcut todo ile doldur
  useEffect(() => {
    if (todo) {
      setFormData({
        id: todo.id,
        title: todo.title,
        description: todo.description || '',
        status: todo.status,
        priority: todo.priority,
        category_id: todo.category_id,
        due_date: todo.due_date,
        tags: todo.tags || [],
        parent_id: todo.parent_id || null,
        sub_tasks: todo.sub_tasks || []
      })
      
      // Etiketleri ayarla
      if (todo.tags && todo.tags.length > 0) {
        setSelectedTagIds(todo.tags.map(tag => tag.id))
      } else {
        setSelectedTagIds([])
      }
      
      // Alt görevleri ayarla
      if (todo.sub_tasks && todo.sub_tasks.length > 0) {
        setSubTasks(todo.sub_tasks.map(task => ({
          id: task.id,
          title: task.title,
          completed: task.status === 'completed'
        })))
      }
    }
  }, [todo])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Emoji ekle
  const handleEmojiSelect = (emoji: any) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      
      const newDescription = 
        formData.description!.substring(0, start) + 
        emoji.native + 
        formData.description!.substring(end)
      
      setFormData(prev => ({ ...prev, description: newDescription }))
      
      // Cursor'ı emojiden sonraya taşı
      setTimeout(() => {
        const newCursorPos = start + emoji.native.length
        textarea.focus()
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 10)
    }
    setShowEmojiPicker(false)
  }
  
  // Markdown örneği ekle
  const insertMarkdownExample = (example: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = formData.description!.substring(start, end)
      
      let newText = ''
      
      switch(example) {
        case 'bold':
          newText = `**${selectedText || 'kalın metin'}**`
          break
        case 'italic':
          newText = `*${selectedText || 'italik metin'}*`
          break
        case 'link':
          newText = `[${selectedText || 'link metni'}](https://ornek.com)`
          break
        case 'list':
          newText = `\n- Liste öğesi 1\n- Liste öğesi 2\n- Liste öğesi 3`
          break
        case 'heading':
          newText = `\n## ${selectedText || 'Başlık'}`
          break
        case 'code':
          newText = `\`${selectedText || 'kod'}\``
          break
        default:
          newText = selectedText
      }
      
      const newDescription = 
        formData.description!.substring(0, start) + 
        newText + 
        formData.description!.substring(end)
      
      setFormData(prev => ({ ...prev, description: newDescription }))
      
      // Cursor'ı yeni metinden sonraya taşı
      setTimeout(() => {
        const newCursorPos = start + newText.length
        textarea.focus()
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 10)
    }
  }
  
  // Etiketlerin değişimini işle
  const handleTagsChange = (tagIds: number[]) => {
    setSelectedTagIds(tagIds)
    
    // Todo verilerine etiketleri ekle
    const selectedTags = tags.filter(tag => tagIds.includes(tag.id))
    setFormData(prev => ({ ...prev, tags: selectedTags }))
  }
  
  // Yeni alt görev ekleme
  const addSubTask = () => {
    if (!newSubTaskTitle.trim()) return
    
    setSubTasks([
      ...subTasks,
      { title: newSubTaskTitle, completed: false }
    ])
    
    setNewSubTaskTitle('')
  }
  
  // Alt görev durumunu değiştirme
  const toggleSubTaskCompletion = (index: number) => {
    setSubTasks(prev => 
      prev.map((task, i) => 
        i === index ? { ...task, completed: !task.completed } : task
      )
    )
  }
  
  // Alt görev silme
  const removeSubTask = (index: number) => {
    setSubTasks(prev => prev.filter((_, i) => i !== index))
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Alt görevleri todo verilerine ekle
    const updatedTodo = {
      ...formData,
      sub_tasks: subTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: '',
        status: task.completed ? 'completed' as const : 'pending' as const,
        priority: 'medium' as const,
        category_id: formData.category_id,
        parent_id: formData.id,
        due_date: null
      }))
    }
    
    onSubmit(updatedTodo as Todo)
    
    // Form gönderildikten sonra modalı kapat
    onCancel()
  }

  // Escape tuşu ile modal'ı kapatma
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onCancel]);

  // Modal dışına tıklandığında kapatma
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };
  
  // Markdown rehberi
  const markdownGuide = (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 text-sm">
      <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Markdown Rehberi
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="mb-2">
            <code className="bg-gray-100 dark:bg-gray-600 px-1 py-0.5 rounded text-sm">**Kalın**</code> → <span className="font-bold">Kalın</span>
          </div>
          <div className="mb-2">
            <code className="bg-gray-100 dark:bg-gray-600 px-1 py-0.5 rounded text-sm">*İtalik*</code> → <span className="italic">İtalik</span>
          </div>
          <div className="mb-2">
            <code className="bg-gray-100 dark:bg-gray-600 px-1 py-0.5 rounded text-sm"># Başlık</code> → <span className="text-lg font-bold">Başlık</span>
          </div>
        </div>
        <div>
          <div className="mb-2">
            <code className="bg-gray-100 dark:bg-gray-600 px-1 py-0.5 rounded text-sm">- Liste öğesi</code> → <span>• Liste öğesi</span>
          </div>
          <div className="mb-2">
            <code className="bg-gray-100 dark:bg-gray-600 px-1 py-0.5 rounded text-sm">[Metin](URL)</code> → <span className="text-blue-500 underline">Metin</span>
          </div>
          <div className="mb-2">
            <code className="bg-gray-100 dark:bg-gray-600 px-1 py-0.5 rounded text-sm">`kod`</code> → <span className="bg-gray-100 dark:bg-gray-600 font-mono px-1 rounded">kod</span>
          </div>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Yukarıdaki araç çubuğunda bulunan düğmeleri kullanarak Markdown biçimlendirmesini hızlıca ekleyebilirsiniz.
      </div>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white dark:bg-gray-700 rounded-2xl shadow-2xl dark:shadow-dark-xl w-full max-w-2xl transition-all duration-300 transform animate-fadeIn modal-content border dark:border-gray-600 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 py-3 px-5 z-10 flex justify-between items-center text-white shadow-md">
          <h2 className="text-xl font-bold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
            </svg>
            {isEditMode ? 'Görevi Düzenle' : 'Yeni Görev Ekle'}
          </h2>
          <button 
            type="button" 
            className="text-white/80 hover:text-white focus:outline-none p-1.5 rounded-full hover:bg-white/10 transition-colors"
            onClick={onCancel}
            aria-label="Kapat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Başlık */}
          <div className="relative">
            <label htmlFor="title" className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Başlık
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Görev başlığını girin"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-500 rounded-xl bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:border-blue-300 dark:hover:border-blue-500"
            />
          </div>
          
          {/* Açıklama */}
          <div className="relative">
            <label htmlFor="description" className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              Açıklama
              <div className="ml-2 flex gap-1">
                <button 
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-gray-400 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                  title="Emoji ekle"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button 
                  type="button"
                  onClick={() => setShowMarkdownGuide(!showMarkdownGuide)}
                  className="text-gray-400 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                  title="Markdown ipuçları"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </label>
            <textarea
              id="description"
              name="description"
              ref={textareaRef}
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Görev açıklamasını girin (Markdown formatı desteklenir)"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-500 rounded-xl bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:border-blue-300 dark:hover:border-blue-500 font-mono text-sm"
            ></textarea>
            
            {showEmojiPicker && (
              <div className="absolute z-10 mt-1">
                <Picker onSelect={handleEmojiSelect} theme={document.documentElement.classList.contains('dark') ? "dark" : "light"} />
              </div>
            )}
            
            {showMarkdownGuide && (
              <div className="mt-2 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-100 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300">
                <div className="font-medium mb-1">Markdown Biçimlendirme İpuçları:</div>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    type="button" 
                    onClick={() => insertMarkdownExample('bold')}
                    className="bg-white dark:bg-blue-800/30 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors text-left"
                  >
                    <strong>Kalın</strong>: **metin**
                  </button>
                  <button 
                    type="button" 
                    onClick={() => insertMarkdownExample('italic')}
                    className="bg-white dark:bg-blue-800/30 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors text-left"
                  >
                    <em>İtalik</em>: *metin*
                  </button>
                  <button 
                    type="button" 
                    onClick={() => insertMarkdownExample('link')}
                    className="bg-white dark:bg-blue-800/30 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors text-left"
                  >
                    <span className="underline">Link</span>: [ad](url)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => insertMarkdownExample('list')}
                    className="bg-white dark:bg-blue-800/30 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors text-left"
                  >
                    • Liste: - öğe
                  </button>
                  <button 
                    type="button" 
                    onClick={() => insertMarkdownExample('heading')}
                    className="bg-white dark:bg-blue-800/30 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors text-left"
                  >
                    <span className="font-bold">Başlık</span>: ## Başlık
                  </button>
                  <button 
                    type="button" 
                    onClick={() => insertMarkdownExample('code')}
                    className="bg-white dark:bg-blue-800/30 px-2 py-1 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors text-left"
                  >
                    <code>Kod</code>: `kod`
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Durum, Öncelik, Kategori ve Son Tarih - iki satıra ayırıldı */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Durum - görsel butonlar */}
            <div className="relative bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
                Durum
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status: 'pending' }))}
                  className={`flex-1 p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                    formData.status === 'pending' 
                      ? 'bg-gradient-to-r from-amber-300 to-amber-500 text-amber-900 shadow-md scale-105 ring-2 ring-amber-300/50' 
                      : 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-600 hover:from-amber-100 hover:to-amber-200 dark:from-amber-800/30 dark:to-amber-700/40 dark:text-amber-300 dark:hover:from-amber-800/40 dark:hover:to-amber-700/50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Bekleyen
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status: 'in-progress' }))}
                  className={`flex-1 p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                    formData.status === 'in-progress' 
                      ? 'bg-gradient-to-r from-blue-300 to-blue-500 text-blue-900 shadow-md scale-105 ring-2 ring-blue-300/50' 
                      : 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 hover:from-blue-100 hover:to-blue-200 dark:from-blue-800/30 dark:to-blue-700/40 dark:text-blue-300 dark:hover:from-blue-800/40 dark:hover:to-blue-700/50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Devam
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status: 'completed' }))}
                  className={`flex-1 p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                    formData.status === 'completed' 
                      ? 'bg-gradient-to-r from-green-300 to-green-500 text-green-900 shadow-md scale-105 ring-2 ring-green-300/50' 
                      : 'bg-gradient-to-r from-green-50 to-green-100 text-green-600 hover:from-green-100 hover:to-green-200 dark:from-green-800/30 dark:to-green-700/40 dark:text-green-300 dark:hover:from-green-800/40 dark:hover:to-green-700/50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Tamam
                </button>
              </div>
            </div>
            
            {/* Öncelik */}
            <div className="relative bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Öncelik
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, priority: 'low' }))}
                  className={`flex-1 p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                    formData.priority === 'low' 
                      ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 shadow-md scale-105 ring-2 ring-gray-300/50' 
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 hover:from-gray-100 hover:to-gray-200 dark:from-gray-700/50 dark:to-gray-600/60 dark:text-gray-300 dark:hover:from-gray-700/60 dark:hover:to-gray-600/70'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  Düşük
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, priority: 'medium' }))}
                  className={`flex-1 p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                    formData.priority === 'medium' 
                      ? 'bg-gradient-to-r from-orange-300 to-orange-500 text-orange-900 shadow-md scale-105 ring-2 ring-orange-300/50' 
                      : 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-600 hover:from-orange-100 hover:to-orange-200 dark:from-orange-800/30 dark:to-orange-700/40 dark:text-orange-300 dark:hover:from-orange-800/40 dark:hover:to-orange-700/50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                  Orta
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, priority: 'high' }))}
                  className={`flex-1 p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                    formData.priority === 'high' 
                      ? 'bg-gradient-to-r from-red-300 to-red-500 text-red-900 shadow-md scale-105 ring-2 ring-red-300/50' 
                      : 'bg-gradient-to-r from-red-50 to-red-100 text-red-600 hover:from-red-100 hover:to-red-200 dark:from-red-800/30 dark:to-red-700/40 dark:text-red-300 dark:hover:from-red-800/40 dark:hover:to-red-700/50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  Yüksek
                </button>
              </div>
            </div>
            
            {/* Kategori */}
            <div className="relative bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
              <label htmlFor="category_id" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Kategori
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id || ""}
                onChange={(e) => {
                  const value = e.target.value !== "" ? parseInt(e.target.value) : null
                  setFormData(prev => ({ ...prev, category_id: value }))
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm shadow-sm hover:border-blue-300 dark:hover:border-blue-500"
              >
                <option value="">Kategori Seçin</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            
            {/* Son Tarih */}
            <div className="relative bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
              <label htmlFor="due_date" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Son Tarih
              </label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={formData.due_date || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm shadow-sm hover:border-blue-300 dark:hover:border-blue-500"
              />
            </div>
          </div>
          
          {/* Etiketler - daha görsel hale getirildi */}
          {tags && tags.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Etiketler
              </label>
              <TagSelector
                selectedTagIds={selectedTagIds}
                allTags={tags}
                onTagsChange={handleTagsChange}
                onTagCreate={onCreateTag}
              />
            </div>
          )}
          
          {/* Alt Görevler - daha görsel hale getirildi */}
          <div className="bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              Alt Görevler
            </label>
            
            <div className="space-y-1 mb-3 max-h-28 overflow-y-auto bg-white dark:bg-gray-600 rounded-lg p-2 border border-gray-200 dark:border-gray-500">
              {subTasks.length === 0 ? (
                <div className="p-3 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 text-xs italic">Alt görev eklenmemiş</p>
                </div>
              ) : (
                subTasks.map((task, index) => (
                  <div key={index} className="flex items-center gap-2 group p-2 hover:bg-blue-50 dark:hover:bg-blue-800/20 rounded-md transition-colors">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleSubTaskCompletion(index)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition-colors"
                    />
                    <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                      {task.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubTask(index)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-800/20"
                      aria-label="Alt görevi sil"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubTaskTitle}
                onChange={(e) => setNewSubTaskTitle(e.target.value)}
                placeholder="Yeni alt görev ekle..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm transition-colors duration-200 shadow-sm hover:border-blue-300 dark:hover:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSubTaskTitle.trim()) {
                    e.preventDefault();
                    addSubTask();
                  }
                }}
              />
              <button
                type="button"
                onClick={addSubTask}
                disabled={!newSubTaskTitle.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-600 dark:disabled:text-gray-400 text-sm transition-colors duration-200 font-medium flex items-center shadow-sm hover:shadow"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Ekle
              </button>
            </div>
          </div>
          
          {/* Butonlar */}
          <div className="flex justify-end space-x-3 pt-3 border-t dark:border-gray-600">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-600 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow"
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414-1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                İptal
              </span>
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {isEditMode ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TodoForm 