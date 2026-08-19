import { MapPin } from "lucide-react";

export function BPITDestinations() {
  const places = [
    {
      name: "Lake Pichola",
      desc: "Iconic freshwater lake surrounded by palaces, hills & bathing ghats.",
      img: "/images/destinations/udaipur-lake-pichola.jpg",
    },
    {
      name: "City Palace Udaipur",
      desc: "Grand palace complex showcasing Rajput architecture & panoramic views.",
      img: "/images/destinations/udaipur-city-palace.jpg",
    },
    {
      name: "Fateh Sagar Lake",
      desc: "Famous sunset hangout spot for college gangs with lakeside food stalls.",
      img: "/images/destinations/udaipur-fateh-sagar.jpg",
    },
    {
      name: "Saheliyon Ki Bari",
      desc: "Historic lush green garden with marble fountains & lotus pools.",
      img: "/images/destinations/udaipur-saheliyon-ki-bari.jpg",
    },
  ];

  return (
    <section className="py-16 bg-muted/30 font-poppins">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-2 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-xs font-semibold text-blue-600">
            <MapPin className="h-3.5 w-3.5" />
            <span>Places You'll Explore</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            Udaipur Iconic Spots
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {places.map((p, i) => (
            <div key={i} className="group rounded-2xl overflow-hidden bg-card border border-border/60 shadow-sm hover:shadow-md transition-all">
              <div className="h-48 overflow-hidden relative">
                <img
                  src={p.img}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <h3 className="absolute bottom-3 left-3 text-lg font-bold text-white font-display">
                  {p.name}
                </h3>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
