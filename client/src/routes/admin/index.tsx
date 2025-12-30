import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { Container } from "@/components/ui/container"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { login, isAuthenticated } from "@/lib/auth"

export const Route = createFileRoute("/admin/")({
  component: AdminLogin,
})

function AdminLogin() {
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) {
      navigate({ to: "/admin/dashboard" })
    }
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await login(password)

    if (result.success) {
      navigate({ to: "/admin/dashboard" })
    } else {
      setError(result.message || "Error de autenticacion")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Container className="max-w-md">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LockIcon className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Panel de Administracion</CardTitle>
            <CardDescription>
              Ingresa tu contrasena para acceder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Contrasena"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90"
                disabled={loading || !password}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Ingresar"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t text-center">
              <a
                href="/"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Volver a la pagina principal
              </a>
            </div>
          </CardContent>
        </Card>
      </Container>
    </div>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  )
}
