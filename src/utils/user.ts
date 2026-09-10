export interface StoredUser {
  id?: string
  first_name?: string
  last_name?: string
  username?: string
  email?: string
  role?: 'user' | 'admin'
}

export function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export function getHomeRoute(role?: string): string {
  return role === 'admin' ? '/admin' : '/dashboard'
}
