
import { db } from "./db";
import { units } from "@shared/schema";

async function initializeUnits() {
  console.log("🔧 Initializing default units...");

  const defaultUnits = [
    { name: "Kilograms", abbreviation: "kg", type: "weight" },
    { name: "Grams", abbreviation: "g", type: "weight" },
    { name: "Pounds", abbreviation: "lbs", type: "weight" },
    { name: "Ounces", abbreviation: "oz", type: "weight" },
    { name: "Liters", abbreviation: "L", type: "volume" },
    { name: "Milliliters", abbreviation: "ml", type: "volume" },
    { name: "Cups", abbreviation: "cup", type: "volume" },
    { name: "Tablespoons", abbreviation: "tbsp", type: "volume" },
    { name: "Teaspoons", abbreviation: "tsp", type: "volume" },
    { name: "Pieces", abbreviation: "pcs", type: "count" },
    { name: "Dozen", abbreviation: "doz", type: "count" },
    { name: "Packets", abbreviation: "pkt", type: "count" },
    { name: "Boxes", abbreviation: "box", type: "count" },
    { name: "Bags", abbreviation: "bag", type: "count" },
  ];

  try {
    // Check if units already exist
    const existingUnits = await db.select().from(units);
    if (existingUnits.length > 0) {
      console.log("✅ Units already initialized");
      return;
    }

    // Insert default units
    await db.insert(units).values(defaultUnits);
    console.log("✅ Default units added successfully");
  } catch (error) {
    console.error("❌ Error initializing units:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initializeUnits()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { initializeUnits };
