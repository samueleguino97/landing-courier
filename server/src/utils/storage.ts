import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { ArrivalDate } from 'shared/dist'

const DATA_DIR = join(import.meta.dir, '../../data')

// Dates storage
interface DatesData {
  dates: ArrivalDate[]
}

export function getDatesPath(): string {
  return join(DATA_DIR, 'dates.json')
}

export function readDates(): ArrivalDate[] {
  const path = getDatesPath()
  if (!existsSync(path)) {
    writeDates([])
    return []
  }
  const data: DatesData = JSON.parse(readFileSync(path, 'utf-8'))
  return data.dates
}

export function writeDates(dates: ArrivalDate[]): void {
  const path = getDatesPath()
  writeFileSync(path, JSON.stringify({ dates }, null, 2))
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Admin storage
interface AdminData {
  password: string
  sessions: { token: string; expiresAt: number }[]
}

export function getAdminPath(): string {
  return join(DATA_DIR, 'admin.json')
}

export function readAdmin(): AdminData {
  const path = getAdminPath()
  if (!existsSync(path)) {
    const defaultData: AdminData = { password: 'admin123', sessions: [] }
    writeFileSync(path, JSON.stringify(defaultData, null, 2))
    return defaultData
  }
  return JSON.parse(readFileSync(path, 'utf-8'))
}

export function writeAdmin(data: AdminData): void {
  const path = getAdminPath()
  writeFileSync(path, JSON.stringify(data, null, 2))
}

export function validatePassword(password: string): boolean {
  const admin = readAdmin()
  return admin.password === password
}

export function createSession(): string {
  const token = generateId() + generateId()
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  const admin = readAdmin()

  // Clean expired sessions
  admin.sessions = admin.sessions.filter(s => s.expiresAt > Date.now())

  // Add new session
  admin.sessions.push({ token, expiresAt })
  writeAdmin(admin)

  return token
}

export function validateSession(token: string): boolean {
  const admin = readAdmin()
  const session = admin.sessions.find(s => s.token === token)
  return session !== undefined && session.expiresAt > Date.now()
}

export function deleteSession(token: string): void {
  const admin = readAdmin()
  admin.sessions = admin.sessions.filter(s => s.token !== token)
  writeAdmin(admin)
}
