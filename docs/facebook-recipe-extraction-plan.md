# תוכנית: חילוץ מתכון מקישור פייסבוק

מסמך תכנון מפורט לפיצ'ר "ייבוא מתכון מפייסבוק". **שלב זה: תכנון בלבד — אין קוד עדיין.**

---

## 1. רקע ותובנת המפתח

המטרה: משתמש מדביק קישור לפוסט/רील פייסבוק שמכיל מתכון בתיאור, והמערכת ממלאת אוטומטית את טופס יצירת המתכון (`RecipeForm`).

**התובנה הקריטית — פייסבוק חוסמת שליפה ישירה:**
בדיקה בפועל של הקישור לדוגמה (`https://www.facebook.com/share/r/1CyGPgP8kf/`) החזירה **`403 Forbidden`**.
- קישורי `/share/r/` הם **רילז (Reels)**; התוכן מאחורי JavaScript + חומת התחברות.
- `og:description` על רילז בדרך כלל גנרי ("צפו ברील"), לא התיאור המלא.
- ה-Graph/oEmbed API דורש אפליקציה מאומתת + App Review, ומוגבל מאוד לרילז.

**לכן:** החלק האמין והיקר הוא ה-**AI שהופך טקסט תיאור חופשי בעברית למתכון מובנה**. השליפה מפייסבוק היא best-effort עם נפילה רכה (graceful fallback) להדבקה ידנית.

---

## 2. אסטרטגיית רכישה (לפי החלטת המשתמש)

זרימת UX מוסכמת:

1. משתמש מדביק **קישור** ולוחץ "ייבא".
2. השרת מנסה שליפה אוטומטית (best-effort) של `og:image` / `og:title` / `og:description`.
3. **כישלון ראשון (403/חסום):** מחזירים שגיאה ידידותית עם כפתור **"נסה שוב"**.
4. **כישלון שני:** מציגים הודעה — *"לא הצלחנו לגשת לפוסט (ייתכן שהוא פרטי). העתק/י את תיאור הפוסט והדבק/י אותו כאן"* — וחושפים **שדה הדבקה ידני**.
5. בכל מקרה שבו יש טקסט (מ-og:description או מהדבקה) → ממשיכים לחילוץ AI.

> הערה: גם בהצלחת fetch, ה-`og:description` של רילז לרוב חלקי. לכן שדה ההדבקה תמיד זמין כ"שיפור/תיקון" ולא רק כ-fallback.

---

## 3. ארכיטקטורת הצינור (Pipeline)

```
[Frontend] משתמש: קישור (+ טקסט מודבק אופציונלי)
      │  POST /api/recipes/import-facebook  { url, pastedText? }
      ▼
[שלב A · רכישה]  fetchFacebookMeta(url)  → { ogTitle, ogDescription, ogImage }  (best-effort)
      │  אם אין טקסט (לא מ-og ולא מהדבקה) → 422 + flag לבקשת הדבקה ידנית
      ▼
[שלב B · חילוץ AI]  groqWithTracking(prompt)  → JSON מובנה לפי סכמת Recipe
      ▼
[שלב C · תיוג]  שימוש חוזר ב-generateTagsAI הקיים על התוצאה (אופציונלי בצד השרת או הלקוח)
      ▼
[Frontend] RecipeForm ממולא מראש → המשתמש מאשר/עורך → POST /api/recipes רגיל
```

עיקרון מנחה: **ה-AI ממלא טופס לאישור, לא יוצר מתכון אוטומטית.** המשתמש תמיד מתקן הזיות לפני שמירה.

---

## 4. שינויי Backend

המערכת כבר עובדת בדיוק בתבנית הנכונה (`groqWithTracking` + חילוץ JSON ב-regex, כמו ב-`generateTagsAI`). מתחברים לזה.

### 4.1 dependency חדש
- `cheerio` (פרסור HTML קליל) — לחילוץ meta tags. אין צורך ב-Puppeteer.
- שימוש ב-`fetch` המובנה של Node 18 (זמין בפרויקט) — ללא ספרייה חדשה ל-HTTP.

