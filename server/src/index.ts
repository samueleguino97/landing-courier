import { Hono } from "hono";
import { cors } from "hono/cors";
import type {
	AdminLoginResponse,
	ApiResponse,
	ConvertQuoteToOrderInput,
	CreateArrivalDateInput,
	CreateQuoteInput,
	DateResponse,
	DatesResponse,
	DeleteResponse,
	OrderResponse,
	OrdersResponse,
	QuoteResponse,
	QuotesResponse,
	UpdateArrivalDateInput,
	UpdateOrderItemStatusInput,
	UpdateQuoteInput,
} from "shared/dist";
import {
	convertQuoteToOrder,
	createFlight,
	createQuote,
	deleteFlight,
	getFlightById,
	getOrderById,
	getQuoteById,
	initDatabase,
	listFlights,
	listOrders,
	listQuotes,
	syncOrderItemsWithFlightStatus,
	updateFlight,
	updateOrderItemStatus,
	updateQuote,
} from "./db";
import {
	createSession,
	deleteSession,
	validatePassword,
	validateSession,
} from "./utils/storage";

const app = new Hono();

app.use(cors());

let dbInitError: Error | null = null;
const dbInitPromise = initDatabase().catch((error) => {
	dbInitError =
		error instanceof Error ? error : new Error("No se pudo iniciar Postgres");
	console.error("Database init error:", dbInitError);
});

app.use("/api/*", async (c, next) => {
	await dbInitPromise;

	if (dbInitError) {
		return c.json(
			{
				success: false,
				message:
					"Error de base de datos. Verifica DATABASE_URL y que Postgres este activo.",
			},
			500,
		);
	}

	await next();
});

// Health check
app.get("/", (c) => {
	return c.text("Online Courier API");
});

app.get("/hello", async (c) => {
	const data: ApiResponse = {
		message: "Online Courier API Running!",
		success: true,
	};
	return c.json(data, { status: 200 });
});

// ============ PUBLIC ROUTES ============

