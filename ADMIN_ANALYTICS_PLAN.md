# 📊 תוכנית: Logger, אנליטיקה, Audit Log ופיצ'רים מתקדמים לאדמין

מסמך תכנון לפיצ'ר מערכת ניטור ואנליטיקה ל-RecipeMaster.
**ענף פיתוח:** `claude/admin-logging-analytics-xRjYF`

> מטרה: לתת לאדמין תמונה מלאה על מי משתמש באתר, איך, כמה ומתי — כולל
> כלי ניהול חסרים ופיצ'רים "מחרמנים" שמייצרים תחושת חיות ומעורבות.

---

## 🎯 עקרונות מנחים

1. **לחקות דפוסים קיימים** — נשען על התשתית של `GroqUsage` + `GroqDashboard`
   שכבר עובדת מצוין (mongoose aggregations, `auth` + `checkRole(['Admin'])`,
   עמוד React שמושך מ-API). לא ממציאים סטאק חדש.
2. **תיעוד לא-חוסם (fire-and-forget)** — כמו `trackUsage`, כל קריאת לוג
   עטופה ב-`try/catch` ולעולם לא מפילה או מאטה את הבקשה של המשתמש.
3. **פרטיות** — שומרים IP מקוצר/האש לצורך גיאו-לוקיישן בלבד, לא חושפים
   סיסמאות/טוקנים. תיעוד פעולות רגישות נשמר ל-Audit נפרד.
4. **תאימות לאחור** — שדות חדשים ב-`User` הם אופציונליים עם defaults.

---

## 🧱 שלב 1 — תשתית Logger + מעקב התחברויות

### 1.1 מודל חדש: `models/ActivityLog.js`
אירוע בודד לכל פעולה משמעותית באתר.

```js
{
  user:      ObjectId(ref 'User'),   // null = אורח
  userName:  String,                 // snapshot לשמירה גם אחרי מחיקת משתמש
  action:    String,                 // enum (ראה למטה)
  targetType:String,                 // 'recipe' | 'user' | 'tag' | null
  targetId:  String,                 // shortId / id של היעד
  metadata:  Mixed,                  // { query, recipeTitle, ... }
  ip:        String,                 // נשמר מקוצר (3 אוקטטים) לפרטיות
  country:   String,                 // נגזר מ-IP (אם זמין)
  userAgent: String,
  createdAt: Date (default now, index)
}
```

**ערכי `action` (enum):**
`login`, `logout`, `register`, `login_failed`, `recipe_view`, `recipe_create`,
`recipe_update`, `recipe_delete`, `favorite_add`, `favorite_remove`,
`cart_add`, `search`, `ai_use`, `share`.

**Indexes:** `{createdAt:-1}`, `{action:1, createdAt:-1}`, `{user:1, createdAt:-1}`.

