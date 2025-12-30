import { useEffect, useState } from "react"
import { Container, Section } from "@/components/ui/container"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SERVER_URL } from "@/lib/constants"
import type { ArrivalDate, DatesResponse } from "shared"

const statusLabels: Record<string, { label: string; variant: "success" | "warning" | "info" }> = {
  programado: { label: "Programado", variant: "info" },
  en_camino: { label: "En Camino", variant: "warning" },
  llego: { label: "Llego", variant: "success" }
}

export function Arrivals() {
  const [dates, setDates] = useState<ArrivalDate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDates() {
      try {
        const res = await fetch(`${SERVER_URL}/api/dates`)
        const data: DatesResponse = await res.json()
        if (data.success) {
          const upcoming = data.data
            .filter(d => new Date(d.date) >= new Date() || d.status !== "llego")
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 4)
          setDates(upcoming)
        }
      } catch (error) {
        console.error("Error fetching dates:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDates()
  }, [])

  if (loading) {
    return (
      <Section id="fechas" className="bg-background">
        <Container>
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </Container>
      </Section>
    )
  }

  if (dates.length === 0) {
    return null
  }

  return (
    <Section id="fechas" className="bg-background">
      <Container>
        <div className="text-center mb-16 animate-fade-in-up">
          <span className="inline-block bg-secondary px-4 py-1.5 rounded-full text-sm font-medium text-secondary-foreground mb-4">
            Proximas Llegadas
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Fechas de Arribo
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Estas son las proximas fechas en las que los paquetes llegaran a Bolivia.
            Contactanos para incluir tu envio!
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dates.map((arrival, index) => {
            const status = statusLabels[arrival.status]
            const date = new Date(arrival.date)

            return (
              <Card
                key={arrival.id}
                className="card-hover border-0 shadow-md overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="bg-gradient-primary h-2" />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant={status.variant}>
                      {status.label}
                    </Badge>
                    <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                  </div>

                  <div className="mb-4">
                    <p className="text-3xl font-bold text-primary">
                      {date.getDate()}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {date.toLocaleDateString("es-BO", { month: "long", year: "numeric" })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <MapPinIcon className="w-4 h-4 text-accent" />
                    <span className="font-medium">{arrival.location}</span>
                  </div>

                  {arrival.notes && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {arrival.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </Container>
    </Section>
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

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )
}
