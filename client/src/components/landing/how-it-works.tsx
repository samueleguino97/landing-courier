import { Container, Section } from "@/components/ui/container"
import { WHATSAPP_URL } from "@/lib/constants"

const steps = [
  {
    number: "01",
    title: "Contactanos",
    description: "Escribenos por WhatsApp para coordinar tu envio. Te damos toda la informacion que necesitas.",
    icon: MessageIcon,
    color: "#7EC8E3"
  },
  {
    number: "02",
    title: "Envia tu Paquete",
    description: "Envia tu paquete a nuestra direccion en Estados Unidos. Nosotros lo recibimos y preparamos.",
    icon: BoxIcon,
    color: "#F9B208"
  },
  {
    number: "03",
    title: "Recibe en Bolivia",
    description: "Tu paquete llega a Bolivia en la fecha programada. Te avisamos para la entrega.",
    icon: CheckCircleIcon,
    color: "#25D366"
  }
]

export function HowItWorks() {
  return (
    <Section id="como-funciona" className="bg-muted/50">
      <Container>
        <div className="text-center mb-16 animate-fade-in-up">
          <span className="inline-block bg-accent/20 px-4 py-1.5 rounded-full text-sm font-medium text-accent-foreground mb-4">
            Proceso Simple
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Como Funciona?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            En solo 3 simples pasos tu paquete llega de USA a Bolivia.
            Sin complicaciones.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-20 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-[#7EC8E3] via-[#F9B208] to-[#25D366]" />

          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative text-center animate-fade-in-up"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Step circle */}
              <div
                className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center relative z-10 shadow-lg"
                style={{ backgroundColor: step.color }}
              >
                <step.icon className="w-8 h-8 text-white" />
              </div>

              {/* Number badge */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white z-20"
                style={{ backgroundColor: step.color }}
              >
                {step.number.slice(-1)}
              </div>

              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16 animate-fade-in-up delay-500">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            <WhatsAppIcon className="w-6 h-6" />
            Empezar Ahora
          </a>
        </div>
      </Container>
    </Section>
  )
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  )
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}
