// Network Manager — обработка ошибок сети, retry, rate limiting, логирование
(function() {
  'use strict';
  
  const LOG_KEY = 'cliply_error_logs';
  const MAX_LOGS = 100;
  const MAX_RETRIES = 3;
  const RETRY_DELAY_BASE = 1000; // 1 секунда
  const RATE_LIMIT_WINDOW = 3000; // 3 секунды между кликами
  
  class NetworkManager {
    constructor(options = {}) {
      this.onOffline = options.onOffline || null;
      this.onOnline = options.onOnline || null;
      this.isOnline = navigator.onLine;
      this.rateLimitTimers = {};
      this.errorListeners = [];
      
      this._initListeners();
    }
    
    // Слушатели событий сети
    _initListeners() {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this._showStatusToast('online');
        if (this.onOnline) this.onOnline();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this._showStatusToast('offline');
        if (this.onOffline) this.onOffline();
      });
    }
    
    // Показать toast о статусе сети
    _showStatusToast(status) {
      if (!window.showToast) return;
      
      if (status === 'offline') {
        window.showToast('Нет подключения к интернету. Работа в офлайн-режиме.', 'error', 5000);
      } else if (status === 'online') {
        window.showToast('Подключение восстановлено', 'success', 3000);
      }
    }
    
    // Проверка онлайн-статуса
    checkOnline() {
      if (!this.isOnline) {
        window.showToast('Нет подключения к интернету', 'error');
        return false;
      }
      return true;
    }
    
    // Rate limiting — защита от двойных кликов
    rateLimit(actionId, callback) {
      if (this.rateLimitTimers[actionId]) {
        return false; // Действие заблокировано
      }
      
      callback();
      
      this.rateLimitTimers[actionId] = setTimeout(() => {
        delete this.rateLimitTimers[actionId];
      }, RATE_LIMIT_WINDOW);
      
      return true;
    }
    
    // Retry-логика с экспоненциальной задержкой
    async withRetry(fn, options = {}) {
      const maxRetries = options.maxRetries || MAX_RETRIES;
      const delayBase = options.delayBase || RETRY_DELAY_BASE;
      const label = options.label || 'Операция';
      
      let lastError = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await fn();
          if (attempt > 1) {
            this._log('info', `${label} успешна со ${attempt}-й попытки`);
          }
          return result;
        } catch (error) {
          lastError = error;
          this._log('warning', `${label}: попытка ${attempt}/${maxRetries} — ${error.message}`);
          
          if (attempt < maxRetries) {
            const delay = delayBase * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      this._log('error', `${label} провалена после ${maxRetries} попыток: ${lastError.message}`);
      throw lastError;
    }
    
    // Обёртка для Supabase запросов с retry
    async supabaseRequest(fn, label) {
      return this.withRetry(fn, { label });
    }
    
    // Логирование ошибок в localStorage
    _log(level, message, data = null) {
      const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        data,
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      let logs = [];
      try {
        const raw = localStorage.getItem(LOG_KEY);
        if (raw) logs = JSON.parse(raw);
      } catch (e) {
        // Игнорируем ошибки чтения логов
      }
      
      logs.unshift(entry);
      if (logs.length > MAX_LOGS) {
        logs = logs.slice(0, MAX_LOGS);
      }
      
      try {
        localStorage.setItem(LOG_KEY, JSON.stringify(logs));
      } catch (e) {
        // localStorage может быть переполнен
      }
      
      // Также выводим в консоль для разработки
      const consoleFn = level === 'error' ? console.error : 
                        level === 'warning' ? console.warn : console.log;
      consoleFn(`[Cliply ${level.toUpperCase()}] ${message}`, data || '');
    }
    
    // Публичный метод логирования
    log(level, message, data) {
      this._log(level, message, data);
    }
    
    // Получить все логи
    getLogs() {
      try {
        const raw = localStorage.getItem(LOG_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }
    
    // Очистить логи
    clearLogs() {
      localStorage.removeItem(LOG_KEY);
    }
    
    // Экспорт логов в JSON
    exportLogs() {
      const logs = this.getLogs();
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cliply-logs-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    // Подписаться на ошибки
    onError(listener) {
      this.errorListeners.push(listener);
    }
    
    // Уведомить слушателей об ошибке
    notifyError(error, context) {
      this.errorListeners.forEach(fn => fn(error, context));
    }
  }
  
  // Глобальный обработчик необработанных ошибок
  window.addEventListener('error', (event) => {
    if (window.networkManager) {
      window.networkManager.log('error', `Global error: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    }
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    if (window.networkManager) {
      window.networkManager.log('error', `Unhandled rejection: ${event.reason}`, {
        promise: event.promise
      });
    }
  });
  
  window.NetworkManager = NetworkManager;
})();
