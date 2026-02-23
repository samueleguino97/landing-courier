import { existsSync, readFileSync } from "fs";
import { join } from "path";
import postgres from "postgres";
import type {
	ArrivalDate,
	CreateArrivalDateInput,
	CreateQuoteInput,
	FlightStatus,
	Order,
	OrderItem,
	OrderItemStatus,
	Quote,
	QuoteItem,
	QuoteItemInput,
	QuoteStatus,
	UpdateArrivalDateInput,
	UpdateQuoteInput,
} from "shared/dist";

const DATABASE_URL =
	process.env.DATABASE_URL ||
	"postgres://postgres:postgres@localhost:5432/courier";

const LEGACY_DATES_PATH = join(import.meta.dir, "../data/dates.json");

const sql = postgres(DATABASE_URL, {
	prepare: false,
	max: 10,
});

type FlightRow = {
	id: string;
	departure_date: string;
	arrival_date: string;
	location: string;
	status: FlightStatus;
	notes: string | null;
	created_at: string;
};

type QuoteRow = {
	id: string;
	customer_name: string;
	customer_whatsapp: string;
	customer_notes: string | null;
	status: QuoteStatus;
	subtotal: string;
	converted_order_id: string | null;
	created_at: string;
	updated_at: string;
};

type QuoteItemRow = {
	id: string;
	quote_id: string;
	name: string;
	description: string | null;
	amazon_link: string | null;
	weight: string;
	quantity: number;
	category: string;
	category_label: string;
	category_type: "standard" | "premium" | "special";
	pricing_mode: "per_pound" | "per_unit" | "starting_from";
	unit_price: string;
	price_label: string;
	total_price: string;
	created_at: string;
};

type OrderRow = {
	id: string;
	quote_id: string;
	flight_id: string;
	customer_name: string;
	customer_whatsapp: string;
	customer_notes: string | null;
	status: OrderItemStatus;
	subtotal: string;
	created_at: string;
	updated_at: string;
};

type OrderItemRow = {
	id: string;
	order_id: string;
	quote_item_id: string | null;
	name: string;
	description: string | null;
	amazon_link: string | null;
	weight: string;
	quantity: number;
	category: string;
	category_label: string;
	category_type: "standard" | "premium" | "special";
	pricing_mode: "per_pound" | "per_unit" | "starting_from";
	unit_price: string;
	price_label: string;
	total_price: string;
	status: OrderItemStatus;
	created_at: string;
	updated_at: string;
};

function createId(): string {
	return crypto.randomUUID().replace(/-/g, "");
}

function toFlight(row: FlightRow): ArrivalDate {
	return {
		id: row.id,
		departureDate: row.departure_date,
		date: row.arrival_date,
		location: row.location,
		status: row.status,
		notes: row.notes || "",
		createdAt: new Date(row.created_at).toISOString(),
	};
}

function toQuoteItem(row: QuoteItemRow): QuoteItem {
	return {
		id: row.id,
		name: row.name,
		description: row.description || undefined,
		amazonLink: row.amazon_link || undefined,
		weight: Number(row.weight),
		quantity: row.quantity,
		category: row.category,
		categoryLabel: row.category_label,
		categoryType: row.category_type,
		pricingMode: row.pricing_mode,
		unitPrice: Number(row.unit_price),
		priceLabel: row.price_label,
		totalPrice: Number(row.total_price),
	};
}

function toQuote(row: QuoteRow, items: QuoteItem[]): Quote {
	return {
		id: row.id,
		customerName: row.customer_name,
		customerWhatsapp: row.customer_whatsapp,
		customerNotes: row.customer_notes || undefined,
		status: row.status,
		items,
		subtotal: Number(row.subtotal),
		convertedOrderId: row.converted_order_id,
		createdAt: new Date(row.created_at).toISOString(),
		updatedAt: new Date(row.updated_at).toISOString(),
	};
}

function toOrderItem(row: OrderItemRow): OrderItem {
	return {
		id: row.id,
		quoteItemId: row.quote_item_id || undefined,
		name: row.name,
		description: row.description || undefined,
		amazonLink: row.amazon_link || undefined,
		weight: Number(row.weight),
		quantity: row.quantity,
		category: row.category,
		categoryLabel: row.category_label,
		categoryType: row.category_type,
		pricingMode: row.pricing_mode,
		unitPrice: Number(row.unit_price),
		priceLabel: row.price_label,
		totalPrice: Number(row.total_price),
		status: row.status,
	};
}

