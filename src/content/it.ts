/** Testi del sito, in inglese. Adattati da docs/copy.md, senza claim nuovi. */

export const seo = {
  home: {
    title: "Mindlead Group — We build software companies",
    description:
      "A holding company that brings together technology advisory, bespoke software, and vertical products for business.",
  },
  gruppo: {
    title: "About — Mindlead Group",
    description:
      "The story, mission, and leadership of Mindlead Group, a software group between Italy and the Emirates.",
  },
  aziende: {
    title: "Our companies — Mindlead Group",
    description:
      "Mindlead Advisory, Studio, Suite, and the companies founded with industry partners.",
  },
  modello: {
    title: "Our model — Mindlead Group",
    description:
      "A shared platform and industry partners: how Mindlead Group builds new software companies.",
  },
  partnership: {
    title: "Build with us — Mindlead Group",
    description: "Know an industry? Let's found the group's next software company together.",
  },
  carriere: {
    title: "Careers — Mindlead Group",
    description:
      "We look for developers, consultants, and commercial people who want their work to become real products.",
  },
  contatti: {
    title: "Contact — Mindlead Group",
    description: "Choose the address that fits your request. The right person will reply.",
  },
} as const;

export const nav = [
  { href: "/gruppo", label: "Group" },
  { href: "/aziende", label: "Companies" },
  { href: "/modello", label: "Model" },
  { href: "/partnership", label: "Partnership" },
  { href: "/carriere", label: "Careers" },
  { href: "/contatti", label: "Contact" },
] as const;

export const emails = {
  info: "info@mindleadholding.com",
  partnership: "partnership@mindleadholding.com",
  investors: "investors@mindleadholding.com",
  careers: "careers@mindleadholding.com",
  press: "press@mindleadholding.com",
} as const;

export const contacts = [
  { label: "General enquiries", email: emails.info },
  { label: "Partnerships and new companies", email: emails.partnership },
  { label: "Investors", email: emails.investors },
  { label: "Careers", email: emails.careers },
  { label: "Press", email: emails.press },
] as const;

export type CompanyStatus = "Available" | "In development";

export type Company = {
  id: string;
  name: string;
  short: string;
  category: string;
  family: "mindlead" | "venture";
  /** 1 = linee del gruppo, 2 = partner ventures */
  ring: 1 | 2;
  angle: number;
  line: string;
  status?: CompanyStatus;
  href: string;
};

export const companies: Company[] = [
  {
    id: "advisory",
    name: "Mindlead Advisory",
    short: "Advisory",
    category: "Mindlead",
    family: "mindlead",
    ring: 1,
    angle: -90,
    line: "Technology advisory and complex platforms.",
    href: "/aziende#advisory",
  },
  {
    id: "studio",
    name: "Mindlead Studio",
    short: "Studio",
    category: "Mindlead",
    family: "mindlead",
    ring: 1,
    angle: 30,
    line: "Bespoke management software for small and medium-sized businesses.",
    href: "/aziende#studio",
  },
  {
    id: "suite",
    name: "Mindlead Suite",
    short: "Suite",
    category: "Mindlead",
    family: "mindlead",
    ring: 1,
    angle: 150,
    line: "Vertical software, ready to use.",
    href: "/aziende#suite",
  },
  {
    id: "totalone",
    name: "Totalone",
    short: "Totalone",
    category: "Partner Venture",
    family: "venture",
    ring: 2,
    angle: -30,
    line: "The management platform for the furniture industry.",
    href: "/aziende#totalone",
  },
  {
    id: "relay",
    name: "RelateSales",
    short: "RelateSales",
    category: "Partner Venture",
    family: "venture",
    ring: 2,
    angle: 90,
    line: "The CRM designed for industrial companies.",
    href: "/aziende#relay",
  },
];

/** Nodo tratteggiato: invito alla partnership, non un'azienda pubblicata. */
export const nextCompany = {
  id: "prossima",
  name: "Next company",
  short: "Next",
  line: "The group's next company could be yours.",
  angle: 210,
  href: "/partnership",
} as const;

