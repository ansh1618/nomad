import { useState } from "react";
import { Reveal } from "./Reveal";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: "Is it safe to travel solo with Nomadik?",
    answer:
      "Absolutely. Over 60% of our explorers are solo travelers. Every trip is led by an experienced Trip Captain, runs in GPS-tracked vehicles, and includes 24×7 support from our Delhi NCR operations team. We've safely hosted 15,000+ travelers across 120+ trips.",
  },
  {
    question: "Where is the pickup and drop point?",
    answer:
      "Most trips depart from Delhi NCR (Majnu Ka Tila or Kashmere Gate). Chandigarh pickup is available for Himachal trips. Exact pickup details are shared 48 hours before departure via WhatsApp. Airport transfers can be arranged at additional cost.",
  },
  {
    question: "Are meals included in the journey price?",
    answer:
      "Breakfast and dinner are included on all trips. Lunch is on your own so you can explore local eateries and street food — that's part of the adventure! We recommend budget-friendly local restaurants at every stop.",
  },
  {
    question: "Can I customize an itinerary or do a private group trip?",
    answer:
      "Yes! We offer custom itineraries for private groups of 6+ explorers. You can choose dates, stays, and routes. Contact our Trip Planning team via WhatsApp or the website form and we'll design a personalized journey within 24 hours.",
  },
  {
    question: "Do you offer EMI or split payment options?",
    answer:
      "Yes. You can secure your seat with a token amount of ₹2,000 and pay the rest in installments before the trip date. We support UPI, bank transfers, and select EMI options through Razorpay.",
  },
  {
    question: "What about safety for women travelers?",
    answer:
      "Women safety is our top priority. All Trip Captains are background-verified. Our groups maintain a healthy gender ratio. We have a dedicated women's safety helpline, and female Trip Captains are available on select departures. Over 40% of our explorer community is women.",
  },
  {
    question: "What is the cancellation and refund policy?",
    answer:
      "Full refund if cancelled 15+ days before departure. 50% refund for 7-14 days. No refund within 7 days, but you can transfer your seat to someone else. Trip date changes are free if done 10+ days in advance, subject to availability.",
  },
  {
    question: "What should I pack for a mountain road trip?",
    answer:
      "We share a detailed packing checklist via WhatsApp 5 days before your trip. Essentials include layered clothing, comfortable trekking shoes, a rain jacket, sunscreen, and a power bank. We provide sleeping bags for camping trips.",
  },
];

function FaqAccordionItem({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={`rounded-2xl border transition-colors duration-300 ${isOpen ? "border-gold/40 bg-gold/5" : "border-border bg-white"}`}>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-semibold text-primary font-sans pr-4">{item.question}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180 text-gold" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-60 pb-5 px-5" : "max-h-0"}`}
      >
        <p className="text-xs text-muted-foreground leading-relaxed font-sans">{item.answer}</p>
      </div>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-5">
        <Reveal className="text-center pb-12">
          <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">
            GOT QUESTIONS?
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
            Frequently Asked
          </h2>
          <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
            Everything you need to know before hitting the road with us.
          </p>
        </Reveal>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <Reveal key={i} delay={Math.min(i, 3)}>
              <FaqAccordionItem
                item={faq}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