// Extract weight from Amazon product page
app.post("/api/amazon/weight", async (c) => {
	try {
		const { url } = (await c.req.json()) as { url: string };

		if (!url || (!url.includes("amazon.com") && !url.includes("amzn"))) {
			return c.json({ success: false, message: "URL de Amazon invalida" }, 400);
		}

		// Fetch Amazon page with browser-like headers
		const response = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				Accept:
					"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
				"Accept-Language": "en-US,en;q=0.5",
				"Accept-Encoding": "gzip, deflate, br",
				Connection: "keep-alive",
				"Upgrade-Insecure-Requests": "1",
			},
		});

		if (!response.ok) {
			return c.json(
				{ success: false, message: "No se pudo acceder al producto" },
				400,
			);
		}

		const html = await response.text();

		// Try to extract weight from various places Amazon puts it
		let weight: string | null = null;
		let weightInPounds: number | null = null;

		// Pattern 1: Look for "Item Weight" in product details table
		const weightPatterns = [
			/Item Weight[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i,
			/Item Weight[:\s]*([0-9.]+\s*(?:pounds?|lbs?|ounces?|oz|kilograms?|kg|grams?|g))/i,
			/Product Dimensions[^<]*?([0-9.]+\s*(?:pounds?|lbs?))/i,
			/Weight[:\s]*([0-9.]+\s*(?:pounds?|lbs?|ounces?|oz|kilograms?|kg|grams?|g))/i,
			/"weight":\s*"([^"]+)"/i,
			/Shipping Weight[:\s]*([0-9.]+\s*(?:pounds?|lbs?|ounces?|oz))/i,
		];

		for (const pattern of weightPatterns) {
			const match = html.match(pattern);
			if (match && match[1]) {
				weight = match[1].trim();
				break;
			}
		}

		if (weight) {
			// Convert to pounds
			const numMatch = weight.match(/([0-9.]+)/);
			if (numMatch && numMatch[1]) {
				const num = parseFloat(numMatch[1]);
				const lowerWeight = weight.toLowerCase();

				if (lowerWeight.includes("ounce") || lowerWeight.includes("oz")) {
					weightInPounds = num / 16;
				} else if (
					lowerWeight.includes("kilogram") ||
					lowerWeight.includes("kg")
				) {
					weightInPounds = num * 2.20462;
				} else if (lowerWeight.includes("gram") || lowerWeight.includes(" g")) {
					weightInPounds = num / 453.592;
				} else {
					// Assume pounds
					weightInPounds = num;
				}

				// Round to 2 decimals
				weightInPounds = Math.round(weightInPounds * 100) / 100;
			}
		}

		// Try to extract product title
		let title: string | null = null;
		const titleMatch = html.match(/<span[^>]*id="productTitle"[^>]*>([^<]+)</i);
		if (titleMatch && titleMatch[1]) {
			title = titleMatch[1].trim();
		}

		// Try to extract category from breadcrumbs or department
		let category: string | null = null;
		const categoryPatterns = [
			/a-breadcrumb[^>]*>.*?<a[^>]*>([^<]+)/is,
			/"department":\s*"([^"]+)"/i,
			/nav-subnav[^>]*data-category="([^"]+)"/i,
			/<a[^>]*href="[^"]*\/b\/[^"]*"[^>]*>([^<]+)<\/a>/i,
		];

		for (const pattern of categoryPatterns) {
			const catMatch = html.match(pattern);
			if (catMatch && catMatch[1]) {
				category = catMatch[1].trim().toLowerCase();
				break;
			}
		}

		// Also check the full HTML for category keywords
		const htmlLower = html.toLowerCase();

		// Determine product type based on category or title
		let productType: "standard" | "premium" | "special" = "standard";
		let suggestedCategory: string = "otros";

		const titleLower = (title || "").toLowerCase();
		const searchText = `${category || ""} ${titleLower}`;

		if (searchText.includes("iphone") || htmlLower.includes('"iphone"')) {
			productType = "special";
			suggestedCategory = "iphone";
		} else if (
			searchText.includes("spare part") ||
			searchText.includes("replacement part") ||
			searchText.includes("replacement") ||
			searchText.includes("parts") ||
			searchText.includes("refaccion") ||
			searchText.includes("repuesto") ||
			htmlLower.includes('"replacement"')
		) {
			productType = "special";
			suggestedCategory = "repuestos";
		}
		// Check for premium categories ($15/lb)
		else if (
			searchText.includes("perfum") ||
			searchText.includes("cologne") ||
			searchText.includes("fragrance") ||
			searchText.includes("eau de") ||
			htmlLower.includes('"fragrance"') ||
			htmlLower.includes('"perfume"')
		) {
			productType = "premium";
			suggestedCategory = "perfumes";
		} else if (
			searchText.includes("vitamin") ||
			searchText.includes("supplement") ||
			searchText.includes("capsule") ||
			searchText.includes("tablet") ||
			searchText.includes("gummies") ||
			htmlLower.includes('"vitamins"')
		) {
			productType = "premium";
			suggestedCategory = "vitaminas";
		} else if (
			searchText.includes("shampoo") ||
			searchText.includes("conditioner")
		) {
			productType = "premium";
			suggestedCategory = "shampoo";
		} else if (
			searchText.includes("lotion") ||
			searchText.includes("body lotion") ||
			searchText.includes("locion")
		) {
			productType = "premium";
			suggestedCategory = "lociones";
		} else if (
			searchText.includes("cream") ||
			searchText.includes("moisturizer") ||
			searchText.includes("crema") ||
			searchText.includes("ointment")
		) {
			productType = "premium";
			suggestedCategory = "cremas";
		} else if (
			searchText.includes("skin care") ||
			searchText.includes("skincare") ||
			searchText.includes("serum") ||
			searchText.includes("cleanser") ||
			searchText.includes("face wash")
		) {
			productType = "premium";
			suggestedCategory = "skincare";
		} else if (
			searchText.includes("medical") ||
			searchText.includes("first aid") ||
			searchText.includes("surgical") ||
			searchText.includes("medico") ||
			searchText.includes("hospital") ||
			htmlLower.includes('"medical supplies"')
		) {
			productType = "premium";
			suggestedCategory = "suministros_medicos";
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
			suggestedCategory = "ropa";
		} else if (
			searchText.includes("shoe") ||
			searchText.includes("sneaker") ||
			searchText.includes("boot") ||
			searchText.includes("sandal") ||
			searchText.includes("zapato") ||
			htmlLower.includes('"shoes"')
		) {
			suggestedCategory = "ropa"; // Ropa, Zapatos, Bolsos
		} else if (
			searchText.includes("bag") ||
			searchText.includes("purse") ||
			searchText.includes("handbag") ||
			searchText.includes("backpack") ||
			searchText.includes("bolso") ||
			htmlLower.includes('"handbags"')
		) {
			suggestedCategory = "ropa"; // Ropa, Zapatos, Bolsos
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
			productType = "premium";
			suggestedCategory = "skincare";
		}

		if (weightInPounds) {
			return c.json({
				success: true,
				data: {
					weight: weightInPounds,
					weightRaw: weight,
					title: title || null,
					productType,
					suggestedCategory,
				},
			});
		}

		return c.json(
			{
				success: false,
				message:
					"No se pudo encontrar el peso del producto. Por favor ingresalo manualmente.",
				data: {
					title,
					productType,
					suggestedCategory,
				},
			},
			200,
		);
	} catch (error) {
		console.error("Error fetching Amazon:", error);
		return c.json(
			{ success: false, message: "Error al obtener datos del producto" },
			500,
		);
	}
});