function toOrder(row: OrderRow, items: OrderItem[]): Order {
	return {
		id: row.id,
		quoteId: row.quote_id,
		flightId: row.flight_id,
		customerName: row.customer_name,
		customerWhatsapp: row.customer_whatsapp,
		customerNotes: row.customer_notes || undefined,
		status: row.status,
		items,
		subtotal: Number(row.subtotal),
		createdAt: new Date(row.created_at).toISOString(),
		updatedAt: new Date(row.updated_at).toISOString(),
	};
}

function roundCurrency(value: number): number {
	return Math.round(value * 100) / 100;
}

function calculateItemTotal(item: QuoteItemInput): number {
	if (item.pricingMode === "per_pound") {
		return roundCurrency(item.weight * item.unitPrice);
	}
	return roundCurrency(item.quantity * item.unitPrice);
}

function normalizeQuoteItems(items: QuoteItemInput[]): QuoteItemInput[] {
	return items.map((item) => ({
		...item,
		weight: Number.isFinite(item.weight) ? item.weight : 0,
		quantity: Number.isFinite(item.quantity) ? item.quantity : 0,
		unitPrice: Number.isFinite(item.unitPrice) ? item.unitPrice : 0,
		totalPrice:
			typeof item.totalPrice === "number" && Number.isFinite(item.totalPrice)
				? roundCurrency(item.totalPrice)
				: calculateItemTotal(item),
	}));
}

function calculateSubtotal(items: QuoteItemInput[]): number {
	return roundCurrency(
		items.reduce((sum, item) => sum + (item.totalPrice || 0), 0),
	);
}

function normalizeLegacyFlightStatus(status: string | undefined): FlightStatus {
	if (status === "en_camino") return "in_flight";
	if (status === "llego") return "arrived";
	if (status === "in_flight" || status === "arrived") return status;
	return "pending";
}

function mapFlightToItemStatus(status: FlightStatus): OrderItemStatus {
	if (status === "in_flight") return "in_flight";
	if (status === "arrived") return "arrived";
	return "pending";
}

function deriveOrderStatus(items: OrderItemStatus[]): OrderItemStatus {
	if (items.length === 0) return "pending";
	if (items.every((status) => status === "completed")) return "completed";
	if (items.every((status) => status === "arrived" || status === "completed")) {
		return "arrived";
	}
	if (items.some((status) => status === "in_flight")) return "in_flight";
	return "pending";
}

async function seedLegacyFlights() {
	const countRows = await sql<{ count: number }[]>`
		SELECT COUNT(*)::int AS count
		FROM flights
	`;

	if ((countRows[0]?.count || 0) > 0) {
		return;
	}

	if (!existsSync(LEGACY_DATES_PATH)) {
		return;
	}

	const raw = readFileSync(LEGACY_DATES_PATH, "utf-8");
	const parsed = JSON.parse(raw) as { dates?: Array<Record<string, unknown>> };
	const legacyDates = parsed.dates || [];

	for (const date of legacyDates) {
		const id = String(date.id || createId());
		const departureDate = String(date.departureDate || date.date || "");
		const arrivalDate = String(date.date || "");
		const location = String(date.location || "Sin ubicacion");
		const notes = String(date.notes || "");
		const status = normalizeLegacyFlightStatus(
			String(date.status || "pending"),
		);
		const createdAt = String(date.createdAt || new Date().toISOString());

		if (!departureDate || !arrivalDate) {
			continue;
		}

		await sql`
			INSERT INTO flights (
				id,
				departure_date,
				arrival_date,
				location,
				status,
				notes,
				created_at
			)
			VALUES (
				${id},
				${departureDate},
				${arrivalDate},
				${location},
				${status},
				${notes},
				${createdAt}
			)
			ON CONFLICT (id) DO NOTHING
		`;
	}
}

