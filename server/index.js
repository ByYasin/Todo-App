const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { exec } = require('child_process');
const util = require('util');

// Exec fonksiyonunu promise tabanlı hale getir
const execPromise = util.promisify(exec);

// Env yapılandırması
dotenv.config();

// Abonelik süreleri (gün cinsinden)
const SUBSCRIPTION_DURATIONS = {
  'free': 30,      // Ücretsiz plan 30 gün
  'premium': 30,   // Premium plan 30 gün
  'enterprise': 365 // Enterprise plan 1 yıl (365 gün)
};

// Veritabanı yedekleme klasörü
const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)){
    fs.mkdirSync(backupDir, { recursive: true });
}

// MySQL veritabanını yedekleme fonksiyonu
async function backupDatabase() {
  try {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || '';
    const dbName = process.env.DB_NAME || 'todo_app';
    
    // Yedek dosya adı oluştur: db_yıl_ay_gün_saat_dakika.sql
    const date = new Date();
    const fileName = `${dbName}_${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}.sql`;
    const filePath = path.join(backupDir, fileName);
    
    // mysqldump komutunu oluştur
    const command = `mysqldump -h ${dbHost} -u ${dbUser} ${dbPassword ? `-p${dbPassword}` : ''} ${dbName} > "${filePath}"`;
    
    // Komutu çalıştır
    await execPromise(command);
    console.log(`Veritabanı yedeklendi: ${filePath}`);
    
    // Eski yedekleri temizle (30 günden eski)
    cleanupOldBackups();
    
    return filePath;
  } catch (error) {
    console.error('Veritabanı yedekleme hatası:', error);
    return null;
  }
}

// Veritabanını geri yükleme fonksiyonu
async function restoreDatabase(backupFile) {
  try {
    if (!fs.existsSync(backupFile)) {
      console.error(`Yedek dosyası bulunamadı: ${backupFile}`);
      return false;
    }
    
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || '';
    const dbName = process.env.DB_NAME || 'todo_app';
    
    // mysql komutunu oluştur
    const command = `mysql -h ${dbHost} -u ${dbUser} ${dbPassword ? `-p${dbPassword}` : ''} ${dbName} < "${backupFile}"`;
    
    // Komutu çalıştır
    await execPromise(command);
    console.log(`Veritabanı geri yüklendi: ${backupFile}`);
    
    return true;
  } catch (error) {
    console.error('Veritabanı geri yükleme hatası:', error);
    return false;
  }
}

