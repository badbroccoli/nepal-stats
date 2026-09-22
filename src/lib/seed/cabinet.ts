export type CabinetMember = {
  name: string;
  nameNp?: string;
  role: string;
  party: string;
  bio: string;
  /** Prime minister vs cabinet minister */
  tier: "pm" | "minister";
};

/**
 * Curated roster of the incumbent Council of Ministers.
 * Update when portfolios change; `asOf` is shown on the Government page.
 * Sources: Wikipedia “Balen Shah cabinet”, Radio Nepal, Kathmandu Post, Ratopati.
 */
export const CABINET_AS_OF = "2026-09-10";

export const CABINET: CabinetMember[] = [
  {
    name: "Balendra Shah",
    nameNp: "बालेन्द्र शाह",
    role: "Prime Minister · Defence",
    party: "Rastriya Swatantra Party",
    tier: "pm",
    bio: "Structural engineer, rapper, and former Kathmandu mayor (2022–2026). Became Nepal’s 46th prime minister on 27 March 2026 after RSP’s landslide, and is among the world’s youngest serving leaders.",
  },
  {
    name: "Swarnim Wagle",
    role: "Finance",
    party: "Rastriya Swatantra Party",
    tier: "minister",
    bio: "Development economist and RSP vice-chair; twice elected from Tanahun-1. Oversees the federal budget and macroeconomic policy.",
  },
  {
    name: "Sudan Gurung",
    role: "Home Affairs",
    party: "Rastriya Swatantra Party",
    tier: "minister",
    bio: "Founder of Hami Nepal and a visible Gen Z–era organizer; elected from Gorkha-2. Briefly stepped aside in April 2026 and returned as home minister in June.",
  },
  {
    name: "Shishir Khanal",
    role: "Foreign Affairs",
    party: "Rastriya Swatantra Party",
    tier: "minister",
    bio: "Heads RSP’s foreign-affairs work and represents Kathmandu-6. Focuses on diplomatic outreach and Nepal’s external relations.",
  },
  {
    name: "Biraj Bhakta Shrestha",
    role: "Energy, Water Resources & Irrigation",
    party: "Rastriya Swatantra Party",
    tier: "minister",
    bio: "MP from Kathmandu-8. Leads hydropower, irrigation, and water-resource portfolios central to Nepal’s energy transition.",
  },
  {
    name: "Sunil Lamsal",
    role: "Infrastructure Development",
    party: "Rastriya Swatantra Party",
    tier: "minister",
    bio: "Elected from Rupandehi-1. Responsible for physical infrastructure, transport, and urban development projects.",
  },
  {
    name: "Sobita Gautam",
    role: "Law, Justice & Parliamentary Affairs",
    party: "Rastriya Swatantra Party",
    tier: "minister",
    bio: "Lawyer and MP from Chitwan-3. Known for legislative advocacy on justice reform and parliamentary process.",
  },
  {
    name: "Mahabir Pun",
    role: "Science, Technology & Innovation",
    party: "Independent",
    tier: "minister",
    bio: "Educationist and Magasasay Award laureate known for rural wireless networking. Inducted in June 2026 to drive STI policy.",
  },
  {
    name: "Sita Badi",
    role: "Women, Children & Social Security",
    party: "Rastriya Swatantra Party",
    tier: "minister",
    bio: "Proportional-representation MP and Dalit rights advocate. Portfolios cover women, children, gender minorities, and social security.",
  },
  {
    name: "Pratibha Rawal",
    role: "Federal Affairs & General Administration",
    party: "Rastriya Swatantra Party",
    tier: "minister",
    bio: "Journalist-turned-politician and RSP co-spokesperson (PR). Also covers land management, cooperatives, and poverty alleviation.",
  },
  {
    name: "Nisha Mehta",
    role: "Health & Food Hygiene",
    party: "Rastriya Swatantra Party",
    tier: "minister",
    bio: "Proportional-representation MP focused on public health delivery, food safety, and population services.",
  },
  {
    name: "Sasmit Pokharel",
    role: "Education & Sports",
    party: "Rastriya Swatantra Party",
    tier: "minister",
    bio: "Young MP from Kathmandu-5. Leads school/higher education and youth sports agendas.",
  },
  {
    name: "Khadak Raj Paudel",
    role: "Culture, Tourism & Civil Aviation",
    party: "Rastriya Swatantra Party",
    tier: "minister",
    bio: "Elected from Kaski-1 (Pokhara). Oversees tourism recovery, culture, and civil aviation.",
  },
  {
    name: "Bikram Timilsina",
    role: "Information & Communication",
    party: "Rastriya Swatantra Party",
    tier: "minister",
    bio: "MP from Nuwakot-1. Manages ICT policy, media regulation, and government communications.",
  },
  {
    name: "Gita Chaudhary",
    role: "Agriculture, Forests & Environment",
    party: "Rastriya Swatantra Party",
    tier: "minister",
    bio: "Advocate elected under proportional representation. Combines agriculture, livestock, forests, and environment briefs.",
  },
  {
    name: "Ramjee Yadav",
    role: "Youth, Labour & Employment",
    party: "Rastriya Swatantra Party",
    tier: "minister",
    bio: "Elected from Saptari-2; joined the cabinet in April 2026 after the labour portfolio was reshuffled.",
  },
  {
    name: "Deepak Kumar Sah",
    role: "Industry, Commerce & Supplies",
    party: "Rastriya Swatantra Party",
    tier: "minister",
    bio: "Returned to cabinet in September 2026 for industry and supplies after an earlier short stint as labour minister.",
  },
];
