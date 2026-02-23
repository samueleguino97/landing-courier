import { createFileRoute } from "@tanstack/react-router";
import { Benefits } from "@/components/landing/benefits";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Quoter } from "@/components/landing/quoter";
import { Services } from "@/components/landing/services";
import { WhatsAppFloat } from "@/components/landing/whatsapp-float";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	return (
		<main className="min-h-screen">
			<Hero />
			<Quoter />
			<Services />
			<HowItWorks />
			<Benefits />
			<FAQ />
			<Footer />
			<WhatsAppFloat />
		</main>
	);
}
