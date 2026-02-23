import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
	ArrivalDate,
	CreateArrivalDateInput,
	FlightStatus,
	Order,
	OrderItemStatus,
	Quote,
	QuoteItemInput,
	QuoteStatus,
} from "shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	convertAdminQuoteToOrder,
	createDate,
	deleteDate,
	fetchAdminDates,
	fetchAdminOrders,
	fetchAdminQuotes,
	updateAdminOrderItemStatus,
	updateAdminQuote,
	updateDate,
} from "@/lib/api";
import { isAuthenticated, logout, verifyToken } from "@/lib/auth";

export const Route = createFileRoute("/admin/dashboard")({
	component: AdminDashboard,
});

type AdminTab = "quotes" | "orders" | "flights";

type EditableQuoteItem = {
	id: string;
	name: string;
	description?: string;
	amazonLink?: string;
	weight: number;
	quantity: number;
	category: string;
	categoryLabel: string;
	categoryType: "standard" | "premium" | "special";
	pricingMode: "per_pound" | "per_unit" | "starting_from";
	unitPrice: number;
	priceLabel: string;
	totalPrice: number;
};

type EditableQuote = {
	customerName: string;
	customerWhatsapp: string;
	customerNotes: string;
	status: QuoteStatus;
	items: EditableQuoteItem[];
};

const flightStatusOptions: { value: FlightStatus; label: string }[] = [
	{ value: "pending", label: "Pendiente" },
	{ value: "in_flight", label: "En vuelo" },
	{ value: "arrived", label: "Arribado" },
];

const quoteStatusOptions: { value: QuoteStatus; label: string }[] = [
	{ value: "new", label: "Nueva" },
	{ value: "reviewing", label: "En revision" },
	{ value: "negotiated", label: "Negociada" },
	{ value: "approved", label: "Aprobada" },
	{ value: "rejected", label: "Rechazada" },
	{ value: "converted", label: "Convertida" },
];

const orderItemStatusOptions: { value: OrderItemStatus; label: string }[] = [
	{ value: "pending", label: "Pendiente" },
	{ value: "in_flight", label: "En vuelo" },
	{ value: "arrived", label: "Arribado" },
	{ value: "completed", label: "Completado" },
];

const flightStatusLabels: Record<
	FlightStatus,
	{ label: string; variant: "success" | "warning" | "info" }
> = {
	pending: { label: "Pendiente", variant: "info" },
	in_flight: { label: "En vuelo", variant: "warning" },
	arrived: { label: "Arribado", variant: "success" },
};

const quoteStatusLabels: Record<
	QuoteStatus,
	{ label: string; variant: "success" | "warning" | "info" }
> = {
	new: { label: "Nueva", variant: "info" },
	reviewing: { label: "En revision", variant: "warning" },
	negotiated: { label: "Negociada", variant: "warning" },
	approved: { label: "Aprobada", variant: "success" },
	rejected: { label: "Rechazada", variant: "warning" },
	converted: { label: "Convertida", variant: "success" },
};

const orderItemStatusLabels: Record<
	OrderItemStatus,
	{ label: string; variant: "success" | "warning" | "info" }
> = {
	pending: { label: "Pendiente", variant: "info" },
	in_flight: { label: "En vuelo", variant: "warning" },
	arrived: { label: "Arribado", variant: "success" },
	completed: { label: "Completado", variant: "success" },
};

function toEditableQuote(quote: Quote): EditableQuote {
	return {
		customerName: quote.customerName,
		customerWhatsapp: quote.customerWhatsapp,
		customerNotes: quote.customerNotes || "",
		status: quote.status,
		items: quote.items.map((item) => ({ ...item })),
	};
}