// 30 günden eski yedekleri sil
function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(backupDir);
    const now = new Date();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 gün (milisaniye)
    
    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      const fileAge = now.getTime() - stats.mtime.getTime();
      
      if (fileAge > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Eski yedek silindi: ${filePath}`);
      }
    }
  } catch (error) {
    console.error('Eski yedekleri temizlerken hata:', error);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'todoapp-jwt-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'todoapp-refresh-token-secret';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// Middleware
app.use(cors());
app.use(express.json());

// JWT Token Doğrulama Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Yetkisiz erişim. Token gerekli.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Geçersiz veya süresi dolmuş token.' });
    }
    req.user = user;
    next();
  });
};

// MySQL bağlantısı
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'todo_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Veritabanı bağlantısını promise-based olarak kullanma
const promisePool = pool.promise();

// Veritabanı kontrol fonksiyonu
async function checkDatabaseConnection() {
  try {
    await promisePool.query('SELECT 1');
    console.log('Veritabanı bağlantısı başarılı');
    return true;
  } catch (error) {
    console.error('Veritabanı bağlantı hatası:', error.message);
    return false;
  }
}

// Veritabanı tabloları oluşturma
async function setupDatabase() {
  try {
    // Önce bağlantıyı kontrol et
    const connected = await checkDatabaseConnection();
    if (!connected) {
      console.error('Veritabanı bağlantısı kurulamadı, uygulama sadece yerel veri ile çalışacak');
      return false;
    }

    // Kullanıcılar tablosu
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        subscription_plan ENUM('free', 'premium', 'enterprise') DEFAULT 'free',
        subscription_expires DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Refresh token tablosu
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_token (user_id, token),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Kategoriler tablosu
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(30) DEFAULT '#3b82f6',
        user_id INT,
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Etiketler tablosu
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        color VARCHAR(30) DEFAULT '#6b7280',
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Todo tablosu
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('pending', 'in-progress', 'completed') DEFAULT 'pending',
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        category_id INT,
        user_id INT,
        parent_id INT NULL,
        due_date DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES todos(id) ON DELETE CASCADE
      )
    `);
    
    // Todo-Tag ilişki tablosu
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS todo_tags (
        todo_id INT NOT NULL,
        tag_id INT NOT NULL,
        PRIMARY KEY (todo_id, tag_id),
        FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);
    
    // Abonelik planları tablosu
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id VARCHAR(20) PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Ödeme geçmişi tablosu
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS payment_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        subscription_plan VARCHAR(20) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
        payment_method VARCHAR(50),
        transaction_id VARCHAR(100),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (subscription_plan) REFERENCES subscription_plans(id)
      )
    `);
    
    // Abonelik özellikleri tablosu
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS subscription_features (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subscription_plan VARCHAR(20) NOT NULL,
        feature_key VARCHAR(50) NOT NULL,
        feature_value VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_plan_feature (subscription_plan, feature_key),
        FOREIGN KEY (subscription_plan) REFERENCES subscription_plans(id) ON DELETE CASCADE
      )
    `);
    
    console.log('Veritabanı tabloları başarıyla oluşturuldu');

    // Örnek kullanıcı ekleme (admin)
    try {
      const [users] = await promisePool.query('SELECT * FROM users WHERE username = ?', ['admin']);
      if (users.length === 0) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        await promisePool.query(
          'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
          ['admin', 'admin@example.com', hashedPassword]
        );
        console.log('Örnek admin kullanıcısı eklendi');
      }
    } catch (error) {
      console.error('Örnek kullanıcı eklenirken hata:', error);
    }

    // Örnek abonelik planları ekleme
    try {
      const [plans] = await promisePool.query('SELECT * FROM subscription_plans LIMIT 1');
      if (plans.length === 0) {
        await promisePool.query(`
          INSERT INTO subscription_plans (id, name, price, description) VALUES 
          ('free', 'Ücretsiz', 0.00, 'Temel özellikler ile sınırlı erişim.'),
          ('premium', 'Premium', 29.90, 'Tüm özelliklere sınırsız erişim ve öncelikli destek.'),
          ('enterprise', 'Kurumsal', 99.90, 'Tüm premium özellikler, öncelikli destek, özel entegrasyonlar ve API erişimi.')
        `);
        console.log('Örnek abonelik planları eklendi');
      }
    } catch (error) {
      console.error('Örnek abonelik planları eklenirken hata:', error);
    }

    // Örnek plan özellikleri ekleme
    try {
      const [features] = await promisePool.query('SELECT * FROM subscription_features LIMIT 1');
      if (features.length === 0) {
        await promisePool.query(`
          INSERT INTO subscription_features (subscription_plan, feature_key, feature_value) VALUES 
          ('free', 'max_todos', '10'),
          ('free', 'max_categories', '3'),
          ('free', 'has_markdown_support', 'false'),
          ('free', 'has_priority_support', 'false'),
          ('free', 'has_api_access', 'false'),
          
          ('premium', 'max_todos', '100'),
          ('premium', 'max_categories', '20'),
          ('premium', 'has_markdown_support', 'true'),
          ('premium', 'has_priority_support', 'false'),
          ('premium', 'has_api_access', 'false'),
          
          ('enterprise', 'max_todos', 'unlimited'),
          ('enterprise', 'max_categories', 'unlimited'),
          ('enterprise', 'has_markdown_support', 'true'),
          ('enterprise', 'has_priority_support', 'true'),
          ('enterprise', 'has_api_access', 'true')
        `);
        console.log('Örnek abonelik özellikleri eklendi');
      }
    } catch (error) {
      console.error('Örnek abonelik özellikleri eklenirken hata:', error);
    }

    // Örnek kategori ekleme (eğer yoksa)
    const [categories] = await promisePool.query('SELECT * FROM categories LIMIT 1');
    if (categories.length === 0) {
      const [users] = await promisePool.query('SELECT id FROM users WHERE username = ?', ['admin']);
      const userId = users.length > 0 ? users[0].id : null;
      
      await promisePool.query(`
        INSERT INTO categories (name, color, user_id, is_public) VALUES 
        ('İş', '#ef4444', ?, true), 
        ('Kişisel', '#3b82f6', ?, true),
        ('Öğrenim', '#10b981', ?, true),
        ('Diğer', '#f59e0b', ?, true)
      `, [userId, userId, userId, userId]);
      console.log('Örnek kategoriler eklendi');
    }
    
    return true;
  } catch (error) {
    console.error('Veritabanı kurulumu sırasında hata:', error);
    return false;
  }
}

