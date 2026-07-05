const manaliImg = "/assets/dest-manali.jpg";
const jibhiImg = "/assets/dest-jibhi.jpg";
const udaipurImg = "/assets/dest-udaipur.jpg";
const kashmirImg = "/assets/dest-kashmir.jpg"; // McLeod Ganj
const adventureImg = "/assets/pkg-adventure.jpg"; // Chopta

export interface Journey {
  slug: string;
  destinationSlug: string;
  name: string;
  image: string;
  duration: string;
  transport: string;
  difficulty: "Easy" | "Moderate" | "Extreme";
  distance: string;
  bestSeason: string;
  groupSize: string;
  price: string;
  totalSeats: number;
  bookedSeats: number;
  overview: string;
  highlights: string[];
  dayByDay: {
    day: number;
    title: string;
    description: string;
  }[];
  stayInfo: string;
  foodInfo: string;
  transportDetails: string;
  pickupPoint: string;
  dropPoint: string;
  inclusions: string[];
  exclusions: string[];
  packingList: string[];
}

export const journeys: Journey[] = [
  {
    slug: "manali-weekend",
    destinationSlug: "manali",
    name: "Manali Weekend Escape",
    image: manaliImg,
    duration: "3 Nights / 4 Days",
    transport: "Tempo Traveller / Self Drive Option",
    difficulty: "Easy",
    distance: "540 KM",
    bestSeason: "Year-Round",
    groupSize: "12-18 Explorers",
    price: "₹8,999",
    totalSeats: 18,
    bookedSeats: 13,
    overview: "Break free from the city grind with a curated 4-day road trip to Manali. Hike through magical pine forests, explore Old Manali's bohemian cafe culture, and drive up to Solang Valley with a community of like-minded explorers.",
    highlights: [
      "Scenic overnight drive from Delhi through Bilaspur and Mandi",
      "Stay in a premium cozy riverside cottage with forest views",
      "Explore Hadimba Temple, Jogini Falls, and the winding roads of Solang Valley",
      "Evening bonfire, acoustic music, and storytelling sessions"
    ],
    dayByDay: [
      {
        day: 1,
        title: "Delhi to Manali: The Journey Begins",
        description: "Board our premium AC Tempo Traveller from Majnu ka Tilla, Delhi at 6:30 PM. Meet your fellow Explorers and Trip Captain. Embark on a scenic overnight drive via NH 44."
      },
      {
        day: 2,
        title: "Riverside Cottage Check-in & Old Manali Cafe Walk",
        description: "Arrive in Manali by morning and check into our handpicked riverside cottage. Rest and freshen up. Post-lunch, take a guided stroll through Old Manali's vibrant streets, stopping at hidden cafes and exploring the ancient Hadimba Temple."
      },
      {
        day: 3,
        title: "Solang Valley Drive & Jogini Waterfall Hike",
        description: "Wake up to fresh mountain air. Drive to Solang Valley for stunning valley vistas and adventure sports. In the afternoon, embark on an easy 3-km pine-forest trek to Jogini Waterfalls. Return to the cottage for a cozy bonfire, music, and home-cooked dinner."
      },
      {
        day: 4,
        title: "Mall Road Exploration & Overnight Return to Delhi",
        description: "Enjoy a slow breakfast. Visit Mall Road for souvenir shopping and wood-fired pizzas. At 4:00 PM, board the Tempo Traveller for the overnight return road trip to Delhi NCR, arriving next morning with unforgettable memories."
      }
    ],
    stayInfo: "Cozy wood-and-stone premium riverside cottage (twin/triple sharing). Heated rooms, wooden balconies, and a private garden area.",
    foodInfo: "Fresh organic meals included: 2 Breakfasts and 2 Dinners. Prepared by local chefs focusing on local Himachali and North Indian flavors.",
    transportDetails: "AC Pushback Tempo Traveller from Delhi to Delhi. Inner-valley transfers in SUV (Bolero/Gypsy) for snowy terrain if required.",
    pickupPoint: "Majnu ka Tilla (near Gurudwara), Delhi NCR at 6:30 PM",
    dropPoint: "Majnu ka Tilla, Delhi NCR by 7:00 AM (Day 5)",
    inclusions: [
      "All transport in AC Tempo Traveller from Delhi NCR",
      "Cozy stays for 2 Nights in premium cottages",
      "4 Meals (2 Breakfast, 2 Dinner)",
      "Experienced Trip Captain and Local Guide support",
      "Permits, tolls, and state taxes",
      "First aid and oxygen kits"
    ],
    exclusions: [
      "Any adventure activity costs (paragliding, zorbing)",
      "Lunch meals on all days",
      "Personal expenses, laundry, and tips",
      "Anything not mentioned in Inclusions"
    ],
    packingList: [
      "Warm fleece jacket or light down jacket",
      "Sturdy walking shoes or sneakers",
      "Refillable water bottle",
      "Personal toiletries and sunscreen",
      "Id proof (Aadhar/Passport)"
    ]
  },
  {
    slug: "jibhi-tirthan",
    destinationSlug: "jibhi",
    name: "Jibhi & Tirthan Valley Expedition",
    image: jibhiImg,
    duration: "4 Nights / 5 Days",
    transport: "Premium Force Traveller",
    difficulty: "Moderate",
    distance: "490 KM",
    bestSeason: "March–November",
    groupSize: "12-16 Explorers",
    price: "₹10,999",
    totalSeats: 16,
    bookedSeats: 12,
    overview: "Discover Himachal's best-kept secret. Winding road drives, lush green pine forests, a hike to Serolsar Lake through dense oak woods, and an overnight stay in premium traditional wooden cabins beside the Tirthan river.",
    highlights: [
      "Drive through the famous Aut Tunnel into the peaceful Tirthan Valley",
      "Stay in wooden chalets with a private mountain stream stream walkway",
      "Trek to the holy Serolsar Lake through the oak forests of Jalori Pass",
      "Visit the majestic multi-story wooden fort of Chehni Kothi"
    ],
    dayByDay: [
      {
        day: 1,
        title: "Delhi to Jibhi: Overnight Road Drive",
        description: "Assemble at Akshardham Metro Station at 7:00 PM. Meet the Nomadik crew and depart for Jibhi via Chandigarh-Manali Highway."
      },
      {
        day: 2,
        title: "Arrival in Jibhi, Stream walk & Waterfall Hike",
        description: "Arrive at our luxury wooden cottages in Jibhi by 10:00 AM. After check-in and lunch, head out for a forest stream walk and visit the hidden Jibhi Waterfall. Spend the evening talking and connecting under the stars."
      },
      {
        day: 3,
        title: "Jalori Pass & Serolsar Lake Trek",
        description: "After breakfast, board our transport for a scenic uphill drive to Jalori Pass (10,800 ft). Start a beautiful 5-km flat trek to Serolsar Lake, surrounded by towering oak trees. Return to Jibhi for a local Himachali Siddu tasting and evening bonfire."
      },
      {
        day: 4,
        title: "Chehni Kothi Ancient Wooden Fort Hike",
        description: "Hike up to Chehni Kothi, an extraordinary 1,500-year-old defensive tower made entirely of wood and stone. Learn about local architecture. Return to Jibhi, pack bags, and check out by 5:00 PM for our overnight return to Delhi."
      }
    ],
    stayInfo: "Authentic premium wooden chalets with glass facades, private balconies overlooking the stream, and cozy heating.",
    foodInfo: "Healthy local pahadi meals: 2 Breakfasts and 2 Dinners. High-quality vegetarian food; egg options available.",
    transportDetails: "Premium AC Force Traveller with pushback seats. Jalori Pass sector transferred in local 4x4 vehicles.",
    pickupPoint: "Akshardham Metro Station, Delhi NCR at 7:00 PM",
    dropPoint: "Akshardham Metro Station, Delhi NCR by 8:00 AM (Day 5)",
    inclusions: [
      "AC Force Traveller transport from Delhi NCR and back",
      "2 Nights stay in premium wooden cottages",
      "4 Meals (2 Breakfasts, 2 Dinners)",
      "Guided trek to Serolsar Lake and Chehni Kothi",
      "Forest department entry permits",
      "Nomadik Trip Captain supervision"
    ],
    exclusions: [
      "Lunches and trail snacks",
      "Rafting or trout fishing gear",
      "Travel insurance",
      "Any personal expenses"
    ],
    packingList: [
      "Good grip trekking shoes",
      "Windcheater/Raincoat (weather is unpredictable)",
      "Warm pullover or jacket",
      "Backpack (20-30L) for day hikes",
      "Personal medicines"
    ]
  },
  {
    slug: "chopta-tungnath-trek",
    destinationSlug: "chopta-tungnath",
    name: "Chopta Tungnath Trek & Camp",
    image: adventureImg,
    duration: "3 Nights / 4 Days",
    transport: "AC Traveller from Rishikesh",
    difficulty: "Moderate",
    distance: "200 KM (From Rishikesh)",
    bestSeason: "April–December",
    groupSize: "14-20 Explorers",
    price: "₹6,999",
    totalSeats: 20,
    bookedSeats: 15,
    overview: "Trek to Tungnath, the highest Shiva Temple in the world, and summit Chandrashila Peak (12,110 ft) for a breathtaking 360-degree panoramic view of the snow-clad peaks of Nanda Devi, Trishul, and Chaukhamba.",
    highlights: [
      "Summiteering Chandrashila Peak for stunning Himalayan views",
      "Visiting the highest Shiva temple on earth (Tungnath)",
      "Lakeside camping at Deoria Tal, reflecting the Chaukhamba peaks",
      "Staying in alpine Swiss-style camps in the wilderness of Chopta"
    ],
    dayByDay: [
      {
        day: 1,
        title: "Rishikesh to Chopta: The Scenic Alaknanda Drive",
        description: "Depart from Rishikesh early morning at 6:00 AM. Enjoy a beautiful drive winding along the Ganga, Alaknanda, and Mandakini rivers. Pass through the holy confluences (Devprayag & Rudraprayag). Arrive in Chopta and check into Swiss camps by evening."
      },
      {
        day: 2,
        title: "The Summit Day: Tungnath & Chandrashila Peak",
        description: "Start early at 5:00 AM. Drive to trek point. Begin the 5-km uphill trek to Tungnath temple, then continue 1.5 km further to the Chandrashila Summit. Witness the spectacular sunrise over the snow peaks. Return to Chopta camps for hot soup and bonfire."
      },
      {
        day: 3,
        title: "Deoria Tal Lakeside Trek & Rishikesh Return",
        description: "Drive to Sari Village. Start a short 2.3-km uphill hike through rhododendron forests to Deoria Tal. Marvel at the reflection of Chaukhamba peaks in the lake. Hike back down, board our transport, and drive back to Rishikesh, arriving by 9:00 PM."
      }
    ],
    stayInfo: "Swiss-style tents with attached bathrooms, cozy bedding, and solar charging at the Chopta basecamp.",
    foodInfo: "Organic local meals (2 Breakfasts, 2 Dinners) included. Piping hot meals served in the camp dining hall.",
    transportDetails: "AC Tempo Traveller / Cruiser SUV for hill routes starting and ending at Rishikesh.",
    pickupPoint: "Laksman Jhula / Rishikesh Bus Stand at 6:00 AM",
    dropPoint: "Rishikesh Railway Station / Bus Stand by 9:00 PM",
    inclusions: [
      "AC Transport from Rishikesh to Chopta and back",
      "2 Nights stay in Swiss tents on triple sharing",
      "4 Meals (2 Breakfasts, 2 Dinners)",
      "Guided treks to Chandrashila and Deoria Tal",
      "All forest entry permits and camping fees",
      "Trek Captain support"
    ],
    exclusions: [
      "Transport to Rishikesh (Delhi-Rishikesh)",
      "Pony or mule charges if taken during trek",
      "Lunch and personal snacks",
      "Tips or porterage"
    ],
    packingList: [
      "Thermal base layers",
      "Waterproof trekking shoes",
      "Sun hat and sunglasses",
      "Trekking pole (highly recommended)",
      "Rain cover or poncho"
    ]
  },
  {
    slug: "mcleod-bir",
    destinationSlug: "mcleodganj",
    name: "McLeod Ganj & Bir Billing Adventure",
    image: kashmirImg,
    duration: "4 Nights / 5 Days",
    transport: "AC Semi-Sleeper Coach",
    difficulty: "Moderate",
    distance: "480 KM",
    bestSeason: "September–June",
    groupSize: "15-22 Explorers",
    price: "₹9,499",
    totalSeats: 22,
    bookedSeats: 19,
    overview: "The perfect mix of spiritual culture and high-flying adventure. Hike to the spectacular ridge of Triund, explore Buddhist monasteries in Dharamshala, and fly high at Bir Billing, Asia's highest paragliding takeoff site.",
    highlights: [
      "Guided trek and overnight star-camping on the Triund ridge",
      "Paragliding tandem flight from Bir Billing landing in the valley",
      "Visit the Dalai Lama Monastery and enjoy Tibetan street food",
      "Explore the beautiful monasteries and cafe walks of Bir"
    ],
    dayByDay: [
      {
        day: 1,
        title: "Delhi to McLeod Ganj: Overnight Highway Cruise",
        description: "Board our premium AC coach from Kashmiri Gate, Delhi at 8:00 PM. Get comfortable and depart for the foothills of the Himalayas."
      },
      {
        day: 2,
        title: "Dalai Lama Temple, Cafe Walk & Monasteries",
        description: "Arrive in McLeod Ganj by 8:30 AM. Check into our premium hostel/guesthouse. Post-rest, visit the Dalai Lama Temple complex and the Bhagsunag temple. Spend the evening exploring the local Tibetan market and cafes."
      },
      {
        day: 3,
        title: "Trek to Triund: Camping under the Milky Way",
        description: "Start the scenic 9-km trek to Triund. Pass through mixed forests of oak, deodar, and rhododendron. Reach the Triund ridge by afternoon for breathtaking Dhauladhar views. Camp overnight under a blanket of stars."
      },
      {
        day: 4,
        title: "Descend to McLeod & Drive to Bir Billing",
        description: "Watch the golden sunrise over the peaks. Descend back to McLeod Ganj. Board our vehicle and drive to Bir Billing (Asia's paragliding capital). Check into our Bir campsite. Spend a chill evening visiting the Sherab Ling monastery."
      },
      {
        day: 5,
        title: "Bir Billing Paragliding & Return to Delhi",
        description: "After breakfast, head to Billing for a thrilling tandem paragliding flight (15-20 mins). Land in Bir. Visit local monasteries and cafe hopping on rental cycles. Board our evening return coach to Delhi."
      }
    ],
    stayInfo: "1 Night in premium guest house (McLeod Ganj), 1 Night in alpine dome tents (Triund), and 1 Night in luxury glamping tents (Bir).",
    foodInfo: "Delicious mountain meals: 3 Breakfasts and 3 Dinners included. Includes camp tea and snacks at Triund.",
    transportDetails: "AC Semi-Sleeper pushback bus from Delhi to McLeod Ganj, local transfers in Tempo Traveller, and return coach from Bir to Delhi.",
    pickupPoint: "Kashmiri Gate ISBT, Delhi NCR at 8:00 PM",
    dropPoint: "Kashmiri Gate ISBT, Delhi NCR by 7:00 AM (Day 6)",
    inclusions: [
      "All coach and Tempo Traveller transports",
      "3 Nights stay in premium hotels & camps",
      "6 Meals (3 Breakfasts, 3 Dinners)",
      "Guided Triund Trek and camping gear",
      "Professional paragliding flight with pilot",
      "Nomadik Trip Captain support"
    ],
    exclusions: [
      "Meals during transit and lunches",
      "Cycle rentals in Bir",
      "Video recording charges for paragliding (GoPro)",
      "Personal porter costs"
    ],
    packingList: [
      "Warm down jacket and thermals",
      "Waterproof hiking shoes",
      "Power bank (no electricity at Triund camp)",
      "Flashlight/Headlamp",
      "Hand sanitizer and toiletries"
    ]
  },
  {
    slug: "udaipur-weekend",
    destinationSlug: "udaipur",
    name: "Udaipur Oasis Weekend Journey",
    image: udaipurImg,
    duration: "3 Nights / 4 Days",
    transport: "AC Sedan / SUV Convoy",
    difficulty: "Easy",
    distance: "660 KM",
    bestSeason: "September–March",
    groupSize: "10-14 Explorers",
    price: "₹7,999",
    totalSeats: 14,
    bookedSeats: 9,
    overview: "Experience royalty, heritage, and scenic road cruises. Drive past the scenic Aravalli hills, stay in a heritage Rajasthani Haveli, enjoy a sunset boat cruise on Lake Pichola, and explore the ancient Mewar history with local storytellers.",
    highlights: [
      "Road trip through the Aravalli hills with pit-stops for Rajasthani food",
      "Stay in a beautifully restored traditional lakeview Haveli",
      "Sunset boat ride on Lake Pichola with views of City Palace",
      "Guided historical walking tour of Udaipur's streets and palaces"
    ],
    dayByDay: [
      {
        day: 1,
        title: "Delhi to Udaipur: The Aravalli Highway Drive",
        description: "Depart from Delhi NCR at 9:00 PM in our AC transport. Travel through the night on the smooth NH 48 highway, stopping at heritage highway Dhabas for tea."
      },
      {
        day: 2,
        title: "Haveli Check-in, City Palace & Sunset Boat Ride",
        description: "Arrive in Udaipur by 10:00 AM. Check into our beautiful lakeview Haveli. Post lunch, visit the grand City Palace complex, showcasing Rajput architecture. End the day with a magical sunset boat cruise on Lake Pichola."
      },
      {
        day: 3,
        title: "Sajjangarh Monsoon Palace & Fatehsagar Lake Walk",
        description: "Drive up the winding roads of Bansdara Mountain to Sajjangarh Monsoon Palace for panoramic views of Udaipur's lakes. Spend the evening walking around Fatehsagar Lake, enjoying cold coffee and chatting with co-explorers."
      },
      {
        day: 4,
        title: "Heritage Walk, Shopping & Overnight Return to Delhi",
        description: "Take a morning heritage walking tour through the lanes of the old city. Shop for local handicraft, bandhani fabrics, and leather items. After lunch, board our vehicle for the return drive to Delhi, arriving by morning."
      }
    ],
    stayInfo: "Traditional Rajasthani Haveli with lake views, heritage courtyards, and clean, modern amenities (twin sharing).",
    foodInfo: "Authentic meals: 2 Breakfasts and 2 Dinners. Includes a traditional Rajasthani Lal Maas / Dal Baati Churma dining experience.",
    transportDetails: "AC Tempo Traveller / AC Innova convoy for smooth highway cruising.",
    pickupPoint: "IFFCO Chowk, Gurgaon / Dhaula Kuan, Delhi at 9:00 PM",
    dropPoint: "IFFCO Chowk, Gurgaon by 7:30 AM (Day 5)",
    inclusions: [
      "AC Highway Transport from Delhi/NCR and back",
      "2 Nights stay in a heritage lakeview Haveli",
      "4 Meals (2 Breakfasts, 2 Dinners)",
      "City Palace entry ticket and Lake Pichola Boat Cruise ticket",
      "Guided heritage walking tour with local storyteller",
      "Nomadik Trip Captain support"
    ],
    exclusions: [
      "Lunches and monument entry fees not in inclusions",
      "Camera/Video charges inside palaces",
      "Tips and personal shopping",
      "Alcoholic beverages"
    ],
    packingList: [
      "Comfortable light cotton clothing",
      "Walking sandals or flats",
      "Sunglasses, sun hat, and sunscreen",
      "Light sweater or jacket (winter nights can be cold)",
      "Camera or phone for beautiful palace photography"
    ]
  }
];