function normalizeItem(item: EditableQuoteItem): QuoteItemInput {
	const quantity =
		item.pricingMode === "per_pound" ? 1 : Math.max(item.quantity, 1);
	const weight =
		item.pricingMode === "per_pound" ? Math.max(item.weight, 0) : 0;
	const unitPrice = Math.max(item.unitPrice, 0);
	const rawTotal =
		item.pricingMode === "per_pound"
			? weight * unitPrice
			: quantity * unitPrice;
	const totalPrice = Math.round(rawTotal * 100) / 100;

	return {
		name: item.name,
		description: item.description,
		amazonLink: item.amazonLink,
		weight,
		quantity,
		category: item.category,
		categoryLabel: item.categoryLabel,
		categoryType: item.categoryType,
		pricingMode: item.pricingMode,
		unitPrice,
		priceLabel: item.priceLabel,
		totalPrice,
	};
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("es-BO", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function formatFlightLabel(flight: ArrivalDate): string {
	return `${formatDate(flight.departureDate)} - ${flight.location}`;
}

function subtotalFromItems(items: EditableQuoteItem[]): number {
	return items.reduce(
		(sum, item) => sum + (normalizeItem(item).totalPrice ?? 0),
		0,
	);
}

function AdminDashboard() {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<AdminTab>("quotes");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const [flights, setFlights] = useState<ArrivalDate[]>([]);
	const [quotes, setQuotes] = useState<Quote[]>([]);
	const [orders, setOrders] = useState<Order[]>([]);

	const [showFlightForm, setShowFlightForm] = useState(false);
	const [editingFlightId, setEditingFlightId] = useState<string | null>(null);
	const [flightFormData, setFlightFormData] = useState<CreateArrivalDateInput>({
		departureDate: "",
		date: "",
		location: "",
		status: "pending",
		notes: "",
	});

	const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
	const [quoteDraft, setQuoteDraft] = useState<EditableQuote | null>(null);
	const [convertFlightId, setConvertFlightId] = useState("");

	const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
	const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);

	const selectedQuote = useMemo(
		() => quotes.find((quote) => quote.id === selectedQuoteId) || null,
		[quotes, selectedQuoteId],
	);

	const selectedOrder = useMemo(
		() => orders.find((order) => order.id === selectedOrderId) || null,
		[orders, selectedOrderId],
	);

	const flightsById = useMemo(
		() =>
			new Map<string, ArrivalDate>(
				flights.map((flight) => [flight.id, flight]),
			),
		[flights],
	);

	const ordersByFlightId = useMemo(() => {
		const grouped = new Map<string, Order[]>();

		for (const order of orders) {
			const current = grouped.get(order.flightId) || [];
			current.push(order);
			grouped.set(order.flightId, current);
		}

		return grouped;
	}, [orders]);

	const selectedOrderFlight = useMemo(
		() =>
			selectedOrder ? (flightsById.get(selectedOrder.flightId) ?? null) : null,
		[selectedOrder, flightsById],
	);

	useEffect(() => {
		if (selectedFlightId && !flightsById.has(selectedFlightId)) {
			setSelectedFlightId(null);
		}
	}, [selectedFlightId, flightsById]);

	function openFlightFromOrder(flightId: string) {
		setSelectedFlightId(flightId);
		setShowFlightForm(false);
		setActiveTab("flights");
	}

	function openOrderFromFlight(orderId: string) {
		setSelectedOrderId(orderId);
		setActiveTab("orders");
	}

	const loadData = useCallback(async () => {
		setError("");
		setLoading(true);

		try {
			const [flightData, quoteData, orderData] = await Promise.all([
				fetchAdminDates(),
				fetchAdminQuotes(),
				fetchAdminOrders(),
			]);

			setFlights(
				flightData.sort(
					(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
				),
			);
			setQuotes(quoteData);
			setOrders(orderData);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error al cargar datos");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		async function checkAuth() {
			if (!isAuthenticated()) {
				navigate({ to: "/admin" });
				return;
			}

			const valid = await verifyToken();
			if (!valid) {
				navigate({ to: "/admin" });
				return;
			}

			await loadData();
		}

		checkAuth();
	}, [navigate, loadData]);

	async function handleLogout() {
		await logout();
		navigate({ to: "/admin" });
	}

	function resetFlightForm() {
		setFlightFormData({
			departureDate: "",
			date: "",
			location: "",
			status: "pending",
			notes: "",
		});
		setEditingFlightId(null);
		setShowFlightForm(false);
	}

	function handleEditFlight(flight: ArrivalDate) {
		setFlightFormData({
			departureDate: flight.departureDate,
			date: flight.date,
			location: flight.location,
			status: flight.status,
			notes: flight.notes || "",
		});
		setEditingFlightId(flight.id);
		setShowFlightForm(true);
	}

	async function handleFlightSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		setError("");

		try {
			if (editingFlightId) {
				await updateDate(editingFlightId, flightFormData);
			} else {
				await createDate(flightFormData);
			}

			await loadData();
			resetFlightForm();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error al guardar vuelo");
		} finally {
			setSaving(false);
		}
	}

	async function handleDeleteFlight(id: string) {
		if (!confirm("Estas seguro de eliminar este vuelo?")) return;

		setError("");
		try {
			await deleteDate(id);
			await loadData();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error al eliminar vuelo");
		}
	}

	function startQuoteEdit(quote: Quote) {
		setSelectedQuoteId(quote.id);
		setQuoteDraft(toEditableQuote(quote));
		setConvertFlightId("");
	}

	function handleQuoteItemChange(
		itemId: string,
		field: keyof EditableQuoteItem,
		value: string | number,
	) {
		if (!quoteDraft) return;

		setQuoteDraft({
			...quoteDraft,
			items: quoteDraft.items.map((item) => {
				if (item.id !== itemId) return item;

				if (field === "weight" || field === "unitPrice") {
					return { ...item, [field]: Number(value) || 0 };
				}

				if (field === "quantity") {
					return { ...item, quantity: Number(value) || 1 };
				}

				return { ...item, [field]: value };
			}),
		});
	}

	function addQuoteItem() {
		if (!quoteDraft) return;

		setQuoteDraft({
			...quoteDraft,
			items: [
				...quoteDraft.items,
				{
					id: crypto.randomUUID(),
					name: "Nuevo producto",
					description: "",
					amazonLink: "",
					weight: 1,
					quantity: 1,
					category: "otros",
					categoryLabel: "Otros",
					categoryType: "standard",
					pricingMode: "per_pound",
					unitPrice: 10,
					priceLabel: "$10/lb",
					totalPrice: 10,
				},
			],
		});
	}

	function removeQuoteItem(itemId: string) {
		if (!quoteDraft) return;

		setQuoteDraft({
			...quoteDraft,
			items: quoteDraft.items.filter((item) => item.id !== itemId),
		});
	}

	async function handleSaveQuote() {
		if (!selectedQuoteId || !quoteDraft) return;

		if (quoteDraft.items.length === 0) {
			setError("La cotizacion debe tener al menos un producto");
			return;
		}

		setSaving(true);
		setError("");

		try {
			const updated = await updateAdminQuote(selectedQuoteId, {
				customerName: quoteDraft.customerName,
				customerWhatsapp: quoteDraft.customerWhatsapp,
				customerNotes: quoteDraft.customerNotes || undefined,
				status: quoteDraft.status,
				items: quoteDraft.items.map(normalizeItem),
			});

			setQuotes((current) =>
				current.map((quote) => (quote.id === updated.id ? updated : quote)),
			);
			setQuoteDraft(toEditableQuote(updated));
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Error al guardar cotizacion",
			);
		} finally {
			setSaving(false);
		}
	}

	async function handleConvertQuote() {
		if (!selectedQuoteId || !convertFlightId) {
			setError("Selecciona un vuelo para convertir la cotizacion");
			return;
		}

		setSaving(true);
		setError("");

		try {
			const createdOrder = await convertAdminQuoteToOrder(selectedQuoteId, {
				flightId: convertFlightId,
			});

			setOrders((current) => [createdOrder, ...current]);
			await loadData();
			setActiveTab("orders");
			setSelectedOrderId(createdOrder.id);
			setSelectedFlightId(createdOrder.flightId);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error al convertir");
		} finally {
			setSaving(false);
		}
	}

	async function handleOrderItemStatusChange(
		orderId: string,
		itemId: string,
		status: OrderItemStatus,
	) {
		setSaving(true);
		setError("");

		try {
			const updatedOrder = await updateAdminOrderItemStatus(orderId, itemId, {
				status,
			});

			setOrders((current) =>
				current.map((order) =>
					order.id === updatedOrder.id ? updatedOrder : order,
				),
			);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Error al actualizar estado",
			);
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-muted/30">
			<header className="bg-card border-b sticky top-0 z-40">
				<Container>
					<div className="h-16 flex items-center justify-between gap-4">
						<div>
							<h1 className="font-bold">Online Courier - Admin</h1>
							<p className="text-xs text-muted-foreground">
								Cotizaciones, pedidos y vuelos
							</p>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant={activeTab === "quotes" ? "default" : "outline"}
								size="sm"
								onClick={() => setActiveTab("quotes")}
							>
								Cotizaciones
							</Button>
							<Button
								variant={activeTab === "orders" ? "default" : "outline"}
								size="sm"
								onClick={() => setActiveTab("orders")}
							>
								Pedidos
							</Button>
							<Button
								variant={activeTab === "flights" ? "default" : "outline"}
								size="sm"
								onClick={() => setActiveTab("flights")}
							>
								Vuelos
							</Button>
							<Button variant="outline" size="sm" onClick={handleLogout}>
								Salir
							</Button>
						</div>
					</div>
				</Container>
			</header>

			<Container className="py-8 space-y-6">
				<div className="grid sm:grid-cols-3 gap-4">
					<Card className="border-0 shadow-sm">
						<CardContent className="p-5">
							<p className="text-sm text-muted-foreground">Cotizaciones</p>
							<p className="text-2xl font-bold">{quotes.length}</p>
						</CardContent>
					</Card>
					<Card className="border-0 shadow-sm">
						<CardContent className="p-5">
							<p className="text-sm text-muted-foreground">Pedidos</p>
							<p className="text-2xl font-bold">{orders.length}</p>
						</CardContent>
					</Card>
					<Card className="border-0 shadow-sm">
						<CardContent className="p-5">
							<p className="text-sm text-muted-foreground">Vuelos</p>
							<p className="text-2xl font-bold">{flights.length}</p>
						</CardContent>
					</Card>
				</div>

				{error && (
					<div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
						{error}
					</div>
				)}

				{activeTab === "quotes" && (
					<div className="grid lg:grid-cols-5 gap-6">
						<div className="lg:col-span-2">
							<Card className="border-0 shadow-sm">
								<CardHeader>
									<CardTitle>Cotizaciones</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									{quotes.length === 0 && (
										<p className="text-sm text-muted-foreground">
											Aun no hay cotizaciones.
										</p>
									)}

									{quotes.map((quote) => (
										<button
											key={quote.id}
											type="button"
											onClick={() => startQuoteEdit(quote)}
											className={`w-full text-left rounded-xl border p-4 transition-colors ${
												selectedQuoteId === quote.id
													? "border-primary bg-primary/5"
													: "border-border bg-background"
											}`}
										>
											<div className="flex items-center justify-between gap-2">
												<p className="font-semibold truncate">
													{quote.customerName}
												</p>
												<Badge
													variant={quoteStatusLabels[quote.status].variant}
												>
													{quoteStatusLabels[quote.status].label}
												</Badge>
											</div>
											<p className="text-sm text-muted-foreground mt-1">
												{quote.customerWhatsapp}
											</p>
											<p className="text-sm mt-2">
												{quote.items.length} producto(s) - $
												{quote.subtotal.toFixed(2)}
											</p>
										</button>
									))}
								</CardContent>
							</Card>
						</div>

						<div className="lg:col-span-3">
							<Card className="border-0 shadow-sm">
								<CardHeader>
									<CardTitle>Revision y negociacion</CardTitle>
								</CardHeader>
								<CardContent>
									{!selectedQuote || !quoteDraft ? (
										<p className="text-sm text-muted-foreground">
											Selecciona una cotizacion para editar productos, precios y
											luego convertirla a pedido.
										</p>
									) : (
										<div className="space-y-4">
											<div className="grid sm:grid-cols-2 gap-3">
												<div>
													<label className="text-sm font-medium block mb-1.5">
														Cliente
													</label>
													<Input
														value={quoteDraft.customerName}
														onChange={(e) =>
															setQuoteDraft({
																...quoteDraft,
																customerName: e.target.value,
															})
														}
													/>
												</div>
												<div>
													<label className="text-sm font-medium block mb-1.5">
														WhatsApp
													</label>
													<Input
														value={quoteDraft.customerWhatsapp}
														onChange={(e) =>
															setQuoteDraft({
																...quoteDraft,
																customerWhatsapp: e.target.value,
															})
														}
													/>
												</div>
											</div>

											<div className="grid sm:grid-cols-2 gap-3">
												<div>
													<label className="text-sm font-medium block mb-1.5">
														Estado de cotizacion
													</label>
													<Select
														value={quoteDraft.status}
														onChange={(e) =>
															setQuoteDraft({
																...quoteDraft,
																status: e.target.value as QuoteStatus,
															})
														}
													>
														{quoteStatusOptions.map((option) => (
															<option key={option.value} value={option.value}>
																{option.label}
															</option>
														))}
													</Select>
												</div>
												<div>
													<label className="text-sm font-medium block mb-1.5">
														Subtotal
													</label>
													<div className="h-10 rounded-lg border px-3 flex items-center bg-muted/40 font-semibold">
														${subtotalFromItems(quoteDraft.items).toFixed(2)}
													</div>
												</div>
											</div>

											<div>
												<label className="text-sm font-medium block mb-1.5">
													Notas
												</label>
												<Textarea
													rows={2}
													value={quoteDraft.customerNotes}
													onChange={(e) =>
														setQuoteDraft({
															...quoteDraft,
															customerNotes: e.target.value,
														})
													}
												/>
											</div>

											<div className="flex items-center justify-between">
												<p className="font-semibold">Productos</p>
												<Button
													size="sm"
													variant="outline"
													onClick={addQuoteItem}
												>
													Agregar producto
												</Button>
											</div>

											<div className="space-y-3 max-h-[420px] overflow-auto pr-1">
												{quoteDraft.items.map((item) => (
													<div
														key={item.id}
														className="rounded-xl border p-3 space-y-2"
													>
														<div className="grid sm:grid-cols-2 gap-2">
															<Input
																value={item.name}
																onChange={(e) =>
																	handleQuoteItemChange(
																		item.id,
																		"name",
																		e.target.value,
																	)
																}
															/>
															<Input
																value={item.categoryLabel}
																onChange={(e) =>
																	handleQuoteItemChange(
																		item.id,
																		"categoryLabel",
																		e.target.value,
																	)
																}
															/>
														</div>

														<div className="grid sm:grid-cols-3 gap-2">
															<Input
																type="number"
																min="0"
																step="0.1"
																value={item.weight}
																onChange={(e) =>
																	handleQuoteItemChange(
																		item.id,
																		"weight",
																		e.target.value,
																	)
																}
															/>
															<Input
																type="number"
																min="1"
																step="1"
																value={item.quantity}
																disabled={item.pricingMode === "per_pound"}
																onChange={(e) =>
																	handleQuoteItemChange(
																		item.id,
																		"quantity",
																		e.target.value,
																	)
																}
															/>
															<Input
																type="number"
																min="0"
																step="0.01"
																value={item.unitPrice}
																onChange={(e) =>
																	handleQuoteItemChange(
																		item.id,
																		"unitPrice",
																		e.target.value,
																	)
																}
															/>
														</div>

														<div className="flex items-center justify-between">
															<p className="text-sm text-muted-foreground">
																Total item: $
																{(normalizeItem(item).totalPrice ?? 0).toFixed(
																	2,
																)}
															</p>
															<Button
																size="sm"
																variant="outline"
																onClick={() => removeQuoteItem(item.id)}
															>
																Quitar
															</Button>
														</div>
													</div>
												))}
											</div>

											<div className="grid sm:grid-cols-2 gap-3 pt-2 border-t">
												<Button onClick={handleSaveQuote} disabled={saving}>
													{saving ? "Guardando..." : "Guardar cotizacion"}
												</Button>
												<div className="flex gap-2">
													<Select
														value={convertFlightId}
														onChange={(e) => setConvertFlightId(e.target.value)}
													>
														<option value="">Elegir vuelo</option>
														{flights.map((flight) => (
															<option key={flight.id} value={flight.id}>
																{formatDate(flight.departureDate)} -{" "}
																{flight.location}
															</option>
														))}
													</Select>
													<Button
														onClick={handleConvertQuote}
														disabled={
															saving || selectedQuote.status === "converted"
														}
													>
														Convertir
													</Button>
												</div>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					</div>
				)}

				{activeTab === "orders" && (
					<div className="grid lg:grid-cols-5 gap-6">
						<div className="lg:col-span-2">
							<Card className="border-0 shadow-sm">
								<CardHeader>
									<CardTitle>Pedidos</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									{orders.length === 0 && (
										<p className="text-sm text-muted-foreground">
											No hay pedidos.
										</p>
									)}

									{orders.map((order) => {
										const orderFlight = flightsById.get(order.flightId) || null;

										return (
											<div
												key={order.id}
												className={`rounded-xl border p-4 transition-colors ${
													selectedOrderId === order.id
														? "border-primary bg-primary/5"
														: "border-border bg-background"
												}`}
											>
												<button
													type="button"
													onClick={() => setSelectedOrderId(order.id)}
													className="w-full text-left"
												>
													<div className="flex items-center justify-between gap-2">
														<p className="font-semibold truncate">
															Pedido {order.id.slice(0, 8)}
														</p>
														<Badge
															variant={
																orderItemStatusLabels[order.status].variant
															}
														>
															{orderItemStatusLabels[order.status].label}
														</Badge>
													</div>
													<p className="text-sm text-muted-foreground mt-1">
														{order.customerName}
													</p>
													<p className="text-sm">
														{order.items.length} producto(s)
													</p>
												</button>
												<p className="text-xs text-muted-foreground mt-1">
													Vuelo:{" "}
													{orderFlight ? (
														<button
															type="button"
															onClick={() =>
																openFlightFromOrder(order.flightId)
															}
															className="underline decoration-dotted underline-offset-2 hover:text-foreground"
														>
															{formatFlightLabel(orderFlight)}
														</button>
													) : (
														order.flightId.slice(0, 8)
													)}
												</p>
											</div>
										);
									})}
								</CardContent>
							</Card>
						</div>

						<div className="lg:col-span-3">
							<Card className="border-0 shadow-sm">
								<CardHeader>
									<CardTitle>Detalle de pedido</CardTitle>
								</CardHeader>
								<CardContent>
									{!selectedOrder ? (
										<p className="text-sm text-muted-foreground">
											Selecciona un pedido para actualizar estado por producto.
										</p>
									) : (
										<div className="space-y-4">
											<div className="rounded-xl border p-4 bg-muted/30">
												<p className="font-semibold">
													{selectedOrder.customerName}
												</p>
												<p className="text-sm text-muted-foreground">
													WhatsApp: {selectedOrder.customerWhatsapp}
												</p>
												<p className="text-sm text-muted-foreground">
													Vuelo:{" "}
													{selectedOrderFlight ? (
														<button
															type="button"
															onClick={() =>
																openFlightFromOrder(selectedOrder.flightId)
															}
															className="underline decoration-dotted underline-offset-2 hover:text-foreground"
														>
															{formatFlightLabel(selectedOrderFlight)}
														</button>
													) : (
														selectedOrder.flightId.slice(0, 8)
													)}
												</p>
											</div>

											<div className="space-y-3">
												{selectedOrder.items.map((item) => (
													<div
														key={item.id}
														className="rounded-xl border p-3 flex items-center justify-between gap-3"
													>
														<div className="min-w-0">
															<p className="font-medium truncate">
																{item.name}
															</p>
															<p className="text-sm text-muted-foreground">
																{item.pricingMode === "per_pound"
																	? `${item.weight} lb`
																	: `${item.quantity} unidad(es)`}
																- ${item.totalPrice.toFixed(2)}
															</p>
															<p className="text-xs text-muted-foreground">
																Vuelo:{" "}
																{selectedOrderFlight ? (
																	<button
																		type="button"
																		onClick={() =>
																			openFlightFromOrder(
																				selectedOrder.flightId,
																			)
																		}
																		className="underline decoration-dotted underline-offset-2 hover:text-foreground"
																	>
																		{formatFlightLabel(selectedOrderFlight)}
																	</button>
																) : (
																	selectedOrder.flightId.slice(0, 8)
																)}
															</p>
														</div>
														<div className="flex items-center gap-2">
															<Badge
																variant={
																	orderItemStatusLabels[item.status].variant
																}
															>
																{orderItemStatusLabels[item.status].label}
															</Badge>
															<Select
																value={item.status}
																onChange={(e) =>
																	handleOrderItemStatusChange(
																		selectedOrder.id,
																		item.id,
																		e.target.value as OrderItemStatus,
																	)
																}
															>
																{orderItemStatusOptions.map((option) => (
																	<option
																		key={option.value}
																		value={option.value}
																	>
																		{option.label}
																	</option>
																))}
															</Select>
														</div>
													</div>
												))}
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					</div>
				)}

				{activeTab === "flights" && (
					<div className="grid lg:grid-cols-5 gap-6">
						<div className="lg:col-span-3">
							<Card className="border-0 shadow-sm">
								<CardHeader className="flex flex-row items-center justify-between">
									<CardTitle>Vuelos</CardTitle>
									<Button
										size="sm"
										onClick={() => {
											resetFlightForm();
											setShowFlightForm(true);
										}}
									>
										Agregar vuelo
									</Button>
								</CardHeader>
								<CardContent className="space-y-3">
									{flights.map((flight) => {
										const flightOrders = ordersByFlightId.get(flight.id) || [];

										return (
											<div
												key={flight.id}
												className={`rounded-xl border p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between ${
													selectedFlightId === flight.id
														? "border-primary bg-primary/5"
														: ""
												}`}
											>
												<div>
													<p className="font-semibold">{flight.location}</p>
													<p className="text-sm text-muted-foreground">
														Salida: {formatDate(flight.departureDate)}
													</p>
													<p className="text-sm text-muted-foreground">
														Arribo: {formatDate(flight.date)}
													</p>
													<p className="text-sm mt-2">
														Pedidos asignados:{" "}
														<span className="font-semibold">
															{flightOrders.length}
														</span>
													</p>
													{flightOrders.length > 0 ? (
														<div className="mt-2 space-y-1.5">
															{flightOrders.map((order) => (
																<button
																	key={order.id}
																	type="button"
																	onClick={() => openOrderFromFlight(order.id)}
																	className="text-xs rounded-md border bg-background px-2 py-1 hover:bg-muted"
																>
																	{order.customerName} - #{order.id.slice(0, 6)}
																</button>
															))}
														</div>
													) : (
														<p className="text-xs text-muted-foreground mt-2">
															Sin pedidos asignados.
														</p>
													)}
												</div>
												<div className="flex items-center gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => setSelectedFlightId(flight.id)}
													>
														Ver pedidos
													</Button>
													<Badge
														variant={flightStatusLabels[flight.status].variant}
													>
														{flightStatusLabels[flight.status].label}
													</Badge>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleEditFlight(flight)}
													>
														Editar
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleDeleteFlight(flight.id)}
													>
														Eliminar
													</Button>
												</div>
											</div>
										);
									})}
								</CardContent>
							</Card>
						</div>

						<div className="lg:col-span-2">
							{showFlightForm ? (
								<Card className="border-0 shadow-sm">
									<CardHeader>
										<CardTitle>
											{editingFlightId ? "Editar vuelo" : "Nuevo vuelo"}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<form onSubmit={handleFlightSubmit} className="space-y-3">
											<div>
												<label className="text-sm font-medium block mb-1.5">
													Fecha de salida
												</label>
												<Input
													type="date"
													value={flightFormData.departureDate}
													onChange={(e) =>
														setFlightFormData({
															...flightFormData,
															departureDate: e.target.value,
														})
													}
													required
												/>
											</div>

											<div>
												<label className="text-sm font-medium block mb-1.5">
													Fecha de arribo
												</label>
												<Input
													type="date"
													value={flightFormData.date}
													onChange={(e) =>
														setFlightFormData({
															...flightFormData,
															date: e.target.value,
														})
													}
													required
												/>
											</div>

											<div>
												<label className="text-sm font-medium block mb-1.5">
													Destino
												</label>
												<Input
													value={flightFormData.location}
													onChange={(e) =>
														setFlightFormData({
															...flightFormData,
															location: e.target.value,
														})
													}
													required
												/>
											</div>

											<div>
												<label className="text-sm font-medium block mb-1.5">
													Estado del vuelo
												</label>
												<Select
													value={flightFormData.status}
													onChange={(e) =>
														setFlightFormData({
															...flightFormData,
															status: e.target.value as FlightStatus,
														})
													}
												>
													{flightStatusOptions.map((option) => (
														<option key={option.value} value={option.value}>
															{option.label}
														</option>
													))}
												</Select>
											</div>

											<div>
												<label className="text-sm font-medium block mb-1.5">
													Notas
												</label>
												<Textarea
													rows={3}
													value={flightFormData.notes}
													onChange={(e) =>
														setFlightFormData({
															...flightFormData,
															notes: e.target.value,
														})
													}
												/>
											</div>

											<div className="flex gap-2 pt-1">
												<Button
													type="button"
													variant="outline"
													onClick={resetFlightForm}
													className="flex-1"
												>
													Cancelar
												</Button>
												<Button
													type="submit"
													className="flex-1"
													disabled={saving}
												>
													{saving ? "Guardando..." : "Guardar"}
												</Button>
											</div>
										</form>
									</CardContent>
								</Card>
							) : (
								<Card className="border-0 shadow-sm">
									<CardContent className="p-6 text-center">
										<p className="text-muted-foreground mb-4">
											Administra salidas, arribos y estados de vuelo.
										</p>
										<Button onClick={() => setShowFlightForm(true)}>
											Agregar vuelo
										</Button>
									</CardContent>
								</Card>
							)}
						</div>
					</div>
				)}
			</Container>
		</div>
	);
}
