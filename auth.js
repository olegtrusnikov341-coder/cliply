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
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return null;
  
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return { ...user, profile };
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
      alert('Недостаточно прав доступа. Требуется уровень: ' + ROLES[minLevel].name);
      window.location.href = 'dashboard.html';
      return null;
    }
    return user;
  };
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'index.html';
}

window.supabaseClient = supabaseClient;
window.getCurrentUser = getCurrentUser;
window.requireAuth = requireAuth;
window.requireRole = requireRole;
window.logout = logout;
window.ROLES = ROLES;
