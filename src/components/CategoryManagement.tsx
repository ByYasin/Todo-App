import { useState, useEffect, useMemo } from 'react';
import { Category } from '../types';
import axios from 'axios';

interface CategoryManagementProps {
  categories: Category[];
  onCategoriesUpdate: (categories: Category[]) => void;
  isAuthenticated?: boolean;
}

// API URL'i sabit olarak tanımlayalım
const API_URL = 'http://localhost:5000/api';

const CategoryManagement: React.FC<CategoryManagementProps> = ({ 
  categories, 
  onCategoriesUpdate, 
  isAuthenticated = false 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<{ name: string; color: string; is_public: boolean }>({
    name: '',
    color: '#3b82f6',
    is_public: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kullanıcı bilgilerini al
  const currentUser = useMemo(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }, []);

  // Kullanıcının kendi kategorileri ve diğer kategoriler
  const filteredCategories = useMemo(() => {
    if (!currentUser) return categories;

    // Kategorileri kullanıcının sahip olduğu ve diğerleri olarak ayır
    return categories.map(category => ({
      ...category,
      isOwner: category.user_id === currentUser.id
    }));
  }, [categories, currentUser]);

  // Düzenleme modunda form verilerini doldur
  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        color: editingCategory.color,
        is_public: editingCategory.is_public || false
      });
    } else {
      setFormData({
        name: '',
        color: '#3b82f6',
        is_public: false
      });
    }
  }, [editingCategory]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleOpenModal = (category?: Category) => {
    if (!isAuthenticated) {
      setError('Kategori işlemleri için giriş yapmalısınız');
      return;
    }
    
    if (category) {
      setEditingCategory(category);
    } else {
      setEditingCategory(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('Kategori işlemleri için giriş yapmalısınız');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const { name, color, is_public } = formData;
      console.log('Form verileri:', formData);

      if (!name.trim()) {
        setError('Kategori adı boş olamaz');
        setLoading(false);
        return;
      }

      // Token alınması
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
        setLoading(false);
        return;
      }
      
      // Kullanıcı bilgisi
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      // Debug: Kullanıcı bilgilerini kontrol et
      console.log('Kullanıcı bilgisi:', user);
      
      // API için header
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log('API isteği header:', headers);
      
      let response;

      if (editingCategory) {
        // Kategori güncelleme
        response = await axios.put(
          `${API_URL}/categories/${editingCategory.id}`, 
          { name, color, is_public },
          { headers }
        );

        // Kategoriler listesini güncelle
        const updatedCategories = categories.map(cat =>
          cat.id === editingCategory.id ? { 
            ...cat, 
            name, 
            color, 
            is_public
          } : cat
        );
        onCategoriesUpdate(updatedCategories);
      } else {
        // Yeni kategori ekleme
        // Kullanıcı bilgisini daha önce almıştık
        
        // Veritabanı şema hatası problemi - API'nin desteklediği formata uygun olarak gönderelim
        try {
          // JSON string yaklaşımını deneyelim
          const userId = user?.id || null;
          
          // Tam URL'i konsola yazdır
          const endpoint = `${API_URL}/categories`;
          console.log('API endpoint:', endpoint);
          
          // Object değil, doğrudan veri göndermeyi deneyelim
          const requestBody = {
            name: name,
            color: color,
            is_public: is_public,
            user_id: userId
          };
          
          console.log('Kategori veri yapısı:', JSON.stringify(requestBody));
          
          // Doğrudan axios ile deneme
          response = await axios({
            method: 'post',
            url: endpoint,
            headers: headers,
            data: requestBody
          });
          
          console.log('API yanıtı:', response);
          
          // Başarılı olursa kategoriler listesine ekle
          onCategoriesUpdate([...categories, response.data]);
        } catch (postError: any) {
          console.error('Kategori ekleme hatası:', postError);
          console.log('Hata detayı:', postError.response?.data);
          
          // Alternatif formatlarda deneme
          if (postError.response?.status === 400 || 
              (postError.response?.data?.error && postError.response?.data?.error.includes('Unknown column'))) {
              
            // Denemeler:
            const alternatifFormatlar = [
              // Deneme 1: Sadece userId formatı
              { 
                name, color, is_public, userId: user?.id 
              },
              // Deneme 2: user_id ve farklı kategori formatı
              { 
                categoryName: name, 
                categoryColor: color, 
                isPublic: is_public, 
                user_id: user?.id 
              },
              // Deneme 3: user yerine author kullanımı
              { 
                name, color, is_public, 
                author_id: user?.id 
              },
              // Deneme 4: Sadece temel veriler
              { 
                name, color
              }
            ];
            
            for (const format of alternatifFormatlar) {
              try {
                console.log('Alternatif format deneniyor:', format);
                
                const altResponse = await axios.post(
                  `${API_URL}/categories`,
                  format,
                  { headers }
                );
                
                console.log('Başarılı yanıt:', altResponse);
                
                // Başarılı olursa kategoriler listesine ekle
                onCategoriesUpdate([...categories, altResponse.data]);
                
                // Başarılı formata göre bilgi göster
                setError(null);
                handleCloseModal();
                return; // Başarılıysa çık
              } catch (altError) {
                console.error(`Alternatif format başarısız:`, altError);
              }
            }
            
            // Tüm alternatif formatlar başarısız oldu
            setError('Sunucu tüm veri formatlarını reddediyor. Backend API ile format uyumsuzluğu var.');
          } else {
            // Normal hata gösterimi
            if (postError.response?.data?.error) {
              setError(`Kategori eklenemedi: ${postError.response.data.error}`);
            } else if (postError.message) {
              setError(`Kategori eklenemedi: ${postError.message}`);
            } else {
              setError('Kategori eklenemedi: Bilinmeyen hata');
            }
          }
        }
      }

      handleCloseModal();
    } catch (err: any) {
      // Hata detaylarını kontrol et
      const errorMsg = err.response?.data?.error || 'Bir hata oluştu';
      setError(errorMsg);
      
      // Özel hata mesajlarını detaylandır
      if (errorMsg.includes('Unknown column')) {
        setError('Veritabanı şema uyumsuzluğu. Sunucunun beklediği veri formatı farklı olabilir.');
      } 
      
      console.error('Kategori işlem hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: number) => {
    if (!isAuthenticated) {
      setError('Kategori işlemleri için giriş yapmalısınız');
      return;
    }
    
    if (!window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    setLoading(true);
    
    try {
      // Token alınması
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
        setLoading(false);
        return;
      }
      
      // API için header
      const headers = {
        'Authorization': `Bearer ${token}`,
      };
      
      // Kategori silme
      await axios.delete(`${API_URL}/categories/${categoryId}`, { headers });
      
      // Kategoriler listesini güncelle
      const updatedCategories = categories.filter(cat => cat.id !== categoryId);
      onCategoriesUpdate(updatedCategories);
      
      setError(null);
    } catch (error: any) {
      console.error('Kategori silme hatası:', error);
      setError(error.response?.data?.message || 'Kategori silinirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Kategoriler
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600"
          disabled={!isAuthenticated}
        >
          Yeni Kategori
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {/* Kategori Grupları */}
      <div className="space-y-4">
        {/* Kullanıcı Kategorileri */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Kategorilerim
          </h3>
          <div className="space-y-2">
            {filteredCategories.filter(cat => cat.isOwner).map(category => (
              <div
                key={category.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md border-l-4"
                style={{ borderLeftColor: category.color }}
              >
                <div className="flex items-center">
                  <span
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <span className="text-gray-700 dark:text-gray-200">{category.name}</span>
                    {category.is_public && (
                      <span className="ml-2 text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-1 py-0.5 rounded">
                        Herkese Açık
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenModal(category)}
                    className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    disabled={!isAuthenticated}
                    title="Düzenle"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    disabled={!isAuthenticated}
                    title="Sil"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {filteredCategories.filter(cat => cat.isOwner).length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-2 text-sm bg-gray-50 dark:bg-gray-700 rounded-md">
                Henüz kendi kategoriniz bulunmuyor
              </p>
            )}
          </div>
        </div>

        {/* Paylaşılan Kategoriler */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Paylaşılan Kategoriler
          </h3>
          <div className="space-y-2">
            {filteredCategories.filter(cat => !cat.isOwner).map(category => (
              <div
                key={category.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md border-l-4 border-opacity-50"
                style={{ borderLeftColor: category.color }}
              >
                <div className="flex items-center">
                  <span
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <span className="text-gray-700 dark:text-gray-200">{category.name}</span>
                    <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded">
                      Paylaşılan
                    </span>
                  </div>
                </div>
                {/* Paylaşılan kategoriler için sadece görüntüleme modu */}
              </div>
            ))}

            {filteredCategories.filter(cat => !cat.isOwner).length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-2 text-sm bg-gray-50 dark:bg-gray-700 rounded-md">
                Henüz paylaşılan kategori bulunmuyor
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Kategori Düzenleme/Ekleme Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Kategori Adı
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="color"
                  className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Renk
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="p-1 h-8 w-8 border border-gray-300 dark:border-gray-600 rounded"
                  />
                  <span className="text-gray-600 dark:text-gray-300">{formData.color}</span>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_public"
                    checked={formData.is_public}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 dark:text-blue-500 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Herkese açık kategori
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                  Bu kategori diğer kullanıcılar tarafından da görülebilir ve kullanılabilir
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'İşleniyor...' : editingCategory ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement; 