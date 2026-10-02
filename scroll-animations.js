// ===== АНИМАЦИИ ПОЯВЛЕНИЯ ПРИ СКРОЛЛЕ =====

(function() {
  'use strict';

  // Проверяем поддержку Intersection Observer
  if (!('IntersectionObserver' in window)) {
    // Если не поддерживается — просто показываем всё
    document.querySelectorAll('.animate-on-scroll, .animate-fade-in, .animate-slide-up, .animate-slide-left, .animate-slide-right, .animate-scale-in').forEach(el => {
      el.classList.add('visible');
    });
    return;
  }

  // Настройки наблюдателя
  const observerOptions = {
    root: null, // viewport
    rootMargin: '0px',
    threshold: 0.1 // Элемент должен быть виден на 10%
  };

  // Callback при пересечении
  const observerCallback = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Перестаем наблюдать после появления (одноразовая анимация)
        observer.unobserve(entry.target);
      }
    });
  };

  // Создаем наблюдателя
  const observer = new IntersectionObserver(observerCallback, observerOptions);

  // Наблюдаем за всеми элементами с классами анимации
  const animatedElements = document.querySelectorAll(
    '.animate-on-scroll, .animate-fade-in, .animate-slide-up, .animate-slide-left, .animate-slide-right, .animate-scale-in'
  );

  animatedElements.forEach(el => {
    observer.observe(el);
  });

  console.log(`[Scroll Animations] Наблюдаем за ${animatedElements.length} элементами`);
})();

// ===== ПЛАВНЫЙ СКРОЛЛ ДЛЯ ЯКОРНЫХ ССЫЛОК =====

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId.length < 2) return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});
