// ===== SECURITY.JS — Центральная система безопасности Cliply =====
// Версия: 1.0.0
// Закрывает задачи: 14, 15, 16, 19, 27, 28, 30, 31

(function() {
  'use strict';

  const SecurityUtils = {
    
    // ===== 1. САНТИЗАЦИЯ HTML (защита от XSS — задача 14) =====
    sanitizeHTML: function(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    },

    sanitizeHTMLFull: function(str) {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\//g, '&#x2F;');
    },

    // ===== 2. ВАЛИДАЦИЯ EMAIL (задача 21) =====
    isValidEmail: function(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email) && email.length <= 255;
    },

    isDisposableEmail: function(email) {
      const disposableDomains = [
        'temp-mail.org', 'guerrillamail.com', 'mailinator.com',
        'throwaway.email', 'tempmail.com', 'fakeinbox.com',
        'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com',
        'maildrop.cc', 'dispostable.com', 'tempail.com'
      ];
      const domain = email.split('@')[1]?.toLowerCase();
      return disposableDomains.includes(domain);
    },

    // ===== 3. ВАЛИДАЦИЯ ПАРОЛЯ (задача 20) =====
    isStrongPassword: function(password) {
      if (password.length < 8) return { valid: false, reason: 'Минимум 8 символов' };
      if (password.length > 128) return { valid: false, reason: 'Максимум 128 символов' };
      if (!/[A-Z]/.test(password)) return { valid: false, reason: 'Нужна заглавная буква' };
      if (!/[a-z]/.test(password)) return { valid: false, reason: 'Нужна строчная буква' };
      if (!/[0-9]/.test(password)) return { valid: false, reason: 'Нужна цифра' };
      
      const commonPasswords = [
        'password', '12345678', 'qwerty123', 'admin123', 
        'password1', '123456789', 'qwertyuiop', 'letmein',
        'welcome', 'monkey', 'dragon', 'master'
      ];
      if (commonPasswords.includes(password.toLowerCase())) {
        return { valid: false, reason: 'Слишком простой пароль' };
      }
      
      return { valid: true };
    },

    // ===== 4. ВАЛИДАЦИЯ СТРОК (задача 31) =====
    sanitizeString: function(str, maxLength = 500) {
      if (!str) return '';
      return str.trim().substring(0, maxLength);
    },

    validateProductName: function(name) {
      if (!name || name.trim().length === 0) return { valid: false, reason: 'Название обязательно' };
      if (name.length > 200) return { valid: false, reason: 'Максимум 200 символов' };
      if (/<script|<iframe|<object|javascript:|onerror|onload/i.test(name)) {
        return { valid: false, reason: 'Недопустимые символы' };
      }
      return { valid: true, value: this.sanitizeHTML(name.trim()) };
    },

    validateDescription: function(desc) {
      if (!desc) return { valid: true, value: '' };
      if (desc.length > 2000) return { valid: false, reason: 'Максимум 2000 символов' };
      if (/<script|<iframe|javascript:|onerror|onload/i.test(desc)) {
        return { valid: false, reason: 'Недопустимый контент' };
      }
      return { valid: true, value: this.sanitizeHTML(desc.trim()) };
    },

    validateMessage: function(msg) {
      if (!msg || msg.trim().length === 0) return { valid: false, reason: 'Сообщение обязательно' };
      if (msg.length > 5000) return { valid: false, reason: 'Максимум 5000 символов' };
      if (/<script|<iframe|javascript:|onerror|onload/i.test(msg)) {
        return { valid: false, reason: 'Недопустимый контент' };
      }
      return { valid: true, value: this.sanitizeHTML(msg.trim()) };
    },

    validateUserName: function(name) {
      if (!name || name.trim().length === 0) return { valid: false, reason: 'Имя обязательно' };
      if (name.length > 100) return { valid: false, reason: 'Максимум 100 символов' };
      if (/<script|<iframe|javascript:/i.test(name)) {
        return { valid: false, reason: 'Недопустимые символы' };
      }
      return { valid: true, value: this.sanitizeHTML(name.trim()) };
    },

    // ===== 5. ЗАЩИТА ОТ SQL-ИНЪЕКЦИЙ (задача 10) =====
    sanitizeForSQL: function(str) {
      if (!str) return '';
      return str.replace(/['";\\]/g, '');
    },

    // ===== 6. RATE LIMITING НА КЛИЕНТЕ (задача 30) =====
    _rateLimitStore: {},
    
    checkRateLimit: function(action, maxAttempts = 5, windowMs = 60000) {
      const now = Date.now();
      const key = action;
      
      if (!this._rateLimitStore[key]) {
        this._rateLimitStore[key] = { count: 0, resetAt: now + windowMs };
      }
      
      const store = this._rateLimitStore[key];
      
      if (now > store.resetAt) {
        store.count = 0;
        store.resetAt = now + windowMs;
      }
      
      store.count++;
      
      if (store.count > maxAttempts) {
        const waitTime = Math.ceil((store.resetAt - now) / 1000);
        return { allowed: false, waitSeconds: waitTime };
      }
      
      return { allowed: true, remaining: maxAttempts - store.count };
    },

    rateLimits: {
      login: { max: 5, window: 900000 },
      signup: { max: 3, window: 3600000 },
      generate: { max: 3, window: 60000 },
      upload: { max: 10, window: 60000 },
      message: { max: 10, window: 60000 },
      review: { max: 3, window: 3600000 },
      contact: { max: 3, window: 3600000 },
      password_reset: { max: 3, window: 3600000 }
    },

    checkActionLimit: function(action) {
      const limit = this.rateLimits[action];
      if (!limit) return { allowed: true };
      return this.checkRateLimit(action, limit.max, limit.window);
    },

    // ===== 7. ЗАЩИТА ОТ CSRF (задача 28) =====
    generateCSRFToken: function() {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    },

    validateCSRFToken: function(token) {
      const stored = sessionStorage.getItem('csrf_token');
      return stored && stored === token;
    },

    initCSRF: function() {
      if (!sessionStorage.getItem('csrf_token')) {
        sessionStorage.setItem('csrf_token', this.generateCSRFToken());
      }
    },

    getCSRFToken: function() {
      return sessionStorage.getItem('csrf_token');
    },

    // ===== 8. ЗАЩИТА ОТ CLICKJACKING (задача 29) =====
    preventClickjacking: function() {
      if (window.top !== window.self) {
        window.top.location = window.self.location;
      }
    },

    // ===== 9. МАСКИРОВАНИЕ ДАННЫХ (задача 19) =====
    maskEmail: function(email) {
      if (!email) return '';
      const [name, domain] = email.split('@');
      if (!domain) return email;
      const masked = name.charAt(0) + '***' + name.charAt(name.length - 1);
      return masked + '@' + domain;
    },

    maskPassword: function(password) {
      return '•'.repeat(Math.min(password.length, 12));
    },

    maskToken: function(token) {
      if (!token || token.length < 10) return '***';
      return token.substring(0, 4) + '...' + token.substring(token.length - 4);
    },

    // ===== 10. БЕЗОПАСНОЕ ЛОГИРОВАНИЕ (задача 19) =====
    safeLog: function(level, message, data = null) {
      if (window.location.hostname.includes('localhost')) {
        console[level]('[Cliply]', message, data);
      } else {
        if (level === 'error') {
          console.error('[Cliply]', message);
        }
      }
    },

    // ===== 11. ПРОВЕРКА URL (защита от SSRF — задача 15) =====
    isSafeURL: function(url) {
      try {
        const parsed = new URL(url);
        const blockedProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
        const blockedHosts = [
          'localhost', '127.0.0.1', '0.0.0.0',
          '10.', '172.16.', '172.17.', '172.18.', '172.19.',
          '172.20.', '172.21.', '172.22.', '172.23.', '172.24.',
          '172.25.', '172.26.', '172.27.', '172.28.', '172.29.',
          '172.30.', '172.31.', '192.168.', '169.254.'
        ];
        
        if (blockedProtocols.includes(parsed.protocol.toLowerCase())) {
          return { safe: false, reason: 'Недопустимый протокол' };
        }
        
        for (const host of blockedHosts) {
          if (parsed.hostname.startsWith(host)) {
            return { safe: false, reason: 'Внутренний адрес заблокирован' };
          }
        }
        
        return { safe: true };
      } catch (e) {
        return { safe: false, reason: 'Невалидный URL' };
      }
    },

    // ===== 12. ВАЛИДАЦИЯ ФАЙЛОВ (задача 16) =====
    validateFile: function(file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const maxSize = 10 * 1024 * 1024;
      
      if (!allowedTypes.includes(file.type)) {
        return { valid: false, reason: 'Недопустимый формат файла. Разрешены: JPG, PNG, WebP' };
      }
      
      if (file.size > maxSize) {
        return { valid: false, reason: 'Файл больше 10 МБ' };
      }
      
      if (!file.name || file.name.length > 255) {
        return { valid: false, reason: 'Недопустимое имя файла' };
      }
      
      if (/\.[a-z]+\.[a-z]+\.[a-z]+$/i.test(file.name)) {
        return { valid: false, reason: 'Подозрительное имя файла' };
      }
      
      if (file.name.toLowerCase().includes('script') || 
          file.name.toLowerCase().includes('exec') ||
          file.name.toLowerCase().includes('cmd')) {
        return { valid: false, reason: 'Подозрительное имя файла' };
      }
      
      return { valid: true };
    },

    generateSafeFilename: function(originalName) {
      const ext = originalName.split('.').pop().toLowerCase();
      const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
      if (!allowedExts.includes(ext)) return null;
      return crypto.randomUUID() + '.' + ext;
    },

    // ===== 13. АВТОМАТИЧЕСКИЙ LOGOUT (задача 27) =====
    initAutoLogout: function(timeoutMinutes = 30) {
      let timer;
      
      const resetTimer = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          this.safeLog('info', 'Автоматический выход из-за неактивности');
          if (typeof supabaseClient !== 'undefined') {
            supabaseClient.auth.signOut();
          }
          if (window.location.pathname.includes('dashboard') || 
              window.location.pathname.includes('admin') ||
              window.location.pathname.includes('analytics') ||
              window.location.pathname.includes('settings') ||
              window.location.pathname.includes('achievements')) {
            window.location.href = 'login.html?timeout=1';
          }
        }, timeoutMinutes * 60 * 1000);
      };
      
      ['mousedown', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
        document.addEventListener(event, resetTimer);
      });
      
      resetTimer();
    },

    // ===== 14. МОНИТОРИНГ ПОДОЗРИТЕЛЬНОЙ АКТИВНОСТИ (задача 25) =====
    suspiciousActivity: {
      _events: [],
      
      log: function(type, details) {
        this._events.push({
          type,
          details,
          timestamp: Date.now(),
          url: window.location.href
        });
        
        if (this._events.length >= 5) {
          this.report();
        }
      },
      
      report: async function() {
        if (typeof supabaseClient === 'undefined') return;
        
        try {
          await supabaseClient.from('audit_logs').insert({
            user_id: null,
            action: 'suspicious_activity',
            details: JSON.stringify(this._events)
          });
          this._events = [];
        } catch (e) {
          SecurityUtils.safeLog('error', 'Failed to report suspicious activity', e);
        }
      },
      
      rapidClickDetected: false,
      clickCount: 0,
      clickWindow: 0,
      
      checkRapidClicks: function() {
        const now = Date.now();
        if (now - this.clickWindow > 1000) {
          this.clickCount = 0;
          this.clickWindow = now;
        }
        
        this.clickCount++;
        
        if (this.clickCount > 20) {
          this.rapidClickDetected = true;
          this.log('rapid_clicks', { count: this.clickCount });
          return true;
        }
        
        return false;
      }
    },

    // ===== 15. ЗАЩИТА ОТ REPLAY АТАК =====
    _nonceStore: new Set(),
    
    generateNonce: function() {
      return crypto.randomUUID();
    },

    isNonceValid: function(nonce) {
      if (this._nonceStore.has(nonce)) return false;
      this._nonceStore.add(nonce);
      
      if (this._nonceStore.size > 1000) {
        const first = this._nonceStore.values().next().value;
        this._nonceStore.delete(first);
      }
      
      return true;
    },

    // ===== 16. БЕЗОПАСНОЕ ХРАНЕНИЕ =====
    secureStorage: {
      set: function(key, value, ttl = 3600000) {
        const item = {
          value: value,
          expiry: Date.now() + ttl
        };
        sessionStorage.setItem(key, JSON.stringify(item));
      },
      
      get: function(key) {
        const item = sessionStorage.getItem(key);
        if (!item) return null;
        
        const parsed = JSON.parse(item);
        if (Date.now() > parsed.expiry) {
          sessionStorage.removeItem(key);
          return null;
        }
        
        return parsed.value;
      },
      
      remove: function(key) {
        sessionStorage.removeItem(key);
      },
      
      clear: function() {
        sessionStorage.clear();
      }
    },

    // ===== 17. ПРОВЕРКА ЦЕЛОСТНОСТИ =====
    hash: async function(str) {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    // ===== 18. ИНИЦИАЛИЗАЦИЯ ВСЕХ ЗАЩИТ =====
    init: function() {
      this.initCSRF();
      this.preventClickjacking();
      this.initAutoLogout(30);
      
      document.addEventListener('click', () => {
        this.suspiciousActivity.checkRapidClicks();
      });
      
      let devtoolsOpen = false;
      const threshold = 160;
      
      setInterval(() => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
          if (!devtoolsOpen) {
            devtoolsOpen = true;
            this.suspiciousActivity.log('devtools_opened', {});
          }
        } else {
          devtoolsOpen = false;
        }
      }, 1000);
      
      this.safeLog('info', 'Security utils initialized');
    }
  };

  window.SecurityUtils = SecurityUtils;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SecurityUtils.init());
  } else {
    SecurityUtils.init();
  }
})();
