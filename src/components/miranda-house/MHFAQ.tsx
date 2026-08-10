import { motion } from "motion/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export function MHFAQ() {
  const faqs = [
    {
      q: "Is this trip only for Miranda House students?",
      a: "While this exclusive batch is curated for Miranda House students, you are welcome to bring along your friends from other DU/college campuses into your girl gang!",
    },
    {
      q: "What is the trip duration?",
      a: "The trip is 2 Nights and 3 Days long (departing on 11 September 2026), covering Udaipur City Palace, Lake Pichola sunset cruise, and a day trip to Mount Abu.",
    },
    {
      q: "What is the starting price?",
      a: "The trip starts from ₹6,499 per person for Quad Sharing stay accommodation, which includes AC vehicle transfers, hotel stay, daily breakfast & dinner, boat ride, and bonfire activities.",
    },
    {
      q: "Can I use the STUTI500 coupon?",
      a: "Yes! Use coupon code STUTI500 during booking checkout to instantly receive FLAT ₹500 OFF on your booking.",
    },
    {
      q: "How do I book?",
      a: "Click 'Book Your Spot' on this page, choose your room sharing option, enter traveller details, apply code STUTI500, and complete your booking via Razorpay or UPI.",
    },
  ];

  return (
    <section className="py-20 bg-slate-50 font-poppins">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-[#102A43] bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-xs">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="text-3xl font-display font-bold text-[#102A43]">
            Got Questions? We've Got Answers.
          </h2>
        </div>

        {/* Accordion */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((item, idx) => (
              <AccordionItem key={item.q} value={`faq-${idx}`} className="border-b border-slate-100 last:border-none pb-2">
                <AccordionTrigger className="text-left font-bold text-sm sm:text-base text-[#102A43] hover:text-[#E05688] py-3">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-slate-600 font-light leading-relaxed pt-1 pb-3">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
