import { Calendar, MapPin, CheckCircle2 } from "lucide-react";

export function BPITItinerary() {
  const days = [
    {
      day: "Day 0",
      title: "Overnight Journey from Delhi NCR",
      activities: [
        "Boarding from Delhi (Pickups at designated metro points).",
        "Overnight AC Volvo / Traveler road trip journey to Udaipur.",
        "Ice-breaker session & road trip games with your college batch.",
      ],
    },
    {
      day: "Day 1",
      title: "Arrival in Udaipur, Lake Pichola & City Palace",
      activities: [
        "Reach Udaipur in the morning, check-in to handpicked 3-star hotel & fresh up.",
        "Visit the magnificent City Palace & Jagdish Temple.",
        "Sunset boat ride at Lake Pichola with views of Taj Lake Palace & Jag Mandir.",
        "Welcome dinner & evening free to explore local markets.",
      ],
    },
    {
      day: "Day 2",
      title: "Monsoon Palace, Fateh Sagar & Bonfire Jamming",
      activities: [
        "Breakfast at hotel.",
        "Explore Saheliyon Ki Bari and Monsoon Palace (Sajjangarh) for panoramic hill views.",
        "Sunset at Fateh Sagar Lake & famous roadside cold coffee hangout.",
        "Late evening bonfire & acoustic music session with college squad.",
      ],
    },
    {
      day: "Day 3",
      title: "Old City Food Walk, Souvenir Shopping & Return",
      activities: [
        "Breakfast & hotel checkout.",
        "Explore Udaipur's famous leather craft, miniature paintings & street food at Hathipole.",
        "Board return transport towards Delhi NCR.",
        "Reach Delhi early next morning with unforgettable college memories.",
      ],
    },
  ];

  return (
    <section id="bpit-itinerary-section" className="py-16 bg-background font-poppins">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-2 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-xs font-semibold text-blue-600">
            <Calendar className="h-3.5 w-3.5" />
            <span>Itinerary Overview</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            3-Day Action Packed Plan
          </h2>
        </div>

        <div className="space-y-6">
          {days.map((d, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-card border border-border/60 hover:border-blue-500/30 transition-all shadow-sm space-y-4"
            >
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold font-mono">
                  {d.day}
                </span>
                <h3 className="text-lg font-bold text-foreground font-display">{d.title}</h3>
              </div>
              <ul className="space-y-2">
                {d.activities.map((act, actIdx) => (
                  <li key={actIdx} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
