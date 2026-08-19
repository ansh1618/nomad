import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export function BPITFAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "Is this trip open to BPIT students and their friends?",
      a: "Yes! This special batch is curated for BPIT students and you are welcome to bring along your friends from other college campuses as well.",
    },
    {
      q: "What is the pickup location in Delhi?",
      a: "Pickups are arranged at central metro stations in Delhi NCR (such as Kashmere Gate / Majnu Ka Tila) with easy connectivity.",
    },
    {
      q: "Are room sharing options available for friends?",
      a: "Yes, double, triple, and quad sharing options are available so you can stay in rooms together with your college gang.",
    },
    {
      q: "What safety measures are in place?",
      a: "All stays are 100% verified 3-star properties. GoNomadik experienced Trip Captains travel with the group 24/7 to manage logistics and assist.",
    },
    {
      q: "How do I confirm my booking spot?",
      a: "Click 'Book Your Spot' to select your preferred room sharing type, enter traveller details, and complete payment via Razorpay.",
    },
  ];

  return (
    <section className="py-16 bg-background font-poppins">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-2 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-xs font-semibold text-blue-600">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-foreground">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={i}
                className="rounded-2xl bg-card border border-border/60 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-foreground"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-blue-600" : "text-muted-foreground"
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