// Get all upcoming dates (public)
app.get("/api/dates", async (c) => {
	try {
		const dates = await listFlights();
		const response: DatesResponse = {
			success: true,
			data: dates,
		};
		return c.json(response);
	} catch (error) {
		return c.json({ success: false, message: "Error al cargar vuelos" }, 500);
	}
});

// Create quote from landing
app.post("/api/quotes", async (c) => {
	try {
		const body = (await c.req.json()) as CreateQuoteInput;

		if (!body.customerName?.trim() || !body.customerWhatsapp?.trim()) {
			return c.json(
				{
					success: false,
					message: "Nombre y WhatsApp son requeridos",
				},
				400,
			);
		}

		if (!Array.isArray(body.items) || body.items.length === 0) {
			return c.json(
				{
					success: false,
					message: "Debes agregar al menos un producto",
				},
				400,
			);
		}

		const quote = await createQuote(body);
		const response: QuoteResponse = {
			success: true,
			data: quote,
		};

		return c.json(response, 201);
	} catch (error) {
		return c.json(
			{ success: false, message: "Error al crear cotizacion" },
			500,
		);
	}
});

// ============ AUTH ROUTES ============

app.post("/api/admin/login", async (c) => {
	try {
		const body = await c.req.json();
		const { password } = body as { password: string };

		if (!password) {
			const response: AdminLoginResponse = {
				success: false,
				message: "Contrasena requerida",
			};
			return c.json(response, 400);
		}

		if (!validatePassword(password)) {
			const response: AdminLoginResponse = {
				success: false,
				message: "Contrasena incorrecta",
			};
			return c.json(response, 401);
		}

		const token = createSession();
		const response: AdminLoginResponse = {
			success: true,
			token,
		};
		return c.json(response);
	} catch (error) {
		const response: AdminLoginResponse = {
			success: false,
			message: "Error en el servidor",
		};
		return c.json(response, 500);
	}
});

app.post("/api/admin/logout", async (c) => {
	const authHeader = c.req.header("Authorization");
	if (authHeader?.startsWith("Bearer ")) {
		const token = authHeader.slice(7);
		deleteSession(token);
	}
	return c.json({ success: true });
});

