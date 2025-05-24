import { LoginFormValues, RegisterFormValues, ValidationErrors } from '../types';

/**
 * Giriş formu doğrulama
 * @param values Form değerleri
 * @returns ValidationErrors Doğrulama hataları
 */
export function validateLoginForm(values: LoginFormValues): ValidationErrors {
  const errors: ValidationErrors = {};
  
  if (!values.username) {
    errors.username = 'Kullanıcı adı gereklidir';
  }
  
  if (!values.password) {
    errors.password = 'Şifre gereklidir';
  }
  
  return errors;
}

/**
 * Kayıt formu doğrulama
 * @param values Form değerleri
 * @returns ValidationErrors Doğrulama hataları
 */
export function validateRegisterForm(values: RegisterFormValues): ValidationErrors {
  const errors: ValidationErrors = {};
  
  // Kullanıcı adı doğrulama
  if (!values.username) {
    errors.username = 'Kullanıcı adı gereklidir';
  } else if (values.username.length < 3) {
    errors.username = 'Kullanıcı adı en az 3 karakter olmalıdır';
  }
  
  // Email doğrulama
  if (!values.email) {
    errors.email = 'E-posta adresi gereklidir';
  } else {
    // Basit email doğrulama
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(values.email)) {
      errors.email = 'Geçerli bir email adresi girin';
    }
  }
  
  // Şifre doğrulama
  if (!values.password) {
    errors.password = 'Şifre gereklidir';
  } else if (values.password.length < 6) {
    errors.password = 'Şifre en az 6 karakter olmalıdır';
  }
  
  // Şifre tekrarı doğrulama
  if (!values.confirmPassword) {
    errors.confirmPassword = 'Şifre tekrarı gereklidir';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Şifreler eşleşmiyor';
  }
  
  return errors;
} 