### 4.2 קובץ חדש: `utils/facebookFetcher.js`
פונקציה `fetchFacebookMeta(url)`:
- ולידציית URL — **חובה אבטחתית (מניעת SSRF):** לאשר רק hostים של פייסבוק (`facebook.com`, `m.facebook.com`, `fb.watch`, `*.facebook.com`). לדחות IP-ים פנימיים/כל דומיין אחר.
- ניסיון fetch עם User-Agent של בוט (`facebookexternalhit/1.1`) — לעיתים מחזיר OG tags טובים יותר.
- פרסור עם cheerio: `meta[property="og:title"|"og:description"|"og:image"]`.
- timeout (למשל 8 שניות) + טיפול ב-403/404/timeout → זריקת שגיאה מסווגת (`FB_BLOCKED` / `FB_NOT_FOUND` / `FB_TIMEOUT`) כדי שה-controller יחזיר את ה-UX הנכון (נסה שוב / הדבק ידנית).

### 4.3 קובץ חדש: `controllers/facebookImportController.js`
`exports.importFromFacebook(req, res)`:
1. קלט: `{ url, pastedText }`. ולידציה: חייב `url` תקין; `pastedText` אופציונלי.
2. אם יש `pastedText` → דלג על fetch, השתמש בו ישירות.
3. אחרת קרא ל-`fetchFacebookMeta(url)`. בכישלון → החזר קוד שגיאה מסווג (`FB_BLOCKED` וכו') כדי שהלקוח יציג "נסה שוב" / בקשת הדבקה.
4. בנה את הטקסט המקור: `pastedText || ogDescription`. אם ריק → `422 { needManualPaste: true }`.
5. קרא ל-`extractRecipeFromText(sourceText)` (פונקציית ה-AI).
6. החזר `{ recipe, image: ogImage, source: url }` (recipe = השדות המובנים).

### 4.4 פונקציית ה-AI: `extractRecipeFromText(text)`
- משתמשת ב-`groqWithTracking([{role:'user', content: prompt}], 'llama-3.3-70b-versatile', {temperature: 0.2, max_tokens: 1500}, 'import-facebook')`.
- חילוץ JSON מהתשובה ב-regex `/\{[\s\S]*\}/` (כמו `generateTagsAI`), עם try/catch.
- ולידציה/נרמול של הפלט: לוודא ש-`difficulty` ∈ {קל,בינוני,מתקדם} או null; `dishType` ∈ הרשימה המותרת או null; `prepTime`/`servings` מספרים או null. שדות חסרים → ברירת מחדל בטוחה (`""`/`null`).

### 4.5 ראוט חדש: `routes/recipes.js`
```js
// POST /api/recipes/import-facebook  — דורש auth (כמו createRecipe)
router.post('/import-facebook', auth, facebookImportController.importFromFacebook);
```
> לשים **לפני** ראוטים פרמטריים כמו `/:shortId` כדי למנוע התנגשות.

---

## 5. עיצוב הפרומט (הליבה)

עקרונות:
1. **פלט JSON קשיח בלבד** בשדות בדיוק לפי סכמת `Recipe`.
2. **איסור הזיות מוחלט** — פרט שלא מופיע בטקסט → `""`/`null`. קריטי לאמון.
3. **ניקוי רעש** — אמוג'ים, האשטגים, "תייגו חבר", "עקבו אחרינו", קישורים.
4. **הפרדת רכיבים מהוראות** גם כשהטקסט מערבב.
5. `temperature: 0.2` לעקביות.
6. **few-shot** — דוגמה אחת-שתיים מקפיצות דרמטית את הדיוק בעברית.

### הפרומט המלא (טיוטה)

```text
אתה מומחה לחילוץ מתכונים מטקסט חופשי בעברית. קיבלת תיאור של פוסט מפייסבוק
שעשוי להכיל מתכון מעורבב ברעש (אמוג'ים, האשטגים, קריאות לשיתוף/עקיבה).
חלץ ממנו את המתכון והחזר אובייקט JSON תקין בלבד.

חוקים מחייבים:
1. החזר JSON תקין בלבד — ללא טקסט לפני או אחרי.
2. אסור להמציא מידע! אם פרט (כמות, זמן, מספר מנות, רמת קושי) לא מופיע
   במפורש בטקסט — החזר "" עבור מחרוזת או null עבור מספר/ערך מוגבל.
3. ingredients: כל רכיב בשורה נפרדת (\n), כולל הכמות אם צוינה. ללא תבליטים/מספור.
4. instructions: שלבי ההכנה בלבד, מנוקים מרעש. אפשר מספור 1. 2. 3.
5. נקה אמוג'ים, האשטגים (#), קריאות כמו "תייגו"/"עקבו אחרינו"/"שתפו"/קישורים.
6. difficulty: רק אחד מ-{"קל","בינוני","מתקדם"} אם משתמע בבירור, אחרת null.
7. dishType: רק אחד מ-{"ראשונה","עיקרית","קינוח","חטיף","סלט","מרק","לחם","תוספת"}
   אם משתמע בבירור, אחרת null.
8. prepTime במספר דקות (מספר שלם) אם צוין, אחרת null. servings מספר אם צוין, אחרת null.
9. title קצר ותמציתי. description = משפט תקציר אחד (לא העתקה של כל הפוסט).

מבנה הפלט המדויק:
{"title":"","description":"","ingredients":"","instructions":"","prepTime":null,"servings":null,"difficulty":null,"dishType":null}

--- דוגמה ---
טקסט קלט:
"""
🔥🔥 עוגיות שוקולד צ'יפס הכי טובות! 🍪 חובה לנסות
תייגו חבר שחייב את זה 👇 #עוגיות #קינוחים
החומרים:
200 גרם חמאה רכה
1 כוס סוכר חום
2 ביצים
2.5 כוסות קמח
1 כפית סודה לשתייה
200 גרם שוקולד צ'יפס
אופן ההכנה:
מערבבים חמאה וסוכר עד לקבלת תערובת אוורירית. מוסיפים ביצים.
מוסיפים קמח וסודה, ולבסוף את השוקולד צ'יפס.
אופים ב-180 מעלות כ-12 דקות. בתאבון! עקבו אחרינו לעוד מתכונים 🙏
"""
פלט נכון:
{"title":"עוגיות שוקולד צ'יפס","description":"עוגיות שוקולד צ'יפס רכות וקלות להכנה","ingredients":"200 גרם חמאה רכה\n1 כוס סוכר חום\n2 ביצים\n2.5 כוסות קמח\n1 כפית סודה לשתייה\n200 גרם שוקולד צ'יפס","instructions":"1. מערבבים חמאה וסוכר עד לתערובת אוורירית ומוסיפים ביצים.\n2. מוסיפים קמח וסודה לשתייה, ולבסוף את השוקולד צ'יפס.\n3. אופים ב-180 מעלות כ-12 דקות.","prepTime":12,"servings":null,"difficulty":"קל","dishType":"קינוח"}
--- סוף דוגמה ---

עכשיו חלץ מהטקסט הבא:
"""
<sourceText>
"""
```

> אופציה לשדרוג: אם Groq תומך ב-`response_format: { type: "json_object" }` עבור llama-3.3 — להוסיף ל-`options` ולחסוך את ה-regex. לבדוק תאימות; אם לא — נשארים בתבנית ה-regex הקיימת שכבר עובדת בפרויקט.

---

## 6. מיפוי לסכמת Recipe

| שדה AI | שדה במודל `Recipe` | הערה |
|--------|--------------------|------|
| title | title | required — חובה לפני שמירה |
| description | description | required |
| ingredients | ingredients | טקסט, שורה לכל רכיב (תואם לסכמה הקיימת) |
| instructions | instructions | required |
| prepTime | prepTime | Number/null |
| servings | servings | Number/null |
| difficulty | difficulty | enum: קל/בינוני/מתקדם |
| dishType | dishType | enum קיים |
| ogImage | mainImage | ראה §8 — לא במסגרת ה-MVP |
| — | tags | דרך `generateTagsAI` הקיים |
| url | (חדש?) sourceUrl | ראה §9 |

---

## 7. שינויי Frontend

### 7.1 קומפוננטה חדשה: `client/src/components/FacebookImportModal.js`
- שדה קלט לקישור + כפתור "ייבא".
- מצב טעינה בזמן הקריאה ל-API.
- טיפול בשגיאות לפי הקודים מהשרת:
  - `FB_BLOCKED` (פעם ראשונה) → הודעה + כפתור **"נסה שוב"**.
  - כישלון שני / `needManualPaste` → הודעה *"ייתכן שהפוסט פרטי — הדבק/י את תיאור הפוסט"* + textarea הדבקה + כפתור "חלץ מהטקסט".
- בהצלחה → סוגר ומעביר את ה-recipe המחולץ ל-`RecipeForm` (pre-fill).

### 7.2 שילוב ב-`pages/CreateRecipe.js`
- כפתור חדש "📋 ייבוא מפייסבוק" שפותח את המודאל.
- ה-state של `RecipeForm` יקבל ערכים התחלתיים מהמודאל (כבר תומך בעריכה → קל להזרים initialValues).
- אחרי pre-fill, ניתן להפעיל את `generateTagsAI` הקיים אוטומטית (כמו בזרימה הרגילה).

### 7.3 לוגיקת "נסה שוב"
- הלקוח שומר מונה ניסיונות. ניסיון 1 כושל → "נסה שוב". ניסיון 2 כושל → מעבר אוטומטי למצב הדבקה ידנית.

---

## 8. טיפול בתמונה (מחוץ ל-MVP)

- `og:image` של פייסבוק הוא בד"כ URL זמני/חתום שעלול לפוג. הורדה והעלאה ל-Cloudinary (כמו `/api/upload` הקיים) אפשרית אך מוסיפה נקודת כשל.
- **החלטה ל-MVP:** לא נכלל. נחזיר את `ogImage` ללקוח כ"הצעה" בלבד; המשתמש יוכל להעלות תמונה ידנית כרגיל. אפשר להוסיף בשלב 2.

---

## 9. שדה מקור (אופציונלי, מומלץ)

הוספת שדה `sourceUrl: String` ל-`models/Recipe.js` כדי לשמור קרדיט/מקור הייבוא. לא חובה ל-MVP אך זול וערכי (שקיפות + מניעת ייבוא כפול בעתיד).

---

## 10. אבטחה, מגבלות ושיקולים

- **SSRF:** הראוט מבצע fetch לכתובת מהמשתמש. **חובה** allow-list לדומייני פייסבוק בלבד + חסימת IP פנימיים. זו נקודת האבטחה הקריטית ביותר בפיצ'ר.
- **מגבלות Groq (free tier):** 30 RPM, 15K TPM. הפרומט עם few-shot ~600-800 טוקנים + טקסט הפוסט. בטווח. החילוץ נספר אוטומטית דרך `groqWithTracking` (endpoint: `import-facebook`) ויופיע בלוח ה-usage הקיים.
- **rate limiting:** לשקול הגבלה פר-משתמש על הראוט (מניעת abuse של fetch חיצוני).
- **תאימות ToS:** גישת best-effort + הדבקה ידנית נמנעת מ-scraping אגרסיבי. אין login/cookies של פייסבוק.

---

## 11. בדיקות

- אין כיום תשתית בדיקות בצד שרת. מומלץ להוסיף **Jest + Supertest** (קל) עבור:
  - `extractRecipeFromText` עם 3-4 דוגמאות טקסט אמיתיות (כולל מקרה קצה: טקסט ללא מתכון → שדות ריקים, לא הזיה).
  - ולידציית ה-allow-list של ה-URL (דחיית דומיין זר / IP פנימי).
  - `fetchFacebookMeta` עם mock של תגובת HTML (403, 200 עם/בלי og tags).
- בדיקה ידנית מקצה-לקצה עם הקישור לדוגמה (יפול ל-403 → מסלול הדבקה ידנית).

---

## 12. רשימת קבצים לשינוי/יצירה

**חדשים:**
- `utils/facebookFetcher.js` — fetch + פרסור og (cheerio) + allow-list.
- `controllers/facebookImportController.js` — orchestration + פונקציית `extractRecipeFromText` + הפרומט.
- `client/src/components/FacebookImportModal.js` — UI הייבוא + לוגיקת retry/paste.
- (אופציונלי) קבצי בדיקות תחת `__tests__/`.

**שינויים:**
- `routes/recipes.js` — ראוט `POST /api/recipes/import-facebook`.
- `client/src/pages/CreateRecipe.js` — כפתור + שילוב המודאל + pre-fill.
- `package.json` — הוספת `cheerio` (+ jest/supertest אם בוחרים בדיקות).
- (אופציונלי) `models/Recipe.js` — שדה `sourceUrl`.

---

## 13. הצעת פיצול לשלבים

- **שלב 1 (MVP):** ראוט + פרומט + חילוץ AI + מודאל עם retry/הדבקה ידנית + pre-fill לטופס + תיוג אוטומטי קיים. ← לב הפיצ'ר.
- **שלב 2:** משיכת `og:image` והעלאה ל-Cloudinary + שדה `sourceUrl`.
- **שלב 3:** הרחבת מקורות (אינסטגרם/אתרי מתכונים עם JSON-LD) באמצעות אותה פונקציית חילוץ AI.

---

## 14. שאלות פתוחות לפני מימוש

1. להוסיף תשתית בדיקות (Jest/Supertest) או להסתפק בבדיקה ידנית ל-MVP?
2. להוסיף `sourceUrl` למודל כבר עכשיו?
3. response_format JSON של Groq — לבדוק תאימות ל-llama-3.3 או להישאר עם regex?
