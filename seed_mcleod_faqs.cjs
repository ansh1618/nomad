const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://sgeffapbsrppzrgqfpec.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZWZmYXBic3JwcHpyZ3FmcGVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkyNjYwOSwiZXhwIjoyMDk4NTAyNjA5fQ.2AEOZXKpsRxvG1jZjCwwpd0emdwVmqOVhx2P_Se_vhA'
)

const MCLEOD_JOURNEY_ID = '28881dbc-ead3-4e4d-ba3e-e46f5ff61ffa'

const faqs = [
  {
    question: 'Is the Triund Trek suitable for beginners?',
    answer: 'Yes. The Triund Trek is considered beginner-friendly. A person with basic fitness can comfortably complete the trek with guidance from our experienced Trip Captain.',
    category: 'Trek & Activity',
    sort_order: 1,
  },
  {
    question: 'What is the difficulty level of this trip?',
    answer: 'The overall trip is Easy to Moderate. The trek involves gradual ascent and is suitable for first-time trekkers.',
    category: 'Trek & Activity',
    sort_order: 2,
  },
  {
    question: 'What kind of accommodation is provided?',
    answer: "You'll stay in comfortable hotels in McLeod Ganj and premium camps at Triund on a sharing basis (Double/Triple/Quad as selected).",
    category: 'Accommodation',
    sort_order: 3,
  },
  {
    question: 'What meals are included?',
    answer: 'Breakfasts and dinners are included as mentioned in the package inclusions. Lunches and personal snacks are not included.',
    category: 'Food & Meals',
    sort_order: 4,
  },
  {
    question: 'How do we travel from Delhi?',
    answer: 'Travel is by comfortable AC Tempo Traveller or Volvo (depending on batch size and package).',
    category: 'Transport',
    sort_order: 5,
  },
  {
    question: 'Is the trek guided?',
    answer: 'Yes. Our experienced Trip Captain and local trek guide accompany the group throughout the trek.',
    category: 'Trek & Activity',
    sort_order: 6,
  },
  {
    question: 'What should I pack for the trip?',
    answer: 'Carry warm clothes, trekking shoes, rain protection, a water bottle, power bank, sunscreen, sunglasses, torch, and personal medicines.',
    category: 'Packing & Preparation',
    sort_order: 7,
  },
  {
    question: 'Is there mobile network availability?',
    answer: 'Jio and Airtel work well in McLeod Ganj. Network connectivity at Triund campsite is limited and may not be available.',
    category: 'General',
    sort_order: 8,
  },
  {
    question: 'Is there electricity at the campsite?',
    answer: 'Electricity is limited at the campsite. We recommend carrying a fully charged power bank.',
    category: 'Accommodation',
    sort_order: 9,
  },
  {
    question: 'Can solo travellers join?',
    answer: "Absolutely! More than half of our travellers join solo. It's a great way to meet like-minded explorers.",
    category: 'General',
    sort_order: 10,
  },
  {
    question: 'Are washrooms available during the trek?',
    answer: 'Basic washroom facilities are available at the campsite. During the trek, facilities are limited.',
    category: 'Trek & Activity',
    sort_order: 11,
  },
  {
    question: 'What if the weather becomes bad?',
    answer: 'Safety is our highest priority. If weather conditions become unsafe, the itinerary may be modified based on local administration and Trip Captain instructions.',
    category: 'Safety',
    sort_order: 12,
  },
  {
    question: 'Can I cancel my booking?',
    answer: "Yes. Cancellation charges will apply as per Nomadik's Cancellation & Refund Policy available on the website.",
    category: 'Booking & Payment',
    sort_order: 13,
  },
  {
    question: 'Is travel insurance included?',
    answer: 'No. Travel insurance is not included but is highly recommended.',
    category: 'General',
    sort_order: 14,
  },
  {
    question: 'How do I book my seat?',
    answer: "Simply select your preferred departure date, complete the booking form, make the payment, and you'll receive a booking confirmation via Email/WhatsApp.",
    category: 'Booking & Payment',
    sort_order: 15,
  },
]

async function main() {
  console.log(`Inserting ${faqs.length} FAQs for McLeod Ganj & Triund Trek (journey_id: ${MCLEOD_JOURNEY_ID})...\n`)

  const rows = faqs.map(faq => ({
    ...faq,
    journey_id: MCLEOD_JOURNEY_ID,
    page: 'journey',
    is_active: true,
  }))

  const { data, error } = await supabase
    .from('faqs')
    .insert(rows)
    .select('id, question, sort_order')

  if (error) {
    console.error('❌ Error inserting FAQs:', error)
    process.exit(1)
  }

  console.log(`✅ Successfully inserted ${data.length} FAQs:\n`)
  data.forEach(f => console.log(`  ${f.sort_order}. ${f.question}`))
  console.log('\n🎉 Done! FAQs are now live on the McLeod Ganj package page.')
}

main()
