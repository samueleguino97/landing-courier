import { useState } from "react"
import { Container, Section } from "@/components/ui/container"

const faqs = [
  {
    question: "Cuanto tiempo tarda en llegar mi paquete?",
    answer: "El tiempo de entrega depende de la fecha de envio programada. Normalmente realizamos envios cada 2-3 semanas. Una vez que tu paquete llega a nuestra direccion en USA, lo incluimos en el proximo envio disponible. Te avisamos la fecha exacta de llegada a Bolivia."
  },
  {
    question: "Que puedo enviar?",
    answer: "Puedes enviar paquetes, documentos, electronicos, medicinas, ropa, accesorios y articulos especiales. Hay algunas restricciones para productos perecederos, materiales peligrosos y articulos prohibidos por ley. Consultanos por WhatsApp para confirmar si tu articulo puede enviarse."
  },
  {
    question: "Cuanto cuesta el envio?",
    answer: "El costo depende del peso y tamano del paquete. Ofrecemos tarifas competitivas calculadas por libra. Contactanos por WhatsApp con los detalles de tu paquete y te daremos una cotizacion exacta sin compromiso."
  },
  {
    question: "Como pago el servicio?",
    answer: "Aceptamos diferentes formas de pago tanto en USA como en Bolivia. Puedes pagar en efectivo, transferencia bancaria o por aplicaciones de pago. Te damos todas las opciones al coordinar tu envio."
  },
  {
    question: "Donde recibo mi paquete en Bolivia?",
    answer: "Actualmente entregamos en las principales ciudades de Bolivia incluyendo La Paz, Santa Cruz, y Cochabamba. Te contactamos para coordinar la entrega en un punto conveniente para ti."
  },
  {
    question: "Mi paquete esta asegurado?",
    answer: "Si, todos los envios incluyen cobertura basica. Para articulos de alto valor, ofrecemos opciones de seguro adicional. Garantizamos que tu paquete llegue en perfectas condiciones."
  }
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <Section id="faq" className="bg-background">
      <Container>
        <div className="text-center mb-16 animate-fade-in-up">
          <span className="inline-block bg-secondary px-4 py-1.5 rounded-full text-sm font-medium text-secondary-foreground mb-4">
            Preguntas Frecuentes
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tienes Dudas?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Aqui respondemos las preguntas mas comunes. Si tienes otra consulta,
            escribenos por WhatsApp!
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-card rounded-xl shadow-sm overflow-hidden animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-semibold pr-4">{faq.question}</span>
                <ChevronIcon
                  className={`w-5 h-5 shrink-0 text-muted-foreground transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  openIndex === index ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-6 text-muted-foreground">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}
