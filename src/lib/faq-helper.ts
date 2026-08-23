export interface FAQItem {
  q: string;
  a: string;
}

const UDAIPUR_FAQS: FAQItem[] = [
  {
    q: "Who will be our trip captain?",
    a: "Every Nomadik Udaipur trip is led by a certified, experienced Trip Captain who manages group logistics, stay check-ins, local sightseeing in Udaipur, and 24/7 convoy assistance."
  },
  {
    q: "What does the trip captain help with?",
    a: "Your Trip Captain coordinates the Delhi NCR departure, handles Bagore Ki Haveli show passes & Lake Pichola boat timings, recommends authentic rooftop Rajasthani dining spots, and ensures safety for all travelers."
  },
  {
    q: "What is included in the Udaipur trip?",
    a: "Includes roundtrip AC travel from Delhi NCR, 2 Nights stay in verified Udaipur heritage hotels/resorts, daily breakfast & dinner, lakes & palace sightseeing, and full Trip Captain coverage."
  },
  {
    q: "Where does the trip start and end?",
    a: "The trip starts from Delhi NCR (convenient pickup points like Majnu Ka Tilla / Dhaula Kuan) and ends with a safe drop-back at Delhi NCR."
  },
  {
    q: "What type of accommodation is provided?",
    a: "Comfortable, verified 3-star/boutique heritage hotel stays in Udaipur with attached baths, hot water, high hygiene standards, and quad/triple/double room sharing options."
  },
  {
    q: "What transport is provided?",
    a: "Sanitized, comfortable AC Volvo semi-sleeper buses or Tempo Travelers for the entire Delhi-Udaipur-Delhi highway journey and local sightseeing."
  },
  {
    q: "Is the trip suitable for college students/groups?",
    a: "Yes! GoNomadik trips are specifically designed for college students, young professionals, and solo explorers with female-friendly safety protocols and curated group vibe."
  },
  {
    q: "What should I carry for the trip?",
    a: "Carry a valid Government photo ID (Aadhaar/Passport), comfortable walking shoes for palace tours, light cottons for daytime, a light layer for evenings, and personal medications."
  },
  {
    q: "What happens if I have a question during the journey?",
    a: "Your Trip Captain is available 24/7 on ground throughout the convoy. You can also reach our emergency support hotline anytime."
  },
  {
    q: "How can I contact GoNomadik before the trip?",
    a: "You can WhatsApp or call our team at +91 79828 50767 or email support@gonomadik.in for instant assistance."
  }
];

const MANALI_FAQS: FAQItem[] = [
  {
    q: "Who will be our trip captain?",
    a: "Every Nomadik Manali trip is led by an experienced mountain Trip Captain certified in wilderness convoy management and group safety."
  },
  {
    q: "What does the trip captain help with?",
    a: "Your Trip Captain manages the Delhi-Manali bus departure, Old Manali cafe walks, Solang Valley snow activity permits, bonfire sessions, and 24/7 ground coordination."
  },
  {
    q: "What is included in the Manali trip?",
    a: "Roundtrip AC Volvo travel from Delhi NCR, 2 Nights stay in verified Manali hotel/resort, daily breakfast & dinner, Solang Valley & Jogini Waterfall excursions, bonfire music night, and Trip Captain support."
  },
  {
    q: "Where does the trip start and end?",
    a: "Pickup & drop-off at Majnu Ka Tilla / Kashmere Gate, Delhi NCR."
  },
  {
    q: "What type of accommodation is provided?",
    a: "Verified mountain-view hotels/resorts in Manali with power backup, room heaters, attached baths, and 24/7 hot water."
  },
  {
    q: "What transport is provided?",
    a: "AC Semi-Sleeper Luxury Volvo bus from Delhi to Manali and back, plus local cabs for sightseeing."
  },
  {
    q: "Is the trip suitable for college students/groups?",
    a: "Yes, it is extremely popular among college groups and solo travelers with strict safety guidelines and zero tolerance for misbehavior."
  },
  {
    q: "What should I carry for the trip?",
    a: "Valid ID, warm woolens/jackets, thermal wear, waterproof footwear for snow, lip balm, and personal medicines."
  },
  {
    q: "What happens if I have a question during the journey?",
    a: "Your Trip Captain accompanies the group throughout the trip to assist with any query or emergency."
  },
  {
    q: "How can I contact GoNomadik before the trip?",
    a: "Reach out via WhatsApp at +91 79828 50767 or email support@gonomadik.in."
  }
];

