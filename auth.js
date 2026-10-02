// ===== AUTH.JS — Безопасная авторизация =====
// Версия: 2.0.0 (с защитой от брутфорса)

const SUPABASE_URL = 'https://djvdklcahpqbjotukmxt.supabase.co';
const SUPABASE_ANON_KEY = 'твой_anon_key_сюда'; // ТОЛЬКО anon key!

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ROLES = {
  1: { name: 'Owner', color: '#6C5CE7' },
  2: { name: 'Admin', color: '#3b82f6' },
  3: { name: 'Moderator', color: '#10b981' },
  4: { name: 'User', color: '#A1A1AA' }
};

// ===== БЕЗОПАСНЫЙ ВХОД =====
async function safeLogin(email, password) {
  // Валидация email
  if (typeof SecurityUtils !== 'undefined') {
    if (!SecurityUtils.isValidEmail(email)) {
      return { error: { message: 'Некорректный email' } };
    }
    
    if (SecurityUtils.isDisposableEmail(email)) {
      return { error: { message: 'Одноразовые email не поддерживаются' } };
    }
    
    // Rate limit
    const limit = SecurityUtils.checkActionLimit('login');
    if (!limit.allowed) {
      return { error: { message: `Слишком много попыток. Подождите ${limit.waitSeconds} сек.` } };
    }
  }
  
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password
    });
    
    if (error) {
      // Логируем неудачную попытку (если есть функция)
      if (typeof SecurityUtils !== 'undefined') {
        SecurityUtils.suspiciousActivity.log('failed_login', { email: SecurityUtils.maskEmail(email) });
      }
      
      // Одинаковое сообщение для всех ошибок (защита от enumeration)
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
  if (typeof SecurityUtils !== 'undefined') {
    if (!SecurityUtils.isValidEmail(email)) {
      return { error: { message: 'Некорректный email' } };
    }
    
    if (SecurityUtils.isDisposableEmail(email)) {
      return { error: { message: 'Одноразовые email не поддерживаются' } };
    }
    
    const pwdCheck = SecurityUtils.isStrongPassword(password);
    if (!pwdCheck.valid) {
      return { error: { message: pwdCheck.reason } };
    }
    
    const nameCheck = SecurityUtils.validateProductName(fullName);
    if (!nameCheck.valid) {
      return { error: { message: nameCheck.reason } };
    }
    
    const limit = SecurityUtils.checkActionLimit('login');
    if (!limit.allowed) {
      return { error: { message: `Слишком много попыток. Подождите ${limit.waitSeconds} сек.` } };
    }
  }
  
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
      options: {
        data: {
          full_name: fullName.trim()
        }
      }
    });
    
    if (error) {
      return { error: { message: 'Ошибка регистрации. Возможно, email уже используется.' } };
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

// ===== ТРЕБОВАНИЕ АВТОРИЗАЦИИ =====
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
    
    // Очистка всех данных
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

// ===== ПРОВЕРКА РЕФЕРАЛЬНОГО КОДА =====
function getReferralCode() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  
  if (ref && typeof SecurityUtils !== 'undefined') {
    // Валидация реферального кода (только буквы и цифры, 8 символов)
    if (/^[A-Z0-9]{8}$/.test(ref)) {
      return ref;
    }
  }
  
  return null;
}
