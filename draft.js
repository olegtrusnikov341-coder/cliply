// Автосохранение черновика формы создания видео

(function() {
  'use strict';
  
  const DRAFT_PREFIX = 'cliply_draft_';
  const DRAFT_EXPIRY_DAYS = 30; // Черновик хранится 30 дней
  
  class DraftManager {
    constructor(options = {}) {
      this.userId = options.userId;
      this.descriptionSelector = options.descriptionSelector || '#productDescription';
      this.scenarioSelector = options.scenarioSelector || '#scenarioSelect';
      this.indicatorSelector = options.indicatorSelector || '#draftIndicator';
      this.clearButtonSelector = options.clearButtonSelector || '#clearDraftBtn';
      this.debounceMs = options.debounceMs || 500;
      this.saveTimeout = null;
      this.status = 'idle'; // idle | saving | saved | error
      this.onStatusChange = options.onStatusChange || null;
      
      this.descriptionEl = document.querySelector(this.descriptionSelector);
      this.scenarioEl = document.querySelector(this.scenarioSelector);
      this.indicatorEl = document.querySelector(this.indicatorSelector);
      this.clearBtn = document.querySelector(this.clearButtonSelector);
      
      if (this.clearBtn) {
        this.clearBtn.addEventListener('click', () => this.clear());
      }
    }
    
    getStorageKey() {
      return `${DRAFT_PREFIX}${this.userId}`;
    }
    
    // Сохранить черновик
    save() {
      if (!this.userId) return;
      
      this.setStatus('saving');
      
      const draft = {
        description: this.descriptionEl ? this.descriptionEl.value : '',
        scenario: this.scenarioEl ? this.scenarioEl.value : '',
        timestamp: Date.now(),
        version: 1
      };
      
      try {
        localStorage.setItem(this.getStorageKey(), JSON.stringify(draft));
        this.setStatus('saved');
        
        // Сбросить статус через 2 секунды
        setTimeout(() => {
          if (this.status === 'saved') {
            this.setStatus('idle');
          }
        }, 2000);
      } catch (e) {
        console.error('Draft save error:', e);
        this.setStatus('error');
      }
    }
    
    // Загрузить черновик
    load() {
      if (!this.userId) return null;
      
      try {
        const raw = localStorage.getItem(this.getStorageKey());
        if (!raw) return null;
        
        const draft = JSON.parse(raw);
        
        // Проверяем срок годности
        const age = Date.now() - draft.timestamp;
        const maxAge = DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        if (age > maxAge) {
          this.clear();
          return null;
        }
        
        // Восстанавливаем поля
        if (this.descriptionEl && draft.description) {
          this.descriptionEl.value = draft.description;
        }
        if (this.scenarioEl && draft.scenario) {
          this.scenarioEl.value = draft.scenario;
        }
        
        return draft;
      } catch (e) {
        console.error('Draft load error:', e);
        return null;
      }
    }
    
    // Очистить черновик
    clear() {
      if (!this.userId) return;
      
      try {
        localStorage.removeItem(this.getStorageKey());
        
        if (this.descriptionEl) {
          this.descriptionEl.value = '';
        }
        if (this.scenarioEl) {
          this.scenarioEl.value = '';
        }
        
        this.setStatus('idle');
        
        if (window.showToast) {
          window.showToast('Черновик очищен', 'info');
        }
      } catch (e) {
        console.error('Draft clear error:', e);
      }
    }
    
    // Установить статус индикатора
    setStatus(status) {
      this.status = status;
      
      if (!this.indicatorEl) return;
      
      const messages = {
        idle: '',
        saving: 'Сохранение...',
        saved: '✓ Автосохранено',
        error: '⚠ Ошибка сохранения'
      };
      
      const classes = {
        idle: '',
        saving: 'draft-saving',
        saved: 'draft-saved',
        error: 'draft-error'
      };
      
      this.indicatorEl.textContent = messages[status] || '';
      this.indicatorEl.className = 'draft-indicator ' + (classes[status] || '');
      
      if (this.onStatusChange) {
        this.onStatusChange(status);
      }
    }
    
    // Debounce-обёртка для save
    scheduleSave() {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = setTimeout(() => this.save(), this.debounceMs);
    }
    
    // Подключить слушатели событий
    attachListeners() {
      if (this.descriptionEl) {
        this.descriptionEl.addEventListener('input', () => this.scheduleSave());
      }
      if (this.scenarioEl) {
        this.scenarioEl.addEventListener('change', () => this.save());
      }
      
      // Сохранять перед закрытием вкладки (sync, без debounce)
      window.addEventListener('beforeunload', () => {
        if (this.descriptionEl && this.descriptionEl.value.trim()) {
          this.save();
        }
      });
      
      // Сохранять при потере фокуса страницы
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.descriptionEl && this.descriptionEl.value.trim()) {
          this.save();
        }
      });
    }
    
    // Инициализация
    init() {
      if (!this.userId) {
        console.warn('DraftManager: userId не указан');
        return;
      }
      
      // Загружаем существующий черновик
      const draft = this.load();
      if (draft) {
        if (window.showToast) {
          const timeAgo = this.getTimeAgo(draft.timestamp);
          window.showToast(`Восстановлен черновик (сохранён ${timeAgo})`, 'info', 3000);
        }
      }
      
      // Подключаем слушатели
      this.attachListeners();
      
      // Показываем/скрываем кнопку очистки
      this.updateClearButton();
    }
    
    updateClearButton() {
      if (!this.clearBtn) return;
      
      const hasDraft = localStorage.getItem(this.getStorageKey()) !== null;
      this.clearBtn.style.display = hasDraft ? 'inline-flex' : 'none';
    }
    
    getTimeAgo(timestamp) {
      const seconds = Math.floor((Date.now() - timestamp) / 1000);
      if (seconds < 60) return 'только что';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} мин назад`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} ч назад`;
      const days = Math.floor(hours / 24);
      return `${days} дн назад`;
    }
  }
  
  // Экспорт
  window.DraftManager = DraftManager;
})();
