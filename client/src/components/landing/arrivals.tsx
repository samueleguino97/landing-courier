import { useEffect, useState } from "react";
import type { ArrivalDate, DatesResponse } from "shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/container";
import { SERVER_URL } from "@/lib/constants";

const statusLabels: Record<
	string,
	{ label: string; variant: "success" | "warning" | "info" }
> = {
	programado: { label: "Programado", variant: "info" },
	en_camino: { label: "En Camino", variant: "warning" },
	llego: { label: "Llego", variant: "success" },
};

type ArrivalsProps = {
	variant?: "section" | "hero";
};

function useArrivalDates() {
	const [dates, setDates] = useState<ArrivalDate[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchDates() {
			try {
				const res = await fetch(`${SERVER_URL}/api/dates`);
				const data: DatesResponse = await res.json();
				if (data.success) {
					const upcoming = data.data
						.filter(
							(d) => new Date(d.date) >= new Date() || d.status !== "llego",
						)
						.sort(
							(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
						)
						.slice(0, 4);
					setDates(upcoming);
				}
			} catch (error) {
				console.error("Error fetching dates:", error);
			} finally {
				setLoading(false);
			}
		}
		fetchDates();
	}, []);

	return { dates, loading };
}

export function Arrivals({ variant = "section" }: ArrivalsProps) {
	const { dates, loading } = useArrivalDates();

	if (variant === "hero") {
		return <ArrivalsHeroPanel dates={dates} loading={loading} />;
	}

	if (loading) {
		return (
			<Section id="fechas" className="bg-background">
				<Container>
					<div className="text-center">
						<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
					</div>
				</Container>
			</Section>
		);
	}

	if (dates.length === 0) {
		return null;
	}

	return (
		<Section id="fechas" className="bg-background">
			<Container>
				<div className="text-center mb-16 animate-fade-in-up">
					<span className="inline-block bg-secondary px-4 py-1.5 rounded-full text-sm font-medium text-secondary-foreground mb-4">
						Proximos Vuelos
					</span>
					<h2 className="text-3xl md:text-4xl font-bold mb-4">
						Salida y Arribo
					</h2>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						Consulta fecha de salida y llegada de cada vuelo para planificar tu
						envio.
					</p>
				</div>

				<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
					{dates.map((arrival, index) => {
						const status = statusLabels[arrival.status];
						const departureDate = new Date(
							arrival.departureDate || arrival.date,
						);
						const arrivalDate = new Date(arrival.date);

						return (
							<Card
								key={arrival.id}
								className="card-hover border-0 shadow-md overflow-hidden animate-fade-in-up"
								style={{ animationDelay: `${index * 100}ms` }}
							>
								<div className="bg-gradient-primary h-2" />
								<CardContent className="p-6">
									<div className="flex items-center justify-between mb-4">
										<Badge variant={status.variant}>{status.label}</Badge>
										<CalendarIcon className="w-5 h-5 text-muted-foreground" />
									</div>

									<div className="mb-4 space-y-2">
										<div>
											<p className="text-xs uppercase tracking-wide text-muted-foreground">
												Salida
											</p>
											<p className="text-base font-semibold text-foreground capitalize">
												{departureDate.toLocaleDateString("es-BO", {
													day: "numeric",
													month: "long",
												})}
											</p>
										</div>
										<div>
											<p className="text-xs uppercase tracking-wide text-muted-foreground">
												Arribo
											</p>
											<p className="text-xl font-bold text-primary capitalize">
												{arrivalDate.toLocaleDateString("es-BO", {
													day: "numeric",
													month: "long",
													year: "numeric",
												})}
											</p>
										</div>
									</div>

									<div className="flex items-center gap-2 text-sm">
										<MapPinIcon className="w-4 h-4 text-accent" />
										<span className="font-medium">{arrival.location}</span>
									</div>

									{arrival.notes && (
										<p className="mt-3 text-xs text-muted-foreground">
											{arrival.notes}
										</p>
									)}
								</CardContent>
							</Card>
						);
					})}
				</div>
			</Container>
		</Section>
	);
}

function ArrivalsHeroPanel({
	dates,
	loading,
}: {
	dates: ArrivalDate[];
	loading: boolean;
}) {
	return (
		<Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
			<div className="bg-gradient-primary h-2" />
			<CardContent className="p-6">
				<div className="flex items-start justify-between gap-4 mb-5">
					<div>
						<span className="inline-block bg-[#3B9AC4]/10 text-[#3B9AC4] px-3 py-1 rounded-full text-xs font-semibold mb-3">
							Estado de Vuelos
						</span>
						<h3 className="text-2xl font-bold text-foreground mb-1">
							Salida y Arribo
						</h3>
						<p className="text-sm text-muted-foreground">
							Seguimiento de los proximos vuelos a Bolivia.
						</p>
					</div>
					<PlaneIcon className="w-8 h-8 text-[#3B9AC4] shrink-0 mt-1" />
				</div>

				{loading ? (
					<div className="h-40 flex items-center justify-center">
						<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
					</div>
				) : dates.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No hay fechas programadas por ahora.
					</p>
				) : (
					<div className="space-y-3">
						{dates.map((arrival) => {
							const status = statusLabels[arrival.status];
							const departureDate = new Date(
								arrival.departureDate || arrival.date,
							);
							const arrivalDate = new Date(arrival.date);

							return (
								<div
									key={arrival.id}
									className="rounded-xl border border-border/70 bg-background/80 p-3 flex items-center justify-between gap-3"
								>
									<div>
										<p className="text-base font-semibold text-foreground">
											{departureDate.toLocaleDateString("es-BO", {
												day: "numeric",
												month: "short",
											})}
											{" -> "}
											{arrivalDate.toLocaleDateString("es-BO", {
												day: "numeric",
												month: "short",
											})}
										</p>
										<p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
											<MapPinIcon className="w-3.5 h-3.5 text-accent" />
											{arrival.location}
										</p>
									</div>
									<Badge variant={status.variant} className="shrink-0">
										{status.label}
									</Badge>
								</div>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function CalendarIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			aria-hidden="true"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
			<line x1="16" y1="2" x2="16" y2="6" />
			<line x1="8" y1="2" x2="8" y2="6" />
			<line x1="3" y1="10" x2="21" y2="10" />
		</svg>
	);
}

function MapPinIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			aria-hidden="true"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
			<circle cx="12" cy="10" r="3" />
		</svg>
	);
}

function PlaneIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			aria-hidden="true"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
		</svg>
	);
}
