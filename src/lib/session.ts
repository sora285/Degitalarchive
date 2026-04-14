export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  schoolId: string;
  role: 'admin' | 'user' | string;
};

const USER_KEY = 'currentUser';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

export function setCurrentUser(user: CurrentUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getCurrentUser(expectedSchoolId?: string): CurrentUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    const user = JSON.parse(raw) as CurrentUser;
    if (expectedSchoolId && user.schoolId !== expectedSchoolId) {
      localStorage.removeItem(USER_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(USER_KEY);
}

export async function logoutCurrentUser() {
  try {
    await fetch(`${apiBaseUrl}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Cookie削除に失敗しても、ローカルセッションは必ず破棄する
  } finally {
    clearSession();
  }
}
