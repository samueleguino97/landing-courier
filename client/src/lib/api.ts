import { SERVER_URL } from "./constants"
import { getAuthHeaders } from "./auth"
import type { ArrivalDate, CreateArrivalDateInput, UpdateArrivalDateInput, DatesResponse, DateResponse, DeleteResponse } from "shared"

// Public API
export async function fetchPublicDates(): Promise<ArrivalDate[]> {
  const res = await fetch(`${SERVER_URL}/api/dates`)
  const data: DatesResponse = await res.json()
  return data.success ? data.data : []
}

// Admin API
export async function fetchAdminDates(): Promise<ArrivalDate[]> {
  const res = await fetch(`${SERVER_URL}/api/admin/dates`, {
    headers: getAuthHeaders()
  })
  const data: DatesResponse = await res.json()
  if (!data.success) throw new Error("Error al obtener fechas")
  return data.data
}

export async function createDate(input: CreateArrivalDateInput): Promise<ArrivalDate> {
  const res = await fetch(`${SERVER_URL}/api/admin/dates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(input)
  })
  const data: DateResponse = await res.json()
  if (!data.success) throw new Error("Error al crear fecha")
  return data.data
}

export async function updateDate(id: string, input: UpdateArrivalDateInput): Promise<ArrivalDate> {
  const res = await fetch(`${SERVER_URL}/api/admin/dates/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(input)
  })
  const data: DateResponse = await res.json()
  if (!data.success) throw new Error("Error al actualizar fecha")
  return data.data
}

export async function deleteDate(id: string): Promise<void> {
  const res = await fetch(`${SERVER_URL}/api/admin/dates/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  })
  const data: DeleteResponse = await res.json()
  if (!data.success) throw new Error("Error al eliminar fecha")
}
