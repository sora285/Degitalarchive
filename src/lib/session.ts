export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  schoolId: string;
  role: 'admin' | 'user' | string;
};

const USER_KEY = 'currentUser';

export function setCurrentUser(user: CurrentUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getCurrentUser(): CurrentUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(USER_KEY);
}
