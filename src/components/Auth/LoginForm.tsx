import { useState, useEffect } from 'react';
import axios from 'axios';
import { User } from '../../types';
import { 
  FormWrapper, 
  FormTitle, 
  FormInput, 
  PasswordInput, 
  Button, 
  AlertMessage, 
  Divider 
} from './components';
import { useDarkMode } from './hooks';
import { validateLoginForm } from './utils/validators';
import { LoginFormValues, ValidationErrors } from './types';

interface LoginFormProps {
  onLogin: (token: string, refreshToken: string, user: User) => void;
  onSwitchToRegister: () => void;
  apiUrl: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onSwitchToRegister, apiUrl }) => {
  // Form değerleri
  const [formValues, setFormValues] = useState<LoginFormValues>({
    username: '',
    password: '',
    rememberMe: false
  });
  
  // Form durumları
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Dark mode takibi için
  const isDarkMode = useDarkMode();
  
  // Kayıtlı kullanıcı adını localStorage'dan yükleme
  useEffect(() => {
    const savedUsername = localStorage.getItem('remembered_username');
    if (savedUsername) {
      setFormValues(prev => ({
        ...prev,
        username: savedUsername,
        rememberMe: true
      }));
    }
  }, []);

  // Form değişikliği işleyicisi
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // İlgili hata mesajını temizle
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Form gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form doğrulama
    const validationErrors = validateLoginForm(formValues);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    setServerError(null);
    
    try {
      console.log('API URL:', apiUrl);
      console.log('Login URL:', `${apiUrl}/auth/login`);
      
      const response = await axios.post(`${apiUrl}/auth/login`, {
        username: formValues.username,
        password: formValues.password
      });
      
      const { token, refreshToken, user } = response.data;
      
      // Beni hatırla seçiliyse kullanıcı adını kaydet, değilse temizle
      if (formValues.rememberMe) {
        localStorage.setItem('remembered_username', formValues.username);
      } else {
        localStorage.removeItem('remembered_username');
      }
      
      // Ana bileşeni güncelle
      onLogin(token, refreshToken, user);
    } catch (err: any) {
      console.error('Login error:', err);
      
      setServerError(
        err.response?.data?.error || 
        'Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormWrapper colorScheme="blue">
      <FormTitle 
        title="Giriş Yap" 
        colorScheme="blue"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        }
      />
      
      {serverError && (
        <AlertMessage 
          type="error" 
          message={serverError} 
          onClose={() => setServerError(null)} 
        />
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormInput
          id="username"
          name="username"
          label="Kullanıcı Adı"
          value={formValues.username}
          onChange={handleChange}
          placeholder="Kullanıcı adınızı girin"
          error={errors.username}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          required
        />
        
        <PasswordInput
          id="password"
          name="password"
          label="Şifre"
          value={formValues.password}
          onChange={handleChange}
          placeholder="Şifrenizi girin"
          error={errors.password}
          required
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="rememberMe"
                checked={formValues.rememberMe} 
                onChange={handleChange}
                className="sr-only peer" 
              />
              <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
              <span className="ms-3 text-sm font-medium text-gray-700 dark:text-gray-300">Beni hatırla</span>
            </label>
          </div>
        </div>
        
        <div className="flex flex-col space-y-5 pt-2">
          <Button
            type="submit"
            isLoading={loading}
            loadingText="Giriş Yapılıyor..."
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            }
          >
            Giriş Yap
          </Button>
          
          <Divider />
          
          <Button
            type="button"
            variant="secondary"
            onClick={onSwitchToRegister}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            }
          >
            Yeni Hesap Oluştur
          </Button>
        </div>
      </form>
    </FormWrapper>
  );
};

export default LoginForm; 