app.get("/api/admin/verify", (c) => {
	const authHeader = c.req.header("Authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		return c.json({ valid: false }, 401);
	}

	const token = authHeader.slice(7);
	const valid = validateSession(token);

	if (!valid) {
		return c.json({ valid: false }, 401);
	}

	return c.json({ valid: true });
});

// ============ PROTECTED ADMIN ROUTES ============

const authMiddleware = async (c: any, next: any) => {
	const authHeader = c.req.header("Authorization");

	if (!authHeader?.startsWith("Bearer ")) {
		return c.json({ success: false, message: "No autorizado" }, 401);
	}

	const token = authHeader.slice(7);
	if (!validateSession(token)) {
		return c.json({ success: false, message: "Sesion expirada" }, 401);
	}

	await next();
};

// Flights
app.get("/api/admin/dates", authMiddleware, async (c) => {
	try {
		const dates = await listFlights();
		const response: DatesResponse = {
			success: true,
			data: dates,
		};
		return c.json(response);
	} catch (error) {
		return c.json({ success: false, message: "Error al cargar vuelos" }, 500);
	}
});

app.post("/api/admin/dates", authMiddleware, async (c) => {
	try {
		const body = (await c.req.json()) as CreateArrivalDateInput;

		if (!body.date || !body.departureDate || !body.location || !body.status) {
			return c.json(
				{
					success: false,
					message: "Campos requeridos: departureDate, date, location, status",
				},
				400,
			);
		}

		const created = await createFlight(body);
		const response: DateResponse = {
			success: true,
			data: created,
		};
		return c.json(response, 201);
	} catch (error) {
		return c.json({ success: false, message: "Error al crear vuelo" }, 500);
	}
});

app.put("/api/admin/dates/:id", authMiddleware, async (c) => {
	try {
		const id = c.req.param("id");
		const body = (await c.req.json()) as UpdateArrivalDateInput;

		const existing = await getFlightById(id);
		if (!existing) {
			return c.json({ success: false, message: "Vuelo no encontrado" }, 404);
		}

		const updated = await updateFlight(id, body);
		if (!updated) {
			return c.json({ success: false, message: "Vuelo no encontrado" }, 404);
		}

		if (body.status && body.status !== existing.status) {
			await syncOrderItemsWithFlightStatus(id, body.status);
		}

		const response: DateResponse = {
			success: true,
			data: updated,
		};
		return c.json(response);
	} catch (error) {
		return c.json(
			{ success: false, message: "Error al actualizar vuelo" },
			500,
		);
	}
});

app.delete("/api/admin/dates/:id", authMiddleware, async (c) => {
	try {
		const id = c.req.param("id");
		const deleted = await deleteFlight(id);

		if (!deleted) {
			return c.json({ success: false, message: "Vuelo no encontrado" }, 404);
		}

		const response: DeleteResponse = {
			success: true,
			message: "Vuelo eliminado correctamente",
		};
		return c.json(response);
	} catch (error) {
		const errorCode = (error as { code?: string }).code;
		if (errorCode === "23503") {
			return c.json(
				{
					success: false,
					message: "No puedes eliminar un vuelo que ya tiene pedidos",
				},
				409,
			);
		}

		return c.json({ success: false, message: "Error al eliminar vuelo" }, 500);
	}
});

// Quotes
app.get("/api/admin/quotes", authMiddleware, async (c) => {
	try {
		const quotes = await listQuotes();
		const response: QuotesResponse = {
			success: true,
			data: quotes,
		};
		return c.json(response);
	} catch (error) {
		return c.json(
			{ success: false, message: "Error al cargar cotizaciones" },
			500,
		);
	}
});

app.get("/api/admin/quotes/:id", authMiddleware, async (c) => {
	try {
		const id = c.req.param("id");
		const quote = await getQuoteById(id);

		if (!quote) {
			return c.json(
				{ success: false, message: "Cotizacion no encontrada" },
				404,
			);
		}

		const response: QuoteResponse = {
			success: true,
			data: quote,
		};
		return c.json(response);
	} catch (error) {
		return c.json(
			{ success: false, message: "Error al cargar cotizacion" },
			500,
		);
	}
});

