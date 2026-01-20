# 🛒 סל קניות + 👨‍🍳 מצב בישול - RecipeMaster

## סיכום התכונות החדשות

### 1️⃣ סל קניות (Shopping Cart)
### 2️⃣ מצב בישול (Cooking Mode)

---

## 🛒 סל הקניות

### תכונות עיקריות

#### ✅ הוספת מרכיבים מהמתכון
- כפתור "הוסף מרכיבים לסל" 🛒 בדף המתכון
- פיצול אוטומטי של המרכיבים לפי שורות
- שמירת קישור למתכון המקורי
- הודעת Toast עם מספר המרכיבים שנוספו

#### ✅ דף סל הקניות
- **ניווט**: דרך ה-Navbar (🛒) או `/cart`
- **קיבוץ לפי מתכון**: מרכיבים מאותו מתכון מקובצים יחד
- **Checkboxes**: סימון מרכיבים שכבר נקנו
- **מחיקה**: מחיקת פריט בודד או ניקוי כל הסל
- **קישורים**: חזרה למתכון המקורי מכל קבוצה

#### ✅ ממשק משתמש
- עיצוב נקי עם כרטיסיות מקובצות
- כותרות עם גרדיאנט Indigo-Purple
- רקע ירוק לפריטים מסומנים
- קו חוצה (line-through) לפריטים שנקנו
- מונה התקדמות: X מרכיבים | Y מסומנים

### API Endpoints

#### GET `/api/cart`
קבלת סל הקניות של המשתמש המחובר
```javascript
Headers: {Authorization: 'Bearer TOKEN'}
Response: {
  _id: "...",
  user: "...",
  items: [{
    _id: "...",
    ingredient: "מלח",
    recipe: "...",
    recipeTitle: "פסטה",
    shortId: "abc123"
  }]
}
```

#### POST `/api/cart/add`
הוספת מרכיבים לסל
```javascript
Body: {
  ingredients: ["מלח", "פלפל", "שמן זית"],
  recipeId: "...",
  recipeTitle: "פסטה",
  shortId: "abc123"
}
Response: {msg: "3 מרכיבים נוספו לסל הקניות", cart: {...}}
```

#### DELETE `/api/cart/:itemId`
מחיקת פריט בודד
```javascript
Response: {msg: "הפריט נמחק", cart: {...}}
```

#### DELETE `/api/cart/clear/all`
ניקוי כל הסל
```javascript
Response: {msg: "הסל נוקה", cart: {...}}
```

---

## 👨‍🍳 מצב בישול (Cooking Mode)

### תכונות עיקריות

#### ✅ כניסה למצב
- כפתור "מצב בישול" 👨‍🍳 בראש דף המתכון
- עיצוב בולט: גרדיאנט Orange → Red
- אנימציות Hover: scale-105, shadow-xl

#### ✅ תצוגת מצב בישול
**Full Screen Experience:**
- רקע כהה (Slate-900) נקי ללא הסחות דעת
- Navbar ו-Footer נעלמים אוטומטית
- גובה מלא (fixed inset-0)
- גלילה אנכית (overflow-y-auto)

**טקסטים ענקיים:**
- כותרת: text-5xl md:text-6xl עם גרדיאנט
- רכיבים: text-2xl
- הוראות: text-3xl
- ריווח מוגדל: leading-loose

**עיצוב:**
- כרטיסיות Slate-800 מעוגלות
- אייקונים גדולים (📝, 👨‍🍳)
- גופן לבן קריא על רקע כהה

#### ✅ יציאה ממצב
- כפתור X אדום גדול בפינה שמאלית עליונה
- מיקום קבוע (fixed top-6 left-6)
- hover: scale-110
- אייקון X עם strokeWidth={3}

### קוד לדוגמה

