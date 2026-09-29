// Переключатель темы с сохранением в localStorage
(function() {
  'use strict';
  
  const THEME_KEY = 'cliply_theme';
  const VALID_THEMES = ['dark', 'light'];
  
  class ThemeSwitcher {
    constructor() {
      this.currentTheme = this._loadTheme();
      this._applyTheme(this.currentTheme);
      this._createSwitcher();
    }
    
    // Загрузить тему из localStorage
    _loadTheme() {
      try {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved && VALID_THEMES.includes(saved)) {
          return saved;
        }
      } catch (e) {
        console.warn('ThemeSwitcher: не удалось загрузить тему', e);
      }
      return 'dark'; // По умолчанию тёмная
    }
    
    // Сохранить тему в localStorage
    _saveTheme(theme) {
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (e) {
        console.warn('ThemeSwitcher: не удалось сохранить тему', e);
      }
    }
    
    // Применить тему
    _applyTheme(theme) {
      if (theme === 'light') {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }
      this.currentTheme = theme;
      this._updateActiveButton();
    }
    
    // Переключить тему
    toggle(theme) {
      if (!VALID_THEMES.includes(theme)) {
        theme = this.currentTheme === 'dark' ? 'light' : 'dark';
      }
      this._applyTheme(theme);
      this._saveTheme(theme);
      
      if (window.showToast) {
        showToast(`Тема изменена на ${theme === 'dark' ? 'тёмную' : 'светлую'}`, 'info', 2000);
      }
    }
    
    // Создать UI переключателя
    _createSwitcher() {
      const switcher = document.createElement('div');
      switcher.className = 'theme-switcher';
      
      const darkBtn = document.createElement('button');
      darkBtn.className = 'theme-btn';
      darkBtn.innerHTML = '🌙';
      darkBtn.title = 'Тёмная тема';
      darkBtn.onclick = () => this.toggle('dark');
      
      const lightBtn = document.createElement('button');
      lightBtn.className = 'theme-btn';
      lightBtn.innerHTML = '☀️';
      lightBtn.title = 'Светлая тема';
      lightBtn.onclick = () => this.toggle('light');
      
      switcher.appendChild(darkBtn);
      switcher.appendChild(lightBtn);
      
      document.body.appendChild(switcher);
      
      this._updateActiveButton();
    }
    
    // Обновить активную кнопку
    _updateActiveButton() {
      const buttons = document.querySelectorAll('.theme-btn');
      buttons.forEach(btn => btn.classList.remove('active'));
      
      const activeBtn = this.currentTheme === 'dark' ? buttons[0] : buttons[1];
      if (activeBtn) {
        activeBtn.classList.add('active');
      }
    }
  }
  
  // Инициализация при загрузке
  document.addEventListener('DOMContentLoaded', () => {
    window.themeSwitcher = new ThemeSwitcher();
  });
  
  window.ThemeSwitcher = ThemeSwitcher;
})();
