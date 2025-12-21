import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Use the same configuration as the main app
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["query", "error", "warn"],
});

const curatedBackgrounds = [
  {
    name: "Gradient Sunset",
    imagePath: "bg-gradient-01.png",
    tags: ["gradient", "warm", "orange"],
  },
  {
    name: "Abstract Waves",
    imagePath: "bg-gradient-02.png",
    tags: ["gradient", "blue", "abstract"],
  },
  {
    name: "Minimal Grid",
    imagePath: "bg-abstract-03.png",
    tags: ["pattern", "minimal", "monochrome"],
  },
  {
    name: "Colorful Gradient",
    imagePath: "bg-gradient-04.png",
    tags: ["gradient", "colorful", "vibrant"],
  },
  {
    name: "Soft Pastel",
    imagePath: "bg-gradient-05.png",
    tags: ["gradient", "pastel", "soft"],
  },
  {
    name: "Dark Abstract",
    imagePath: "bg-abstract-06.png",
    tags: ["abstract", "dark", "modern"],
  },
  {
    name: "Purple Haze",
    imagePath: "bg-gradient-07.png",
    tags: ["gradient", "purple", "dreamy"],
  },
  {
    name: "Green Organic",
    imagePath: "bg-gradient-08.png",
    tags: ["gradient", "green", "natural"],
  },
  {
    name: "Geometric Pattern",
    imagePath: "bg-pattern-09.png",
    tags: ["pattern", "geometric", "modern"],
  },
  {
    name: "Warm Gradient",
    imagePath: "bg-gradient-10.png",
    tags: ["gradient", "warm", "yellow"],
  },
];

async function main() {
  console.log("Seeding curated backgrounds...");

  for (const bg of curatedBackgrounds) {
    // Check if background already exists
    const existing = await prisma.curatedBackground.findFirst({
      where: { imagePath: bg.imagePath },
    });

    if (existing) {
      console.log(`⚠ ${bg.name} already exists, skipping...`);
      continue;
    }

    const created = await prisma.curatedBackground.create({
      data: bg,
    });
    console.log(`✓ ${created.name} (${created.imagePath})`);
  }

  console.log(`\n✓ Seeded ${curatedBackgrounds.length} curated backgrounds`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
