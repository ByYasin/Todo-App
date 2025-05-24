# Todo Uygulaması

Modern, kullanıcı dostu ve çok yönlü bir görev yönetim uygulaması. Geliştirmesine vakit buldukca devam edilecektir. Bilmeniz gereken ödeme kısmında gerçek entegrasyon kodları buraya eklenmedi ödeme kısmı bu projede simule edilmektedir.

Geliştirici: [Yasin Kınalı](https://www.linkedin.com/in/yasin-k%C4%B1nal%C4%B1-9671b0255/)


## Özellikler

### Görev Yönetimi
- ✅ Görevleri kategorilere göre düzenleme ve filtreleme
- ✅ Görevlere öncelik seviyesi atama (Düşük, Orta, Yüksek)
- ✅ Son tarih belirleme ve tarih yaklaştıkça uyarı sistemi
- ✅ Görevleri sürükle-bırak ile durumlar arasında taşıma (Bekleyen, Devam Eden, Tamamlandı)
- ✅ Alt görevler oluşturma ve yönetme
- ✅ Görevleri başlık, açıklama veya tarihe göre sıralama
- ✅ Detaylı arama ve filtreleme seçenekleri
- ✅ Sürükle-bırak ile durum değişikliklerinin hem veritabanına hem de yerel depolamaya kaydedilmesi
- ✅ Sürükleme sırasında geliştirilmiş görsel ipuçları ve animasyonlar
- ✅ Emoji desteği ile görevlere emoji ekleyebilme (Premium özellik)

### Kategori Yönetimi
- ✅ Kişisel kategoriler oluşturma ve özelleştirme
- ✅ Kategorilere renk atama
- ✅ Kategorileri paylaşma veya özel tutma seçeneği
- ✅ Kategorilere göre görevleri filtreleme

### Kullanıcı Deneyimi
- ✅ Açık/koyu tema desteği
- ✅ Tamamen mobil uyumlu duyarlı tasarım
- ✅ Sürükle-bırak görev yönetimi
- ✅ Görev durumlarını görsel olarak takip etme
- ✅ Kullanıcı doğrulama ve yetkilendirme sistemi
- ✅ Gerçek zamanlı istatistikler ve görev dağılımları
- ✅ Göz yorgunluğunu azaltan daha açık dark tema renkleri
- ✅ Durum değişiklikleri için kullanıcı bildirim sistemi
- ✅ Boş durum mesajlarının daha açıklayıcı ve kullanıcı dostu tasarımı
- ✅ Gelişmiş karşılama sayfası ve mobil uyumlu giriş ekranı

### Veri Yönetimi
- ✅ MySQL veritabanı ile veri saklama
- ✅ Kullanıcıya özel veri erişimi
- ✅ Offline çalışma modu (API bağlantısı olmadığında)
- ✅ Otomatik veri yedekleme
- ✅ Geliştirilmiş çevrimdışı modu: Internet bağlantısı yokken değişiklikleri LocalStorage'da saklama
- ✅ Otomatik veri senkronizasyonu: Bağlantı sağlandığında veritabanı ile otomatik senkronize etme
- ✅ Bekleyen değişikliklerin arayüzde sayaç ile gösterimi
- ✅ API hatası durumunda veri kaybını önleyen akıllı kurtarma mekanizmaları
- ✅ Otomatik yerel yedekleme ve geri yükleme sistemi

### Abonelik Sistemi
- ✅ Üç farklı abonelik planı: Ücretsiz (Kayıt olunca varsayılan olarak aktiftir.), Premium (125 TL/ay) ve Enterprise (325 TL/ay)
- ✅ Premium özelliklere erişim kontrolü (Emoji desteği, Markdown formatı)
- ✅ Kullanıcı bazlı özellik limitleri (görev sayısı, kategori sayısı)
- ✅ Abonelik yönetimi ve ödeme sistemi entegrasyonu
- ✅ Abonelik yükseltme/düşürme işlemleri
- ✅ Modern ve etkileşimli plan kartları
- ✅ Premium/enterprise özellikler için açıklayıcı upgrade modalları
- ✅ Abone durumunun veritabanı ve yerel depolamada senkronizasyonu
- ✅ **YENİ!** Gelişmiş abonelik geçmişi görüntüleme sistemi
- ✅ **YENİ!** Abonelik geçmişinde arama ve filtreleme özellikleri (tümü, aktif, geçmiş)

## Teknolojiler

### Frontend
- **React 18** - Modern kullanıcı arayüzü geliştirme
- **TypeScript** - Tip güvenliği ve geliştirme deneyimi
- **TailwindCSS** - Responsive ve özelleştirilebilir tasarım
- **Vite** - Hızlı geliştirme ve derleme
- **Axios** - API istekleri için HTTP istemcisi
- **react-beautiful-dnd** - Sürükle-bırak görev yönetimi
- **YENİ! @emoji-mart/react** - Emoji picker entegrasyonu

### Backend
- **Node.js** - Sunucu tarafı JavaScript çalışma ortamı
- **Express.js** - Web uygulaması çerçevesi
- **JWT** - Kullanıcı kimlik doğrulama
- **Bcrypt** - Güvenli şifre hashleme
- **CORS** - Cross-Origin Resource Sharing

### Veritabanı
- **MySQL** - İlişkisel veritabanı yönetim sistemi
- **mysql2** - MySQL için Promise tabanlı Node.js sürücüsü

## Kurulum

### Gereksinimleri Yükleme

```bash
# Projeyi klonlayın
# Bağımlılıkları yükleyin
npm install
```

### Veritabanı Ayarları

1. MySQL veritabanı oluşturun:
```sql
CREATE DATABASE todo_app;
```

2. `.env` dosyası oluşturun:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=şifreniz
DB_NAME=todo_app
PORT=5000
JWT_SECRET=gizli_anahtar
JWT_EXPIRES_IN=24h
```

## Projeyi Çalıştırma

### Backend Sunucusunu Başlatma

```bash
cd server
node index.js
```

Başarılı bir başlatma sonrası şu mesajı görmelisiniz:
```
Veritabanı bağlantısı başarılı
Veritabanı tabloları başarıyla oluşturuldu
Server http://localhost:5000 adresinde çalışıyor (Veritabanı bağlı)
```

### Frontend Uygulamasını Başlatma

```bash
# Yeni bir terminal penceresi açın
npm run dev
```

Uygulama varsayılan olarak `http://localhost:5173` adresinde çalışacaktır.

## Veritabanı Yapısı

Uygulama aşağıdaki veritabanı tablolarını kullanır:

1. **users** - Kullanıcı bilgileri
   - id, username, email, password, created_at
   - subscription_plan - Kullanıcının abonelik planı (free, premium, enterprise)
   - subscription_expires - Abonelik bitiş tarihi

2. **categories** - Görev kategorileri
   - id, name, color, user_id, is_public, created_at

3. **todos** - Görev bilgileri
   - id, title, description, status, priority, category_id, user_id, parent_id, due_date, created_at, updated_at
   - **YENİ!** emoji_ids - Göreve eklenen emojilerin ID'leri (premium özellik)

4. **tags** - Etiket bilgileri
   - id, name, color, user_id, created_at

5. **todo_tags** - Görev-etiket ilişkileri
   - todo_id, tag_id

6. **refresh_tokens** - Kullanıcı yenileme tokenları
   - id, user_id, token, expires_at, created_at
   - Otomatik oturum yenileme ve "Beni hatırla" özelliği için kullanılır

7. **YENİ! pending_changes** - Çevrimdışı yapılan değişikliklerin takibi
   - id, entity_type, change_type, data, timestamp, status, retry_count, error_message
   - Çevrimdışı yapılan değişikliklerin kaydedilmesi ve senkronize edilmesi için kullanılır

8. **YENİ! backups** - Yerel yedekleme noktaları
   - id, data, timestamp, version
   - Otomatik yerel yedekleme ve geri yükleme işlevleri için kullanılır

9. **YENİ! payment_history** - Abonelik ödeme geçmişi tablosu
   - id, user_id, subscription_plan, amount, payment_date, status, payment_method
   - Kullanıcı ödeme geçmişini takip etmek için kullanılır

## Premium Özellikler

Uygulamanın premium abonelik planına sahip kullanıcılar için sunduğu özel özellikler:

1. **Emoji Desteği** - Görevlere emoji ekleyebilme ve arama
2. **Markdown Formatı** - Görev açıklamalarında zengin metin formatı kullanabilme
3. **Gelişmiş İstatistikler** - Detaylı performans ve görev tamamlama analizleri
4. **Arttırılmış Limitler**:
   - Free: 5 görev, 5 kategori
   - Premium: 25 görev, 10 kategori
   - Enterprise: Sınırsız görev ve kategori
5. **Çevrimdışı senkronizasyon önceliği** - İnternet bağlantısı sağlandığında premium kullanıcıların verileri öncelikli olarak senkronize edilir
6. **Gelişmiş veri yedekleme** - Otomatik yedekleme ve geri yükleme özellikleri
7. **YENİ! Detaylı abonelik geçmişi** - Geçmiş ödemeleri ve abonelik yenilemelerini görüntüleme ve arama

## Sorun Giderme

### Backend API Bağlantı Sorunları

Uygulama, backend API'sine bağlanamadığı durumlarda varsayılan verilerle çalışabilir. API bağlantısı olmadığında:

1. API sunucusunun çalışıp çalışmadığını kontrol edin: `cd server && node index.js`
2. MySQL veritabanının çalışır durumda olduğundan emin olun
3. `.env` dosyasındaki veritabanı bilgilerinin doğru olduğunu kontrol edin
4. API hala çalışmazsa, frontend uygulaması yerel depolama ile çalışacak, ancak veriler sunucuya kaydedilemeyecektir

### Kategori Ekleme Sorunu

Kategori eklerken sorun yaşıyorsanız:
1. Kullanıcı kimliğinin (user_id) doğru şekilde gönderildiğinden emin olun
2. Giriş yapmış olduğunuzdan ve token'ın geçerli olduğundan emin olun
3. Sunucu konsolunda hata mesajlarını kontrol edin

## Son Değişiklikler

### YENİ! Abonelik Geçmişi Sayfası (24.05.2025)
- ✅ Tamamen yeni bir kart tabanlı abonelik geçmişi görünümü
- ✅ Geçmiş ödemeleri filtreleme ve arama özellikleri
- ✅ Aktif ve geçmiş abonelikleri ayrı sekmelerde görüntüleme
- ✅ Tüm ekran boyutlarında uyumlu responsive tasarım
- ✅ Gelişmiş görsel ipuçları ve plan bazlı renkli ikonlar

## Katkıda Bulunma

1. Bu depoyu forklayın ve yıldızlayın.
2. Özellik dalınızı oluşturun (`git checkout -b yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik: Açıklama'`)
4. Dalınızı ana depoya itelemek için bir Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
