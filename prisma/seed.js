// Runs with plain Node (no Next.js transpiling), so this file uses CommonJS.
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const PRODUCTS = [
  { name: "Linea Minimalist Line-Art Poster", category: "posters", price: 349, mrp: 599, rating: 4.8, reviewsCount: 214, badges: ["Bestseller"], img: "seed/linea1/600/750", img2: "seed/linea2/600/750", description: "Fine-line botanical & abstract prints on 250gsm matte art paper. A quiet, gallery-grade accent for any wall.", variants: ["A4", "A3", "Set of 3 (A4)"], customizable: false, specs: ["250gsm matte art paper", "Fade-resistant pigment ink", "Ships rolled in a rigid tube"] },
  { name: "Circuit F1 Multi-Panel Racing Canvas", category: "posters", price: 1899, mrp: 2999, rating: 4.9, reviewsCount: 132, badges: ["New", "37% off"], img: "seed/f1canvas1/600/750", img2: "seed/f1canvas2/600/750", description: "Split-panel canvas capturing the speed and grit of race day. Gallery-wrapped edges, ready to hang.", variants: ["3-Panel Set", "5-Panel Set"], customizable: false, specs: ["Gallery-wrapped canvas", "UV-protected print", "Hanging hardware included"] },
  { name: "Botanica Framed Wall Art", category: "posters", price: 899, mrp: 1299, rating: 4.7, reviewsCount: 98, badges: ["Framed"], img: "seed/framed1/600/750", img2: "seed/framed2/600/750", description: "Museum-style framed botanical prints with anti-glare acrylic and a solid oak-finish frame.", variants: ["A4 Framed", "A3 Framed"], customizable: false, specs: ["Oak-finish frame", "Anti-glare acrylic front", "Wall-mount kit included"] },
  { name: "Golden Hour Birthday Photo Magazine", category: "magazines", price: 799, mrp: 1099, rating: 4.9, reviewsCount: 301, badges: ["Bestseller", "Personalised"], img: "seed/bdaymag1/600/750", img2: "seed/bdaymag2/600/750", description: "A keepsake photo magazine built around your favourite birthday memories — upload photos, we lay out the rest.", variants: ["12 Pages", "20 Pages"], customizable: true, specs: ["Silk-matte 170gsm pages", "Perfect-bound spine", "Free digital proof before print"] },
  { name: "Us, Always — Anniversary Memory Book", category: "magazines", price: 899, mrp: 1199, rating: 4.8, reviewsCount: 176, badges: ["Personalised"], img: "seed/annimag1/600/750", img2: "seed/annimag2/600/750", description: "Chronicle your story together — from first date to forever — in a premium hardcover-style photo magazine.", variants: ["16 Pages", "24 Pages"], customizable: true, specs: ["170gsm silk-matte", "Lay-flat binding", "Free digital proof before print"] },
  { name: "Squad Edition — Friends Photo Zine", category: "magazines", price: 649, mrp: 899, rating: 4.7, reviewsCount: 89, badges: ["Personalised"], img: "seed/friendmag1/600/750", img2: "seed/friendmag2/600/750", description: "A fun, candid-style zine of your friend group's best moments, captions and inside jokes included.", variants: ["12 Pages"], customizable: true, specs: ["170gsm silk-matte", "Saddle-stitch binding", "Free digital proof before print"] },
  { name: "Blank Slate Undated Planner", category: "planners", price: 549, mrp: 799, rating: 4.6, reviewsCount: 154, badges: ["Bestseller"], img: "seed/planner1/600/750", img2: "seed/planner2/600/750", description: "Start any month, any week. Thoughtful layouts for daily focus, habits and monthly goals.", variants: ["Weekly Layout", "Daily Layout"], customizable: false, specs: ["120gsm ivory pages", "Elastic closure", "Ribbon bookmark"] },
  { name: "Frame-Worthy 2027 Wall Calendar", category: "planners", price: 449, mrp: 649, rating: 4.7, reviewsCount: 121, badges: ["Personalised", "New"], img: "seed/calendar1/600/750", img2: "seed/calendar2/600/750", description: "A 12-month wall calendar featuring your own photos for every month — order now, hang on the 1st.", variants: ["A3 Wall Hang", "A4 Wall Hang"], customizable: true, specs: ["250gsm art paper", "Wire-o binding", "Free digital proof before print"] },
  { name: "Named Custom Memo Pad Duo", category: "memopads", price: 299, mrp: 449, rating: 4.8, reviewsCount: 267, badges: ["Personalised", "Bestseller"], img: "seed/memo1/600/750", img2: "seed/memo2/600/750", description: "To-do pads with your name (or a little joke only you'll get) printed at the top of every sheet.", variants: ["Set of 2", "Set of 4"], customizable: true, specs: ["80gsm notepaper", "Glue-bound top edge", "50 sheets per pad"] },
  { name: "Golden Line Aesthetic Bookmarks", category: "bookmarks", price: 199, mrp: 299, rating: 4.9, reviewsCount: 342, badges: ["Bestseller"], img: "seed/bookmark1/600/750", img2: "seed/bookmark2/600/750", description: "Laminated, tassel-finished bookmarks with quiet line-art and gold foil accents.", variants: ["Set of 5", "Set of 10"], customizable: false, specs: ["Laminated matte finish", "Tassel detail", "Rounded corners"] },
];

async function main() {
  // 1. Super Admin — created only from env vars, never hardcoded in source.
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME || "Super Admin";

  if (!email || !password) {
    console.warn("⚠️  SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set in .env — skipping Super Admin creation.");
  } else {
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      console.log(`Super Admin already exists (${email}) — leaving it as is.`);
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.adminUser.create({
        data: { name, email, passwordHash, role: "SUPER_ADMIN", status: "ACTIVE" },
      });
      console.log(`✅ Super Admin created: ${email}`);
    }
  }

  // 2. Starting product catalog (only if the table is empty)
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    for (const p of PRODUCTS) {
      await prisma.product.create({
        data: { ...p, badges: JSON.stringify(p.badges), variants: JSON.stringify(p.variants), specs: JSON.stringify(p.specs) },
      });
    }
    console.log(`✅ Seeded ${PRODUCTS.length} starting products.`);
  } else {
    console.log("Products already exist — skipping catalog seed.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
