// WhatsApp Configuration
export const WHATSAPP_NUMBER = "17039864047"

export const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hola! Me interesa el servicio de courier de USA a Bolivia. Me pueden dar mas informacion?"
)

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`

// Instagram
export const INSTAGRAM_URL = "https://instagram.com/onlinecourier.bo"
export const INSTAGRAM_HANDLE = "@onlinecourier.bo"

// Locations
export const ORIGIN_LOCATION = "Lorton, VA"
export const DESTINATIONS = ["Santa Cruz", "Cochabamba"]

// Pricing
export const PRICING = {
  standard: {
    price: 10,
    label: "$10/libra",
    categories: ["Ropa", "Zapatos", "Bolsos", "Maquillajes", "Documentos", "Otros"]
  },
  premium: {
    price: 15,
    label: "$15/libra",
    categories: ["Vitaminas", "Perfumes"]
  }
}

// API Configuration
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000"
