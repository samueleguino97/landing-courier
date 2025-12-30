import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type {
  ApiResponse,
  ArrivalDate,
  CreateArrivalDateInput,
  UpdateArrivalDateInput,
  DatesResponse,
  DateResponse,
  DeleteResponse,
  AdminLoginResponse
} from 'shared/dist'
import {
  readDates,
  writeDates,
  generateId,
  validatePassword,
  createSession,
  validateSession,
  deleteSession
} from './utils/storage'

const app = new Hono()

app.use(cors())

// Health check
app.get('/', (c) => {
  return c.text('Online Courier API')
})

app.get('/hello', async (c) => {
  const data: ApiResponse = {
    message: "Online Courier API Running!",
    success: true
  }
  return c.json(data, { status: 200 })
})

// ============ PUBLIC ROUTES ============

// Extract weight from Amazon product page
app.post('/api/amazon/weight', async (c) => {
  try {
    const { url } = await c.req.json() as { url: string }

    if (!url || (!url.includes('amazon.com') && !url.includes('amzn'))) {
      return c.json({ success: false, message: 'URL de Amazon invalida' }, 400)
    }

    // Fetch Amazon page with browser-like headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    })

    if (!response.ok) {
      return c.json({ success: false, message: 'No se pudo acceder al producto' }, 400)
    }

    const html = await response.text()

    // Try to extract weight from various places Amazon puts it
    let weight: string | null = null
    let weightInPounds: number | null = null

    // Pattern 1: Look for "Item Weight" in product details table
    const weightPatterns = [
      /Item Weight[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i,
      /Item Weight[:\s]*([0-9.]+\s*(?:pounds?|lbs?|ounces?|oz|kilograms?|kg|grams?|g))/i,
      /Product Dimensions[^<]*?([0-9.]+\s*(?:pounds?|lbs?))/i,
      /Weight[:\s]*([0-9.]+\s*(?:pounds?|lbs?|ounces?|oz|kilograms?|kg|grams?|g))/i,
      /"weight":\s*"([^"]+)"/i,
      /Shipping Weight[:\s]*([0-9.]+\s*(?:pounds?|lbs?|ounces?|oz))/i,
    ]

    for (const pattern of weightPatterns) {
      const match = html.match(pattern)
      if (match && match[1]) {
        weight = match[1].trim()
        break
      }
    }

    if (weight) {
      // Convert to pounds
      const numMatch = weight.match(/([0-9.]+)/)
      if (numMatch && numMatch[1]) {
        const num = parseFloat(numMatch[1])
        const lowerWeight = weight.toLowerCase()

        if (lowerWeight.includes('ounce') || lowerWeight.includes('oz')) {
          weightInPounds = num / 16
        } else if (lowerWeight.includes('kilogram') || lowerWeight.includes('kg')) {
          weightInPounds = num * 2.20462
        } else if (lowerWeight.includes('gram') || lowerWeight.includes(' g')) {
          weightInPounds = num / 453.592
        } else {
          // Assume pounds
          weightInPounds = num
        }

        // Round to 2 decimals
        weightInPounds = Math.round(weightInPounds * 100) / 100
      }
    }

    // Try to extract product title
    let title: string | null = null
    const titleMatch = html.match(/<span[^>]*id="productTitle"[^>]*>([^<]+)</i)
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim()
    }

    // Try to extract category from breadcrumbs or department
    let category: string | null = null
    const categoryPatterns = [
      /a-breadcrumb[^>]*>.*?<a[^>]*>([^<]+)/is,
      /"department":\s*"([^"]+)"/i,
      /nav-subnav[^>]*data-category="([^"]+)"/i,
      /<a[^>]*href="[^"]*\/b\/[^"]*"[^>]*>([^<]+)<\/a>/i,
    ]

    for (const pattern of categoryPatterns) {
      const catMatch = html.match(pattern)
      if (catMatch && catMatch[1]) {
        category = catMatch[1].trim().toLowerCase()
        break
      }
    }

    // Also check the full HTML for category keywords
    const htmlLower = html.toLowerCase()

    // Determine product type based on category or title
    let productType: "standard" | "premium" = "standard"
    let suggestedCategory: string = "otros"

    const titleLower = (title || "").toLowerCase()
    const searchText = `${category || ""} ${titleLower}`

    // Check for premium categories ($15/lb)
    if (
      searchText.includes("vitamin") ||
      searchText.includes("supplement") ||
      searchText.includes("health") && (searchText.includes("capsule") || searchText.includes("tablet") || searchText.includes("gummies")) ||
      htmlLower.includes('"vitamins"') ||
      htmlLower.includes('health-and-beauty')
    ) {
      productType = "premium"
      suggestedCategory = "vitaminas"
    } else if (
      searchText.includes("perfum") ||
      searchText.includes("cologne") ||
      searchText.includes("fragrance") ||
      searchText.includes("eau de") ||
      htmlLower.includes('"fragrance"') ||
      htmlLower.includes('"perfume"')
    ) {
      productType = "premium"
      suggestedCategory = "perfumes"
    }
    // Check for standard categories ($10/lb)
    else if (
      searchText.includes("cloth") ||
      searchText.includes("shirt") ||
      searchText.includes("dress") ||
      searchText.includes("pants") ||
      searchText.includes("jacket") ||
      searchText.includes("sweater") ||
      htmlLower.includes('"clothing"') ||
      htmlLower.includes('"apparel"')
    ) {
      suggestedCategory = "ropa"
    } else if (
      searchText.includes("shoe") ||
      searchText.includes("sneaker") ||
      searchText.includes("boot") ||
      searchText.includes("sandal") ||
      searchText.includes("zapato") ||
      htmlLower.includes('"shoes"')
    ) {
      suggestedCategory = "ropa" // Ropa, Zapatos, Bolsos
    } else if (
      searchText.includes("bag") ||
      searchText.includes("purse") ||
      searchText.includes("handbag") ||
      searchText.includes("backpack") ||
      searchText.includes("bolso") ||
      htmlLower.includes('"handbags"')
    ) {
      suggestedCategory = "ropa" // Ropa, Zapatos, Bolsos
    } else if (
      searchText.includes("makeup") ||
      searchText.includes("cosmetic") ||
      searchText.includes("lipstick") ||
      searchText.includes("mascara") ||
      searchText.includes("foundation") ||
      searchText.includes("maquillaje") ||
      htmlLower.includes('"makeup"') ||
      htmlLower.includes('"beauty"')
    ) {
      suggestedCategory = "maquillaje"
    }

    if (weightInPounds) {
      return c.json({
        success: true,
        data: {
          weight: weightInPounds,
          weightRaw: weight,
          title: title || null,
          productType,
          suggestedCategory
        }
      })
    }

    return c.json({
      success: false,
      message: 'No se pudo encontrar el peso del producto. Por favor ingresalo manualmente.',
      data: {
        title,
        productType,
        suggestedCategory
      }
    }, 200)

  } catch (error) {
    console.error('Error fetching Amazon:', error)
    return c.json({ success: false, message: 'Error al obtener datos del producto' }, 500)
  }
})

