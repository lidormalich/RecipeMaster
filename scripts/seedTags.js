const mongoose = require('mongoose');
const Tag = require('../models/Tag');
require('dotenv').config();

const tagData = [
  {
    category: 'זמן הכנה',
    categoryEn: 'Preparation Time',
    tags: [
      {he: 'עד 10 דקות', en: 'Up to 10 minutes', globalId: 1001},
      {he: 'עד 20 דקות', en: 'Up to 20 minutes', globalId: 1002},
      {he: 'עד 30 דקות', en: 'Up to 30 minutes', globalId: 1003},
      {he: 'עד 45 דקות', en: 'Up to 45 minutes', globalId: 1004},
      {he: 'עד שעה', en: 'Up to 1 hour', globalId: 1005},
      {he: 'עד שעתיים', en: 'Up to 2 hours', globalId: 1006},
      {he: 'מעל שעתיים', en: 'Over 2 hours', globalId: 1007},
      {he: 'הכנה מהירה', en: 'Quick prep', globalId: 1008},
      {he: 'הכנה ארוכה', en: 'Long prep', globalId: 1009},
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
      {he: 'מקצועי', en: 'Professional', globalId: 2005},
      {he: 'למתחילים', en: 'For beginners', globalId: 2006},
      {he: 'דורש ניסיון', en: 'Requires experience', globalId: 2007},
    ],
  },
  {
    category: 'סוג מנה',
    categoryEn: 'Dish Type',
    tags: [
      {he: 'מנה ראשונה', en: 'Appetizer', globalId: 3001},
      {he: 'מנה עיקרית', en: 'Main course', globalId: 3002},
      {he: 'קינוח', en: 'Dessert', globalId: 3003},
      {he: 'חטיף', en: 'Snack', globalId: 3004},
      {he: 'סלט', en: 'Salad', globalId: 3005},
      {he: 'מרק', en: 'Soup', globalId: 3006},
      {he: 'תבשיל', en: 'Stew', globalId: 3007},
      {he: 'פשטידה', en: 'Pie', globalId: 3008},
      {he: 'קיש', en: 'Quiche', globalId: 3009},
      {he: 'פיצה', en: 'Pizza', globalId: 3010},
      {he: 'המבורגר', en: 'Burger', globalId: 3011},
      {he: 'סנדוויץ׳', en: 'Sandwich', globalId: 3012},
      {he: 'פסטה', en: 'Pasta', globalId: 3013},
      {he: 'ריזוטו', en: 'Risotto', globalId: 3014},
      {he: 'אורז', en: 'Rice', globalId: 3015},
      {he: 'לחם', en: 'Bread', globalId: 3016},
      {he: 'עוגה', en: 'Cake', globalId: 3017},
      {he: 'עוגיות', en: 'Cookies', globalId: 3018},
      {he: 'מאפה', en: 'Pastry', globalId: 3019},
      {he: 'טארט', en: 'Tart', globalId: 3020},
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
      {he: 'דל פחמימות', en: 'Low carb', globalId: 4005},
      {he: 'דל שומן', en: 'Low fat', globalId: 4006},
      {he: 'דל קלוריות', en: 'Low calorie', globalId: 4007},
      {he: 'עתיר חלבון', en: 'High protein', globalId: 4008},
      {he: 'קטוגני', en: 'Keto', globalId: 4009},
      {he: 'פליאו', en: 'Paleo', globalId: 4010},
      {he: 'ללא סוכר', en: 'Sugar-free', globalId: 4011},
      {he: 'אורגני', en: 'Organic', globalId: 4012},
      {he: 'ללא חומרים מלאכותיים', en: 'No artificial', globalId: 4013},
      {he: 'ללא אגוזים', en: 'Nut-free', globalId: 4014},
      {he: 'ללא סויה', en: 'Soy-free', globalId: 4015},
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
      {he: 'איטלקי', en: 'Italian', globalId: 6001},
      {he: 'צרפתי', en: 'French', globalId: 6002},
      {he: 'ספרדי', en: 'Spanish', globalId: 6003},
      {he: 'יווני', en: 'Greek', globalId: 6004},
      {he: 'תורכי', en: 'Turkish', globalId: 6005},
      {he: 'מרוקאי', en: 'Moroccan', globalId: 6006},
      {he: 'תימני', en: 'Yemenite', globalId: 6007},
      {he: 'אתיופי', en: 'Ethiopian', globalId: 6008},
      {he: 'הודי', en: 'Indian', globalId: 6009},
      {he: 'תאילנדי', en: 'Thai', globalId: 6010},
      {he: 'סיני', en: 'Chinese', globalId: 6011},
      {he: 'יפני', en: 'Japanese', globalId: 6012},
      {he: 'קוריאני', en: 'Korean', globalId: 6013},
      {he: 'וייטנאמי', en: 'Vietnamese', globalId: 6014},
      {he: 'מקסיקני', en: 'Mexican', globalId: 6015},
      {he: 'אמריקאי', en: 'American', globalId: 6016},
      {he: 'ישראלי', en: 'Israeli', globalId: 6017},
      {he: 'ים תיכוני', en: 'Mediterranean', globalId: 6018},
      {he: 'מזרח תיכוני', en: 'Middle Eastern', globalId: 6019},
      {he: 'אסייתי', en: 'Asian', globalId: 6020},
    ],
  },
  {
    category: 'חומרי גלם',
    categoryEn: 'Ingredients',
    tags: [
      {he: 'בשר בקר', en: 'Beef', globalId: 7001},
      {he: 'עוף', en: 'Chicken', globalId: 7002},
      {he: 'הודו', en: 'Turkey', globalId: 7003},
      {he: 'כבש', en: 'Lamb', globalId: 7004},
      {he: 'דגים', en: 'Fish', globalId: 7005},
      {he: 'פירות ים', en: 'Seafood', globalId: 7006},
      {he: 'ביצים', en: 'Eggs', globalId: 7007},
      {he: 'גבינה', en: 'Cheese', globalId: 7008},
      {he: 'ירקות', en: 'Vegetables', globalId: 7009},
      {he: 'פירות', en: 'Fruits', globalId: 7010},
      {he: 'קטניות', en: 'Legumes', globalId: 7011},
      {he: 'אגוזים', en: 'Nuts', globalId: 7012},
      {he: 'פסטה', en: 'Pasta', globalId: 7013},
      {he: 'אורז', en: 'Rice', globalId: 7014},
      {he: 'תפוחי אדמה', en: 'Potatoes', globalId: 7015},
      {he: 'שוקולד', en: 'Chocolate', globalId: 7016},
    ],
  },
  {
    category: 'שיטת בישול',
    categoryEn: 'Cooking Method',
    tags: [
      {he: 'אפייה', en: 'Baking', globalId: 8001},
      {he: 'צלייה', en: 'Roasting', globalId: 8002},
      {he: 'טיגון', en: 'Frying', globalId: 8003},
      {he: 'טיגון עמוק', en: 'Deep frying', globalId: 8004},
      {he: 'בישול', en: 'Boiling', globalId: 8005},
      {he: 'אידוי', en: 'Steaming', globalId: 8006},
      {he: 'צלייה בגריל', en: 'Grilling', globalId: 8007},
      {he: 'סיר לחץ', en: 'Pressure cooker', globalId: 8008},
      {he: 'סיר איטי', en: 'Slow cooker', globalId: 8009},
      {he: 'ללא חום', en: 'No-cook', globalId: 8010},
      {he: 'ללא אפייה', en: 'No-bake', globalId: 8011},
    ],
  },
  {
    category: 'חגים',
    categoryEn: 'Holidays',
    tags: [
      {he: 'ראש השנה', en: 'Rosh Hashanah', globalId: 9001},
      {he: 'יום כיפור', en: 'Yom Kippur', globalId: 9002},
      {he: 'סוכות', en: 'Sukkot', globalId: 9003},
      {he: 'חנוכה', en: 'Hanukkah', globalId: 9004},
      {he: 'פורים', en: 'Purim', globalId: 9005},
      {he: 'פסח', en: 'Passover', globalId: 9006},
      {he: 'שבועות', en: 'Shavuot', globalId: 9007},
      {he: 'שבת', en: 'Shabbat', globalId: 9008},
    ],
  },
  {
    category: 'אירועים',
    categoryEn: 'Events',
    tags: [
      {he: 'יום הולדת', en: 'Birthday', globalId: 10001},
      {he: 'חתונה', en: 'Wedding', globalId: 10002},
      {he: 'פיקניק', en: 'Picnic', globalId: 10003},
      {he: 'ברביקיו', en: 'BBQ', globalId: 10004},
      {he: 'מסיבה', en: 'Party', globalId: 10005},
      {he: 'ארוחה משפחתית', en: 'Family dinner', globalId: 10006},
      {he: 'ארוחה רומנטית', en: 'Romantic dinner', globalId: 10007},
    ],
  },
  {
    category: 'ארוחות ביום',
    categoryEn: 'Daily Meals',
    tags: [
      {he: 'ארוחת בוקר', en: 'Breakfast', globalId: 11001},
      {he: 'בראנץ׳', en: 'Brunch', globalId: 11002},
      {he: 'ארוחת צהריים', en: 'Lunch', globalId: 11003},
      {he: 'ארוחת ערב', en: 'Dinner', globalId: 11004},
      {he: 'חטיף', en: 'Snack', globalId: 11005},
      {he: 'קינוח', en: 'Dessert', globalId: 11006},
      {he: 'משקה', en: 'Drink', globalId: 11007},
    ],
  },
  {
    category: 'טעמים',
    categoryEn: 'Flavors',
    tags: [
      {he: 'מתוק', en: 'Sweet', globalId: 12001},
      {he: 'מלוח', en: 'Salty', globalId: 12002},
      {he: 'חמוץ', en: 'Sour', globalId: 12003},
      {he: 'חריף', en: 'Spicy', globalId: 12004},
      {he: 'מתוק-חמוץ', en: 'Sweet-sour', globalId: 12005},
      {he: 'עשיר', en: 'Rich', globalId: 12006},
      {he: 'עדין', en: 'Delicate', globalId: 12007},
    ],
  },
  {
    category: 'בריאות',
    categoryEn: 'Health',
    tags: [
      {he: 'בריא', en: 'Healthy', globalId: 13001},
      {he: 'מזין', en: 'Nutritious', globalId: 13002},
      {he: 'לירידה במשקל', en: 'Weight loss', globalId: 13003},
      {he: 'אנרגטי', en: 'Energizing', globalId: 13004},
      {he: 'דטוקס', en: 'Detox', globalId: 13005},
    ],
  },
  {
    category: 'לילדים',
    categoryEn: 'For Kids',
    tags: [
      {he: 'ידידותי לילדים', en: 'Kid-friendly', globalId: 14001},
      {he: 'ארוחה לילדים', en: 'Kids meal', globalId: 14002},
      {he: 'חטיף לבית הספר', en: 'School snack', globalId: 14003},
      {he: 'כיף להכין עם ילדים', en: 'Fun to make with kids', globalId: 14004},
    ],
  },
];

async function seedTags() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to MongoDB');

    // Drop old indexes that might cause issues
    try {
      await mongoose.connection.collection('tags').dropIndexes();
      console.log('Dropped old indexes');
    } catch (e) {
      // Indexes might not exist, that's ok
    }

    // Clear existing tags
    await Tag.deleteMany({});
    console.log('Cleared existing tags');

    // Insert new tags
    const result = await Tag.insertMany(tagData);
    console.log(`Successfully seeded ${result.length} tag categories`);

    // Count total tags
    const totalTags = result.reduce((sum, cat) => sum + cat.tags.length, 0);
    console.log(`Total tags: ${totalTags}`);

    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding tags:', error);
    process.exit(1);
  }
}

seedTags();
