import { SERVER_URL } from "./constants"

const TOKEN_KEY = "courier_admin_token"

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return getToken() !== null
}

export async function login(password: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${SERVER_URL}/api/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password })
    })

    const data = await res.json()

    if (data.success && data.token) {
      setToken(data.token)
      return { success: true }
    }

    return { success: false, message: data.message || "Error de autenticacion" }
  } catch (error) {
    return { success: false, message: "Error de conexion" }
  }
}

export async function logout(): Promise<void> {
  const token = getToken()
  if (token) {
    try {
      await fetch(`${SERVER_URL}/api/admin/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
    } catch {
      // Ignore errors
    }
  }
  removeToken()
}

export async function verifyToken(): Promise<boolean> {
  const token = getToken()
  if (!token) return false

  try {
    const res = await fetch(`${SERVER_URL}/api/admin/verify`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const data = await res.json()
    return data.valid === true
  } catch {
    return false
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
