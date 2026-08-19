import { Check, X, ShieldCheck } from "lucide-react";

export function BPITInclusions() {
  const inclusions = [
    "AC Volvo / Force Traveler transfers (Delhi - Udaipur - Delhi)",
    "2 Nights accommodation in handpicked 3-star rated stays",
    "Daily Breakfast & Dinner at hotel",
    "Lake Pichola boat cruise experience ticket",
    "Bonfire & evening jam session",
    "Experienced & friendly GoNomadik Trip Captains throughout",
    "All toll taxes, parking fees, driver allowances",
  ];

  const exclusions = [
    "Monuments entry tickets & monument guides",
    "Personal expenses, shopping & extra snacks",
    "Anything not explicitly mentioned under inclusions",
  ];

  return (
    <section className="py-16 bg-muted/20 font-poppins">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-3xl font-display font-bold text-foreground">
            Inclusions & Exclusions
          </h2>
          <p className="text-sm text-muted-foreground">Transparent trip inclusions with zero hidden costs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Inclusions */}
          <div className="p-6 rounded-2xl bg-card border border-emerald-500/30 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-lg font-display">
              <ShieldCheck className="h-5 w-5" />
              <span>What's Included</span>
            </div>
            <ul className="space-y-3">
              {inclusions.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground">
                  <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Exclusions */}
          <div className="p-6 rounded-2xl bg-card border border-rose-500/20 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-rose-500 font-bold text-lg font-display">
              <X className="h-5 w-5" />
              <span>What's Excluded</span>
            </div>
            <ul className="space-y-3">
              {exclusions.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground">
                  <div className="p-1 rounded-full bg-rose-500/10 text-rose-500 shrink-0 mt-0.5">
                    <X className="h-3.5 w-3.5" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
