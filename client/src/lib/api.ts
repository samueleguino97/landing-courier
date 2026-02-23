import type {
	ArrivalDate,
	ConvertQuoteToOrderInput,
	CreateArrivalDateInput,
	CreateQuoteInput,
	DateResponse,
	DatesResponse,
	DeleteResponse,
	Order,
	OrderResponse,
	OrdersResponse,
	Quote,
	QuoteResponse,
	QuotesResponse,
	UpdateArrivalDateInput,
	UpdateOrderItemStatusInput,
	UpdateQuoteInput,
} from "shared";
import { getAuthHeaders } from "./auth";
import { SERVER_URL } from "./constants";

async function parseResponse<T>(res: Response): Promise<T> {
	const data = (await res.json()) as T & {
		success?: boolean;
		message?: string;
	};

	if (!res.ok || data.success === false) {
		throw new Error(data.message || "Error de API");
	}

	return data;
}

// Public API
export async function fetchPublicDates(): Promise<ArrivalDate[]> {
	const res = await fetch(`${SERVER_URL}/api/dates`);
	const data = await parseResponse<DatesResponse>(res);
	return data.data;
}

export async function createQuoteFromLanding(
	input: CreateQuoteInput,
): Promise<Quote> {
	const res = await fetch(`${SERVER_URL}/api/quotes`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(input),
	});

	const data = await parseResponse<QuoteResponse>(res);
	return data.data;
}

// Admin Flights API
export async function fetchAdminDates(): Promise<ArrivalDate[]> {
	const res = await fetch(`${SERVER_URL}/api/admin/dates`, {
		headers: getAuthHeaders(),
	});
	const data = await parseResponse<DatesResponse>(res);
	return data.data;
}

export async function createDate(
	input: CreateArrivalDateInput,
): Promise<ArrivalDate> {
	const res = await fetch(`${SERVER_URL}/api/admin/dates`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...getAuthHeaders(),
		},
		body: JSON.stringify(input),
	});

	const data = await parseResponse<DateResponse>(res);
	return data.data;
}

export async function updateDate(
	id: string,
	input: UpdateArrivalDateInput,
): Promise<ArrivalDate> {
	const res = await fetch(`${SERVER_URL}/api/admin/dates/${id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			...getAuthHeaders(),
		},
		body: JSON.stringify(input),
	});

	const data = await parseResponse<DateResponse>(res);
	return data.data;
}

export async function deleteDate(id: string): Promise<void> {
	const res = await fetch(`${SERVER_URL}/api/admin/dates/${id}`, {
		method: "DELETE",
		headers: getAuthHeaders(),
	});
	await parseResponse<DeleteResponse>(res);
}

// Admin Quotes API
export async function fetchAdminQuotes(): Promise<Quote[]> {
	const res = await fetch(`${SERVER_URL}/api/admin/quotes`, {
		headers: getAuthHeaders(),
	});

	const data = await parseResponse<QuotesResponse>(res);
	return data.data;
}

export async function updateAdminQuote(
	id: string,
	input: UpdateQuoteInput,
): Promise<Quote> {
	const res = await fetch(`${SERVER_URL}/api/admin/quotes/${id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			...getAuthHeaders(),
		},
		body: JSON.stringify(input),
	});

	const data = await parseResponse<QuoteResponse>(res);
	return data.data;
}

export async function convertAdminQuoteToOrder(
	id: string,
	input: ConvertQuoteToOrderInput,
): Promise<Order> {
	const res = await fetch(`${SERVER_URL}/api/admin/quotes/${id}/convert`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...getAuthHeaders(),
		},
		body: JSON.stringify(input),
	});

	const data = await parseResponse<OrderResponse>(res);
	return data.data;
}

// Admin Orders API
export async function fetchAdminOrders(): Promise<Order[]> {
	const res = await fetch(`${SERVER_URL}/api/admin/orders`, {
		headers: getAuthHeaders(),
	});

	const data = await parseResponse<OrdersResponse>(res);
	return data.data;
}

export async function updateAdminOrderItemStatus(
	orderId: string,
	itemId: string,
	input: UpdateOrderItemStatusInput,
): Promise<Order> {
	const res = await fetch(
		`${SERVER_URL}/api/admin/orders/${orderId}/items/${itemId}/status`,
		{
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				...getAuthHeaders(),
			},
			body: JSON.stringify(input),
		},
	);

	const data = await parseResponse<OrderResponse>(res);
	return data.data;
}