app.put("/api/admin/quotes/:id", authMiddleware, async (c) => {
	try {
		const id = c.req.param("id");
		const body = (await c.req.json()) as UpdateQuoteInput;

		const existing = await getQuoteById(id);
		if (!existing) {
			return c.json(
				{ success: false, message: "Cotizacion no encontrada" },
				404,
			);
		}

		if (existing.status === "converted") {
			return c.json(
				{
					success: false,
					message: "La cotizacion ya fue convertida a pedido",
				},
				400,
			);
		}

		const updated = await updateQuote(id, body);
		if (!updated) {
			return c.json(
				{ success: false, message: "Cotizacion no encontrada" },
				404,
			);
		}

		const response: QuoteResponse = {
			success: true,
			data: updated,
		};
		return c.json(response);
	} catch (error) {
		return c.json(
			{ success: false, message: "Error al actualizar cotizacion" },
			500,
		);
	}
});

app.post("/api/admin/quotes/:id/convert", authMiddleware, async (c) => {
	try {
		const id = c.req.param("id");
		const body = (await c.req.json()) as ConvertQuoteToOrderInput;

		if (!body.flightId) {
			return c.json(
				{ success: false, message: "Debes seleccionar un vuelo" },
				400,
			);
		}

		const order = await convertQuoteToOrder(id, body.flightId);
		const response: OrderResponse = {
			success: true,
			data: order,
		};
		return c.json(response, 201);
	} catch (error) {
		const message = (error as Error).message;

		if (message === "QUOTE_NOT_FOUND") {
			return c.json(
				{ success: false, message: "Cotizacion no encontrada" },
				404,
			);
		}

		if (message === "FLIGHT_NOT_FOUND") {
			return c.json({ success: false, message: "Vuelo no encontrado" }, 404);
		}

		if (message === "QUOTE_ALREADY_CONVERTED") {
			return c.json(
				{ success: false, message: "Esta cotizacion ya fue convertida" },
				400,
			);
		}

		return c.json(
			{ success: false, message: "Error al convertir cotizacion" },
			500,
		);
	}
});

// Orders
app.get("/api/admin/orders", authMiddleware, async (c) => {
	try {
		const orders = await listOrders();
		const response: OrdersResponse = {
			success: true,
			data: orders,
		};
		return c.json(response);
	} catch (error) {
		return c.json({ success: false, message: "Error al cargar pedidos" }, 500);
	}
});

app.get("/api/admin/orders/:id", authMiddleware, async (c) => {
	try {
		const id = c.req.param("id");
		const order = await getOrderById(id);

		if (!order) {
			return c.json({ success: false, message: "Pedido no encontrado" }, 404);
		}

		const response: OrderResponse = {
			success: true,
			data: order,
		};
		return c.json(response);
	} catch (error) {
		return c.json({ success: false, message: "Error al cargar pedido" }, 500);
	}
});

app.patch(
	"/api/admin/orders/:orderId/items/:itemId/status",
	authMiddleware,
	async (c) => {
		try {
			const orderId = c.req.param("orderId");
			const itemId = c.req.param("itemId");
			const body = (await c.req.json()) as UpdateOrderItemStatusInput;

			if (!body.status) {
				return c.json({ success: false, message: "Estado requerido" }, 400);
			}

			const validStatuses = ["pending", "in_flight", "arrived", "completed"];
			if (!validStatuses.includes(body.status)) {
				return c.json({ success: false, message: "Estado invalido" }, 400);
			}

			const order = await updateOrderItemStatus(orderId, itemId, body.status);
			if (!order) {
				return c.json(
					{ success: false, message: "Pedido o producto no encontrado" },
					404,
				);
			}

			const response: OrderResponse = {
				success: true,
				data: order,
			};
			return c.json(response);
		} catch (error) {
			return c.json(
				{ success: false, message: "Error al actualizar estado del producto" },
				500,
			);
		}
	},
);

export default app;
