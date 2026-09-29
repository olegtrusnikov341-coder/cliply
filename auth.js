const SUPABASE_URL = 'https://djvdklcahpqbjotukmxt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-uFh8AQYODLNnTSqXc1nJg_cirR4QCV';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ROLES = {
  1: { name: 'Owner', color: '#6C5CE7', permissions: 'full' },
  2: { name: 'Admin', color: '#3b82f6', permissions: 'settings+stats' },
  3: { name: 'Moderator', color: '#10b981', permissions: 'stats+content' }
};

async function getCurrentUser() {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return null;
    
    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      if (window.networkManager) {
        window.networkManager.log('error', 'Ошибка загрузки профиля', error);
      }
      return null;
    }
    
    return { ...user, profile };
  } catch (error) {
    if (window.networkManager) {
      window.networkManager.log('error', 'getCurrentUser failed', error);
    }
    return null;
  }
}

async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

function requireRole(minLevel) {
  return async function() {
    const user = await requireAuth();
    if (!user) return null;
    if (user.profile.role_level > minLevel) {
      if (window.showToast) {
        showToast('Недостаточно прав доступа. Требуется уровень: ' + ROLES[minLevel].name, 'error');
      }
      window.location.href = 'dashboard.html';
      return null;
    }
    return user;
  };
}

async function logout() {
  try {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
  } catch (error) {
    if (window.showToast) {
      showToast('Ошибка выхода: ' + error.message, 'error');
    }
    if (window.networkManager) {
      window.networkManager.log('error', 'Logout failed', error);
    }
  }
}

window.supabaseClient = supabaseClient;
window.getCurrentUser = getCurrentUser;
window.requireAuth = requireAuth;
window.requireRole = requireRole;
window.logout = logout;
window.ROLES = ROLES;
