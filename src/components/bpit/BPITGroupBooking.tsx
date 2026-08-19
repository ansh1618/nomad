import { Users, Phone, MessageSquare, GraduationCap } from "lucide-react";
import { BRAND } from "@/config/brand";

export function BPITGroupBooking() {
  const whatsappMsg = encodeURIComponent(
    "Hi GoNomadik! We are planning a group booking for the BPIT Udaipur 2026 trip. Please guide us with group rates!"
  );

  return (
    <section className="py-16 bg-gradient-to-r from-[#0F2642] via-[#1A365D] to-[#0E2038] text-white font-poppins relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-semibold text-blue-300 uppercase tracking-wider">
          <GraduationCap className="h-4 w-4 text-blue-400" />
          <span>College Gang Discounts</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">
          Traveling in a Group of 4 or More?
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto font-light">
          Get exclusive group pricing for your BPIT college gang. Connect directly with our trip captains for customized group reservations & room allocation.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a
            href={`https://wa.me/${BRAND.whatsapp}?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chat on WhatsApp</span>
          </a>

          <a
            href={`tel:${BRAND.phones[0]}`}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 backdrop-blur-md"
          >
            <Phone className="h-4 w-4 text-[#C8A96A]" />
            <span>Call Us: {BRAND.phones[0]}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
