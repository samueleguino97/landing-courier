import type {
	ArrivalDate,
	CreateArrivalDateInput,
	CreateQuoteInput,
	FlightStatus,
	Order,
	Quote,
	QuoteStatus,
} from "shared/dist";
import {
	closeDatabase,
	convertQuoteToOrder,
	createFlight,
	createQuote,
	getOrderById,
	initDatabase,
	listFlights,
	listOrders,
	listQuotes,
	syncOrderItemsWithFlightStatus,
	updateFlight,
	updateOrderItemStatus,
	updateQuote,
} from "../db";

type SeedFlight = {
	key: string;
	input: CreateArrivalDateInput;
	targetStatus: FlightStatus;
};

type SeedQuote = {
	key: string;
	input: CreateQuoteInput;
	status: QuoteStatus;
	convertToFlightKey?: string;
	completeFirstItem?: boolean;
};

const DEMO_TAG = "[DEMO_SEED]";

const SEED_FLIGHTS: SeedFlight[] = [
	{
		key: "demo-flight-pending",
		input: {
			departureDate: "2026-03-03",
			date: "2026-03-07",
			location: "Santa Cruz",
			status: "pending",
			notes: `${DEMO_TAG} Vuelo pendiente para pruebas`,
		},
		targetStatus: "pending",
	},
	{
		key: "demo-flight-in-flight",
		input: {
			departureDate: "2026-03-10",
			date: "2026-03-14",
			location: "Cochabamba",
			status: "in_flight",
			notes: `${DEMO_TAG} Vuelo en curso para pruebas`,
		},
		targetStatus: "in_flight",
	},
	{
		key: "demo-flight-arrived",
		input: {
			departureDate: "2026-02-14",
			date: "2026-02-18",
			location: "La Paz",
			status: "arrived",
			notes: `${DEMO_TAG} Vuelo arribado para pruebas`,
		},
		targetStatus: "arrived",
	},
];

const SEED_QUOTES: SeedQuote[] = [
	{
		key: "demo-quote-reviewing",
		input: {
			customerName: "Demo Cliente Revision",
			customerWhatsapp: "+59170001001",
			customerNotes: `${DEMO_TAG} Cotizacion en revision`,
			items: [
				{
					name: "Cremas faciales x2",
					description: "Pack cuidado personal",
					weight: 2.2,
					quantity: 1,
					category: "cremas",
					categoryLabel: "Cremas",
					categoryType: "premium",
					pricingMode: "per_pound",
					unitPrice: 15,
					priceLabel: "$15/lb",
				},
				{
					name: "Zapatos deportivos",
					description: "Talla 41",
					weight: 2,
					quantity: 1,
					category: "ropa",
					categoryLabel: "Ropa, zapatos, bolsos y documentos",
					categoryType: "standard",
					pricingMode: "per_pound",
					unitPrice: 10,
					priceLabel: "$10/lb",
				},
			],
		},
		status: "reviewing",
	},
	{
		key: "demo-quote-negotiated-order",
		input: {
			customerName: "Demo Cliente Negociado",
			customerWhatsapp: "+59170001002",
			customerNotes: `${DEMO_TAG} Negociada y convertida`,
			items: [
				{
					name: "iPhone 13",
					description: "Tarifa especial por unidad",
					weight: 0,
					quantity: 1,
					category: "iphone",
					categoryLabel: "iPhone",
					categoryType: "special",
					pricingMode: "per_unit",
					unitPrice: 95,
					priceLabel: "$95 por iPhone",
				},
				{
					name: "Repuestos varios",
					description: "Set de repuestos pequenos",
					weight: 0,
					quantity: 2,
					category: "repuestos",
					categoryLabel: "Repuestos",
					categoryType: "special",
					pricingMode: "starting_from",
					unitPrice: 25,
					priceLabel: "Desde $25",
				},
			],
		},
		status: "negotiated",
		convertToFlightKey: "demo-flight-in-flight",
	},
	{
		key: "demo-quote-completed-order",
		input: {
			customerName: "Demo Cliente Entregado",
			customerWhatsapp: "+59170001003",
			customerNotes: `${DEMO_TAG} Pedido con item completado`,
			items: [
				{
					name: "Perfume importado",
					description: "Fragancia premium",
					weight: 1,
					quantity: 1,
					category: "perfumes",
					categoryLabel: "Perfumes",
					categoryType: "premium",
					pricingMode: "per_pound",
					unitPrice: 15,
					priceLabel: "$15/lb",
				},
				{
					name: "Bolso de mano",
					description: "Color negro",
					weight: 1.6,
					quantity: 1,
					category: "ropa",
					categoryLabel: "Ropa, zapatos, bolsos y documentos",
					categoryType: "standard",
					pricingMode: "per_pound",
					unitPrice: 10,
					priceLabel: "$10/lb",
				},
			],
		},
		status: "approved",
		convertToFlightKey: "demo-flight-arrived",
		completeFirstItem: true,
	},
];

