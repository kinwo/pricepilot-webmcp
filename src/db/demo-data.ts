export type CatalogSeed = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  useCase: string;
  imagePath: string;
  specs: string[];
  tags: string[];
  listPriceCents: number;
  excellentPriceCents: number;
  goodPriceCents: number;
  floorPriceCents: number;
  maxInstantDiscountBps: number;
  defaultNewStock: number;
  defaultExcellentStock: number;
  defaultGoodStock: number;
};

export const SHOWCASE_PRODUCT_ID = "aster-air-13";

export const CATALOG: CatalogSeed[] = [
  {
    id: "aster-air-13",
    slug: "aster-air-13",
    name: "Aster Air 13",
    tagline: "The carry-everywhere workday laptop",
    description: "A quiet, lightweight laptop with all-day battery life for study, travel, and focused work.",
    useCase: "Everyday productivity",
    imagePath: "/products/aster-air.svg",
    specs: ["13.4-inch display", "16 GB memory", "512 GB SSD", "1.18 kg"],
    tags: ["portable", "student", "battery"],
    listPriceCents: 109900,
    excellentPriceCents: 87900,
    goodPriceCents: 78900,
    floorPriceCents: 73500,
    maxInstantDiscountBps: 500,
    defaultNewStock: 18,
    defaultExcellentStock: 7,
    defaultGoodStock: 5
  },
  {
    id: "aster-pro-14",
    slug: "aster-pro-14",
    name: "Aster Pro 14",
    tagline: "Serious performance without the bulk",
    description: "A durable productivity machine designed for analysts, founders, and software teams.",
    useCase: "Professional work",
    imagePath: "/products/aster-pro.svg",
    specs: ["14-inch 2.8K display", "32 GB memory", "1 TB SSD", "12-core processor"],
    tags: ["business", "performance", "coding"],
    listPriceCents: 159900,
    excellentPriceCents: 127900,
    goodPriceCents: 114900,
    floorPriceCents: 106500,
    maxInstantDiscountBps: 450,
    defaultNewStock: 11,
    defaultExcellentStock: 4,
    defaultGoodStock: 3
  },
  {
    id: "orbit-flex-14",
    slug: "orbit-flex-14",
    name: "Orbit Flex 14",
    tagline: "Sketch, present, and work in one motion",
    description: "A convertible touchscreen laptop for visual thinkers, presenters, and note-takers.",
    useCase: "Flexible creativity",
    imagePath: "/products/orbit-flex.svg",
    specs: ["14-inch touchscreen", "16 GB memory", "512 GB SSD", "360° hinge"],
    tags: ["touchscreen", "creative", "presentations"],
    listPriceCents: 129900,
    excellentPriceCents: 101900,
    goodPriceCents: 91900,
    floorPriceCents: 86000,
    maxInstantDiscountBps: 550,
    defaultNewStock: 9,
    defaultExcellentStock: 6,
    defaultGoodStock: 4
  },
  {
    id: "orbit-studio-16",
    slug: "orbit-studio-16",
    name: "Orbit Studio 16",
    tagline: "A portable studio for demanding ideas",
    description: "A color-accurate creator laptop with dedicated graphics and generous memory.",
    useCase: "Creative production",
    imagePath: "/products/orbit-studio.svg",
    specs: ["16-inch 3.2K display", "32 GB memory", "1 TB SSD", "8 GB graphics"],
    tags: ["video", "design", "creator"],
    listPriceCents: 219900,
    excellentPriceCents: 178900,
    goodPriceCents: 161900,
    floorPriceCents: 149500,
    maxInstantDiscountBps: 400,
    defaultNewStock: 6,
    defaultExcellentStock: 3,
    defaultGoodStock: 2
  },
  {
    id: "terra-lite-13",
    slug: "terra-lite-13",
    name: "Terra Lite 13",
    tagline: "Simple, dependable, and easy on the budget",
    description: "A friendly entry laptop for documents, calls, browsing, and online learning.",
    useCase: "Budget essentials",
    imagePath: "/products/terra-lite.svg",
    specs: ["13.3-inch display", "8 GB memory", "256 GB SSD", "14-hour battery"],
    tags: ["budget", "student", "simple"],
    listPriceCents: 69900,
    excellentPriceCents: 55900,
    goodPriceCents: 48900,
    floorPriceCents: 44500,
    maxInstantDiscountBps: 650,
    defaultNewStock: 24,
    defaultExcellentStock: 12,
    defaultGoodStock: 9
  },
  {
    id: "terra-work-15",
    slug: "terra-work-15",
    name: "Terra Work 15",
    tagline: "Room to work, built to last",
    description: "A repairable, full-size laptop with a numeric keypad and practical business ports.",
    useCase: "Small business",
    imagePath: "/products/terra-work.svg",
    specs: ["15.6-inch display", "16 GB memory", "512 GB SSD", "Numeric keypad"],
    tags: ["business", "repairable", "office"],
    listPriceCents: 99900,
    excellentPriceCents: 79900,
    goodPriceCents: 70900,
    floorPriceCents: 65500,
    maxInstantDiscountBps: 600,
    defaultNewStock: 16,
    defaultExcellentStock: 8,
    defaultGoodStock: 7
  },
  {
    id: "nova-spark-14",
    slug: "nova-spark-14",
    name: "Nova Spark 14",
    tagline: "A fast start for ambitious learners",
    description: "A balanced laptop for research, coursework, light coding, and campus life.",
    useCase: "Education",
    imagePath: "/products/nova-spark.svg",
    specs: ["14-inch display", "16 GB memory", "512 GB SSD", "1080p webcam"],
    tags: ["education", "coding", "portable"],
    listPriceCents: 89900,
    excellentPriceCents: 71900,
    goodPriceCents: 63900,
    floorPriceCents: 59500,
    maxInstantDiscountBps: 600,
    defaultNewStock: 21,
    defaultExcellentStock: 10,
    defaultGoodStock: 7
  },
  {
    id: "nova-forge-16",
    slug: "nova-forge-16",
    name: "Nova Forge 16",
    tagline: "Build, simulate, and create at full speed",
    description: "A high-performance laptop for engineering, 3D work, and local AI experiments.",
    useCase: "Engineering",
    imagePath: "/products/nova-forge.svg",
    specs: ["16-inch 240 Hz display", "64 GB memory", "2 TB SSD", "12 GB graphics"],
    tags: ["engineering", "3d", "ai"],
    listPriceCents: 279900,
    excellentPriceCents: 229900,
    goodPriceCents: 209900,
    floorPriceCents: 194500,
    maxInstantDiscountBps: 350,
    defaultNewStock: 4,
    defaultExcellentStock: 2,
    defaultGoodStock: 1
  }
];

