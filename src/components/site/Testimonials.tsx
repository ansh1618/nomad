import { Reveal } from "./Reveal";
import { Star, Quote, MapPin } from "lucide-react";

interface Review {
  name: string;
  avatar: string;
  location: string;
  trip: string;
  rating: number;
  text: string;
  date: string;
}

const reviews: Review[] = [
  {
    name: "Priya Sharma",
    avatar: "https://i.pravatar.cc/80?img=47",
    location: "Delhi NCR",
    trip: "Manali Weekend Escape",
    rating: 5,
    text: "Honestly didn't expect this level of planning from an Indian travel company. The Trip Captain knew every hidden café and scenic stop. I've already booked Jibhi with them.",
    date: "June 2025",
  },
  {
    name: "Arjun Mehta",
    avatar: "https://i.pravatar.cc/80?img=68",
    location: "Mumbai",
    trip: "Chopta & Tungnath Trek",
    rating: 5,
    text: "The trek was perfectly paced — not too rushed, not too slow. The campfire night at Chopta with strangers-turned-friends was the highlight of my year. Will come back for Spiti.",
    date: "May 2025",
  },
  {
    name: "Sneha Reddy",
    avatar: "https://i.pravatar.cc/80?img=45",
    location: "Bangalore",
    trip: "Jibhi & Tirthan Valley",
    rating: 5,
    text: "Traveled solo as a woman and felt 100% safe the entire time. The wooden cottage stay was dreamy. The group bonded so well that we have a separate WhatsApp group now!",
    date: "April 2025",
  },
  {
    name: "Rohan Kapoor",
    avatar: "https://i.pravatar.cc/80?img=12",
    location: "Chandigarh",
    trip: "McLeod Ganj & Bir Billing",
    rating: 5,
    text: "The paragliding at Bir was unreal. But what made this trip special was the tempo traveller ride — music, chai stops, and views you can't get on a flight. Premium experience at fair pricing.",
    date: "March 2025",
  },
  {
    name: "Ananya Gupta",
    avatar: "https://i.pravatar.cc/80?img=32",
    location: "Jaipur",
    trip: "Udaipur Heritage Ride",
    rating: 5,
    text: "The haveli stay was gorgeous. Our Trip Captain took us to a local pottery village that isn't on Google Maps. This is what authentic travel looks like. Highly recommend Nomadik.",
    date: "February 2025",
  },
  {
    name: "Vikram Singh",
    avatar: "https://i.pravatar.cc/80?img=60",
    location: "Pune",
    trip: "Manali Weekend Escape",
    rating: 4,
    text: "Great vibes, amazing group. Only suggestion — the Manali old town walk could have been longer. Everything else was top notch. Already eyeing the Chopta trek next.",
    date: "January 2025",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-gold text-gold" : "text-border"}`}
        />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center pb-14">
          <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">
            VERIFIED REVIEWS
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
            Explorer Stories
          </h2>
          <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
            Real reviews from real travelers. No paid promotions, no influencer deals — just honest road trip feedback.
          </p>
          {/* Google Reviews badge */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-2 shadow-soft">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-xs font-poppins font-bold text-primary">4.9</span>
            <StarRating rating={5} />
            <span className="text-[10px] text-muted-foreground">on Google</span>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal key={r.name} delay={i}>
              <article className="group h-full rounded-3xl bg-white border border-border p-7 shadow-soft hover:border-gold/30 hover:shadow-gold/10 transition-all duration-300 flex flex-col">
                {/* Quote icon */}
                <Quote className="h-6 w-6 text-gold/30 mb-3 shrink-0" />

                {/* Review text */}
                <p className="text-sm text-foreground/80 leading-relaxed font-sans flex-1">
                  "{r.text}"
                </p>

                {/* Trip tag */}
                <div className="mt-4 mb-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-[10px] font-poppins font-semibold text-accent">
                    <MapPin className="h-3 w-3" />
                    {r.trip}
                  </span>
                </div>

                {/* Reviewer info */}
                <div className="flex items-center gap-3 border-t border-border pt-4">
                  <img
                    src={r.avatar}
                    alt={r.name}
                    className="h-10 w-10 rounded-full object-cover border-2 border-gold/20"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground">{r.location} · {r.date}</p>
                  </div>
                  <StarRating rating={r.rating} />
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
