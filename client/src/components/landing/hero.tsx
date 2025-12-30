import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { WHATSAPP_URL, ORIGIN_LOCATION, DESTINATIONS, INSTAGRAM_URL, INSTAGRAM_HANDLE } from "@/lib/constants"
import logoImg from "@/assets/logo.jpg"

export function Hero() {
  return (
    <div className="bg-gradient-hero min-h-[90vh] flex items-center relative overflow-hidden">
      {/* Swooping curve decorations - matching logo style */}
      <SwoopCurve className="absolute -left-20 top-1/4 w-[600px] h-[300px] opacity-20" />
      <SwoopCurve className="absolute -right-40 bottom-1/4 w-[500px] h-[250px] opacity-15 rotate-180" />

      {/* Additional decorative elements */}
      <div className="absolute top-20 right-20 w-24 h-24 bg-[#F9A826]/15 rounded-full blur-2xl" />
      <div className="absolute bottom-40 left-20 w-32 h-32 bg-[#3B9AC4]/20 rounded-full blur-3xl" />

      <Container>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="animate-fade-in-up">
            {/* Logo */}
            <img src={logoImg} alt="Online Courier" className="h-24 md:h-32 mb-6 object-contain" />

            <span className="inline-block bg-[#3B9AC4]/15 text-[#3B9AC4] px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              {ORIGIN_LOCATION} → {DESTINATIONS.join(" / ")}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold italic text-foreground leading-tight mb-6">
              <span className="text-[#F9A826]">ONLINE</span>{" "}
              <span className="text-[#3B9AC4]">COURIER</span>
            </h1>
            <p className="text-xl md:text-2xl font-semibold italic text-[#3B9AC4] mb-4">
              Envio de Encomiendas
            </p>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg">
              Conectamos familias y negocios con un servicio de courier rapido,
              seguro y a precios justos. Tu paquete en buenas manos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-[#25D366] hover:bg-[#20bd5a] text-white text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                asChild
              >
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="w-6 h-6 mr-2" />
                  Contactar por WhatsApp
                </a>
              </Button>
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                asChild
              >
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                  <InstagramIcon className="w-6 h-6 mr-2" />
                  {INSTAGRAM_HANDLE}
                </a>
              </Button>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="mt-4 text-lg px-8 py-6 rounded-xl"
              asChild
            >
              <a href="#cotizador">
                Cotizar Envio
              </a>
            </Button>

            {/* Trust badges */}
            <div className="flex items-center gap-6 mt-10 pt-10 border-t border-border/50">
              <div className="text-center">
                <p className="text-2xl font-bold italic text-[#3B9AC4]">500+</p>
                <p className="text-sm text-muted-foreground">Envios Exitosos</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold italic text-[#F9A826]">5+</p>
                <p className="text-sm text-muted-foreground">Anos de Experiencia</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold italic text-[#3B9AC4]">100%</p>
                <p className="text-sm text-muted-foreground">Garantizado</p>
              </div>
            </div>
          </div>

          {/* Visual Element */}
          <div className="hidden lg:flex justify-center items-center animate-fade-in-up delay-200">
            <div className="relative">
              {/* Package illustration */}
              <div className="w-80 h-80 bg-gradient-logo rounded-3xl shadow-2xl flex items-center justify-center animate-float">
                <div className="text-center text-white p-8">
                  <PackageIcon className="w-24 h-24 mx-auto mb-4 opacity-90" />
                  <p className="text-xl font-bold italic">Tu paquete</p>
                  <p className="text-sm opacity-80">De puerta a puerta</p>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-white p-4 rounded-xl shadow-lg animate-float delay-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm font-semibold italic">En camino</span>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-xl shadow-lg animate-float delay-300">
                <div className="flex items-center gap-2">
                  <PlaneIcon className="w-5 h-5 text-[#3B9AC4]" />
                  <span className="text-sm font-semibold italic">USA → BOL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
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

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}

function SwoopCurve({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 200" fill="none" preserveAspectRatio="none">
      <path
        d="M-50,150 Q50,50 150,100 T350,80 T550,120"
        stroke="#3B9AC4"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M-30,170 Q70,70 170,120 T370,100 T570,140"
        stroke="#3B9AC4"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
    </svg>
  )
}
