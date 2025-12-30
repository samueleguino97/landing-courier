import { Container, Section } from "@/components/ui/container"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const services = [
  {
    icon: PackageIcon,
    title: "Paquetes",
    description: "Enviamos todo tipo de paquetes de manera segura. Desde regalos hasta compras en linea.",
    color: "#7EC8E3"
  },
  {
    icon: DocumentIcon,
    title: "Documentos",
    description: "Documentos importantes, contratos, certificados. Entrega segura y confidencial.",
    color: "#F9B208"
  },
  {
    icon: PhoneIcon,
    title: "Electronicos",
    description: "Telefonos, laptops, tablets y mas. Empaque especial para proteger tus dispositivos.",
    color: "#7EC8E3"
  },
  {
    icon: MedicineIcon,
    title: "Medicinas",
    description: "Medicamentos y productos de salud con el cuidado que requieren.",
    color: "#F9B208"
  },
  {
    icon: ShirtIcon,
    title: "Ropa y Accesorios",
    description: "Moda y accesorios desde USA. Tus compras favoritas directo a Bolivia.",
    color: "#7EC8E3"
  },
  {
    icon: StarIcon,
    title: "Articulos Especiales",
    description: "Articulos fragiles o de valor. Manejo especial y empaque premium.",
    color: "#F9B208"
  }
]

export function Services() {
  return (
    <Section id="servicios" className="bg-background">
      <Container>
        <div className="text-center mb-16 animate-fade-in-up">
          <span className="inline-block bg-secondary px-4 py-1.5 rounded-full text-sm font-medium text-secondary-foreground mb-4">
            Nuestros Servicios
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Que Puedes Enviar?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ofrecemos un servicio completo para todo tipo de envios.
            Tu paquete llega seguro a Bolivia.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <Card
              key={service.title}
              className="card-hover border-0 shadow-md animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${service.color}20` }}
                >
                  <service.icon className="w-7 h-7" style={{ color: service.color }} />
                </div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
                <CardDescription className="text-base">
                  {service.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  )
}

function PackageIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  )
}

function DocumentIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  )
}

function PhoneIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  )
}

function MedicineIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  )
}

function ShirtIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/>
    </svg>
  )
}

function StarIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}
