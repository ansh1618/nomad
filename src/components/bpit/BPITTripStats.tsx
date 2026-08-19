import { Calendar, MapPin, ShieldCheck, Users, Clock, Award } from "lucide-react";

export function BPITTripStats() {
  const stats = [
    { icon: Clock, label: "Duration", val: "2N / 3D", sub: "Udaipur & Mount Abu" },
    { icon: Users, label: "Batch Type", val: "BPIT Special", sub: "College & Friends" },
    { icon: ShieldCheck, label: "Safety & Care", val: "100% Verified", sub: "Expert Captains" },
    { icon: Award, label: "Experiences", val: "Palaces & Lakes", sub: "Sunsets & Jamming" },
  ];

  return (
    <section className="bg-slate-900 border-y border-white/10 py-6 text-white font-poppins">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((st, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-400/20 shrink-0">
                <st.icon className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{st.label}</p>
                <p className="text-base font-bold text-white">{st.val}</p>
                <p className="text-xs text-[#C8A96A] font-medium">{st.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
