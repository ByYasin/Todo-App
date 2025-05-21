import { useState } from 'react';
import { Tag } from '../../types';

interface TagSelectorProps {
  selectedTagIds: number[];
  allTags: Tag[];
  onTagsChange: (tagIds: number[]) => void;
  onTagCreate?: (name: string, color: string) => Promise<Tag | undefined>;
}

const TagSelector = ({ selectedTagIds, allTags, onTagsChange, onTagCreate }: TagSelectorProps) => {
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6b7280');
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Etiketlerin seçili olup olmadığını kontrol et
  const isTagSelected = (tagId: number) => selectedTagIds.includes(tagId);

  // Etiket seçimini değiştir
  const toggleTagSelection = (tagId: number) => {
    setErrorMessage(null);
    onTagsChange(
      isTagSelected(tagId)
        ? selectedTagIds.filter(id => id !== tagId)
        : [...selectedTagIds, tagId]
    );
  };
  
  // Yeni etiket oluşturma
  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      setErrorMessage('Etiket adı boş olamaz');
      return;
    }
    
    if (!onTagCreate) return;
    
    try {
      setIsCreating(true);
      setErrorMessage(null);
      
      const createdTag = await onTagCreate(newTagName, newTagColor);
      
      if (createdTag) {
        // Yeni etiketi seç
        onTagsChange([...selectedTagIds, createdTag.id]);
        
        // Formu temizle
        setNewTagName('');
        setNewTagColor('#6b7280');
        setShowTagInput(false);
      }
    } catch (error) {
      setErrorMessage('Etiket oluşturulurken bir hata oluştu');
      console.error('Tag creation error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mb-2">
      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
        Etiketler
      </label>
      
      <div className="flex flex-wrap gap-1 mb-2">
        {allTags.map(tag => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggleTagSelection(tag.id)}
            className={`px-1.5 py-0.5 text-xs rounded-full flex items-center ${
              isTagSelected(tag.id)
                ? 'text-white'
                : 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            style={{ 
              backgroundColor: isTagSelected(tag.id) ? tag.color : undefined 
            }}
          >
            <span>{tag.name}</span>
            {isTagSelected(tag.id) && (
              <svg className="w-2.5 h-2.5 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        ))}
        
        {!showTagInput && onTagCreate && (
          <button
            type="button"
            onClick={() => setShowTagInput(true)}
            className="px-1.5 py-0.5 text-xs rounded-full text-blue-600 dark:text-blue-400 border border-dashed border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center"
          >
            <svg className="w-2.5 h-2.5 mr-0.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 4v16m8-8H4"></path>
            </svg>
            Yeni Etiket
          </button>
        )}
      </div>
      
      {/* Yeni etiket formu */}
      {showTagInput && (
        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 mb-2">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                Etiket Adı
              </label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="w-full px-1.5 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Etiket adı girin"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                Renk
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">{newTagColor}</span>
              </div>
            </div>
          </div>
          
          {errorMessage && (
            <div className="mb-1 text-xs text-red-500">{errorMessage}</div>
          )}
          
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() => {
                setShowTagInput(false);
                setNewTagName('');
                setNewTagColor('#6b7280');
                setErrorMessage(null);
              }}
              className="px-1.5 py-0.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleCreateTag}
              disabled={isCreating}
              className={`px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 ${
                isCreating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isCreating ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagSelector; 