export const hero = {
  title: ["We build software", "companies."],
  body: "Mindlead Group brings together technology advisory, bespoke software, and vertical products for specific industries. One platform, several focused companies, one aim: help businesses grow with the right software.",
  primary: "See our companies",
  secondary: "Build with us",
  places: ["Milan", "Dubai"],
  year: "© 2026",
};

export const manifesto =
  "A holding company, three lines of business, companies founded with industry experts. From Europe to the Middle East.";

/**
 * Capitolo home "What we've learned": il perché del gruppo, dal manifesto al modello.
 * Non elenca le aziende (lo fa "Our companies"): sistema, vuoto, vuoto che si ripete nel settore.
 */
export const insights = [
  {
    title: "Every company runs on a system.",
    body: "Orders, production, people, numbers. When the system is built well, the whole company moves in order.",
  },
  {
    title: "Generic software leaves gaps.",
    body: "Every company has its own way of working, and off-the-shelf tools never cover all of it. Closing the gap takes software shaped around the company.",
  },
  {
    title: "The same gaps repeat across an industry.",
    body: "Companies in the same sector lose time in the same places. One answer, built with people who know the industry, can serve all of them.",
  },
] as const;

/** Sezione home "Our companies": quale azienda del gruppo risponde a quale scala di cliente. */
export const approach = {
  title: ["One approach,", "four scales."],
  levels: [
    {
      company: "Mindlead Suite",
      scale: "Whole industries",
      title: "Standard software for a whole industry.",
      body: "When many companies in one industry share the same needs, Suite turns them into one ready-to-use product, updated continuously for all of them.",
      href: "/aziende#suite",
    },
    {
      company: "Mindlead Studio",
      scale: "Small and medium-sized businesses",
      title: "Bespoke software for one company.",
      body: "For SMEs that have outgrown Excel and generic software, Studio builds management software around how they actually work.",
      href: "/aziende#studio",
    },
    {
      company: "Mindlead Advisory",
      scale: "Large companies and groups",
      title: "Advisory and platforms for large groups.",
      body: "For established companies and industrial groups, Advisory works on architecture, data integration, and complex platforms, as a stable technology partner.",
      href: "/aziende#advisory",
    },
    {
      company: "Partner Ventures",
      scale: "A specific market problem",
      title: "New companies, built with partners.",
      body: "When we find a specific problem in a market, we solve it with people who know it: we found a new company together, or we grow through acquisitions.",
      href: "/partnership",
    },
  ],
} as const;

/**
 * Sezione home "Platform": la struttura tecnologica comune. Lo schema si compone a passi:
 * Core, metodo, poi le aziende che ci costruiscono sopra (prodotti standard, custom piccoli e grandi, partner).
 */
export const platform = {
  title: ["One platform", "under every company."],
  core: {
    name: "Mindlead Core",
    tag: "Owned by the holding",
    modules: ["Identity & access", "Multi-company", "E-invoicing", "Banking", "Data & AI"],
  },
  method: {
    name: "Method",
    items: ["Analysis", "Delivery", "Security", "Quality"],
  },
  columns: [
    {
      name: "Suite",
      tag: "Standard",
      cards: [
        { kind: "Product", name: "Construction" },
        { kind: "Product", name: "Furniture" },
        { kind: "Product", name: "Manufacturing" },
      ],
    },
    {
      name: "Studio",
      tag: "Custom · SME",
      cards: [
        { kind: "Client 01", name: "Order management" },
        { kind: "Client 02", name: "Production planning" },
        { kind: "Client 03", name: "Field service" },
      ],
    },
    {
      name: "Advisory",
      tag: "Custom · Enterprise",
      cards: [{ kind: "Group", name: "Enterprise platform" }],
    },
    {
      name: "Partners",
      tag: "Ventures",
      cards: [
        { kind: "Venture", name: "Totalone" },
        { kind: "Venture", name: "RelateSales" },
      ],
    },
  ],
  steps: [
    {
      label: "Layer 0 · Foundation",
      title: "Mindlead Core.",
      body: "The shared technology layer, built and maintained by the holding company: identity and access, multi-company management, e-invoicing, banking integrations, data and AI.",
    },
    {
      label: "Layer 1 · Standards",
      title: "One way of working.",
      body: "Analysis, delivery, security and quality follow the same standards in every company, on every project.",
    },
    {
      label: "Layer 2 · Industry products",
      title: "Standard software, built on Core.",
      body: "Suite products are configured, not rebuilt: one product per industry, updated continuously for every customer.",
    },
    {
      label: "Layer 2 · Bespoke for SMEs",
      title: "Custom software, shared components.",
      body: "Studio builds software around each client on the same foundations: tailored where it matters, proven everywhere else.",
    },
    {
      label: "Layer 2 · Enterprise",
      title: "Large platforms, same foundations.",
      body: "Advisory designs and delivers large-scale systems for groups and enterprises, with Core's components and the group's standards.",
    },
    {
      label: "Layer 2 · Partner ventures",
      title: "New companies start ahead.",
      body: "Companies founded with partners inherit the whole platform from day one. They focus on their market, not on the infrastructure.",
    },
    {
      label: "Release model",
      title: "Improve once, upgrade everyone.",
      body: "Every improvement to Core reaches every product, every client and every company in the group.",
    },
  ],
} as const;