const JIBHI_FAQS: FAQItem[] = [
  {
    q: "Who will be our trip captain?",
    a: "A seasoned Himalayan Trip Captain leads the group through Jibhi & Tirthan Valley."
  },
  {
    q: "What does the trip captain help with?",
    a: "Guides the Jalori Pass & Serolsar Lake trek, coordinates cozy wooden cottage check-ins, organizes riverside bonfires, and ensures smooth transit."
  },
  {
    q: "What is included in the Jibhi trip?",
    a: "Roundtrip travel from Delhi, 2 Nights stay in Jibhi wooden cottages/homestays, breakfast & dinner, Jalori Pass trek guide, and Trip Captain support."
  },
  {
    q: "Where does the trip start and end?",
    a: "Starts and ends at Delhi NCR (Majnu Ka Tilla)."
  },
  {
    q: "What type of accommodation is provided?",
    a: "Cozy wooden cottages or treehouse-style homestays with mountain/river views, attached baths, and hot water."
  },
  {
    q: "What transport is provided?",
    a: "AC Bus/Tempo Traveler from Delhi to Aut, followed by local mountain cabs to Jibhi."
  },
  {
    q: "Is the trip suitable for college students/groups?",
    a: "Yes! Perfect for nature lovers, friend groups, and solo travelers."
  },
  {
    q: "What should I carry for the trip?",
    a: "Valid ID, comfortable trekking shoes, warm jackets, raincoat/poncho, power bank, and personal items."
  },
  {
    q: "What happens if I have a question during the journey?",
    a: "Your Trip Captain is with the group 24/7 to resolve any issue."
  },
  {
    q: "How can I contact GoNomadik before the trip?",
    a: "WhatsApp +91 79828 50767 or email support@gonomadik.in."
  }
];

const CHOPTA_FAQS: FAQItem[] = [
  {
    q: "Who will be our trip captain?",
    a: "Led by certified alpine trek captains who know the Uttarakhand Himalayan routes intimately."
  },
  {
    q: "What does the trip captain help with?",
    a: "Leads the Tungnath Temple & Chandrashila summit trek, manages high-altitude safety, bonfire sessions, and camp check-ins."
  },
  {
    q: "What is included in the Chopta trip?",
    a: "Roundtrip travel from Delhi/Rishikesh, camp/homestay accommodation in Chopta, all meals during stay, trek guide & permits, and Trip Captain coverage."
  },
  {
    q: "Where does the trip start and end?",
    a: "Starts and ends at Delhi NCR / Rishikesh."
  },
  {
    q: "What type of accommodation is provided?",
    a: "Swiss alpine camps or cozy mountain homestays with warm bedding and essential mountain facilities."
  },
  {
    q: "What transport is provided?",
    a: "Comfortable AC Tempo Traveler / Pushback coach from Delhi/Rishikesh."
  },
  {
    q: "Is the trip suitable for college students/groups?",
    a: "Yes, it is a beginner-friendly snow trek ideal for youth and adventure seekers."
  },
  {
    q: "What should I carry for the trip?",
    a: "Valid ID, sturdy trekking boots, heavy thermals, gloves, sunglasses, water bottle, and trekking pole."
  },
  {
    q: "What happens if I have a question during the journey?",
    a: "Your Trip Captain provides continuous on-ground guidance throughout the trek."
  },
  {
    q: "How can I contact GoNomadik before the trip?",
    a: "Contact +91 79828 50767 via WhatsApp or email support@gonomadik.in."
  }
];

const MCLEOD_FAQS: FAQItem[] = [
  {
    q: "Who will be our trip captain?",
    a: "An experienced Trip Captain familiar with Dharamshala, Tibetan culture, and Triund trail routes."
  },
  {
    q: "What does the trip captain help with?",
    a: "Coordinates Dalai Lama Temple visits, Tibetan cafe walks, Bhagsu waterfall hikes, and group safety."
  },
  {
    q: "What is included in the McLeod Ganj trip?",
    a: "Roundtrip AC Volvo travel from Delhi, 2 Nights stay in verified hotel/resort, daily breakfast & dinner, sightseeing, and Trip Captain support."
  },
  {
    q: "Where does the trip start and end?",
    a: "Delhi NCR pickup and drop."
  },
  {
    q: "What type of accommodation is provided?",
    a: "Verified 3-star hotels/resorts in McLeod Ganj with valley views, attached baths, and hot water."
  },
  {
    q: "What transport is provided?",
    a: "AC Volvo semi-sleeper bus from Delhi and local cabs."
  },
  {
    q: "Is the trip suitable for college students/groups?",
    a: "Yes, great for solo travelers and student groups looking for culture, cafes, and mountain views."
  },
  {
    q: "What should I carry for the trip?",
    a: "Valid ID, comfortable walking shoes, light woolens for summer or heavy woolens for winter, and personal medicines."
  },
  {
    q: "What happens if I have a question during the journey?",
    a: "Your Trip Captain is available 24/7 to help."
  },
  {
    q: "How can I contact GoNomadik before the trip?",
    a: "WhatsApp +91 79828 50767 or email support@gonomadik.in."
  }
];

