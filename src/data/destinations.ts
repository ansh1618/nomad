const manaliImg = "/assets/dest-manali.jpg";
const jibhiImg = "/assets/dest-jibhi.jpg";
const udaipurImg = "/assets/dest-udaipur.jpg";
const kashmirImg = "/assets/dest-kashmir.jpg"; // using as fallback for McLeod Ganj
const adventureImg = "/assets/pkg-adventure.jpg"; // using as fallback for Chopta

export interface Destination {
  slug: string;
  name: string;
  subtitle: string;
  image: string;
  overview: string;
  bestTime: string;
  weather: {
    summer: string;
    monsoon: string;
    winter: string;
  };
  howToReach: {
    road: string;
    rail: string;
    air: string;
  };
  topPlaces: string[];
  faqs: { q: string; a: string }[];
  reviews: {
    name: string;
    avatar: string;
    rating: number;
    text: string;
    date: string;
  }[];
}

export const destinations: Destination[] = [
  {
    slug: "manali",
    name: "Manali",
    subtitle: "Gateway to the majestic Solang Valley and Rohtang Pass",
    image: manaliImg,
    overview: "Nestled in the Beas River valley, Manali is a premium high-altitude Himalayan resort town. It is a magnet for road travelers, backpackers, and adventure enthusiasts seeking gorgeous pine forests, snow-clad peaks, and co-traveler connections.",
    bestTime: "October to June (Snow seekers: Dec–Feb; Paragliders: Mar–May)",
    weather: {
      summer: "15°C to 25°C · Pleasant and clear skies.",
      monsoon: "10°C to 18°C · Heavy rainfall; landslides possible, caution advised.",
      winter: "-2°C to 10°C · Sub-zero temperatures with heavy snowfall."
    },
    howToReach: {
      road: "Direct overnight semi-sleeper Volvo buses run daily from Delhi NCR (approx 12-14 hours, 540 KM).",
      rail: "Nearest broad gauge railhead is Ambala Cantt (340 km) or Chandigarh (310 km).",
      air: "Nearest domestic airport is Bhuntar (Kullu), located 50 km south of Manali."
    },
    topPlaces: ["Solang Valley", "Hadimba Temple", "Jogini Waterfalls", "Old Manali Cafes", "Sethan Valley"],
    faqs: [
      { q: "Is pickup available from Delhi?", a: "Yes, all our Manali group journeys include premium traveler pickup from Majnu ka Tilla, Delhi NCR." },
      { q: "What kind of clothing should I pack?", a: "For summers, light woolens are sufficient. For winters, pack heavy thermal innerwear, down jackets, and snow-proof boots." }
    ],
    reviews: [
      {
        name: "Abhinav Singh",
        avatar: "AS",
        rating: 5,
        text: "The Manali road trip was pure magic. Our trip captain took us to some secret cafe spots in Old Manali that you won't find on Google Maps!",
        date: "2 weeks ago"
      },
      {
        name: "Meera Sen",
        avatar: "MS",
        rating: 5,
        text: "Incredible stays and super safe road journey. Traveling solo as a female traveler, I felt completely at ease with the Nomadik group.",
        date: "1 month ago"
      }
    ]
  },
  {
    slug: "jibhi",
    name: "Jibhi",
    subtitle: "An untouched fairytale hamlet in the Tirthan Valley",
    image: jibhiImg,
    overview: "Jibhi is a serene, scenic hamlet nestled in the lush green pine forests of Himachal's Tirthan Valley. Renowned for its traditional wooden architecture, crystal-clear streams, and cozy treehouses, it is the ultimate retreat for slow travelers and nature lovers.",
    bestTime: "March to June & October to December (Clear mountain views)",
    weather: {
      summer: "12°C to 22°C · Warm days, cool nights; ideal for trekking.",
      monsoon: "8°C to 15°C · High humidity, heavy rain showers; lush greenery.",
      winter: "-1°C to 12°C · Very cold, occasional snowfall in nearby Jalori Pass."
    },
    howToReach: {
      road: "Delhi to Aut tunnel via bus (11 hours), followed by a local cab to Jibhi (approx 1 hour, 35 KM).",
      rail: "Nearest railway station is Shimla (150 km) or Joginder Nagar (120 km).",
      air: "Nearest airport is Bhuntar (Kullu), which is 60 km from Jibhi."
    },
    topPlaces: ["Jibhi Waterfall", "Jalori Pass", "Serolsar Lake", "Chehni Kothi", "Choi Waterfall"],
    faqs: [
      { q: "Can I customize the Jibhi itinerary?", a: "Absolutely! We offer flexible customized extensions for couples and private groups." },
      { q: "Is internet connectivity reliable in Jibhi?", a: "Jibhi has decent 4G connectivity (Airtel/Jio), though remote locations like Jalori Pass may have limited signal." }
    ],
    reviews: [
      {
        name: "Shreya Nair",
        avatar: "SN",
        rating: 5,
        text: "Waking up to the sound of the stream in Jibhi was healing. Nomadik planned it flawlessly.",
        date: "3 weeks ago"
      }
    ]
  },
  {
    slug: "chopta-tungnath",
    name: "Chopta & Tungnath",
    subtitle: "The Mini Switzerland of Uttarakhand and the highest Shiva temple",
    image: adventureImg,
    overview: "Chopta is an unspoiled natural destination lying in the laps of the Uttarakhand Himalayas. Serving as the base for the Tungnath temple and Chandrashila peak trek, it offers stunning alpine meadows (Bugyals) and 360-degree views of majestic snow-peaks.",
    bestTime: "April to November (Trek remains open; snow treks in Jan-Mar)",
    weather: {
      summer: "10°C to 20°C · Extremely pleasant; lush green meadows.",
      monsoon: "6°C to 14°C · Misty atmosphere, heavy rains; landslides common.",
      winter: "-5°C to 8°C · Frozen landscape, temple doors close; heavy snow."
    },
    howToReach: {
      road: "Well connected by road to Rishikesh/Haridwar (approx 7-8 hours drive, 200 KM). All group departures start from Rishikesh.",
      rail: "Nearest railhead is Rishikesh railway station, which is 200 km away.",
      air: "Nearest airport is Jolly Grant Airport, Dehradun (220 km)."
    },
    topPlaces: ["Tungnath Temple", "Chandrashila Peak", "Deoria Tal Lake", "Ukhimath", "Kanchula Kharak Sanctuary"],
    faqs: [
      { q: "Is the Tungnath trek difficult?", a: "The trek is moderate, about 5 km one-way from Chopta, on a well-defined paved trail. Most first-timers do it easily." },
      { q: "Are meals included in the camp?", a: "Yes, hot freshly prepared organic local pahadi meals (breakfast & dinner) are included at the Chopta camps." }
    ],
    reviews: [
      {
        name: "Rohan Varma",
        avatar: "RV",
        rating: 5,
        text: "The sunrise from Chandrashila peak was life-changing. Excellent trip captain who kept our spirits high during the trek!",
        date: "1 month ago"
      }
    ]
  },
  {
    slug: "mcleodganj",
    name: "McLeod Ganj",
    subtitle: "The vibrant home of His Holiness the Dalai Lama",
    image: kashmirImg,
    overview: "McLeod Ganj, a suburb of Dharamshala in Himachal Pradesh, is affectionately known as 'Little Lhasa'. Nestled in the Dhauladhar range, it boasts a unique blend of Tibetan culture, spiritual monasteries, breathtaking cafes, and classic trails like Triund.",
    bestTime: "September to June (Perfect weather for exploring and trekking)",
    weather: {
      summer: "18°C to 28°C · Sunny and breezy; ideal for outdoor exploration.",
      monsoon: "12°C to 20°C · Very heavy rainfall; mist covers the mountains.",
      winter: "2°C to 12°C · Chilly, with freezing winds and occasional snow at Triund."
    },
    howToReach: {
      road: "Direct overnight buses run from Delhi Kashmiri Gate (approx 10-12 hours, 480 KM).",
      rail: "Nearest broad gauge rail station is Pathankot (85 km away).",
      air: "Nearest airport is Gaggal Airport (Kangra), located 20 km from McLeod Ganj."
    },
    topPlaces: ["Dalai Lama Temple", "Bhagsunag Waterfall", "Triund Trek", "Naddi Viewpoint", "St. John in the Wilderness"],
    faqs: [
      { q: "Can we camp at Triund overnight?", a: "Yes, we arrange guided overnight camps at Triund with premium sleeping bags and warm meals." },
      { q: "Are payments secure?", a: "All transactions are fully encrypted. We support booking deposits and flexible split payments." }
    ],
    reviews: [
      {
        name: "Karan Johar",
        avatar: "KJ",
        rating: 5,
        text: "Loved the cafes, loved the Triund trek, loved the community. Nomadik connects you with other solo travelers beautifully.",
        date: "3 weeks ago"
      }
    ]
  },
  {
    slug: "udaipur",
    name: "Udaipur",
    subtitle: "The majestic City of Lakes and royal Mewar history",
    image: udaipurImg,
    overview: "Udaipur, the historic capital of the kingdom of Mewar, is a premium cultural destination in Rajasthan. Famous for its pristine lakes, grand palaces, heritage Havelis, and scenic Aravali roads, it is the perfect weekend escape for heritage and art lovers.",
    bestTime: "September to March (Pleasant winter months for sightseeing)",
    weather: {
      summer: "28°C to 40°C · Hot and dry days; pleasant evenings by the lake.",
      monsoon: "24°C to 32°C · Rain turns the surrounding Aravali hills green.",
      winter: "10°C to 25°C · Cozy, pleasant weather; ideal for street walking."
    },
    howToReach: {
      road: "Direct highway connectivity via NH 48 from Ahmedabad (4 hours) or Delhi/NCR (11 hours).",
      rail: "Udaipur City Railway Station is well connected to all major Indian metros.",
      air: "Maharana Pratap Airport is 22 km from the city center, with daily direct flights."
    },
    topPlaces: ["City Palace", "Lake Pichola", "Sajjangarh Monsoon Palace", "Jagmandir", "Fateh Sagar Lake"],
    faqs: [
      { q: "Is pick-up available from Udaipur station?", a: "Yes, we arrange comfortable AC transport pickup from Udaipur station or Airport on day one." },
      { q: "Can we customize the heritage tours?", a: "Yes! Private custom itineraries are available for all Rajasthan journeys." }
    ],
    reviews: [
      {
        name: "Ananya Mehta",
        avatar: "AM",
        rating: 5,
        text: "Udaipur felt like a painting. Staying at a heritage haveli overlooking Lake Pichola was outstanding. Nomadik rules!",
        date: "2 months ago"
      }
    ]
  }
];
