export type ApiResponse = {
	message: string;
	success: true;
};

// Arrival Date Types
export type ArrivalDateStatus = "programado" | "en_camino" | "llego";

export interface ArrivalDate {
	id: string;
	departureDate: string;
	date: string;
	location: string;
	status: ArrivalDateStatus;
	notes?: string;
	createdAt: string;
}

export interface CreateArrivalDateInput {
	departureDate: string;
	date: string;
	location: string;
	status: ArrivalDateStatus;
	notes?: string;
}

export interface UpdateArrivalDateInput {
	departureDate?: string;
	date?: string;
	location?: string;
	status?: ArrivalDateStatus;
	notes?: string;
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

export interface DeleteResponse {
	success: boolean;
	message: string;
}
