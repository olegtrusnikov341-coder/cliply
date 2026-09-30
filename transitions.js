// Плавные переходы между страницами Cliply

document.addEventListener('DOMContentLoaded', () => {
  // Анимация появления контента при скролле
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('content-fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  document.querySelectorAll('.step-card, .feature-card, .example-card, .pricing-card, .project-card').forEach(el => {
    observer.observe(el);
  });
});

function showContentWithAnimation(selector) {
  const el = document.querySelector(selector);
  if (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    el.style.transition = 'all 0.4s ease';
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 50);
  }
}