/**
 * Sezione home "Intelligence": l'AI come secondo cervello dell'azienda. Nasce dalla fusione degli strati di Platform:
 * è possibile proprio perché il gruppo ha già un Core unico, settori reali e un solo modo di rilasciare.
 */
export const intelligence = {
  title: ["A second brain", "for every company."],
  mission:
    "Management software has always recorded what already happened. We are building software that understands the company and works alongside the people who run it.",
  sources: ["Orders", "Production", "Invoices", "Banking", "People"],
  actions: [
    { tag: "Sales", text: "Quote drafted from last year's prices." },
    { tag: "Operations", text: "Order 1042 at risk: supplier notified." },
    { tag: "Finance", text: "38 bank movements reconciled." },
  ],
  companies: ["Suite", "Studio", "Advisory", "Partners"],
  steps: [
    {
      label: "Context",
      title: "It knows the whole company.",
      body: "Through Core it reads orders, production, invoices, banking and people as one picture, not as scattered spreadsheets.",
    },
    {
      label: "Collaboration",
      title: "It works next to you.",
      body: "In every application it prepares, checks and suggests. People decide; the AI does the groundwork, all day long.",
    },
    {
      label: "Learning",
      title: "It learns from every company.",
      body: "What it discovers in one industry improves the others. Every company that joins the group makes it smarter for all.",
    },
  ],
  advantage: {
    title: ["Only a group", "can build it."],
    body: "A second brain needs clean data, real processes and a way to reach every customer at once. Our organisation already has all three.",
    points: [
      { label: "One Core", text: "Every company runs on the same data model: no integration project before the AI can start." },
      { label: "Real industries", text: "It learns from processes we build and run every day, not from demos." },
      { label: "One release", text: "When the AI improves, every product, client and venture gets it at once." },
    ],
  },
} as const;

export const companiesIntro =
  "Each company has its own market, team, and mission. All of them share the same technology and the same way of working.";

export const whyGroup = [
  {
    title: "One technology, more markets.",
    body: "Every new product starts on foundations already proven: more speed, more reliability, less risk for the people who adopt it.",
  },
  {
    title: "Experience that moves between companies.",
    body: "What we learn in one industry improves the products of the others.",
  },
  {
    title: "Substance.",
    body: "Behind every product is a group, not a single supplier.",
  },
] as const;

/** Solo settori con un prodotto descritto nel copy. */
export const sectors = ["Construction", "Furniture", "Manufacturing"] as const;

export const finalCta = {
  title: "Do you know an industry better than anyone else?",
  body: "Let's build the group's next company together.",
  primary: "Propose a project",
  secondary: "Contact us",
};

export const core = {
  title: ["Mindlead Core:", "one foundation,", "many products."],
  body: "Every company in the group sits on Mindlead Core, the platform built and maintained by the holding company. Multi-company management, security and access control, e-invoicing, bank integrations, artificial intelligence applied to data: proven components that every new product inherits from day one.",
  note: "For customers, that means software that is more reliable and faster to start. For the group, every improvement benefits every company.",
  layers: [
    {
      label: "Partner Ventures",
      note: "Founded with industry experts",
      items: ["Totalone", "RelateSales"],
    },
    {
      label: "Mindlead",
      note: "Wholly owned by the group",
      items: ["Advisory", "Studio", "Suite"],
    },
    {
      label: "Mindlead Core",
      note: "Owned by the holding company",
      items: [
        "Multi-company management",
        "Security and access control",
        "E-invoicing",
        "Bank integrations",
        "Artificial intelligence applied to data",
      ],
    },
  ],
};