export async function initDatabase() {
	await sql.unsafe(`
		CREATE TABLE IF NOT EXISTS flights (
			id TEXT PRIMARY KEY,
			departure_date DATE NOT NULL,
			arrival_date DATE NOT NULL,
			location TEXT NOT NULL,
			status TEXT NOT NULL CHECK (status IN ('pending', 'in_flight', 'arrived')),
			notes TEXT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`);

	await sql.unsafe(`
		CREATE TABLE IF NOT EXISTS quotes (
			id TEXT PRIMARY KEY,
			customer_name TEXT NOT NULL,
			customer_whatsapp TEXT NOT NULL,
			customer_notes TEXT,
			status TEXT NOT NULL CHECK (status IN ('new', 'reviewing', 'negotiated', 'approved', 'rejected', 'converted')),
			subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
			converted_order_id TEXT UNIQUE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`);

	await sql.unsafe(`
		CREATE TABLE IF NOT EXISTS quote_items (
			id TEXT PRIMARY KEY,
			quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
			name TEXT NOT NULL,
			description TEXT,
			amazon_link TEXT,
			weight NUMERIC(12, 3) NOT NULL DEFAULT 0,
			quantity INTEGER NOT NULL DEFAULT 0,
			category TEXT NOT NULL,
			category_label TEXT NOT NULL,
			category_type TEXT NOT NULL CHECK (category_type IN ('standard', 'premium', 'special')),
			pricing_mode TEXT NOT NULL CHECK (pricing_mode IN ('per_pound', 'per_unit', 'starting_from')),
			unit_price NUMERIC(12, 2) NOT NULL,
			price_label TEXT NOT NULL,
			total_price NUMERIC(12, 2) NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`);

	await sql.unsafe(`
		CREATE TABLE IF NOT EXISTS orders (
			id TEXT PRIMARY KEY,
			quote_id TEXT NOT NULL UNIQUE REFERENCES quotes(id),
			flight_id TEXT NOT NULL REFERENCES flights(id),
			customer_name TEXT NOT NULL,
			customer_whatsapp TEXT NOT NULL,
			customer_notes TEXT,
			status TEXT NOT NULL CHECK (status IN ('pending', 'in_flight', 'arrived', 'completed')),
			subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`);

	await sql.unsafe(`
		CREATE TABLE IF NOT EXISTS order_items (
			id TEXT PRIMARY KEY,
			order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
			quote_item_id TEXT,
			name TEXT NOT NULL,
			description TEXT,
			amazon_link TEXT,
			weight NUMERIC(12, 3) NOT NULL DEFAULT 0,
			quantity INTEGER NOT NULL DEFAULT 0,
			category TEXT NOT NULL,
			category_label TEXT NOT NULL,
			category_type TEXT NOT NULL CHECK (category_type IN ('standard', 'premium', 'special')),
			pricing_mode TEXT NOT NULL CHECK (pricing_mode IN ('per_pound', 'per_unit', 'starting_from')),
			unit_price NUMERIC(12, 2) NOT NULL,
			price_label TEXT NOT NULL,
			total_price NUMERIC(12, 2) NOT NULL,
			status TEXT NOT NULL CHECK (status IN ('pending', 'in_flight', 'arrived', 'completed')),
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`);

	await sql.unsafe(
		`CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);`,
	);
	await sql.unsafe(
		`CREATE INDEX IF NOT EXISTS idx_orders_flight_id ON orders(flight_id);`,
	);
	await sql.unsafe(
		`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);`,
	);

	await seedLegacyFlights();
}

export async function listFlights(): Promise<ArrivalDate[]> {
	const rows = await sql<FlightRow[]>`
		SELECT id, departure_date, arrival_date, location, status, notes, created_at
		FROM flights
		ORDER BY arrival_date ASC, created_at ASC
	`;

	return rows.map(toFlight);
}

export async function getFlightById(id: string): Promise<ArrivalDate | null> {
	const rows = await sql<FlightRow[]>`
		SELECT id, departure_date, arrival_date, location, status, notes, created_at
		FROM flights
		WHERE id = ${id}
		LIMIT 1
	`;

	const row = rows[0];
	return row ? toFlight(row) : null;
}

export async function createFlight(
	input: CreateArrivalDateInput,
): Promise<ArrivalDate> {
	const id = createId();
	const rows = await sql<FlightRow[]>`
		INSERT INTO flights (
			id,
			departure_date,
			arrival_date,
			location,
			status,
			notes
		)
		VALUES (
			${id},
			${input.departureDate},
			${input.date},
			${input.location},
			${input.status},
			${input.notes || ""}
		)
		RETURNING id, departure_date, arrival_date, location, status, notes, created_at
	`;

	const created = rows[0];
	if (!created) {
		throw new Error("No se pudo crear vuelo");
	}

	return toFlight(created);
}

