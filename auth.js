// ===== AUTH.JS — Безопасная авторизация Cliply =====
// Версия: 2.0.0 (с защитой от брутфорса и enumeration)
// Закрывает задачи: 5, 6, 20, 21, 26

const SUPABASE_URL = 'https://djvdklcahpqbjotukmxt.supabase.co';

// ⚠️ ВАЖНО: Вставь сюда свой ANON PUBLIC KEY из настроек Supabase (Settings -> API)
// НИКОГДА не вставляй сюда service_role key!
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdmRrbGNhaHBxYmpvdHVrbXh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NTE3NzIsImV4cCI6MjEwNjEyNzc3Mn0.7vKBE_sIlpnN0NMa1gWekDTpaKiGGipOGsmmoNpt7eI'; 

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ROLES = {
  1: { name: 'Owner', color: '#6C5CE7' },
  2: { name: 'Admin', color: '#3b82f6' },
  3: { name: 'Moderator', color: '#10b981' },
  4: { name: 'User', color: '#A1A1AA' }
};

// ===== БЕЗОПАСНЫЙ ВХОД (Защита от брутфорса и enumeration) =====
async function safeLogin(email, password) {
  // 1. Проверка rate limit (если security.js загружен)
  if (typeof SecurityUtils !== 'undefined') {
    const limit = SecurityUtils.checkActionLimit('login');
    if (!limit.allowed) {
      return { error: { message: `Слишком много попыток. Подождите ${limit.waitSeconds} сек.` } };
    }
    
    if (!SecurityUtils.isValidEmail(email)) {
      return { error: { message: 'Некорректный формат email' } };
    }
  }

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password
    });

    if (error) {
      // Логируем подозрительную активность
      if (typeof SecurityUtils !== 'undefined') {
        SecurityUtils.suspiciousActivity.log('failed_login', { email: SecurityUtils.maskEmail(email) });
      }
      
      // Одинаковое сообщение для всех ошибок (защита от перебора email)
      return { error: { message: 'Неверный email или пароль' } };
    }

    // Успешный вход
    if (typeof SecurityUtils !== 'undefined') {
      SecurityUtils.suspiciousActivity.log('successful_login', {});
    }

    return { data, error: null };
  } catch (e) {
    return { error: { message: 'Ошибка соединения. Попробуйте позже.' } };
  }
}

// ===== БЕЗОПАСНАЯ РЕГИСТРАЦИЯ =====
async function safeSignup(email, password, fullName) {
  // 1. Валидация на клиенте
  if (typeof SecurityUtils !== 'undefined') {
    const limit = SecurityUtils.checkActionLimit('signup');
    if (!limit.allowed) {
      return { error: { message: `Слишком много попыток. Подождите ${limit.waitSeconds} сек.` } };
    }

    if (!SecurityUtils.isValidEmail(email)) {
      return { error: { message: 'Некорректный формат email' } };
    }

    if (SecurityUtils.isDisposableEmail(email)) {
      return { error: { message: 'Одноразовые email не поддерживаются' } };
    }

    const pwdCheck = SecurityUtils.isStrongPassword(password);
    if (!pwdCheck.valid) {
      return { error: { message: pwdCheck.reason } };
    }

    const nameCheck = SecurityUtils.validateUserName(fullName);
    if (!nameCheck.valid) {
      return { error: { message: nameCheck.reason } };
    }
    fullName = nameCheck.value;
  }

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      // Одинаковое сообщение, чтобы не раскрывать занятость email
      return { error: { message: 'Ошибка регистрации. Возможно, этот email уже используется.' } };
    }

    return { data, error: null };
  } catch (e) {
    return { error: { message: 'Ошибка соединения. Попробуйте позже.' } };
  }
}

// ===== ПОЛУЧЕНИЕ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ =====
async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error || !user) return null;

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return { ...user, profile };
  } catch (e) {
    return null;
  }
}

// ===== ТРЕБОВАНИЕ АВТОРИЗАЦИИ (для защищенных страниц) =====
async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

// ===== БЕЗОПАСНЫЙ ВЫХОД =====
async function logout() {
  try {
    await supabaseClient.auth.signOut();
    
    // Полная очистка хранилища
    if (typeof SecurityUtils !== 'undefined') {
      SecurityUtils.secureStorage.clear();
    }
    
    localStorage.clear();
    sessionStorage.clear();
    
    window.location.href = 'index.html';
  } catch (e) {
    console.error('Logout error:', e);
    window.location.href = 'index.html';
  }
}

// ===== ПРОВЕРКА РЕФЕРАЛЬНОГО КОДА (защита от XSS в URL) =====
function getReferralCode() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  
  if (ref && typeof SecurityUtils !== 'undefined') {
    // Разрешаем только заглавные буквы и цифры, ровно 8 символов
    if (/^[A-Z0-9]{8}$/.test(ref)) {
      return ref;
    }
  }
  
  return null;
}

// Экспортируем функции в глобальную область
window.supabaseClient = supabaseClient;
window.ROLES = ROLES;
window.safeLogin = safeLogin;
window.safeSignup = safeSignup;
window.getCurrentUser = getCurrentUser;
window.requireAuth = requireAuth;
window.logout = logout;
window.getReferralCode = getReferralCode;