function quoteAlreadySeeded(quotes: Quote[], whatsapp: string): Quote | null {
	return quotes.find((quote) => quote.customerWhatsapp === whatsapp) || null;
}

function orderForQuote(orders: Order[], quoteId: string): Order | null {
	return orders.find((order) => order.quoteId === quoteId) || null;
}

async function ensureFlight(
	seedFlight: SeedFlight,
	existingFlights: ArrivalDate[],
): Promise<string> {
	const found = existingFlights.find(
		(flight) =>
			flight.notes?.includes(DEMO_TAG) &&
			flight.notes?.includes(seedFlight.key) &&
			flight.location === seedFlight.input.location,
	);

	if (found) {
		if (found.status !== seedFlight.targetStatus) {
			const updated = await updateFlight(found.id, {
				status: seedFlight.targetStatus,
			});
			if (updated) {
				await syncOrderItemsWithFlightStatus(updated.id, updated.status);
			}
		}
		return found.id;
	}

	const created = await createFlight({
		...seedFlight.input,
		notes: `${seedFlight.input.notes} ${seedFlight.key}`,
	});

	if (seedFlight.targetStatus !== created.status) {
		const updated = await updateFlight(created.id, {
			status: seedFlight.targetStatus,
		});
		if (updated) {
			await syncOrderItemsWithFlightStatus(updated.id, updated.status);
		}
	}

	return created.id;
}

async function ensureQuoteAndOrder(
	seedQuote: SeedQuote,
	flightIdsByKey: Map<string, string>,
	quotes: Quote[],
	orders: Order[],
) {
	let quote = quoteAlreadySeeded(quotes, seedQuote.input.customerWhatsapp);

	if (!quote) {
		quote = await createQuote(seedQuote.input);
		quote = await updateQuote(quote.id, {
			status: seedQuote.status,
			customerNotes:
				`${seedQuote.input.customerNotes || ""} ${seedQuote.key}`.trim(),
		});

		if (!quote) {
			throw new Error(`No se pudo actualizar cotizacion seed ${seedQuote.key}`);
		}
	}

	if (!seedQuote.convertToFlightKey) {
		return;
	}

	const flightId = flightIdsByKey.get(seedQuote.convertToFlightKey);
	if (!flightId) {
		throw new Error(`Vuelo seed faltante: ${seedQuote.convertToFlightKey}`);
	}

	let order = orderForQuote(orders, quote.id);

	if (!order) {
		order = await convertQuoteToOrder(quote.id, flightId);
	}

	const fullOrder = await getOrderById(order.id);
	if (!fullOrder) {
		throw new Error(`No se pudo cargar pedido seed ${order.id}`);
	}

	if (seedQuote.completeFirstItem && fullOrder.items[0]) {
		await updateOrderItemStatus(
			fullOrder.id,
			fullOrder.items[0].id,
			"completed",
		);
	}
}

async function main() {
	await initDatabase();

	const existingFlights = await listFlights();
	const flightIdsByKey = new Map<string, string>();

	for (const seedFlight of SEED_FLIGHTS) {
		const flightId = await ensureFlight(seedFlight, existingFlights);
		flightIdsByKey.set(seedFlight.key, flightId);
	}

	const quotes = await listQuotes();
	const orders = await listOrders();

	for (const seedQuote of SEED_QUOTES) {
		await ensureQuoteAndOrder(seedQuote, flightIdsByKey, quotes, orders);
	}

	const finalFlights = await listFlights();
	const finalQuotes = await listQuotes();
	const finalOrders = await listOrders();

	const seededFlights = finalFlights.filter((flight) =>
		flight.notes?.includes(DEMO_TAG),
	);
	const seededQuotes = finalQuotes.filter((quote) =>
		quote.customerNotes?.includes(DEMO_TAG),
	);

	console.log("Demo seed completado.");
	console.log(`Flights demo: ${seededFlights.length}`);
	console.log(`Quotes demo: ${seededQuotes.length}`);
	console.log(`Orders total: ${finalOrders.length}`);
}

main()
	.catch((error) => {
		const errorCode = (error as { code?: string }).code;
		if (errorCode === "3D000") {
			console.error(
				"La base de datos no existe. Crea la DB configurada en DATABASE_URL y vuelve a correr bun run seed.",
			);
		} else {
			console.error("Error ejecutando seed:", error);
		}
		process.exitCode = 1;
	})
	.finally(async () => {
		await closeDatabase();
	});