**Static methods** (בסגנון `GroqUsage`):
- `getOverview(from, to)` — ספירות מצרפיות (DAU/WAU/MAU, סה"כ אירועים).
- `getTimeSeries(action, from, to, granularity)` — סדרה יומית לגרפים.
- `getTopRecipes(from, to, limit)` — מתכונים לפי `recipe_view`.
- `getTopSearches(from, to, limit)` — שאילתות חיפוש פופולריות.
- `getActivityHeatmap(from, to)` — ספירה לפי שעה×יום-בשבוע.
- `getRecentActivity(limit)` — פיד פעילות אחרון.

### 1.2 Helper: `utils/logActivity.js`
```js
logActivity({ req, user, action, targetType, targetId, metadata })
```
- מחלץ IP מ-`req` (כולל `x-forwarded-for` כי רץ מאחורי Render proxy),
  מקצר אותו ושומר `userAgent`.
- `await` עטוף ב-`try/catch` שלא זורק — fire-and-forget.
- גיאו-לוקיישן: שימוש ב-`geoip-lite` (תלות קלה, offline) לשדה `country`.

### 1.3 הרחבת `models/User.js`
שדות חדשים (אופציונליים):
```js
lastLogin:      Date,
loginCount:     { type: Number, default: 0 },
lastActiveAt:   Date,
registrationIp: String,
badges:         [String],   // לגיימיפיקציה (שלב 4)
```

### 1.4 נקודות תיעוד (היכן קוראים ל-`logActivity`)
| קובץ | פעולה | אירוע |
|------|-------|-------|
| `controllers/authController.js` | `login` הצלחה | `login` + עדכון `lastLogin`/`loginCount` |
| | `login` כשל | `login_failed` |
| | `register` | `register` + `registrationIp` |
| | `googleAuthCallback` | `login` (google) |
| `controllers/recipeController.js` | צפייה במתכון בודד | `recipe_view` |
| | יצירה/עדכון/מחיקה | `recipe_create/update/delete` |
| | חיפוש (אם query) | `search` |
| `controllers/authController.js` | מועדפים | `favorite_add/remove` |
| `controllers/groqController.js` | קריאת AI | `ai_use` (מלבד ה-tracking הקיים) |

`lastActiveAt` יתעדכן ב-middleware `auth` (זול — update ללא await על כל בקשה מאומתת,
עם throttle של ~5 דק' כדי לא להעמיס).

---

## 📈 שלב 2 — דשבורד אנליטיקה לאדמין

### 2.1 Backend
- **`controllers/analyticsController.js`** — מאגד את ה-statics של `ActivityLog`
  + ספירות מ-`User`/`Recipe`. מחזיר JSON אחד עשיר (כמו `getUsage`).
- **`routes/analytics.js`** — `GET /api/analytics/overview` (+ פרמטרי טווח תאריכים),
  הכל `auth` + `checkRole(['Admin'])`.
- רישום ב-`server.js`: `app.use('/api/analytics', require('./routes/analytics'))`.

**מבנה תשובה:**
```js
{
  kpis: { totalUsers, newUsers, dau, wau, mau, totalRecipes, totalViews },
  registrationsByDay: [...],
  loginsByDay: [...],
  topRecipes: [...],
  topAuthors: [...],
  topSearches: [...],
  recentActivity: [...],
  usersByCountry: [...],
}
```

### 2.2 Frontend: `client/src/pages/AdminAnalytics.js`
- חיקוי מבנה `GroqDashboard.js` (בדיקת `user.role==='Admin'`, `fetchOverview`,
  loading/error states, RTL, Tailwind).
- **כרטיסי KPI** עם מונים מונפשים.
- **גרפים** — נשתמש ב-`recharts` (קל, פופולרי) לקווי הרשמות/התחברויות.
- **טבלאות**: מתכונים מובילים, יוצרים מובילים, חיפושים נפוצים.
- **פיד פעילות אחרונה** מתעדכן.
- בורר טווח תאריכים (היום / 7 ימים / 30 יום / מותאם).

### 2.3 עדכוני ניווט
- `App.js`: route חדש `/admin/analytics`.
- `Header.js`: פריט בתפריט הניהול (📊 דשבורד אנליטיקה) — `isAdmin` בלבד.
- שינוי שם הקיים ל"ניטור AI (Groq)" כדי להבחין בין השניים.

### 2.4 עדכון עמוד ניהול משתמשים
- הוספת עמודות `lastLogin`, `loginCount`, מס' מתכונים — ב-`ManageUsers.js`
  ו-`adminController.getAllUsers` (כבר מחזיר users, נוסיף aggregation קל).

---

## 🛡️ שלב 3 — Audit Log לפעולות אדמין

### 3.1 מודל `models/AuditLog.js`
```js
{
  admin:      ObjectId(ref 'User'),
  adminName:  String,
  action:     String,   // 'role_change' | 'suspend' | 'unsuspend' |
                        // 'reset_password' | 'delete_user' | 'feature_recipe' ...
  targetUser: ObjectId(ref 'User'),
  targetName: String,
  details:    Mixed,    // { from:'User', to:'Admin' } וכו'
  ip:         String,
  createdAt:  Date (index)
}
```
> לעולם לא שומר סיסמאות — ב-`reset_password` נשמר רק שהפעולה בוצעה.

### 3.2 שילוב ב-`adminController.js`
כל אחת מהפעולות (`updateUserRole`, `suspendUser`, `resetPassword`,
`deleteUser`) תיצור רשומת `AuditLog` אחרי הצלחה.

### 3.3 צפייה
- `GET /api/admin/audit-log` (Admin בלבד) — עם pagination.
- טאב/אזור בדשבורד האנליטיקה: "יומן פעולות מנהלים" עם פילטר לפי אדמין/פעולה.

---

## 🔥 שלב 4 — פיצ'רים מחרמנים

נבנים מעל אותו `ActivityLog`. מוצע לפי סדר value/effort:

### 4.1 🟢 "מי מחובר עכשיו" (Live)
- חישוב משתמשים עם `lastActiveAt` ב-15 הדקות האחרונות.
- כרטיס בדשבורד עם נקודה ירוקה פועמת + רשימת שמות, polling כל 30ש'.

### 4.2 🔥 Trending עכשיו
- מתכונים עם הכי הרבה `recipe_view` בשעה האחרונה מול הממוצע — "מתחממים".
- תג 🔥 בכרטיס הדשבורד.

### 4.3 🏆 Hall of Fame / Leaderboard
- שלושה דירוגים: הכי הרבה מתכונים, הכי הרבה לבבות שנצברו, הכי פעיל.
- מבוסס aggregation על `Recipe.ratings`/`favorites` + `ActivityLog`.

### 4.4 🌡️ Heatmap פעילות
- רשת שעה×יום-בשבוע (`getActivityHeatmap`) — מראה מתי האתר הכי חי.
- רינדור כ-grid צבעוני ב-Tailwind (ללא ספרייה).

### 4.5 🗺️ מפת משתמשים גיאוגרפית
- `usersByCountry` מ-`geoip-lite` — תצוגת טבלה/רשימה עם דגלים תחילה
  (מפה אינטראקטיבית כ-nice-to-have בהמשך).

### 4.6 🎮 גיימיפיקציה — Badges
- תגי הישגים אוטומטיים (`User.badges`): "🥇 10 מתכונים", "❤️ 100 לבבות",
  "🔥 רצף התחברות". מחושבים על אירועי `ActivityLog`.
- מוצגים בפרופיל המשתמש + עמודה בדשבורד.

### 4.7 🎉 פוליש
- מונים מונפשים (count-up) ו-confetti במעבר אבני-דרך (למשל משתמש מס' 1000).

---

## 📁 סיכום קבצים

**חדשים:**
- `models/ActivityLog.js`
- `models/AuditLog.js`
- `utils/logActivity.js`
- `controllers/analyticsController.js`
- `routes/analytics.js`
- `client/src/pages/AdminAnalytics.js`
- `client/src/components/admin/` (כרטיסי KPI, Heatmap, Leaderboard, LiveNow)

**שינויים:**
- `models/User.js` — שדות חדשים
- `controllers/authController.js` — תיעוד login/register/favorites
- `controllers/recipeController.js` — תיעוד views/create/search
- `controllers/adminController.js` — Audit log + סטטיסטיקות משתמש
- `middleware/auth.js` — עדכון `lastActiveAt` (throttled)
- `routes/admin.js` — endpoint ל-audit log
- `server.js` — רישום route אנליטיקה
- `client/src/App.js` — route חדש
- `client/src/components/Header.js` — פריט תפריט
- `client/src/pages/ManageUsers.js` — עמודות חדשות
- `package.json` — תלויות: `geoip-lite`, `recharts`

---

## 🔐 שיקולי אבטחה ופרטיות
- כל ה-endpoints מאחורי `auth` + `checkRole(['Admin'])`.
- IP נשמר מקוצר; אין שמירת סיסמאות/טוקנים בלוגים.
- `login_failed` לא חושף אם המייל קיים (רק לסטטיסטיקה פנימית).
- אופציונלי: TTL index על `ActivityLog` (למשל מחיקה אוטומטית אחרי 6 חודשים)
  כדי לשמור על גודל DB סביר.

---

## 🚦 סדר ביצוע מוצע
1. שלב 1 (Logger + User fields) — הבסיס לכל השאר.
2. שלב 2 (Dashboard + Analytics API).
3. שלב 3 (Audit Log).
4. שלב 4 (פיצ'רים מחרמנים) — אינקרמנטלי, אחד-אחד.

כל שלב = commit נפרד וברור. push ל-`claude/admin-logging-analytics-xRjYF`.
