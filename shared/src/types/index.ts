export type ApiResponse = {
	message: string;
	success: true;
};

// Flight Types
export type FlightStatus = "pending" | "in_flight" | "arrived";
export type ArrivalDateStatus = FlightStatus;

export interface ArrivalDate {
	id: string;
	departureDate: string;
	date: string;
	location: string;
	status: FlightStatus;
	notes?: string;
	createdAt: string;
}

export type Flight = ArrivalDate;

export interface CreateArrivalDateInput {
	departureDate: string;
	date: string;
	location: string;
	status: FlightStatus;
	notes?: string;
}

export interface UpdateArrivalDateInput {
	departureDate?: string;
	date?: string;
	location?: string;
	status?: FlightStatus;
	notes?: string;
}

// Quote / Order Types
export type QuoteStatus =
	| "new"
	| "reviewing"
	| "negotiated"
	| "approved"
	| "rejected"
	| "converted";

export type ProductCategoryType = "standard" | "premium" | "special";
export type ProductPricingMode = "per_pound" | "per_unit" | "starting_from";

export interface QuoteItem {
	id: string;
	name: string;
	description?: string;
	amazonLink?: string;
	weight: number;
	quantity: number;
	category: string;
	categoryLabel: string;
	categoryType: ProductCategoryType;
	pricingMode: ProductPricingMode;
	unitPrice: number;
	priceLabel: string;
	totalPrice: number;
}

export interface Quote {
	id: string;
	customerName: string;
	customerWhatsapp: string;
	customerNotes?: string;
	status: QuoteStatus;
	items: QuoteItem[];
	subtotal: number;
	convertedOrderId?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface QuoteItemInput {
	name: string;
	description?: string;
	amazonLink?: string;
	weight: number;
	quantity: number;
	category: string;
	categoryLabel: string;
	categoryType: ProductCategoryType;
	pricingMode: ProductPricingMode;
	unitPrice: number;
	priceLabel: string;
	totalPrice?: number;
}

export interface CreateQuoteInput {
	customerName: string;
	customerWhatsapp: string;
	customerNotes?: string;
	items: QuoteItemInput[];
}

export interface UpdateQuoteInput {
	customerName?: string;
	customerWhatsapp?: string;
	customerNotes?: string;
	status?: QuoteStatus;
	items?: QuoteItemInput[];
}

export type OrderItemStatus = "pending" | "in_flight" | "arrived" | "completed";

export interface OrderItem extends QuoteItem {
	status: OrderItemStatus;
	quoteItemId?: string;
}

export interface Order {
	id: string;
	quoteId: string;
	flightId: string;
	customerName: string;
	customerWhatsapp: string;
	customerNotes?: string;
	status: OrderItemStatus;
	items: OrderItem[];
	subtotal: number;
	createdAt: string;
	updatedAt: string;
}

export interface ConvertQuoteToOrderInput {
	flightId: string;
}

export interface UpdateOrderItemStatusInput {
	status: OrderItemStatus;
}

// Admin Types
export interface AdminLoginInput {
	password: string;
}

export interface AdminLoginResponse {
	success: boolean;
	token?: string;
	message?: string;
}

// API Response Types
export interface DatesResponse {
	success: boolean;
	data: ArrivalDate[];
}

export interface DateResponse {
	success: boolean;
	data: ArrivalDate;
}

export interface QuotesResponse {
	success: boolean;
	data: Quote[];
}

export interface QuoteResponse {
	success: boolean;
	data: Quote;
}

export interface OrdersResponse {
	success: boolean;
	data: Order[];
}

export interface OrderResponse {
	success: boolean;
	data: Order;
}

export interface DeleteResponse {
	success: boolean;
	message: string;
}
