import { useState } from 'react';
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
import { validateRegisterForm } from './utils/validators';
import { RegisterFormValues, ValidationErrors } from './types';

interface RegisterFormProps {
  onRegister: (token: string, refreshToken: string, user: User) => void;
  onSwitchToLogin: () => void;
  apiUrl: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onSwitchToLogin, apiUrl }) => {
  // Form değerleri
  const [formValues, setFormValues] = useState<RegisterFormValues>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  // Form durumları
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Dark mode takibi için
  const isDarkMode = useDarkMode();

  // Form değişikliği işleyicisi
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormValues(prev => ({
      ...prev,
      [name]: value
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
    const validationErrors = validateRegisterForm(formValues);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    setServerError(null);
    
    try {
      const response = await axios.post(`${apiUrl}/auth/register`, {
        username: formValues.username,
        email: formValues.email,
        password: formValues.password
      });
      
      const { token, refreshToken, user } = response.data;
      
      // Ana bileşeni güncelle
      onRegister(token, refreshToken, user);
    } catch (err: any) {
      console.error('Register error:', err);
      setServerError(
        err.response?.data?.error || 
        'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormWrapper colorScheme="indigo">
      <FormTitle 
        title="Kayıt Ol" 
        colorScheme="indigo"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
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
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          id="username"
          name="username"
          label="Kullanıcı Adı"
          value={formValues.username}
          onChange={handleChange}
          placeholder="Kullanıcı adı seçin"
          error={errors.username}
          colorScheme="indigo"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          required
        />
        
        <FormInput
          id="email"
          name="email"
          label="E-posta Adresi"
          type="email"
          value={formValues.email}
          onChange={handleChange}
          placeholder="E-posta adresinizi girin"
          error={errors.email}
          colorScheme="indigo"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
          placeholder="Şifre oluşturun (en az 6 karakter)"
          error={errors.password}
          colorScheme="indigo"
          required
        />
        
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Şifreniz en az 6 karakter olmalıdır</div>
        
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Şifre Tekrarı"
          value={formValues.confirmPassword}
          onChange={handleChange}
          placeholder="Şifrenizi tekrar girin"
          error={errors.confirmPassword}
          colorScheme="indigo"
          required
        />
        
        <div className="flex flex-col space-y-5 pt-4">
          <Button
            type="submit"
            isLoading={loading}
            loadingText="Kayıt Yapılıyor..."
            colorScheme="indigo"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            }
          >
            Hesap Oluştur
          </Button>
          
          <Divider />
          
          <Button
            type="button"
            variant="secondary"
            onClick={onSwitchToLogin}
            colorScheme="indigo"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            }
          >
            Giriş Sayfasına Dön
          </Button>
        </div>
      </form>
    </FormWrapper>
  );
};

export default RegisterForm; 