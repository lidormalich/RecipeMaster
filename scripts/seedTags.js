const mongoose = require('mongoose');
const Tag = require('../models/Tag');
require('dotenv').config();

const tagData = [
  // ==================== 6 קטגוריות לעוזר AI ====================
  {
    category: 'זמן הכנה',
    categoryEn: 'Preparation Time',
    tags: [
      {he: 'עד 15 דקות', en: 'Up to 15 minutes', globalId: 1001},
      {he: '15-30 דקות', en: '15-30 minutes', globalId: 1002},
      {he: '30-45 דקות', en: '30-45 minutes', globalId: 1003},
      {he: '45-60 דקות', en: '45-60 minutes', globalId: 1004},
      {he: 'שעה עד שעתיים', en: '1-2 hours', globalId: 1005},
      {he: 'מעל שעתיים', en: 'Over 2 hours', globalId: 1006},
    ],
  },
  {
    category: 'רמת קושי',
    categoryEn: 'Difficulty',
    tags: [
      {he: 'קל מאוד', en: 'Very Easy', globalId: 2001},
      {he: 'קל', en: 'Easy', globalId: 2002},
      {he: 'בינוני', en: 'Medium', globalId: 2003},
      {he: 'מתקדם', en: 'Advanced', globalId: 2004},
      {he: 'שף מקצועי', en: 'Professional Chef', globalId: 2005},
    ],
  },
  {
    category: 'סוג מנה',
    categoryEn: 'Dish Type',
    tags: [
      {he: 'מנה ראשונה', en: 'Appetizer', globalId: 3001},
      {he: 'מנה עיקרית', en: 'Main Course', globalId: 3002},
      {he: 'תוספת', en: 'Side Dish', globalId: 3003},
      {he: 'סלט', en: 'Salad', globalId: 3004},
      {he: 'מרק', en: 'Soup', globalId: 3005},
      {he: 'קינוח', en: 'Dessert', globalId: 3006},
      {he: 'חטיף', en: 'Snack', globalId: 3007},
      {he: 'משקה', en: 'Beverage', globalId: 3008},
      {he: 'לחם ומאפים', en: 'Bread & Pastries', globalId: 3009},
    ],
  },
  {
    category: 'תזונה',
    categoryEn: 'Nutrition',
    tags: [
      {he: 'טבעוני', en: 'Vegan', globalId: 4001},
      {he: 'צמחוני', en: 'Vegetarian', globalId: 4002},
      {he: 'ללא גלוטן', en: 'Gluten-free', globalId: 4003},
      {he: 'ללא לקטוז', en: 'Lactose-free', globalId: 4004},
      {he: 'דל פחמימות', en: 'Low Carb', globalId: 4005},
      {he: 'דל קלוריות', en: 'Low Calorie', globalId: 4006},
      {he: 'עתיר חלבון', en: 'High Protein', globalId: 4007},
      {he: 'קטוגני', en: 'Keto', globalId: 4008},
      {he: 'ללא סוכר', en: 'Sugar-free', globalId: 4009},
      {he: 'ללא אגוזים', en: 'Nut-free', globalId: 4010},
    ],
  },
  {
    category: 'כשרות',
    categoryEn: 'Kosher',
    tags: [
      {he: 'כשר', en: 'Kosher', globalId: 5001},
      {he: 'כשר למהדרין', en: 'Kosher Mehadrin', globalId: 5002},
      {he: 'פרווה', en: 'Pareve', globalId: 5003},
      {he: 'חלבי', en: 'Dairy', globalId: 5004},
      {he: 'בשרי', en: 'Meat', globalId: 5005},
      {he: 'כשר לפסח', en: 'Kosher for Passover', globalId: 5006},
    ],
  },
  {
    category: 'סגנון מטבח',
    categoryEn: 'Cuisine Style',
    tags: [
      {he: 'ישראלי', en: 'Israeli', globalId: 6001},
      {he: 'ים תיכוני', en: 'Mediterranean', globalId: 6002},
      {he: 'מזרח תיכוני', en: 'Middle Eastern', globalId: 6003},
      {he: 'איטלקי', en: 'Italian', globalId: 6004},
      {he: 'צרפתי', en: 'French', globalId: 6005},
      {he: 'אסייתי', en: 'Asian', globalId: 6006},
      {he: 'מקסיקני', en: 'Mexican', globalId: 6007},
      {he: 'אמריקאי', en: 'American', globalId: 6008},
      {he: 'הודי', en: 'Indian', globalId: 6009},
      {he: 'מרוקאי', en: 'Moroccan', globalId: 6010},
      {he: 'תימני', en: 'Yemenite', globalId: 6011},
      {he: 'יווני', en: 'Greek', globalId: 6012},
      {he: 'תורכי', en: 'Turkish', globalId: 6013},
      {he: 'יפני', en: 'Japanese', globalId: 6014},
      {he: 'סיני', en: 'Chinese', globalId: 6015},
      {he: 'תאילנדי', en: 'Thai', globalId: 6016},
    ],
  },

  // ==================== קטגוריות נוספות ====================
  {
    category: 'חומרי גלם עיקריים',
    categoryEn: 'Main Ingredients',
    tags: [
      {he: 'עוף', en: 'Chicken', globalId: 7001},
      {he: 'בשר בקר', en: 'Beef', globalId: 7002},
      {he: 'דגים', en: 'Fish', globalId: 7003},
      {he: 'טופו', en: 'Tofu', globalId: 7004},
      {he: 'ביצים', en: 'Eggs', globalId: 7005},
      {he: 'גבינות', en: 'Cheese', globalId: 7006},
      {he: 'פסטה', en: 'Pasta', globalId: 7007},
      {he: 'אורז', en: 'Rice', globalId: 7008},
      {he: 'תפוחי אדמה', en: 'Potatoes', globalId: 7009},
      {he: 'ירקות', en: 'Vegetables', globalId: 7010},
      {he: 'קטניות', en: 'Legumes', globalId: 7011},
      {he: 'פירות', en: 'Fruits', globalId: 7012},
      {he: 'שוקולד', en: 'Chocolate', globalId: 7013},
      {he: 'כבש/טלה', en: 'Lamb', globalId: 7014},
      {he: 'הודו', en: 'Turkey', globalId: 7015},
      {he: 'פירות ים', en: 'Seafood', globalId: 7016},
    ],
  },
  {
    category: 'שיטת בישול',
    categoryEn: 'Cooking Method',
    tags: [
      {he: 'אפייה בתנור', en: 'Baking', globalId: 8001},
      {he: 'טיגון', en: 'Frying', globalId: 8002},
      {he: 'בישול', en: 'Boiling', globalId: 8003},
      {he: 'צלייה', en: 'Roasting', globalId: 8004},
      {he: 'גריל', en: 'Grilling', globalId: 8005},
      {he: 'אידוי', en: 'Steaming', globalId: 8006},
      {he: 'סיר לחץ', en: 'Pressure Cooker', globalId: 8007},
      {he: 'בישול איטי', en: 'Slow Cooking', globalId: 8008},
      {he: 'ללא בישול', en: 'No-Cook', globalId: 8009},
      {he: 'ללא אפייה', en: 'No-Bake', globalId: 8010},
      {he: 'טיגון עמוק', en: 'Deep Frying', globalId: 8011},
      {he: 'סוטה', en: 'Sauteing', globalId: 8012},
    ],
  },
  {
    category: 'ארוחות',
    categoryEn: 'Meals',
    tags: [
      {he: 'ארוחת בוקר', en: 'Breakfast', globalId: 9001},
      {he: 'ארוחת צהריים', en: 'Lunch', globalId: 9002},
      {he: 'ארוחת ערב', en: 'Dinner', globalId: 9003},
      {he: 'בראנץ\'', en: 'Brunch', globalId: 9004},
      {he: 'ארוחת ילדים', en: 'Kids Meal', globalId: 9005},
      {he: 'ארוחה קלה', en: 'Light Meal', globalId: 9006},
    ],
  },
  {
    category: 'חגים ואירועים',
    categoryEn: 'Holidays & Events',
    tags: [
      {he: 'שבת', en: 'Shabbat', globalId: 10001},
      {he: 'ראש השנה', en: 'Rosh Hashanah', globalId: 10002},
      {he: 'יום כיפור', en: 'Yom Kippur', globalId: 10003},
      {he: 'סוכות', en: 'Sukkot', globalId: 10004},
      {he: 'חנוכה', en: 'Hanukkah', globalId: 10005},
      {he: 'פורים', en: 'Purim', globalId: 10006},
      {he: 'פסח', en: 'Passover', globalId: 10007},
      {he: 'שבועות', en: 'Shavuot', globalId: 10008},
      {he: 'יום העצמאות', en: 'Independence Day', globalId: 10009},
      {he: 'יום הולדת', en: 'Birthday', globalId: 10010},
      {he: 'מסיבה', en: 'Party', globalId: 10011},
      {he: 'פיקניק', en: 'Picnic', globalId: 10012},
      {he: 'ברביקיו', en: 'BBQ', globalId: 10013},
      {he: 'ארוחה משפחתית', en: 'Family Dinner', globalId: 10014},
    ],
  },
  {
    category: 'מאפיינים',
    categoryEn: 'Characteristics',
    tags: [
      {he: 'מתאים להקפאה', en: 'Freezer Friendly', globalId: 11001},
      {he: 'מתאים להכנה מראש', en: 'Make Ahead', globalId: 11002},
      {he: 'חסכוני', en: 'Budget Friendly', globalId: 11003},
      {he: 'מנה אחת', en: 'Single Serving', globalId: 11004},
      {he: 'לאירוח', en: 'For Entertaining', globalId: 11005},
      {he: 'מתאים לילדים', en: 'Kid Friendly', globalId: 11006},
      {he: 'בריא', en: 'Healthy', globalId: 11007},
      {he: 'קומפורט פוד', en: 'Comfort Food', globalId: 11008},
      {he: 'אוכל רחוב', en: 'Street Food', globalId: 11009},
      {he: 'גורמה', en: 'Gourmet', globalId: 11010},
    ],
  },
  {
    category: 'טעמים',
    categoryEn: 'Flavors',
    tags: [
      {he: 'מתוק', en: 'Sweet', globalId: 12001},
      {he: 'מלוח', en: 'Savory', globalId: 12002},
      {he: 'חריף', en: 'Spicy', globalId: 12003},
      {he: 'חמוץ', en: 'Sour', globalId: 12004},
      {he: 'מתוק-חמוץ', en: 'Sweet & Sour', globalId: 12005},
      {he: 'עשיר ושמנתי', en: 'Rich & Creamy', globalId: 12006},
      {he: 'קל ורענן', en: 'Light & Fresh', globalId: 12007},
      {he: 'מעושן', en: 'Smoky', globalId: 12008},
    ],
  },
  {
    category: 'עונות',
    categoryEn: 'Seasons',
    tags: [
      {he: 'קיץ', en: 'Summer', globalId: 13001},
      {he: 'חורף', en: 'Winter', globalId: 13002},
      {he: 'אביב', en: 'Spring', globalId: 13003},
      {he: 'סתיו', en: 'Fall', globalId: 13004},
      {he: 'כל השנה', en: 'All Year', globalId: 13005},
    ],
  },
  {
    category: 'סוגי מאפים',
    categoryEn: 'Baked Goods',
    tags: [
      {he: 'עוגה', en: 'Cake', globalId: 14001},
      {he: 'עוגיות', en: 'Cookies', globalId: 14002},
      {he: 'טארט', en: 'Tart', globalId: 14003},
      {he: 'פאי', en: 'Pie', globalId: 14004},
      {he: 'לחם', en: 'Bread', globalId: 14005},
      {he: 'בורקס', en: 'Burekas', globalId: 14006},
      {he: 'פיצה', en: 'Pizza', globalId: 14007},
      {he: 'קרואסון', en: 'Croissant', globalId: 14008},
      {he: 'מאפינס', en: 'Muffins', globalId: 14009},
      {he: 'דונאטס', en: 'Donuts', globalId: 14010},
      {he: 'קינוחים קרים', en: 'Cold Desserts', globalId: 14011},
    ],
  },
];

async function seedTags() {
  try {
    // התחברות למסד הנתונים
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // מחיקת אינדקסים ישנים שעלולים לגרום לבעיות
    try {
      await mongoose.connection.collection('tags').dropIndexes();
      console.log('Dropped old indexes');
    } catch (e) {
      // אינדקסים לא קיימים - זה בסדר
      console.log('No indexes to drop (this is OK)');
    }

    // מחיקת כל התגיות הקיימות
    await Tag.deleteMany({});
    console.log('Cleared existing tags');

    // הכנסת התגיות החדשות
    const result = await Tag.insertMany(tagData);
    console.log(`Successfully seeded ${result.length} tag categories`);

    // ספירת סה"כ תגיות
    const totalTags = result.reduce((sum, cat) => sum + cat.tags.length, 0);
    console.log(`Total tags: ${totalTags}`);

    // הדפסת סיכום
    console.log('\n--- Categories Summary ---');
    result.forEach(cat => {
      console.log(`  ${cat.category}: ${cat.tags.length} tags`);
    });

    // סגירת החיבור
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding tags:', error);
    process.exit(1);
  }
}

seedTags();