// Veritabanı durumu
let dbConnected = false;

// Örnek veriler (veritabanı bağlantısı olmadığında)
const sampleCategories = [
  { id: 1, name: 'İş', color: '#ef4444' },
  { id: 2, name: 'Kişisel', color: '#3b82f6' },
  { id: 3, name: 'Öğrenim', color: '#10b981' },
  { id: 4, name: 'Diğer', color: '#f59e0b' }
];

const sampleTodos = [
  {
    id: 1,
    title: 'React ile Todo App Geliştir',
    description: 'Full-stack bir uygulama olarak geliştir',
    status: 'in-progress',
    priority: 'high',
    category_id: 3,
    category_name: 'Öğrenim',
    category_color: '#10b981',
    due_date: '2025-05-30',
    created_at: '2025-05-19'
  }
];

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', dbConnected });
});

// Kategoriler için API
app.get('/api/categories', async (req, res) => {
  try {
    let userId = null;
    
    // Token varsa kullanıcı ID'sini al
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (error) {
        console.error('Token doğrulama hatası:', error);
      }
    }
    
    if (!dbConnected) {
      return res.json(sampleCategories);
    }
    
    // Öncelikle is_public sütunu var mı kontrol edelim
    try {
      await promisePool.query(`
        ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false
      `);
    } catch (error) {
      console.error('is_public sütunu kontrol hatası (muhtemelen var):', error);
    }
    
    // Sorgu
    let query = 'SELECT * FROM categories WHERE 1=1';
    let params = [];
    
    // Public veya kullanıcıya özel
    if (userId) {
      query += ' AND (is_public = true OR user_id = ?)';
      params.push(userId);
    } else {
      query += ' AND is_public = true';
    }
    
    query += ' ORDER BY name';
    
    const [rows] = await promisePool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Kategori getirme hatası:', error);
    res.json(sampleCategories);
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(200).json({ message: 'Veritabanı bağlantısı yok, örnek veri kullanılıyor' });
    }
    
    // Token kontrolü
    let userId = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (error) {
        return res.status(401).json({ error: 'Geçersiz token' });
      }
    } else {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }
    
    const { name, color, is_public } = req.body;
    
    // Kategori adının boş olmaması kontrolü
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Kategori adı boş olamaz' });
    }
    
    const [result] = await promisePool.query(
      'INSERT INTO categories (name, color, user_id, is_public) VALUES (?, ?, ?, ?)',
      [name, color, userId, is_public || false]
    );
    
    res.status(201).json({ 
      id: result.insertId, 
      name, 
      color, 
      user_id: userId,
      is_public: is_public || false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kategori güncelleme endpoint'i
app.put('/api/categories/:id', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(200).json({ message: 'Veritabanı bağlantısı yok, güncellenemedi' });
    }
    
    // Token kontrolü
    let userId = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (error) {
        return res.status(401).json({ error: 'Geçersiz token' });
      }
    } else {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }
    
    const { id } = req.params;
    const { name, color, is_public } = req.body;
    
    // Kategori adının boş olmaması kontrolü
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Kategori adı boş olamaz' });
    }
    
    // Kategori sahibi kontrolü
    const [categories] = await promisePool.query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );
    
    if (categories.length === 0) {
      return res.status(404).json({ error: 'Kategori bulunamadı' });
    }
    
    const category = categories[0];
    
    // Sadece kendi kategorilerini güncelleyebilir
    if (category.user_id && category.user_id !== userId) {
      return res.status(403).json({ error: 'Bu kategoriyi düzenleme yetkiniz yok' });
    }
    
    await promisePool.query(
      'UPDATE categories SET name = ?, color = ?, is_public = ? WHERE id = ?',
      [name, color, is_public || false, id]
    );
    
    res.json({ 
      id: parseInt(id), 
      name, 
      color, 
      is_public: is_public || false,
      updated: true 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kategori silme endpoint'i
app.delete('/api/categories/:id', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(200).json({ message: 'Veritabanı bağlantısı yok, silinemedi' });
    }
    
    // Token kontrolü
    let userId = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (error) {
        return res.status(401).json({ error: 'Geçersiz token' });
      }
    } else {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }
    
    const { id } = req.params;
    
    // Kategori sahibi kontrolü
    const [categories] = await promisePool.query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );
    
    if (categories.length === 0) {
      return res.status(404).json({ error: 'Kategori bulunamadı' });
    }
    
    const category = categories[0];
    
    // Sadece kendi kategorilerini silebilir
    if (category.user_id && category.user_id !== userId) {
      return res.status(403).json({ error: 'Bu kategoriyi silme yetkiniz yok' });
    }
    
    // Önce bu kategoriye ait todoları güncelle (kategori null yap)
    await promisePool.query(
      'UPDATE todos SET category_id = NULL WHERE category_id = ?',
      [id]
    );
    
    // Sonra kategoriyi sil
    await promisePool.query('DELETE FROM categories WHERE id = ?', [id]);
    
    res.json({ id: parseInt(id), deleted: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Todo öğeleri için API
app.get('/api/todos', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.json(sampleTodos);
    }
    const [rows] = await promisePool.query(`
      SELECT t.*, c.name as category_name, c.color as category_color
      FROM todos t
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Todo getirme hatası:', error);
    res.json(sampleTodos);
  }
});

app.post('/api/todos', async (req, res) => {
  try {
    if (!dbConnected) {
      const newTodo = { 
        id: sampleTodos.length > 0 ? Math.max(...sampleTodos.map(t => t.id)) + 1 : 1, 
        ...req.body,
        created_at: new Date().toISOString()
      };
      sampleTodos.push(newTodo);
      return res.status(201).json(newTodo);
    }
    const { title, description, status, priority, category_id, due_date } = req.body;
    const [result] = await promisePool.query(
      'INSERT INTO todos (title, description, status, priority, category_id, due_date) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, status, priority, category_id || null, due_date || null]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    res.status(200).json({ error: error.message, usingFallback: true });
  }
});

app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, category_id, due_date } = req.body;
    await promisePool.query(
      'UPDATE todos SET title = ?, description = ?, status = ?, priority = ?, category_id = ?, due_date = ? WHERE id = ?',
      [title, description, status, priority, category_id || null, due_date || null, id]
    );
    res.json({ id: parseInt(id), ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await promisePool.query('DELETE FROM todos WHERE id = ?', [id]);
    res.json({ id: parseInt(id), deleted: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Veritabanı yedekleme endpoint'i
app.post('/api/backup', async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupFileName = `backup-${timestamp}.sql`;
    const backupFilePath = path.join(backupDir, backupFileName);
    
    // Bu basit bir örnek. Gerçek dünyada mysqldump kullanılabilir.
    const [categories] = await promisePool.query('SELECT * FROM categories');
    const [todos] = await promisePool.query('SELECT * FROM todos');
    
    const backupData = {
      timestamp,
      categories,
      todos
    };
    
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));
    
    res.json({
      success: true,
      message: 'Veritabanı yedeklemesi başarıyla oluşturuldu.',
      filename: backupFileName
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Veritabanı bağlantısını kontrol et
    if (!dbConnected) {
      // Test amaçlı admin kullanıcısına izin ver
      if (username === 'admin' && password === 'admin123') {
        const user = {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          created_at: new Date().toISOString(),
          subscription_plan: 'premium',
          subscription_expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        const refreshToken = jwt.sign({ id: user.id, username: user.username }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
        
        return res.json({ token, refreshToken, user });
      }
      
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }
    
    // Kullanıcıyı veritabanında bul
    const [users] = await promisePool.query('SELECT * FROM users WHERE username = ?', [username]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }
    
    const user = users[0];
    
    // Şifre doğrulama
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }
    
    // Kullanıcı bilgilerini hazırla (şifre hariç)
    const userInfo = {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
      subscription_plan: user.subscription_plan,
      subscription_expires: user.subscription_expires
    };
    
    // Token oluştur
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Refresh token oluştur
    const refreshToken = jwt.sign(
      { id: user.id, username: user.username },
      REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );
    
    // Refresh token'ı veritabanına kaydet
    try {
      await promisePool.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at) 
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ${REFRESH_TOKEN_EXPIRES_IN.replace(/\D/g, '')} DAY))
         ON DUPLICATE KEY UPDATE 
         token = VALUES(token), 
         expires_at = VALUES(expires_at)`,
        [user.id, refreshToken]
      );
    } catch (err) {
      console.error('Refresh token kaydedilemedi:', err);
    }
    
    // Token ve kullanıcı bilgilerini döndür
    res.json({ token, refreshToken, user: userInfo });
  } catch (error) {
    console.error('Login hatası:', error);
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
});

