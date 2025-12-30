import { Container } from "@/components/ui/container"
import { WHATSAPP_URL, WHATSAPP_NUMBER, INSTAGRAM_URL, INSTAGRAM_HANDLE, ORIGIN_LOCATION, DESTINATIONS } from "@/lib/constants"
import logoImg from "@/assets/logo.jpg"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#1a2e35] text-white py-16">
      <Container>
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <img src={logoImg} alt="Online Courier" className="h-20 mb-4 object-contain bg-white rounded-lg p-2" />
            <p className="text-gray-400 mb-6">
              Tu servicio de courier confiable de Estados Unidos a Bolivia.
              Conectamos familias y negocios con envios seguros. Make It Easy!
            </p>
            <div className="flex gap-3">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                <WhatsAppIcon className="w-5 h-5" />
                WhatsApp
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                <InstagramIcon className="w-5 h-5" />
                Instagram
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Enlaces</h4>
            <ul className="space-y-3">
              <li>
                <a href="#cotizador" className="text-gray-400 hover:text-white transition-colors">
                  Cotizador
                </a>
              </li>
              <li>
                <a href="#servicios" className="text-gray-400 hover:text-white transition-colors">
                  Servicios
                </a>
              </li>
              <li>
                <a href="#como-funciona" className="text-gray-400 hover:text-white transition-colors">
                  Como Funciona
                </a>
              </li>
              <li>
                <a href="#fechas" className="text-gray-400 hover:text-white transition-colors">
                  Fechas de Llegada
                </a>
              </li>
              <li>
                <a href="#faq" className="text-gray-400 hover:text-white transition-colors">
                  Preguntas Frecuentes
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contacto</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#25D366]/20 rounded-lg flex items-center justify-center shrink-0">
                  <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">WhatsApp</p>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:text-[#25D366] transition-colors"
                  >
                    +1 {WHATSAPP_NUMBER.slice(1, 4)} {WHATSAPP_NUMBER.slice(4, 7)} {WHATSAPP_NUMBER.slice(7)}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <InstagramIcon className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Instagram</p>
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:text-pink-400 transition-colors"
                  >
                    {INSTAGRAM_HANDLE}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
                  <PlaneIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Ruta</p>
                  <p className="font-medium">{ORIGIN_LOCATION} → {DESTINATIONS.join(" / ")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            {currentYear} Online Courier. Todos los derechos reservados.
          </p>
          <p className="text-gray-500 text-sm">
            Servicio de courier {ORIGIN_LOCATION} - {DESTINATIONS.join(" / ")}
          </p>
        </div>
      </Container>
    </footer>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
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

function PlaneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
    </svg>
  )
}