// Get all upcoming dates (public)
app.get('/api/dates', (c) => {
  const dates = readDates()
  const response: DatesResponse = {
    success: true,
    data: dates
  }
  return c.json(response)
})

// ============ AUTH ROUTES ============

// Admin login
app.post('/api/admin/login', async (c) => {
  try {
    const body = await c.req.json()
    const { password } = body as { password: string }

    if (!password) {
      const response: AdminLoginResponse = {
        success: false,
        message: 'Contrasena requerida'
      }
      return c.json(response, 400)
    }

    if (!validatePassword(password)) {
      const response: AdminLoginResponse = {
        success: false,
        message: 'Contrasena incorrecta'
      }
      return c.json(response, 401)
    }

    const token = createSession()
    const response: AdminLoginResponse = {
      success: true,
      token
    }
    return c.json(response)
  } catch (error) {
    const response: AdminLoginResponse = {
      success: false,
      message: 'Error en el servidor'
    }
    return c.json(response, 500)
  }
})

// Admin logout
app.post('/api/admin/logout', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    deleteSession(token)
  }
  return c.json({ success: true })
})

// Verify token
app.get('/api/admin/verify', (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ valid: false }, 401)
  }

  const token = authHeader.slice(7)
  const valid = validateSession(token)

  if (!valid) {
    return c.json({ valid: false }, 401)
  }

  return c.json({ valid: true })
})

// ============ PROTECTED ADMIN ROUTES ============

// Auth middleware for admin routes
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, message: 'No autorizado' }, 401)
  }

  const token = authHeader.slice(7)
  if (!validateSession(token)) {
    return c.json({ success: false, message: 'Sesion expirada' }, 401)
  }

  await next()
}

// Get all dates (admin)
app.get('/api/admin/dates', authMiddleware, (c) => {
  const dates = readDates()
  const response: DatesResponse = {
    success: true,
    data: dates
  }
  return c.json(response)
})

// Create new date
app.post('/api/admin/dates', authMiddleware, async (c) => {
  try {
    const body = await c.req.json() as CreateArrivalDateInput

    if (!body.date || !body.location || !body.status) {
      return c.json({ success: false, message: 'Campos requeridos: date, location, status' }, 400)
    }

    const dates = readDates()
    const newDate: ArrivalDate = {
      id: generateId(),
      date: body.date,
      location: body.location,
      status: body.status,
      notes: body.notes || '',
      createdAt: new Date().toISOString()
    }

    dates.push(newDate)
    writeDates(dates)

    const response: DateResponse = {
      success: true,
      data: newDate
    }
    return c.json(response, 201)
  } catch (error) {
    return c.json({ success: false, message: 'Error al crear fecha' }, 500)
  }
})

// Update date
app.put('/api/admin/dates/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json() as UpdateArrivalDateInput

    const dates = readDates()
    const existingDate = dates.find(d => d.id === id)

    if (!existingDate) {
      return c.json({ success: false, message: 'Fecha no encontrada' }, 404)
    }

    const updatedDate: ArrivalDate = {
      id: existingDate.id,
      createdAt: existingDate.createdAt,
      date: body.date ?? existingDate.date,
      location: body.location ?? existingDate.location,
      status: body.status ?? existingDate.status,
      notes: body.notes !== undefined ? body.notes : existingDate.notes
    }

    const index = dates.findIndex(d => d.id === id)
    dates[index] = updatedDate

    writeDates(dates)

    const response: DateResponse = {
      success: true,
      data: updatedDate
    }
    return c.json(response)
  } catch (error) {
    return c.json({ success: false, message: 'Error al actualizar fecha' }, 500)
  }
})

// Delete date
app.delete('/api/admin/dates/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')

    const dates = readDates()
    const index = dates.findIndex(d => d.id === id)

    if (index === -1) {
      return c.json({ success: false, message: 'Fecha no encontrada' }, 404)
    }

    dates.splice(index, 1)
    writeDates(dates)

    const response: DeleteResponse = {
      success: true,
      message: 'Fecha eliminada correctamente'
    }
    return c.json(response)
  } catch (error) {
    return c.json({ success: false, message: 'Error al eliminar fecha' }, 500)
  }
})

export default app
