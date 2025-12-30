import { Container, Section } from "@/components/ui/container"

const benefits = [
  {
    icon: ShieldIcon,
    title: "Envio Seguro",
    description: "Tu paquete esta protegido durante todo el viaje. Garantizamos entrega en perfectas condiciones.",
    color: "#7EC8E3"
  },
  {
    icon: DollarIcon,
    title: "Precios Justos",
    description: "Tarifas competitivas y transparentes. Sin costos ocultos ni sorpresas.",
    color: "#F9B208"
  },
  {
    icon: ClockIcon,
    title: "Fechas Puntuales",
    description: "Cumplimos con las fechas programadas. Sabras exactamente cuando llega tu paquete.",
    color: "#7EC8E3"
  },
  {
    icon: HeartIcon,
    title: "Atencion Personal",
    description: "Servicio personalizado via WhatsApp. Estamos para resolver todas tus dudas.",
    color: "#F9B208"
  }
]

export function Benefits() {
  return (
    <Section id="beneficios" className="bg-muted/50">
      <Container>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Visual */}
          <div className="relative animate-fade-in-up">
            <div className="relative bg-gradient-primary rounded-3xl p-8 md:p-12">
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-accent/30 rounded-full blur-2xl" />
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/30 rounded-full blur-2xl" />

              <div className="relative z-10 text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-6">
                  Por Que Elegirnos?
                </h3>
                <p className="text-lg opacity-90 mb-8">
                  Somos tu puente confiable entre Estados Unidos y Bolivia.
                  Anos de experiencia nos respaldan.
                </p>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-3xl font-bold">500+</p>
                    <p className="text-sm opacity-80">Envios realizados</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-3xl font-bold">5+</p>
                    <p className="text-sm opacity-80">Anos de experiencia</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-3xl font-bold">100%</p>
                    <p className="text-sm opacity-80">Satisfaccion</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-3xl font-bold">24h</p>
                    <p className="text-sm opacity-80">Respuesta</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Benefits list */}
          <div className="space-y-6">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className="flex gap-4 p-4 rounded-xl bg-card shadow-sm card-hover animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${benefit.color}20` }}
                >
                  <benefit.icon className="w-6 h-6" style={{ color: benefit.color }} />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">{benefit.title}</h4>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  )
}

function ShieldIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  )
}

function DollarIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  )
}

function ClockIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function HeartIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  )
}
