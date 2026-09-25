require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found in .env.local");
    process.exit(1);
  }
  
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("BumbasKitchenDB"); 
    const collection = db.collection("menuItems");
    
    const items = await collection.find({}).toArray();
    let updatedCount = 0;
    let nonVegCount = 0;
    let vegCount = 0;
    
    const nonVegKeywords = ["chicken", "mutton", "fish", "garlic", "onion", "egg", "prawn", "chingri", "rui", "katla", "pomfret", "mach", "meat", "beef", "pork"];
    
    for (const item of items) {
      let isNonVeg = false;
      const name = (item.Name || "").toLowerCase();
      const category = (item.Category || "").toLowerCase();
      
      const searchStr = `${name} ${category}`;
      
      for (const kw of nonVegKeywords) {
        if (searchStr.includes(kw)) {
          isNonVeg = true;
          break;
        }
      }
      
      const type = isNonVeg ? "non-veg" : "veg";
      
      await collection.updateOne(
        { _id: item._id },
        { $set: { type: type } }
      );
      
      if (isNonVeg) nonVegCount++;
      else vegCount++;
      
      updatedCount++;
    }
    
    console.log("Migration Complete!");
    console.log(`Total items updated: ${updatedCount}`);
    console.log(`Non-Veg items: ${nonVegCount}`);
    console.log(`Veg items: ${vegCount}`);
  } catch (err) {
    console.error("Error during migration:", err);
  } finally {
    await client.close();
  }
}

migrate();