export async function updateFlight(
	id: string,
	input: UpdateArrivalDateInput,
): Promise<ArrivalDate | null> {
	const rows = await sql<FlightRow[]>`
		UPDATE flights
		SET
			departure_date = COALESCE(${input.departureDate ?? null}, departure_date),
			arrival_date = COALESCE(${input.date ?? null}, arrival_date),
			location = COALESCE(${input.location ?? null}, location),
			status = COALESCE(${input.status ?? null}, status),
			notes = COALESCE(${input.notes ?? null}, notes)
		WHERE id = ${id}
		RETURNING id, departure_date, arrival_date, location, status, notes, created_at
	`;

	const row = rows[0];
	return row ? toFlight(row) : null;
}

export async function deleteFlight(id: string): Promise<boolean> {
	const rows = await sql<{ id: string }[]>`
		DELETE FROM flights
		WHERE id = ${id}
		RETURNING id
	`;

	return rows.length > 0;
}

async function readQuoteItems(quoteIds: string[]): Promise<QuoteItemRow[]> {
	if (quoteIds.length === 0) return [];

	return sql<QuoteItemRow[]>`
		SELECT
			id,
			quote_id,
			name,
			description,
			amazon_link,
			weight,
			quantity,
			category,
			category_label,
			category_type,
			pricing_mode,
			unit_price,
			price_label,
			total_price,
			created_at
		FROM quote_items
		WHERE quote_id = ANY(${quoteIds})
		ORDER BY created_at ASC
	`;
}

export async function listQuotes(): Promise<Quote[]> {
	const quoteRows = await sql<QuoteRow[]>`
		SELECT
			id,
			customer_name,
			customer_whatsapp,
			customer_notes,
			status,
			subtotal,
			converted_order_id,
			created_at,
			updated_at
		FROM quotes
		ORDER BY created_at DESC
	`;

	if (quoteRows.length === 0) {
		return [];
	}

	const quoteIds = quoteRows.map((row) => row.id);
	const itemRows = await readQuoteItems(quoteIds);
	const itemsByQuoteId = new Map<string, QuoteItem[]>();

	for (const row of itemRows) {
		const items = itemsByQuoteId.get(row.quote_id) || [];
		items.push(toQuoteItem(row));
		itemsByQuoteId.set(row.quote_id, items);
	}

	return quoteRows.map((row) => toQuote(row, itemsByQuoteId.get(row.id) || []));
}

export async function getQuoteById(id: string): Promise<Quote | null> {
	const quoteRows = await sql<QuoteRow[]>`
		SELECT
			id,
			customer_name,
			customer_whatsapp,
			customer_notes,
			status,
			subtotal,
			converted_order_id,
			created_at,
			updated_at
		FROM quotes
		WHERE id = ${id}
		LIMIT 1
	`;

	const quote = quoteRows[0];
	if (!quote) return null;

	const itemRows = await readQuoteItems([id]);
	return toQuote(
		quote,
		itemRows.filter((item) => item.quote_id === id).map(toQuoteItem),
	);
}

export async function createQuote(input: CreateQuoteInput): Promise<Quote> {
	const id = createId();
	const normalizedItems = normalizeQuoteItems(input.items);
	const subtotal = calculateSubtotal(normalizedItems);

	await sql.begin(async (tx: any) => {
		await tx`
			INSERT INTO quotes (
				id,
				customer_name,
				customer_whatsapp,
				customer_notes,
				status,
				subtotal
			)
			VALUES (
				${id},
				${input.customerName},
				${input.customerWhatsapp},
				${input.customerNotes || ""},
				${"new" satisfies QuoteStatus},
				${subtotal}
			)
		`;

		for (const item of normalizedItems) {
			const itemId = createId();
			await tx`
				INSERT INTO quote_items (
					id,
					quote_id,
					name,
					description,
					amazon_link,
					weight,
					quantity,
					category,
					category_label,
					category_type,
					pricing_mode,
					unit_price,
					price_label,
					total_price
				)
				VALUES (
					${itemId},
					${id},
					${item.name},
					${item.description || ""},
					${item.amazonLink || ""},
					${item.weight},
					${item.quantity},
					${item.category},
					${item.categoryLabel},
					${item.categoryType},
					${item.pricingMode},
					${item.unitPrice},
					${item.priceLabel},
					${item.totalPrice || 0}
				)
			`;
		}
	});

	const created = await getQuoteById(id);
	if (!created) {
		throw new Error("No se pudo crear la cotizacion");
	}

	return created;
}

