// Микроанимации: ripple-эффект и вспомогательные функции

(function() {
  'use strict';
  
  // Ripple-эффект для кнопок
  function createRipple(event) {
    const button = event.currentTarget;
    
    // Удаляем старые ripple, если есть
    const oldRipples = button.querySelectorAll('.ripple');
    oldRipples.forEach(r => r.remove());
    
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    const rect = button.getBoundingClientRect();
    
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add('ripple');
    
    // Удаляем старый ripple и добавляем новый
    const existingRipple = button.querySelector('.ripple');
    if (existingRipple) {
      existingRipple.remove();
    }
    
    button.appendChild(circle);
    
    // Удаляем ripple после анимации
    setTimeout(() => {
      circle.remove();
    }, 600);
  }
  
  // Добавляем ripple к основным кнопкам
  function initRippleButtons() {
    const rippleSelectors = [
      '.btn',
      '.btn-generate',
      '.btn-save',
      '.btn-add',
      '.btn-prompt',
      '.nav-links a:last-child',
      '.cta-button'
    ];
    
    rippleSelectors.forEach(selector => {
      const buttons = document.querySelectorAll(selector);
      buttons.forEach(button => {
        // Добавляем класс для overflow: hidden (нужен для ripple)
        if (!button.classList.contains('ripple-container')) {
          button.classList.add('ripple-container');
        }
        
        button.addEventListener('click', createRipple);
      });
    });
  }
  
  // Анимация бейджа при обновлении
  function animateBadge(selector) {
    const badge = document.querySelector(selector);
    if (!badge) return;
    
    badge.classList.remove('badge-updated');
    // Force reflow
    void badge.offsetWidth;
    badge.classList.add('badge-updated');
    
    setTimeout(() => {
      badge.classList.remove('badge-updated');
    }, 400);
  }
  
  // Инициализация при загрузке
  document.addEventListener('DOMContentLoaded', () => {
    initRippleButtons();
  });
  
  // Экспорт для использования в других скриптах
  window.microAnimations = {
    initRipple: initRippleButtons,
    animateBadge: animateBadge
  };
})();
