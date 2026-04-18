import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

type SeedCategory = {
  name: string;
  slug: string;
  color: string;
  sortOrder: number;
  children: Array<{ name: string; slug: string }>;
};

const defaultCategories: SeedCategory[] = [
  {
    name: "Housing & Rent",
    slug: "housing-and-rent",
    color: "#6366F1",
    sortOrder: 10,
    children: [
      { name: "Rent / Mortgage", slug: "rent-mortgage" },
      { name: "Property Tax", slug: "property-tax" },
      { name: "HOA / Condo Fees", slug: "hoa-condo-fees" },
      { name: "Home Insurance", slug: "home-insurance" },
      { name: "Home Maintenance", slug: "home-maintenance" },
      { name: "Home Security", slug: "home-security" },
    ],
  },
  {
    name: "Utilities",
    slug: "utilities",
    color: "#0EA5E9",
    sortOrder: 20,
    children: [
      { name: "Electricity", slug: "electricity" },
      { name: "Water & Sewer", slug: "water-and-sewer" },
      { name: "Natural Gas", slug: "natural-gas" },
      { name: "Internet", slug: "internet" },
      { name: "Phone / Mobile", slug: "phone-mobile" },
      { name: "Trash & Recycling", slug: "trash-and-recycling" },
    ],
  },
  {
    name: "Food & Dining",
    slug: "food-and-dining",
    color: "#F97316",
    sortOrder: 30,
    children: [
      { name: "Groceries", slug: "groceries" },
      { name: "Restaurants", slug: "restaurants" },
      { name: "Coffee & Cafes", slug: "coffee-and-cafes" },
      { name: "Fast Food", slug: "fast-food" },
      { name: "Food Delivery", slug: "food-delivery" },
      { name: "Alcohol & Bars", slug: "alcohol-and-bars" },
    ],
  },
  {
    name: "Transportation",
    slug: "transportation",
    color: "#EF4444",
    sortOrder: 40,
    children: [
      { name: "Fuel / Gas", slug: "fuel-gas" },
      { name: "Public Transit", slug: "public-transit" },
      { name: "Ride Sharing / Taxi", slug: "ride-sharing-taxi" },
      { name: "Car Payment", slug: "car-payment" },
      { name: "Car Insurance", slug: "car-insurance" },
      { name: "Parking", slug: "parking" },
      { name: "Car Maintenance & Repairs", slug: "car-maintenance-and-repairs" },
    ],
  },
  {
    name: "Healthcare",
    slug: "healthcare",
    color: "#EC4899",
    sortOrder: 50,
    children: [
      { name: "Health Insurance", slug: "health-insurance" },
      { name: "Doctor Visits", slug: "doctor-visits" },
      { name: "Dental", slug: "dental" },
      { name: "Vision / Optical", slug: "vision-optical" },
      { name: "Pharmacy / Medications", slug: "pharmacy-medications" },
      { name: "Mental Health", slug: "mental-health" },
    ],
  },
  {
    name: "Personal Care",
    slug: "personal-care",
    color: "#D946EF",
    sortOrder: 60,
    children: [
      { name: "Hair & Grooming", slug: "hair-and-grooming" },
      { name: "Spa & Massage", slug: "spa-and-massage" },
      { name: "Cosmetics & Skincare", slug: "cosmetics-and-skincare" },
      { name: "Gym & Fitness", slug: "gym-and-fitness" },
      { name: "Laundry & Dry Cleaning", slug: "laundry-and-dry-cleaning" },
    ],
  },
  {
    name: "Shopping",
    slug: "shopping",
    color: "#A855F7",
    sortOrder: 70,
    children: [
      { name: "Clothing & Shoes", slug: "clothing-and-shoes" },
      { name: "Electronics & Gadgets", slug: "electronics-and-gadgets" },
      { name: "Furniture & Home Decor", slug: "furniture-and-home-decor" },
      { name: "Books & Media", slug: "books-and-media" },
      { name: "Gifts & Donations", slug: "gifts-and-donations" },
      { name: "Household Supplies", slug: "household-supplies" },
    ],
  },
  {
    name: "Entertainment",
    slug: "entertainment",
    color: "#F59E0B",
    sortOrder: 80,
    children: [
      { name: "Movies & Theater", slug: "movies-and-theater" },
      { name: "Concerts & Events", slug: "concerts-and-events" },
      { name: "Subscriptions", slug: "subscriptions-entertainment" },
      { name: "Games & Hobbies", slug: "games-and-hobbies" },
      { name: "Sports & Recreation", slug: "sports-and-recreation" },
    ],
  },
  {
    name: "Travel",
    slug: "travel",
    color: "#14B8A6",
    sortOrder: 90,
    children: [
      { name: "Flights", slug: "flights" },
      { name: "Hotels & Accommodation", slug: "hotels-and-accommodation" },
      { name: "Car Rental", slug: "car-rental" },
      { name: "Travel Insurance", slug: "travel-insurance" },
      { name: "Activities & Tours", slug: "activities-and-tours" },
      { name: "Travel Meals", slug: "travel-meals" },
    ],
  },
  {
    name: "Education",
    slug: "education",
    color: "#3B82F6",
    sortOrder: 100,
    children: [
      { name: "Tuition & Fees", slug: "tuition-and-fees" },
      { name: "Books & Supplies", slug: "books-and-supplies" },
      { name: "Online Courses", slug: "online-courses" },
      { name: "Student Loans", slug: "student-loans" },
      { name: "Certifications & Exams", slug: "certifications-and-exams" },
    ],
  },
  {
    name: "Children & Family",
    slug: "children-and-family",
    color: "#10B981",
    sortOrder: 110,
    children: [
      { name: "Childcare & Daycare", slug: "childcare-and-daycare" },
      { name: "School Supplies & Fees", slug: "school-supplies-and-fees" },
      { name: "Baby & Toddler", slug: "baby-and-toddler" },
      { name: "Kids Activities", slug: "kids-activities" },
      { name: "Allowances", slug: "allowances" },
    ],
  },
  {
    name: "Pets",
    slug: "pets",
    color: "#84CC16",
    sortOrder: 120,
    children: [
      { name: "Pet Food", slug: "pet-food" },
      { name: "Veterinary", slug: "veterinary" },
      { name: "Pet Grooming", slug: "pet-grooming" },
      { name: "Pet Supplies", slug: "pet-supplies" },
      { name: "Pet Insurance", slug: "pet-insurance" },
    ],
  },
  {
    name: "Insurance & Financial",
    slug: "insurance-and-financial",
    color: "#06B6D4",
    sortOrder: 130,
    children: [
      { name: "Life Insurance", slug: "life-insurance" },
      { name: "Investment Fees", slug: "investment-fees" },
      { name: "Bank Fees", slug: "bank-fees" },
      { name: "Tax Payments", slug: "tax-payments" },
      { name: "Accounting & Legal", slug: "accounting-and-legal" },
    ],
  },
  {
    name: "Subscriptions & Services",
    slug: "subscriptions-and-services",
    color: "#8B5CF6",
    sortOrder: 140,
    children: [
      { name: "Software & Apps", slug: "software-and-apps" },
      { name: "Cloud Storage", slug: "cloud-storage" },
      { name: "Music Streaming", slug: "music-streaming" },
      { name: "Video Streaming", slug: "video-streaming" },
      { name: "News & Magazines", slug: "news-and-magazines" },
    ],
  },
  {
    name: "Renovation & Home Improvement",
    slug: "renovation-and-home-improvement",
    color: "#D97706",
    sortOrder: 150,
    children: [
      { name: "Kitchen", slug: "kitchen" },
      { name: "Bathroom", slug: "bathroom" },
      { name: "Flooring", slug: "flooring" },
      { name: "Painting & Walls", slug: "painting-and-walls" },
      { name: "Electrical Work", slug: "electrical-work" },
      { name: "Plumbing", slug: "plumbing" },
      { name: "Contractor Fees", slug: "contractor-fees" },
    ],
  },
  {
    name: "Business Expenses",
    slug: "business-expenses",
    color: "#475569",
    sortOrder: 160,
    children: [
      { name: "Office Supplies", slug: "office-supplies" },
      { name: "Office Rent", slug: "office-rent" },
      { name: "Business Travel", slug: "business-travel" },
      { name: "Advertising & Marketing", slug: "advertising-and-marketing" },
      { name: "Professional Services", slug: "professional-services" },
      { name: "Equipment & Hardware", slug: "equipment-and-hardware" },
    ],
  },
  {
    name: "Taxes & Government",
    slug: "taxes-and-government",
    color: "#64748B",
    sortOrder: 170,
    children: [
      { name: "Income Tax", slug: "income-tax" },
      { name: "Sales Tax / VAT", slug: "sales-tax-vat" },
      { name: "Government Fees & Licenses", slug: "government-fees-and-licenses" },
      { name: "Fines & Penalties", slug: "fines-and-penalties" },
    ],
  },
  {
    name: "Debt & Loan Payments",
    slug: "debt-and-loan-payments",
    color: "#DC2626",
    sortOrder: 180,
    children: [
      { name: "Credit Card Payment", slug: "credit-card-payment" },
      { name: "Personal Loan Payment", slug: "personal-loan-payment" },
      { name: "Student Loan Payment", slug: "student-loan-payment" },
      { name: "Car Loan Payment", slug: "car-loan-payment" },
      { name: "Other Debt Payments", slug: "other-debt-payments" },
    ],
  },
  {
    name: "Income & Transfers",
    slug: "income-and-transfers",
    color: "#22C55E",
    sortOrder: 190,
    children: [
      { name: "Salary / Wages", slug: "salary-wages" },
      { name: "Freelance / Contract Income", slug: "freelance-contract-income" },
      { name: "Rental Income", slug: "rental-income" },
      { name: "Investment Returns", slug: "investment-returns" },
      { name: "Refunds", slug: "refunds" },
    ],
  },
  {
    name: "Miscellaneous",
    slug: "miscellaneous",
    color: "#78716C",
    sortOrder: 200,
    children: [
      { name: "Cash Withdrawal", slug: "cash-withdrawal" },
      { name: "ATM Fees", slug: "atm-fees" },
      { name: "Charitable Donations", slug: "charitable-donations" },
      { name: "Uncategorized", slug: "uncategorized" },
      { name: "Other", slug: "other" },
    ],
  },
];

