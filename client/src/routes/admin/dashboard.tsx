import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { Container } from "@/components/ui/container"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { isAuthenticated, logout, verifyToken } from "@/lib/auth"
import { fetchAdminDates, createDate, updateDate, deleteDate } from "@/lib/api"
import type { ArrivalDate, ArrivalDateStatus, CreateArrivalDateInput } from "shared"

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
})

const statusOptions: { value: ArrivalDateStatus; label: string }[] = [
  { value: "programado", label: "Programado" },
  { value: "en_camino", label: "En Camino" },
  { value: "llego", label: "Llego" }
]

const statusLabels: Record<string, { label: string; variant: "success" | "warning" | "info" }> = {
  programado: { label: "Programado", variant: "info" },
  en_camino: { label: "En Camino", variant: "warning" },
  llego: { label: "Llego", variant: "success" }
}

function AdminDashboard() {
  const navigate = useNavigate()
  const [dates, setDates] = useState<ArrivalDate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateArrivalDateInput>({
    date: "",
    location: "",
    status: "programado",
    notes: ""
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function checkAuth() {
      if (!isAuthenticated()) {
        navigate({ to: "/admin" })
        return
      }

      const valid = await verifyToken()
      if (!valid) {
        navigate({ to: "/admin" })
        return
      }

      loadDates()
    }

    checkAuth()
  }, [navigate])

  async function loadDates() {
    try {
      const data = await fetchAdminDates()
      setDates(data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
    } catch {
      setError("Error al cargar fechas")
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate({ to: "/admin" })
  }

  function resetForm() {
    setFormData({
      date: "",
      location: "",
      status: "programado",
      notes: ""
    })
    setEditingId(null)
    setShowForm(false)
    setError("")
  }

  function handleEdit(date: ArrivalDate) {
    setFormData({
      date: date.date,
      location: date.location,
      status: date.status,
      notes: date.notes || ""
    })
    setEditingId(date.id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      if (editingId) {
        await updateDate(editingId, formData)
      } else {
        await createDate(formData)
      }
      await loadDates()
      resetForm()
    } catch (err) {
      setError("Error al guardar")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Estas seguro de eliminar esta fecha?")) return

    try {
      await deleteDate(id)
      await loadDates()
    } catch {
      setError("Error al eliminar")
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("es-BO", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <Container>
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <PackageIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold">Online Courier</h1>
                <p className="text-xs text-muted-foreground">Panel de Admin</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogoutIcon className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </Container>
      </header>

      <Container className="py-8">
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dates.length}</p>
                  <p className="text-sm text-muted-foreground">Fechas Totales</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <PlaneIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {dates.filter(d => d.status === "en_camino").length}
                  </p>
                  <p className="text-sm text-muted-foreground">En Camino</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {dates.filter(d => d.status === "llego").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Completados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Dates List */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Fechas de Llegada</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    resetForm()
                    setShowForm(true)
                  }}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4">
                    {error}
                  </div>
                )}

                {dates.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay fechas registradas</p>
                    <p className="text-sm">Agrega la primera fecha de llegada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dates.map(date => {
                      const status = statusLabels[date.status]
                      return (
                        <div
                          key={date.id}
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                              <span className="text-lg font-bold text-primary">
                                {new Date(date.date).getDate()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{date.location}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(date.date)}
                              </p>
                              {date.notes && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {date.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={status.variant}>{status.label}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(date)}
                            >
                              <EditIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(date.id)}
                            >
                              <TrashIcon className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Form */}
          <div>
            {showForm && (
              <Card className="border-0 shadow-sm sticky top-24">
                <CardHeader>
                  <CardTitle>
                    {editingId ? "Editar Fecha" : "Nueva Fecha"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Fecha de Llegada
                      </label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Ubicacion
                      </label>
                      <Input
                        placeholder="Ej: La Paz, Santa Cruz..."
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Estado
                      </label>
                      <Select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value as ArrivalDateStatus })}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Notas (opcional)
                      </label>
                      <Textarea
                        placeholder="Informacion adicional..."
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : editingId ? (
                          "Actualizar"
                        ) : (
                          "Guardar"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {!showForm && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <PlusIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Agrega una nueva fecha de llegada
                  </p>
                  <Button onClick={() => setShowForm(true)}>
                    Agregar Fecha
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Container>
    </div>
  )
}

// Icons
function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  )
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function PlaneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  )
}