export const about = {
  title: ["A group", "built in the field."],
  opening: [
    "Mindlead Group comes from years of work beside Italian businesses: processes studied one by one, bespoke management software, platforms that support the daily work of people and companies.",
    "That work led to a simple idea. What works for one company can become a product for a whole industry. And every industry deserves a dedicated company, led by someone who truly knows it.",
  ],
  steps: [
    {
      title: "The origins.",
      body: "Bespoke management software for Italian small and medium-sized businesses.",
    },
    {
      title: "The growth.",
      body: "Projects for established companies and international groups, and a shared technology platform that becomes the base of every product.",
    },
    {
      title: "Today.",
      body: "A holding company that brings together services, vertical products, and companies founded with industry partners, with a presence in Italy and the United Arab Emirates.",
    },
  ],
  mission:
    "Give businesses the software they deserve: built on their real processes, made to last, and usable even without an IT department.",
  vision:
    "Become the reference group in Europe for vertical software for SMEs: a family of companies, each one leading in its own industry, joined by a shared technology and a shared method.",
  values: [
    {
      title: "Process first, then code.",
      body: "We understand how a company works before we write a line.",
    },
    {
      title: "Build to last.",
      body: "Software that evolves with the people who use it, not projects delivered and forgotten.",
    },
    {
      title: "Partners, not suppliers.",
      body: "With customers and with co-founders we share aims, not only contracts.",
    },
    {
      title: "Substance.",
      body: "We measure our work by the time we save and the results we produce.",
    },
    {
      title: "Responsibility.",
      body: "We treat customer data as if it were our own. Security and compliance are part of the product.",
    },
  ],
  leader: {
    name: "Andrea Donadoni",
    role: "Founder and CEO",
    bio: "An entrepreneur in business software, he founded Mindlead to bring SMEs the technology quality of large companies. He leads the group's strategy, the development of new verticals, and the partnerships.",
  },
};

export const companiesPage = {
  title: ["More companies,", "one vision."],
  intro:
    "Each company in Mindlead Group has a precise market and a dedicated team. All of them share the same technology platform, the same way of working, and the same standards of quality and security.",
  mindleadLabel: "Mindlead · lines wholly owned by the group",
  ventureIntro:
    "Some markets take decades to know. We enter them with partners who live them every day. They bring industry experience and relationships. The group brings the technology, the method, and the structure.",
  ventureLabel: "Partner Ventures · founded with industry experts",
  advisory: {
    forWho: "Established companies, industrial groups, and sales and consulting networks.",
    does: "Strategic advisory, architecture, CRM and commercial platforms, ongoing development.",
    body: "We work with established companies and industrial groups on the technology choices that matter: system architecture, data integration, bespoke platforms, and their evolution over time. We work as a stable technology partner, not as a project supplier.",
  },
  studio: {
    forWho: "SMEs that have outgrown Excel and generic software.",
    does: "Process analysis, bespoke development, integrations, training, support.",
    body: "We start from how a company actually works. We listen to the people, map the processes, and remove the steps that add nothing. Then we build management software that matches that way of working and grows with the business.",
  },
  suite: {
    body: "The Mindlead product family: subscription software built for the needs of a specific industry, ready in a few days and updated continuously.",
    construction: {
      name: "Mindlead Construction",
      line: "Management software for construction companies",
      body: "Jobs, bills of quantities and quotes, purchasing and delivery notes, e-invoicing, safety and compliance deadlines.",
      status: "Available" as CompanyStatus,
    },
    next: {
      name: "Building services",
      line: "Next industries",
      body: "Building services and other verticals in development.",
      status: "In development" as CompanyStatus,
    },
  },
  totalone: {
    body: "Manufacturer price lists, normalised and kept up to date, configuration and quotes, and space design assisted by artificial intelligence. Founded with a long-standing company in the industry, for furniture retailers and manufacturers.",
  },
  relay: {
    body: "Sales, the commercial network, and marketing in one platform, designed for the long, technical sales cycles of industry. Founded with an industrial marketing expert.",
  },
  coreNote:
    "Mindlead Core · the shared technology platform. Owned by the holding company and licensed to every company in the group.",
};