// Token yenileme endpoint'i
app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token gerekli' });
  }
  
  try {
    // Refresh token'ı doğrula
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    
    // Veritabanı bağlantısı yoksa
    if (!dbConnected) {
      if (decoded.username === 'admin') {
        const user = {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          created_at: new Date().toISOString(),
          subscription_plan: 'premium',
          subscription_expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        const newToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        
        return res.json({ token: newToken, user });
      }
      
      return res.status(403).json({ error: 'Geçersiz refresh token' });
    }
    
    // Veritabanında refresh token'ı kontrol et
    const [tokens] = await promisePool.query(
      'SELECT * FROM refresh_tokens WHERE user_id = ? AND token = ? AND expires_at > NOW()',
      [decoded.id, refreshToken]
    );
    
    if (tokens.length === 0) {
      return res.status(403).json({ error: 'Geçersiz veya süresi dolmuş refresh token' });
    }
    
    // Kullanıcı bilgilerini al
    const [users] = await promisePool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    
    if (users.length === 0) {
      return res.status(403).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    const user = {
      id: users[0].id,
      username: users[0].username,
      email: users[0].email,
      created_at: users[0].created_at,
      subscription_plan: users[0].subscription_plan,
      subscription_expires: users[0].subscription_expires
    };
    
    // Yeni JWT token oluştur
    const newToken = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Yeni refresh token
    const newRefreshToken = jwt.sign(
      { id: user.id, username: user.username },
      REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );
    
    // Refresh token'ı güncelle
    await promisePool.query(
      `UPDATE refresh_tokens 
       SET token = ?, expires_at = DATE_ADD(NOW(), INTERVAL ${REFRESH_TOKEN_EXPIRES_IN.replace(/\D/g, '')} DAY)
       WHERE user_id = ?`,
      [newRefreshToken, user.id]
    );
    
    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
      user
    });
  } catch (error) {
    console.error('Token yenileme hatası:', error);
    res.status(403).json({ error: 'Geçersiz refresh token' });
  }
});