export async function updateQuote(
	id: string,
	input: UpdateQuoteInput,
): Promise<Quote | null> {
	const existing = await getQuoteById(id);
	if (!existing) return null;

	const hasItems = Array.isArray(input.items);
	const normalizedItems = hasItems
		? normalizeQuoteItems(input.items || [])
		: [];
	const subtotal = hasItems
		? calculateSubtotal(normalizedItems)
		: existing.subtotal;

	await sql.begin(async (tx: any) => {
		await tx`
			UPDATE quotes
			SET
				customer_name = COALESCE(${input.customerName ?? null}, customer_name),
				customer_whatsapp = COALESCE(${input.customerWhatsapp ?? null}, customer_whatsapp),
				customer_notes = COALESCE(${input.customerNotes ?? null}, customer_notes),
				status = COALESCE(${input.status ?? null}, status),
				subtotal = ${subtotal},
				updated_at = NOW()
			WHERE id = ${id}
		`;

		if (hasItems) {
			await tx`
				DELETE FROM quote_items
				WHERE quote_id = ${id}
			`;

			for (const item of normalizedItems) {
				await tx`
					INSERT INTO quote_items (
						id,
						quote_id,
						name,
						description,
						amazon_link,
						weight,
						quantity,
						category,
						category_label,
						category_type,
						pricing_mode,
						unit_price,
						price_label,
						total_price
					)
					VALUES (
						${createId()},
						${id},
						${item.name},
						${item.description || ""},
						${item.amazonLink || ""},
						${item.weight},
						${item.quantity},
						${item.category},
						${item.categoryLabel},
						${item.categoryType},
						${item.pricingMode},
						${item.unitPrice},
						${item.priceLabel},
						${item.totalPrice || 0}
					)
				`;
			}
		}
	});

	return getQuoteById(id);
}

async function readOrderItems(orderIds: string[]): Promise<OrderItemRow[]> {
	if (orderIds.length === 0) return [];

	return sql<OrderItemRow[]>`
		SELECT
			id,
			order_id,
			quote_item_id,
			name,
			description,
			amazon_link,
			weight,
			quantity,
			category,
			category_label,
			category_type,
			pricing_mode,
			unit_price,
			price_label,
			total_price,
			status,
			created_at,
			updated_at
		FROM order_items
		WHERE order_id = ANY(${orderIds})
		ORDER BY created_at ASC
	`;
}

export async function listOrders(): Promise<Order[]> {
	const orderRows = await sql<OrderRow[]>`
		SELECT
			id,
			quote_id,
			flight_id,
			customer_name,
			customer_whatsapp,
			customer_notes,
			status,
			subtotal,
			created_at,
			updated_at
		FROM orders
		ORDER BY created_at DESC
	`;

	if (orderRows.length === 0) {
		return [];
	}

	const orderIds = orderRows.map((row) => row.id);
	const itemRows = await readOrderItems(orderIds);
	const itemsByOrderId = new Map<string, OrderItem[]>();

	for (const row of itemRows) {
		const items = itemsByOrderId.get(row.order_id) || [];
		items.push(toOrderItem(row));
		itemsByOrderId.set(row.order_id, items);
	}

	return orderRows.map((row) => toOrder(row, itemsByOrderId.get(row.id) || []));
}

export async function getOrderById(id: string): Promise<Order | null> {
	const orderRows = await sql<OrderRow[]>`
		SELECT
			id,
			quote_id,
			flight_id,
			customer_name,
			customer_whatsapp,
			customer_notes,
			status,
			subtotal,
			created_at,
			updated_at
		FROM orders
		WHERE id = ${id}
		LIMIT 1
	`;

	const order = orderRows[0];
	if (!order) return null;

	const itemRows = await readOrderItems([id]);
	return toOrder(
		order,
		itemRows.filter((item) => item.order_id === id).map(toOrderItem),
	);
}

