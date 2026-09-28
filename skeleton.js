// Skeleton Loaders

function showSkeleton(selector, type = 'text') {
  const element = document.querySelector(selector);
  if (!element) return;
  
  element.classList.add('skeleton');
  element.classList.add(`skeleton-${type}`);
  element.style.opacity = '1';
}

function hideSkeleton(selector) {
  const element = document.querySelector(selector);
  if (!element) return;
  
  element.classList.remove('skeleton', 'skeleton-text', 'skeleton-title', 'skeleton-badge', 
                           'skeleton-card', 'skeleton-input', 'skeleton-button');
  element.style.opacity = '1';
}

function showContentWithAnimation(selector) {
  const element = document.querySelector(selector);
  if (!element) return;
  
  element.classList.add('content-fade-in');
}

// Показать скелет для карточки видео
function showVideoCardSkeleton(containerSelector, count = 3) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  container.innerHTML = '';
  
  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
      <div class="project-preview skeleton"></div>
      <div class="project-info">
        <div class="project-title skeleton skeleton-text medium"></div>
        <div class="project-actions">
          <div class="btn-small skeleton skeleton-card-btn"></div>
          <div class="btn-small skeleton skeleton-card-btn"></div>
        </div>
      </div>
    `;
    container.appendChild(card);
  }
}

// Показать скелет для таблицы пользователей
function showUserTableSkeleton(tbodySelector, count = 3) {
  const tbody = document.querySelector(tbodySelector);
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  for (let i = 0; i < count; i++) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><div class="skeleton skeleton-table-cell"></div></td>
      <td><div class="skeleton skeleton-table-cell large"></div></td>
      <td><div class="skeleton skeleton-table-cell small"></div></td>
      <td><div class="skeleton skeleton-table-cell small"></div></td>
    `;
    tbody.appendChild(row);
  }
}

// Показать скелет для полей формы
function showFormSkeleton(containerSelector, fieldCount = 2) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  const originalHTML = container.innerHTML;
  container.dataset.originalHTML = originalHTML;
  container.innerHTML = '';
  
  for (let i = 0; i < fieldCount; i++) {
    const label = document.createElement('div');
    label.className = 'skeleton skeleton-label';
    container.appendChild(label);
    
    const input = document.createElement('div');
    input.className = 'skeleton skeleton-input';
    container.appendChild(input);
  }
}

// Восстановить оригинальный контент формы
function restoreFormContent(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container || !container.dataset.originalHTML) return;
  
  container.innerHTML = container.dataset.originalHTML;
  delete container.dataset.originalHTML;
  showContentWithAnimation(containerSelector);
}

// Сделать функции глобальными
window.showSkeleton = showSkeleton;
window.hideSkeleton = hideSkeleton;
window.showContentWithAnimation = showContentWithAnimation;
window.showVideoCardSkeleton = showVideoCardSkeleton;
window.showUserTableSkeleton = showUserTableSkeleton;
window.showFormSkeleton = showFormSkeleton;
window.restoreFormContent = restoreFormContent;