function getGenericFaqs(name: string): FAQItem[] {
  const displayName = name || "this journey";
  return [
    {
      q: "Who will be our trip captain?",
      a: `Every Nomadik ${displayName} trip is led by a certified, experienced Trip Captain who manages group logistics, stay check-ins, local sightseeing, and 24/7 assistance.`
    },
    {
      q: "What does the trip captain help with?",
      a: `Your Trip Captain coordinates transit from Delhi NCR, handles local permits & ticket timings, recommends top local food spots, and ensures group safety.`
    },
    {
      q: "What is included in this trip?",
      a: `Includes roundtrip transport from Delhi NCR, verified accommodation, daily meals as specified, local sightseeing, and full Trip Captain support.`
    },
    {
      q: "Where does the trip start and end?",
      a: `The trip starts from Delhi NCR (designated pickup point) and ends with a safe drop-back at Delhi NCR.`
    },
    {
      q: "What type of accommodation is provided?",
      a: `Comfortable, verified stays (hotels/resorts/cottages) with attached baths, hot water, and high hygiene standards.`
    },
    {
      q: "What transport is provided?",
      a: `Sanitized AC Volvo semi-sleeper buses or Tempo Travelers for the entire highway journey and local sightseeing.`
    },
    {
      q: "Is the trip suitable for college students/groups?",
      a: `Yes! GoNomadik trips are specifically designed for college students, young professionals, and solo explorers with female-friendly safety protocols.`
    },
    {
      q: "What should I carry for the trip?",
      a: `Carry a valid Government photo ID, comfortable footwear, climate-appropriate clothing, power bank, and personal medications.`
    },
    {
      q: "What happens if I have a question during the journey?",
      a: `Your Trip Captain is available 24/7 on ground throughout the trip. You can also reach our emergency support hotline anytime.`
    },
    {
      q: "How can I contact GoNomadik before the trip?",
      a: `You can WhatsApp or call our team at +91 79828 50767 or email support@gonomadik.in for instant assistance.`
    }
  ];
}

export function getTripCaptainFaqs(slugOrName: string, existingFaqs?: any[]): FAQItem[] {
  // 1. If existing FAQs are available from DB/package, normalize them
  const formattedExisting: FAQItem[] = (existingFaqs || [])
    .map((f: any) => ({
      q: f.q || f.question || "",
      a: f.a || f.answer || ""
    }))
    .filter((f: FAQItem) => f.q.trim().length > 0 && f.a.trim().length > 0);

  if (formattedExisting.length >= 4) {
    return formattedExisting;
  }

  // 2. Identify target route keyword
  const key = String(slugOrName || "").toLowerCase().trim();

  let defaultList: FAQItem[] = [];
  if (key.includes("udaipur")) {
    defaultList = UDAIPUR_FAQS;
  } else if (key.includes("manali")) {
    defaultList = MANALI_FAQS;
  } else if (key.includes("jibhi") || key.includes("tirthan")) {
    defaultList = JIBHI_FAQS;
  } else if (key.includes("chopta") || key.includes("tungnath")) {
    defaultList = CHOPTA_FAQS;
  } else if (key.includes("mcleod") || key.includes("dharamshala")) {
    defaultList = MCLEOD_FAQS;
  } else {
    defaultList = getGenericFaqs(slugOrName);
  }

  if (formattedExisting.length === 0) {
    return defaultList;
  }

  // Merge existing custom FAQs at the top, then fill remainder from defaultList
  const merged = [...formattedExisting];
  for (const item of defaultList) {
    if (!merged.some(m => m.q.toLowerCase() === item.q.toLowerCase())) {
      merged.push(item);
    }
  }
  return merged;
}