export async function convertQuoteToOrder(
	quoteId: string,
	flightId: string,
): Promise<Order> {
	const quote = await getQuoteById(quoteId);
	if (!quote) {
		throw new Error("QUOTE_NOT_FOUND");
	}

	if (quote.status === "converted" || quote.convertedOrderId) {
		throw new Error("QUOTE_ALREADY_CONVERTED");
	}

	const flight = await getFlightById(flightId);
	if (!flight) {
		throw new Error("FLIGHT_NOT_FOUND");
	}

	const orderId = createId();
	const initialItemStatus = mapFlightToItemStatus(flight.status);
	const initialOrderStatus = deriveOrderStatus(
		quote.items.map(() => initialItemStatus),
	);

	await sql.begin(async (tx: any) => {
		await tx`
			INSERT INTO orders (
				id,
				quote_id,
				flight_id,
				customer_name,
				customer_whatsapp,
				customer_notes,
				status,
				subtotal
			)
			VALUES (
				${orderId},
				${quote.id},
				${flightId},
				${quote.customerName},
				${quote.customerWhatsapp},
				${quote.customerNotes || ""},
				${initialOrderStatus},
				${quote.subtotal}
			)
		`;

		for (const item of quote.items) {
			await tx`
				INSERT INTO order_items (
					id,
					order_id,
					quote_item_id,
					name,
					description,
					amazon_link,
					weight,
					quantity,
					category,
					category_label,
					category_type,
					pricing_mode,
					unit_price,
					price_label,
					total_price,
					status
				)
				VALUES (
					${createId()},
					${orderId},
					${item.id},
					${item.name},
					${item.description || ""},
					${item.amazonLink || ""},
					${item.weight},
					${item.quantity},
					${item.category},
					${item.categoryLabel},
					${item.categoryType},
					${item.pricingMode},
					${item.unitPrice},
					${item.priceLabel},
					${item.totalPrice},
					${initialItemStatus}
				)
			`;
		}

		await tx`
			UPDATE quotes
			SET
				status = ${"converted" satisfies QuoteStatus},
				converted_order_id = ${orderId},
				updated_at = NOW()
			WHERE id = ${quote.id}
		`;
	});

	const order = await getOrderById(orderId);
	if (!order) {
		throw new Error("ORDER_CREATION_FAILED");
	}

	return order;
}

export async function updateOrderItemStatus(
	orderId: string,
	itemId: string,
	status: OrderItemStatus,
): Promise<Order | null> {
	const updatedRows = await sql<{ id: string }[]>`
		UPDATE order_items
		SET
			status = ${status},
			updated_at = NOW()
		WHERE id = ${itemId} AND order_id = ${orderId}
		RETURNING id
	`;

	if (updatedRows.length === 0) {
		return null;
	}

	const statusRows = await sql<{ status: OrderItemStatus }[]>`
		SELECT status
		FROM order_items
		WHERE order_id = ${orderId}
	`;

	const orderStatus = deriveOrderStatus(statusRows.map((row) => row.status));

	await sql`
		UPDATE orders
		SET
			status = ${orderStatus},
			updated_at = NOW()
		WHERE id = ${orderId}
	`;

	return getOrderById(orderId);
}

export async function syncOrderItemsWithFlightStatus(
	flightId: string,
	flightStatus: FlightStatus,
) {
	const itemStatus = mapFlightToItemStatus(flightStatus);

	const affectedOrders = await sql<{ id: string }[]>`
		SELECT id
		FROM orders
		WHERE flight_id = ${flightId}
	`;

	if (affectedOrders.length === 0) {
		return;
	}

	await sql`
		UPDATE order_items
		SET
			status = ${itemStatus},
			updated_at = NOW()
		WHERE
			order_id IN (
				SELECT id FROM orders WHERE flight_id = ${flightId}
			)
			AND status <> ${"completed" satisfies OrderItemStatus}
	`;

	for (const order of affectedOrders) {
		const statuses = await sql<{ status: OrderItemStatus }[]>`
			SELECT status
			FROM order_items
			WHERE order_id = ${order.id}
		`;

		const nextStatus = deriveOrderStatus(statuses.map((row) => row.status));
		await sql`
			UPDATE orders
			SET
				status = ${nextStatus},
				updated_at = NOW()
			WHERE id = ${order.id}
		`;
	}
}

export async function closeDatabase() {
	await sql.end();
}