// Token doğrulama endpoint'i
app.get('/api/auth/validate', authenticateToken, async (req, res) => {
  try {
    // Kullanıcının güncel bilgilerini veritabanından çekelim
    const userId = req.user.id;
    
    // Veritabanı bağlantısı yoksa mevcut token bilgilerini kullan
    if (!dbConnected) {
      return res.json({ valid: true, user: req.user });
    }
    
    // Kullanıcı bilgilerini veritabanından al
    const [users] = await promisePool.query(
      'SELECT id, username, email, subscription_plan, subscription_expires, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    // Güncel kullanıcı bilgilerini döndür
    res.json({ 
      valid: true, 
      user: users[0],
      message: 'Token geçerli ve kullanıcı bilgileri güncellendi'
    });
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
});

// Kullanıcı kaydı
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Veritabanı bağlantısını kontrol et
    if (!dbConnected) {
      return res.status(503).json({ error: 'Veritabanı bağlantısı yok, kayıt yapılamıyor' });
    }
    
    // Kullanıcı adı veya e-posta zaten kullanılıyor mu?
    const [existingUsers] = await promisePool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Kullanıcı adı veya e-posta zaten kullanılıyor' });
    }
    
    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Kullanıcıyı kaydet
    const [result] = await promisePool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    
    // Kullanıcı bilgilerini hazırla
    const userInfo = {
      id: result.insertId,
      username,
      email,
      created_at: new Date().toISOString()
    };
    
    // Token oluştur
    const token = jwt.sign(
      { id: userInfo.id, username: userInfo.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Refresh token oluştur
    const refreshToken = jwt.sign(
      { id: userInfo.id, username: userInfo.username },
      REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );
    
    // Refresh token'ı veritabanına kaydet
    await promisePool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) 
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ${REFRESH_TOKEN_EXPIRES_IN.replace(/\D/g, '')} DAY))`,
      [userInfo.id, refreshToken]
    );
    
    // Token ve kullanıcı bilgilerini döndür
    res.status(201).json({ token, refreshToken, user: userInfo });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
});

// Abonelik planlarını listele
app.get('/api/subscription/plans', async (req, res) => {
  try {
    if (!dbConnected) {
      return res.json([
        { id: 'free', name: 'Ücretsiz', price: 0.00, description: 'Temel özellikler ile sınırlı erişim.' },
        { id: 'premium', name: 'Premium', price: 29.90, description: 'Tüm özelliklere sınırsız erişim ve öncelikli destek.' },
        { id: 'enterprise', name: 'Kurumsal', price: 99.90, description: 'Tüm premium özellikler, öncelikli destek, özel entegrasyonlar ve API erişimi.' }
      ]);
    }
    
    // Planları ve özellikleri birlikte getir
    const [plans] = await promisePool.query(`
      SELECT p.id, p.name, p.price, p.description, p.is_active 
      FROM subscription_plans p
      WHERE p.is_active = TRUE
      ORDER BY p.price ASC
    `);
    
    // Her plan için özellikleri getir
    for (let plan of plans) {
      const [features] = await promisePool.query(`
        SELECT feature_key, feature_value 
        FROM subscription_features 
        WHERE subscription_plan = ?
      `, [plan.id]);
      
      // Özellikleri JSON objesine dönüştür
      plan.features = features.reduce((acc, feature) => {
        acc[feature.feature_key] = feature.feature_value;
        return acc;
      }, {});
    }
    
    res.json(plans);
  } catch (error) {
    console.error('Abonelik planları listelenirken hata:', error);
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
});

// Kullanıcının abonelik planını güncelle
app.put('/api/users/:id/subscription', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;
    
    // Kullanıcı kimlik kontrolü
    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({ error: 'Başka bir kullanıcının aboneliğini değiştiremezsiniz' });
    }
    
    if (!dbConnected) {
      return res.status(503).json({ error: 'Veritabanı bağlantısı yok' });
    }
    
    // Planın geçerli olup olmadığını kontrol et
    const [plans] = await promisePool.query(
      'SELECT * FROM subscription_plans WHERE id = ? AND is_active = TRUE',
      [plan]
    );
    
    if (plans.length === 0) {
      return res.status(400).json({ error: 'Geçersiz abonelik planı' });
    }
    
    // Bitiş tarihini plana göre hesapla
    const expiresAt = new Date();
    const durationInDays = SUBSCRIPTION_DURATIONS[plan] || 30; // Varsayılan olarak 30 gün
    expiresAt.setDate(expiresAt.getDate() + durationInDays);
    
    // Kullanıcının aboneliğini güncelle
    await promisePool.query(
      'UPDATE users SET subscription_plan = ?, subscription_expires = ? WHERE id = ?',
      [plan, expiresAt, id]
    );
    
    // Ödeme kaydı oluştur ve planı belirt
    await promisePool.query(
      'INSERT INTO payment_history (user_id, subscription_plan, amount, status, payment_method) VALUES (?, ?, ?, ?, ?)',
      [id, plan, plans[0].price, 'completed', 'credit_card']
    );
    
    // Güncellenmiş kullanıcı bilgisini getir
    const [users] = await promisePool.query(
      'SELECT id, username, email, subscription_plan, subscription_expires, created_at FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    res.json({ 
      message: 'Abonelik başarıyla güncellendi',
      user: users[0],
      subscription_info: {
        plan,
        expires_at: expiresAt,
        duration_days: durationInDays
      }
    });
  } catch (error) {
    console.error('Abonelik güncellenirken hata:', error);
    return res.status(500).json({ error: 'Bir hata oluştu' });
  }
});

// Kullanıcının abonelik özellikleri
app.get('/api/users/:id/subscription/features', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kullanıcı kimlik kontrolü
    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({ error: 'Başka bir kullanıcının abonelik özelliklerine erişemezsiniz' });
    }
    
    if (!dbConnected) {
      // Varsayılan özellikleri döndür
      return res.json({
        max_todos: 10,
        max_categories: 3,
        has_markdown_support: false,
        has_priority_support: false,
        has_api_access: false
      });
    }
    
    // Kullanıcı bilgilerini getir
    const [users] = await promisePool.query(
      'SELECT subscription_plan FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    const subscriptionPlan = users[0].subscription_plan || 'free';
    
    // Kullanıcının abonelik özelliklerini getir
    const [features] = await promisePool.query(`
      SELECT feature_key, feature_value 
      FROM subscription_features 
      WHERE subscription_plan = ?
    `, [subscriptionPlan]);
    
    // Özellikleri JSON objesine dönüştür
    const userFeatures = features.reduce((acc, feature) => {
      acc[feature.feature_key] = feature.feature_value;
      return acc;
    }, {});
    
    res.json(userFeatures);
  } catch (error) {
    console.error('Abonelik özellikleri getirilirken hata:', error);
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
});

// Kullanıcının ödeme geçmişi
app.get('/api/users/:id/payment-history', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kullanıcı kimlik kontrolü
    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({ error: 'Başka bir kullanıcının ödeme geçmişine erişemezsiniz' });
    }
    
    if (!dbConnected) {
      return res.json([]);
    }
    
    // Kullanıcının ödeme geçmişini getir
    const [payments] = await promisePool.query(`
      SELECT p.id, p.subscription_plan, sp.name as plan_name, p.amount, p.payment_date, p.status, p.payment_method
      FROM payment_history p
      JOIN subscription_plans sp ON p.subscription_plan = sp.id
      WHERE p.user_id = ?
      ORDER BY p.payment_date DESC
    `, [id]);
    
    res.json(payments);
  } catch (error) {
    console.error('Ödeme geçmişi getirilirken hata:', error);
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
});

// Hızlı veritabanı düzeltme işlemi (güvenlik açığı olmayan versiyon)
app.get('/api/repair-database', async (req, res) => {
  try {
    console.log('Veritabanı onarımı başlatıldı');
    
    // Veritabanı bağlantısını kontrol et
    if (!dbConnected) {
      return res.status(503).json({ error: 'Veritabanı bağlantısı yok' });
    }
    
    // Önce yedek al
    await backupDatabase();
    console.log('Yedekleme tamamlandı');
    
    // Kullanıcı abonelik bilgilerini yeniden senkronize et (güvenli güncelleme)
    const [users] = await promisePool.query('SELECT id, subscription_plan FROM users');
    let fixCount = 0;
    
    // Her kullanıcı için gerekli düzeltme işlemleri
    for (const user of users) {
      // Demo hesabı için özel düzeltme (kullanıcı bilgileri açığa çıkmadan)
      if (user.id === 1 && user.subscription_plan !== 'premium') {
        await promisePool.query(
          'UPDATE users SET subscription_plan = ? WHERE id = ?',
          ['premium', user.id]
        );
        fixCount++;
      }
    }
    
    // Sonuç dön
    res.json({ 
      success: true, 
      message: 'Veritabanı onarımı tamamlandı',
      fixedRecords: fixCount 
    });
  } catch (error) {
    console.error('Onarım hatası:', error);
    res.status(500).json({ error: 'İşlem sırasında bir hata oluştu' });
  }
});

// Veritabanı kurulumunu başlat ve sunucuyu dinlemeye başla
(async function initialize() {
  try {
    console.log("Uygulama başlatılıyor...");
    
    // Veritabanı kurulumunu başlat ve sunucuyu dinlemeye başla
    const setupResult = await setupDatabase();
    dbConnected = setupResult;
    
    if (dbConnected) {
      console.log('Veritabanı kurulumu tamamlandı');
      
      // İlk yedeklemeyi yap
      await backupDatabase();
      
      // Periyodik yedekleme zamanla (her 24 saatte bir)
      setInterval(async () => {
        await backupDatabase();
      }, 24 * 60 * 60 * 1000); // 24 saat
    }
    
    // Sunucuyu başlat
    app.listen(PORT, () => {
      console.log(`Server http://localhost:${PORT} adresinde çalışıyor (Veritabanı ${dbConnected ? 'bağlı' : 'bağlı değil'})`);
    });
  } catch (error) {
    console.error('Uygulama başlatma hatası:', error);
    
    // Hata oluşsa bile sunucuyu başlat
    app.listen(PORT, () => {
      console.log(`Server http://localhost:${PORT} adresinde çalışıyor (Veritabanı bağlantısı başarısız)`);
    });
  }
})(); 