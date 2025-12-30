import { useState } from "react"
import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { WHATSAPP_URL, SERVER_URL, PRICING } from "@/lib/constants"

type CategoryType = "standard" | "premium"

interface QuotedProduct {
  id: string
  name: string
  amazonLink?: string
  weight: number
  category: string
  categoryLabel: string
  categoryType: CategoryType
  pricePerPound: number
  totalPrice: number
}

const CATEGORIES = [
  { id: "ropa", label: "Ropa, Zapatos, Bolsos", type: "standard" as CategoryType },
  { id: "maquillaje", label: "Maquillajes", type: "standard" as CategoryType },
  { id: "documentos", label: "Documentos", type: "standard" as CategoryType },
  { id: "otros", label: "Otros", type: "standard" as CategoryType },
  { id: "vitaminas", label: "Vitaminas", type: "premium" as CategoryType },
  { id: "perfumes", label: "Perfumes", type: "premium" as CategoryType },
]

export function Quoter() {
  const [amazonLink, setAmazonLink] = useState("")
  const [weight, setWeight] = useState("")
  const [category, setCategory] = useState<string>("ropa")
  const [productName, setProductName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [fetchMessage, setFetchMessage] = useState("")
  const [products, setProducts] = useState<QuotedProduct[]>([])

  const selectedCategory = CATEGORIES.find(c => c.id === category)
  const pricePerPound = selectedCategory?.type === "premium" ? PRICING.premium.price : PRICING.standard.price

  // Computed values for multi-product summary
  const totalWeight = products.reduce((sum, p) => sum + p.weight, 0)
  const totalPrice = products.reduce((sum, p) => sum + p.totalPrice, 0)

  const fetchAmazonWeight = async (url: string) => {
    if (!url.includes('amazon.com') && !url.includes('amzn')) return

    setIsLoading(true)
    setFetchMessage("Buscando peso del producto...")

    try {
      const response = await fetch(`${SERVER_URL}/api/amazon/weight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      const data = await response.json()

      if (data.success && data.data?.weight) {
        setWeight(data.data.weight.toString())
        setProductName(data.data.title || "")
        // Auto-select category if detected
        if (data.data.suggestedCategory) {
          setCategory(data.data.suggestedCategory)
        }
        const categoryLabel = data.data.suggestedCategory
          ? CATEGORIES.find(c => c.id === data.data.suggestedCategory)?.label
          : null
        setFetchMessage(`Peso: ${data.data.weightRaw}${categoryLabel ? ` | Categoria: ${categoryLabel}` : ''}`)
      } else {
        setFetchMessage(data.message || "No se encontro el peso. Ingresalo manualmente.")
        if (data.data?.title) {
          setProductName(data.data.title)
        }
        // Still try to set category even if weight not found
        if (data.data?.suggestedCategory) {
          setCategory(data.data.suggestedCategory)
        }
      }
    } catch {
      setFetchMessage("Error al buscar. Ingresa el peso manualmente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setAmazonLink(url)
    setFetchMessage("")

    if (url.length > 20 && (url.includes('amazon.com/') || url.includes('amzn.'))) {
      fetchAmazonWeight(url)
    }
  }

  const resetForm = () => {
    setAmazonLink("")
    setWeight("")
    setCategory("ropa")
    setProductName("")
    setFetchMessage("")
  }

  const handleAddProduct = () => {
    const weightNum = parseFloat(weight)
    if (weightNum <= 0) return

    const selectedCat = CATEGORIES.find(c => c.id === category)
    if (!selectedCat) return

    const price = selectedCat.type === "premium" ? PRICING.premium.price : PRICING.standard.price

    const newProduct: QuotedProduct = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: productName || (amazonLink ? "Producto de Amazon" : "Producto personalizado"),
      amazonLink: amazonLink || undefined,
      weight: weightNum,
      category: selectedCat.id,
      categoryLabel: selectedCat.label,
      categoryType: selectedCat.type,
      pricePerPound: price,
      totalPrice: weightNum * price,
    }

    setProducts(prev => [...prev, newProduct])
    resetForm()
  }

  const handleRemoveProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId))
  }

  const handleWhatsAppContact = () => {
    if (products.length === 0) {
      const whatsappUrl = `${WHATSAPP_URL}&text=${encodeURIComponent("Hola! Me interesa cotizar un envio.")}`
      window.open(whatsappUrl, "_blank")
      return
    }

    const productLines = products.map((p, index) =>
      `${index + 1}. ${p.name}
   - Categoria: ${p.categoryLabel}
   - Peso: ${p.weight} lb
   - Costo: $${p.totalPrice.toFixed(2)}`
    ).join("\n\n")

    const message = `Hola! Me interesa cotizar un envio con los siguientes productos:

${productLines}

--------------------------
RESUMEN:
- Total productos: ${products.length}
- Peso total: ${totalWeight.toFixed(2)} lb
- Costo total estimado: $${totalPrice.toFixed(2)}

Por favor, confirmar disponibilidad.`

    const whatsappUrl = `${WHATSAPP_URL}&text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const isValidAmazonLink = (link: string) => {
    return link === "" || link.includes("amazon.com") || link.includes("amzn")
  }

  return (
    <section id="cotizador" className="py-20 bg-gradient-to-b from-background to-muted/30">
      <Container>
        <div className="text-center mb-12 animate-fade-in-up">
          <span className="inline-block bg-[#3B9AC4]/15 text-[#3B9AC4] px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            Cotizador Rapido
          </span>
          <h2 className="text-3xl md:text-4xl font-bold italic text-foreground mb-4">
            Cotiza tu <span className="text-[#3B9AC4]">Envio</span> al Instante
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pega el link de tu producto de Amazon, selecciona la categoria y obtene un estimado del costo.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-2xl mx-auto mb-8 grid grid-cols-2 gap-4 animate-fade-in-up">
          <div className="bg-[#3B9AC4]/10 border-2 border-[#3B9AC4]/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold italic text-[#3B9AC4]">${PRICING.standard.price}/lb</p>
            <p className="text-sm text-muted-foreground mt-1">Ropa, Zapatos, Bolsos, Maquillajes, Documentos</p>
          </div>
          <div className="bg-[#F9A826]/10 border-2 border-[#F9A826]/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold italic text-[#F9A826]">${PRICING.premium.price}/lb</p>
            <p className="text-sm text-muted-foreground mt-1">Vitaminas, Perfumes</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-2 border-[#3B9AC4]/20 animate-fade-in-up delay-100">
            <CardContent className="p-6 md:p-8">
              <div className="space-y-6">
                {/* Amazon Link Input */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Link del Producto (Amazon) - Opcional
                  </label>
                  <div className="relative">
                    <AmazonIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FF9900]" />
                    <Input
                      type="url"
                      placeholder="https://www.amazon.com/dp/..."
                      value={amazonLink}
                      onChange={handleLinkChange}
                      className={`pl-10 h-12 ${!isValidAmazonLink(amazonLink) ? "border-red-500" : ""}`}
                      disabled={isLoading}
                    />
                    {isLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <LoadingSpinner className="w-5 h-5 text-[#3B9AC4]" />
                      </div>
                    )}
                  </div>
                  {!isValidAmazonLink(amazonLink) && (
                    <p className="text-red-500 text-sm mt-1">Por favor ingresa un link valido de Amazon</p>
                  )}
                  {fetchMessage && (
                    <p className={`text-sm mt-1 ${fetchMessage.includes('encontrado') ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {fetchMessage}
                    </p>
                  )}
                  {productName && (
                    <p className="text-sm mt-1 text-foreground font-medium truncate">
                      {productName}
                    </p>
                  )}
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tipo de Producto
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-xl text-sm font-semibold transition-all ${
                          category === cat.id
                            ? cat.type === "premium"
                              ? "bg-[#F9A826] text-white"
                              : "bg-[#3B9AC4] text-white"
                            : "bg-muted hover:bg-muted/80 text-foreground"
                        }`}
                      >
                        {cat.label}
                        <span className={`block text-xs mt-0.5 ${category === cat.id ? "text-white/80" : "text-muted-foreground"}`}>
                          ${cat.type === "premium" ? PRICING.premium.price : PRICING.standard.price}/lb
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weight Input */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Peso del Producto (libras)
                  </label>
                  <div className="relative">
                    <ScaleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Ej: 2.5"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      min="0.1"
                      step="0.1"
                      className="pl-10 h-12"
                    />
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">
                    Puedes encontrar el peso en la descripcion del producto en Amazon
                  </p>
                </div>

                {/* Add Product Button */}
                <Button
                  onClick={handleAddProduct}
                  disabled={!weight || parseFloat(weight) <= 0}
                  className="w-full h-12 bg-[#3B9AC4] hover:bg-[#2A8BA8] text-white font-bold text-lg rounded-xl"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Agregar Producto
                </Button>

                {/* Product List */}
                {products.length > 0 && (
                  <div className="mt-6 space-y-3 animate-fade-in-up">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">
                        Productos en tu cotizacion ({products.length})
                      </h3>
                      {products.length > 1 && (
                        <button
                          onClick={() => setProducts([])}
                          className="text-sm text-muted-foreground hover:text-destructive transition-colors"
                        >
                          Limpiar todo
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {product.name}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className={product.categoryType === "premium" ? "text-[#F9A826]" : "text-[#3B9AC4]"}>
                                {product.categoryLabel}
                              </span>
                              <span>|</span>
                              <span>{product.weight} lb</span>
                              <span>|</span>
                              <span>${product.pricePerPound}/lb</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-3">
                            <span className="font-semibold text-foreground whitespace-nowrap">
                              ${product.totalPrice.toFixed(2)}
                            </span>
                            <button
                              onClick={() => handleRemoveProduct(product.id)}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              aria-label="Eliminar producto"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quote Summary */}
                {products.length > 0 && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-[#3B9AC4]/10 to-[#F9A826]/10 rounded-2xl border border-[#3B9AC4]/30 animate-fade-in-up">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Costo Total Estimado</p>
                      <p className="text-5xl font-bold italic text-[#3B9AC4] mb-2">
                        ${totalPrice.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {products.length} producto{products.length > 1 ? "s" : ""} | {totalWeight.toFixed(2)} lb total
                      </p>

                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                          onClick={handleWhatsAppContact}
                          className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold rounded-xl"
                        >
                          <WhatsAppIcon className="w-5 h-5 mr-2" />
                          Confirmar por WhatsApp
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground mt-4">
                        * El precio final puede variar segun dimensiones y peso volumetrico
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up delay-200">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-[#3B9AC4]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <TruckIcon className="w-6 h-6 text-[#3B9AC4]" />
              </div>
              <p className="font-semibold text-foreground">Envio Seguro</p>
              <p className="text-sm text-muted-foreground">Paquete asegurado</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-[#F9A826]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <ClockIcon className="w-6 h-6 text-[#F9A826]" />
              </div>
              <p className="font-semibold text-foreground">Entrega Rapida</p>
              <p className="text-sm text-muted-foreground">15-20 dias habiles</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-[#25D366]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckIcon className="w-6 h-6 text-[#25D366]" />
              </div>
              <p className="font-semibold text-foreground">Sin Sorpresas</p>
              <p className="text-sm text-muted-foreground">Precio transparente</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

// Icons
function AmazonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.493.13.066.112.063.233-.012.363-.075.13-.202.242-.382.337-2.505 1.312-5.278 1.969-8.318 1.969-4.097 0-7.903-.997-11.416-2.988-.264-.157-.396-.315-.396-.473 0-.086.03-.162.088-.226l.67-.391zM21.33 17.34c-.262-.187-.551-.282-.866-.282-.098 0-.235.014-.412.044l-.37.063c-.166.03-.368.067-.607.115-.24.05-.445.086-.615.113-.17.027-.37.05-.6.072-.23.02-.41.03-.541.03-.523 0-.882-.109-1.076-.329-.193-.219-.29-.544-.29-.974 0-.268.032-.543.097-.824.065-.282.146-.523.243-.723.098-.2.203-.387.318-.563.114-.176.223-.324.324-.444.102-.12.194-.218.277-.294.083-.076.15-.128.198-.154.05-.027.073-.04.073-.04.049-.027.097-.055.145-.083.049-.029.086-.053.111-.074.025-.02.047-.041.063-.063.016-.023.024-.048.024-.076 0-.076-.049-.117-.148-.117-.027 0-.066.005-.117.014-.052.01-.092.02-.12.032l-.248.07c-.102.03-.252.078-.451.148-.199.07-.38.137-.546.2-.164.062-.342.13-.531.2-.19.072-.34.125-.452.159-.11.033-.218.063-.322.087-.104.024-.189.037-.252.037-.142 0-.25-.043-.324-.13-.073-.088-.11-.2-.11-.337 0-.21.077-.4.233-.57.155-.169.409-.31.76-.42.33-.1.64-.17.926-.21.286-.04.551-.06.796-.06.26 0 .525.023.796.07.27.048.545.13.825.248.28.117.5.28.66.49.16.21.24.47.24.79 0 .21-.04.42-.11.61-.07.19-.18.38-.31.56-.14.18-.28.35-.43.5-.15.16-.32.31-.49.45-.17.14-.34.27-.49.37-.16.1-.32.2-.47.27-.16.08-.29.14-.4.18-.1.04-.21.08-.31.1-.1.03-.17.05-.23.06-.06.01-.1.02-.12.02-.03 0-.04 0-.04-.01 0-.02.02-.04.07-.06.04-.02.08-.04.13-.06.05-.02.1-.05.16-.08.05-.03.11-.07.17-.1l.21-.13c.07-.04.14-.09.21-.15.07-.06.14-.12.21-.19.07-.07.14-.14.21-.22.07-.08.14-.17.21-.26.07-.1.13-.2.19-.3.05-.1.1-.21.14-.32.04-.11.07-.22.1-.33.02-.12.04-.24.04-.37 0-.19-.04-.35-.11-.48-.08-.13-.17-.24-.29-.31-.12-.08-.25-.13-.39-.16-.15-.03-.29-.05-.44-.05-.23 0-.48.04-.75.11-.27.08-.52.18-.75.3-.24.12-.45.26-.63.43-.18.17-.31.36-.4.56-.09.2-.13.42-.13.64 0 .15.02.29.07.41.04.12.1.23.17.32.07.1.16.18.26.24.1.07.2.12.31.16.11.04.22.07.33.09.11.02.21.03.3.03.13 0 .26-.02.4-.05.14-.03.28-.08.43-.14.14-.07.28-.14.41-.23.13-.09.25-.18.36-.28.11-.1.21-.21.3-.33.09-.11.17-.23.24-.35.07-.12.12-.24.16-.36.04-.12.07-.24.08-.36.02-.12.03-.23.03-.33 0-.19-.03-.36-.1-.51-.07-.16-.17-.29-.3-.39-.13-.1-.28-.17-.45-.22-.17-.05-.36-.07-.55-.07-.22 0-.46.03-.71.1-.25.07-.49.16-.71.28-.23.12-.43.26-.6.42-.18.16-.32.33-.42.52-.11.19-.18.39-.23.6-.05.21-.07.42-.07.63 0 .22.03.44.09.66.06.22.16.42.29.6.14.18.31.33.52.45.21.12.46.2.75.25.08.01.22.02.42.02.2 0 .44-.01.72-.04.28-.03.56-.07.85-.12.29-.05.56-.1.82-.16.25-.05.45-.1.58-.14l.19-.05c.03-.01.08-.02.14-.04.06-.01.11-.02.14-.02.06 0 .12.02.16.05.04.03.07.08.07.14z"/>
    </svg>
  )
}

function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/>
      <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/>
      <path d="M7 21h10"/>
      <path d="M12 3v18"/>
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
    </svg>
  )
}

function CalculatorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <line x1="8" y1="6" x2="16" y2="6"/>
      <line x1="16" y1="14" x2="16" y2="18"/>
      <line x1="8" y1="10" x2="8" y2="10"/>
      <line x1="12" y1="10" x2="12" y2="10"/>
      <line x1="16" y1="10" x2="16" y2="10"/>
      <line x1="8" y1="14" x2="8" y2="14"/>
      <line x1="12" y1="14" x2="12" y2="14"/>
      <line x1="8" y1="18" x2="8" y2="18"/>
      <line x1="12" y1="18" x2="12" y2="18"/>
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

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17h4V5H2v12h3"/>
      <path d="M20 17h2v-3.34a4 4 0 00-1.17-2.83L19 9h-5v8h1"/>
      <circle cx="7.5" cy="17.5" r="2.5"/>
      <circle cx="17.5" cy="17.5" r="2.5"/>
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
    </svg>
  )
}