```jsx
// כפתור כניסה למצב בישול
<button
  onClick={() => setCookingMode(true)}
  className="bg-gradient-to-r from-orange-500 to-red-600..."
>
  👨‍🍳 מצב בישול
</button>

// תצוגת מצב בישול
{cookingMode && (
  <div className="fixed inset-0 z-50 bg-slate-900 text-white overflow-y-auto">
    <button onClick={() => setCookingMode(false)}>
      X
    </button>
    <div className="text-3xl">{recipe.instructions}</div>
  </div>
)}
```

---

## 📁 קבצים שנוצרו/עודכנו

### Backend:
- **routes/cart.js** - API endpoints לסל קניות
- **server.js** - הוספת route `/api/cart`

### Frontend:
- **pages/RecipeDetail.js** - כפתורים + מצב בישול
- **pages/Cart.js** - דף סל הקניות
- **App.js** - Route `/cart`
- **components/Header.js** - קישור לסל בNavbar

---

## 🎨 עיצוב וחוויית משתמש

### סל הקניות
```css
/* כותרת קבוצה */
bg-gradient-to-r from-indigo-500 to-purple-600

/* פריט רגיל */
hover:bg-gray-50

/* פריט מסומן */
bg-green-50 line-through text-gray-500

/* כפתור מחיקה */
text-red-500 hover:text-red-700 hover:bg-red-50
```

### מצב בישול
```css
/* רקע */
bg-slate-900 text-white

/* כרטיסיות */
bg-slate-800 rounded-2xl p-8

/* כותרת */
text-5xl md:text-6xl bg-gradient-to-r from-indigo-400 to-purple-500

/* טקסט */
text-3xl leading-loose
```

---

## 🔄 סנכרון נתונים

### MongoDB
כל הנתונים נשמרים ב-MongoDB:
```javascript
// Cart Model
{
  user: ObjectId,
  items: [{
    ingredient: String,
    recipe: ObjectId,
    recipeTitle: String,
    shortId: String
  }]
}
```

### גישה ממכשירים שונים
- משתמש רשום יכול לגשת לסל מכל מכשיר
- הנתונים נשמרים בענן (MongoDB)
- שימוש בטוקן JWT לאימות

---

## 💡 שימוש מומלץ

### תרחיש 1: הכנה לקניות
```
1. עבור למתכון שתרצה להכין
2. לחץ "הוסף מרכיבים לסל" 🛒
3. עבור לעוד מתכונים והוסף גם אותם
4. פתח את הסל (/cart)
5. קח את הטלפון לסופרמרקט
6. סמן פריטים שקנית תוך כדי
```

### תרחיש 2: בישול בזמן אמת
```
1. עבור למתכון
2. לחץ "מצב בישול" 👨‍🍳
3. הטלפון/מחשב הופכים למסך מתכונים ענק
4. עקוב אחרי ההוראות בטקסט גדול וקריא
5. לחץ X לסגירה
```

---

## 🚀 הרצה

### Development:
```bash
# Terminal 1 - Backend
npm start

# Terminal 2 - Frontend
cd client && npm start
```

### Production:
```bash
cd client && npm run build
npm start
```

---

## 🔐 אבטחה

- **Authentication**: JWT Token נדרש לכל פעולות הסל
- **Authorization**: כל משתמש רואה רק את הסל שלו
- **Validation**: בדיקת נתונים בצד השרת

---

## 📱 רספונסיביות

### סל הקניות
- מובייל: כרטיסיות מלאות רוחב
- טאבלט: grid-cols-1
- דסקטופ: max-w-4xl

### מצב בישול
- מובייל: text-5xl
- דסקטופ: md:text-6xl
- גלילה חלקה בכל הגדלים

---

## 🎯 תכונות עתידיות (אופציונלי)

- [ ] שיתוף רשימת קניות עם משפחה/חברים
- [ ] סנכרון עם אפליקציות סופרמרקט
- [ ] הצעות מחיר למרכיבים
- [ ] מצב קריאה קולית (Voice Mode) להוראות
- [ ] טיימר משולב במצב בישול
- [ ] הוספת תמונות צעד אחרי צעד

---

**נוצר על ידי Claude Code** 🤖
