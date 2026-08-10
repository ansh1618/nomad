import { motion } from "motion/react";
import { Clock, MapPin, CheckCircle2, Compass, Sun, Moon } from "lucide-react";

export function MHItinerary() {
  const days = [
    {
      day: "DAY 01",
      title: "ARRIVE IN UDAIPUR & ROYAL HERITAGE",
      subtitle: "Arrival, City Palace & Lakeview Evening",
      items: [
        { title: "Arrival & Welcome", desc: "Arrive in Udaipur by morning. Comfortable AC transfers to our lakeview stay." },
        { title: "Hotel Check-in & Refresh", desc: "Unpack, freshen up, and enjoy welcome drinks with your batch co-explorers." },
        { title: "City Palace Tour", desc: "Guided tour through Rajasthan's grandest palace complex overlooking Lake Pichola." },
        { title: "Jagdish Temple Visit", desc: "Marvel at the 370-year-old carved marble architecture and vibrant heritage alleys." },
        { title: "Local Market Exploration", desc: "Walk through Hathi Pol and Bada Bazaar for Juttis, handicrafts, and souvenirs." },
        { title: "Dinner & Overnight Stay", desc: "Authentic Rajasthani dinner served at our partner property." },
      ],
    },
    {
      day: "DAY 02",
      title: "LAKES, SUNSETS & BONFIRE JAM SESSION",
      subtitle: "Lake Pichola Cruise & Starlit Celebrations",
      items: [
        { title: "Buffet Breakfast", desc: "Fresh breakfast with lakeside mountain views." },
        { title: "Udaipur Sightseeing", desc: "Visit Saheliyon Ki Bari and Fatehsagar Lake promenade." },
        { title: "Lake Pichola Sunset Boat Cruise", desc: "Private boat ride during golden hour with palace reflections." },
        { title: "Free Time & Gang Photoshoot", desc: "Capture group reels and aesthetic photos with your girl gang." },
        { title: "Bonfire & Music Night", desc: "Cozy starlit bonfire, acoustic jam session, and group trivia games." },
        { title: "Special Dinner", desc: "Delightful dinner under the stars." },
      ],
    },
    {
      day: "DAY 03",
      title: "MOUNT ABU HILL STATION & DEPARTURE",
      subtitle: "Scenic Aravalli Drive & Return Journey",
      items: [
        { title: "Morning Breakfast & Check-out", desc: "Enjoy breakfast and complete check-out formalities." },
        { title: "Drive to Mount Abu", desc: "Scenic mountain road trip to Rajasthan's premier hill station." },
        { title: "Mount Abu Sightseeing & Nakki Lake", desc: "Explore Dilwara temples, Nakki Lake boat club, and local viewpoint." },
        { title: "Return Journey Starts", desc: "Head back with unforgettable college memories, photos, and lifelong friendships." },
      ],
    },
  ];

  return (
    <section id="mh-itinerary-section" className="py-20 bg-background font-poppins">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-[#E05688] bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-100">
            DAY-BY-DAY FLOW
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#102A43] tracking-tight">
            Detailed Trip Itinerary
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-light leading-relaxed">
            Thoughtfully planned 2 Nights • 3 Days itinerary for maximum fun, sightseeing, and relaxation.
          </p>
        </div>

        {/* Days Accordion / Timeline */}
        <div className="space-y-8">
          {days.map((dayData, dIdx) => (
            <motion.div
              key={dayData.day}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: dIdx * 0.1 }}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg space-y-6 hover:border-[#C8A96A]/40 transition-all"
            >
              {/* Day Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                <div className="flex items-center gap-3">
                  <span className="bg-[#102A43] text-[#C8A96A] font-display font-bold text-sm px-4 py-1.5 rounded-full">
                    {dayData.day}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold font-display text-[#102A43]">
                    {dayData.title}
                  </h3>
                </div>
                <span className="text-xs font-medium text-slate-500 italic">
                  {dayData.subtitle}
                </span>
              </div>

              {/* Items List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dayData.items.map((item, iIdx) => (
                  <div
                    key={item.title}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 hover:bg-rose-50/40 transition-colors"
                  >
                    <p className="font-bold text-xs sm:text-sm text-[#102A43] flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{item.title}</span>
                    </p>
                    <p className="text-xs text-slate-600 font-light pl-6">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