async function seed() {
  console.log("Seeding platform admin and default categories...");

  // 1. Promote all existing users to platform admin (dev only)
  const promoted = await db.user.updateMany({
    where: { isPlatformAdmin: false },
    data: { isPlatformAdmin: true },
  });
  if (promoted.count > 0) {
    console.log(`Promoted ${promoted.count} existing user(s) to platform admin.`);
  }

  const admins = await db.user.findMany({
    where: { isPlatformAdmin: true },
    select: { email: true, id: true },
  });
  for (const a of admins) {
    console.log(`  Admin: ${a.email} (${a.id})`);
  }

  // 2. Seed platform-wide categories (spaceId = null)
  let parentCount = 0;
  let childCount = 0;

  for (const cat of defaultCategories) {
    // Find or create parent
    let parent = await db.category.findFirst({
      where: { spaceId: null, parentCategoryId: null, slug: cat.slug },
    });

    if (!parent) {
      parent = await db.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          color: cat.color,
          sortOrder: cat.sortOrder,
          // spaceId omitted = null (platform-wide)
        },
      });
      parentCount++;
    }

    // Create children
    for (const [idx, child] of cat.children.entries()) {
      const existing = await db.category.findFirst({
        where: { spaceId: null, parentCategoryId: parent.id, slug: child.slug },
      });

      if (!existing) {
        await db.category.create({
          data: {
            name: child.name,
            slug: child.slug,
            parentCategoryId: parent.id,
            sortOrder: idx,
          },
        });
        childCount++;
      }
    }
  }

  console.log(`Created ${parentCount} parent categories and ${childCount} child categories.`);
  console.log("Seed complete.");
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  });