export const model = {
  title: ["We build companies,", "not only software."],
  opening:
    "Mindlead Group runs on two engines. Services create relationships, skills, and real cases. Products turn that experience into repeatable software, sold to whole industries. Every project feeds the next one.",
  /** Chiusura del ciclo in home, dalla frase finale di opening. */
  loop: "Every project feeds the next one.",
  cycle: [
    {
      title: "We listen to the market.",
      body: "Through advisory work and bespoke projects, we enter the real processes of companies.",
    },
    {
      title: "We recognise the patterns.",
      body: "When the same needs return across several companies in one industry, there is a product.",
    },
    {
      title: "We build with people who know the industry.",
      body: "We found the company with a partner who brings experience and relationships. The group brings technology and method.",
    },
    {
      title: "We help it grow.",
      body: "Each company has its own team and its own aims, with the group's support on technology, administration, and strategy.",
    },
  ],
  bringsTitle: "What the group gives each company",
  brings: [
    {
      area: "Technology",
      body: "The shared platform, the architecture, security, and updates",
    },
    {
      area: "Method",
      body: "Process analysis, project management, quality standards",
    },
    {
      area: "Strategy",
      body: "Positioning, pricing, commercial development, raising capital",
    },
    {
      area: "Structure",
      body: "Administration, legal matters, governance",
    },
  ],
  ai: "Artificial intelligence is part of our products: automatic reading of documents, analysis of business data, support for design. We use it where it saves real time, with customer data always under their control.",
};

export const partnership = {
  title: ["The group's next", "company could", "be yours."],
  body: "We look for entrepreneurs, managers, and professionals who know an industry in depth and see a problem software has not solved yet. Together we found a dedicated company. You bring market experience and relationships. We bring the technology, the method, and the structure to grow.",
  seek: [
    {
      title: "Industry experts",
      body: "With a network of relationships and a clear view of what their market needs.",
    },
    {
      title: "Established companies",
      body: "That want to turn their know-how into a product for the whole industry.",
    },
    {
      title: "Commercial partners and distributors",
      body: "That want to take our products into their markets.",
    },
  ],
  steps: [
    "You tell us about the industry and the problem.",
    "Together we assess the market, feasibility, and business model.",
    "We found the company and define roles and aims.",
    "We build the product on the group's platform and take it to market.",
  ],
  cta: "Propose a project",
  investorsTitle: "Investors",
  investors:
    "Mindlead Group builds a portfolio of vertical software companies with recurring revenue, on a shared platform that reduces the cost and time of every new launch. For information on the group and on investment in the individual companies, write to us.",
  investorsCta: "Contact the team",
  governanceTitle: "How we govern the group.",
  governanceIntro:
    "The holding company sets the strategy, the technology standards, and the shared rules. Each company has operating autonomy in its own market, with clear aims and regular reporting to the group.",
  governance: [
    {
      title: "Data protection.",
      body: "All of our products are designed in line with the GDPR: data hosted on European infrastructure, controlled access, and traceable operations.",
    },
    {
      title: "Security.",
      body: "Secure authentication, backups, continuous monitoring, and regular updates across the platform.",
    },
    {
      title: "Ethics.",
      body: "We use artificial intelligence openly and leave customers in full control of their data.",
    },
  ],
};

export const careers = {
  title: ["Build software", "companies use", "every day."],
  body: "We look for developers, consultants, and commercial people who want their work to become real products. We work remotely, in small teams, with a lot of autonomy and responsibility.",
  whyTitle: "Why Mindlead",
  why: "Concrete projects across different industries, modern technology, and the chance to grow with a group that is expanding.",
  empty: "No open roles at the moment? Write to us anyway.",
};

export const contactPage = {
  title: ["Let's talk."],
  body: "Choose the address that fits your request. The right person will reply.",
  note: "For projects, quotes, and product support, contact the group company that fits.",
};

export const footer = {
  signature: "Mindlead Group",
  tagline: "We build software companies.",
};
