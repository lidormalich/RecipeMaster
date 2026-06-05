const {groqWithTracking} = require('./groqController');
const {
  fetchFacebookMeta,
  isAllowedFacebookUrl,
} = require('../utils/facebookFetcher');

// ערכים חוקיים לפי סכמת Recipe (enum) - חובה ליישר אליהם כדי ששמירה לא תיכשל
const DIFFICULTIES = ['קל', 'בינוני', 'מתקדם'];
const DISH_TYPES = ['ראשונה', 'עיקרית', 'קינוח', 'חטיף'];

// בניית הפרומט לחילוץ מתכון מטקסט חופשי של פוסט פייסבוק
function buildExtractionPrompt(sourceText) {
  return `אתה מומחה לחילוץ מתכונים מטקסט חופשי בעברית. קיבלת תיאור של פוסט מפייסבוק
שעשוי להכיל מתכון מעורבב ברעש (אמוג'ים, האשטגים, קריאות לשיתוף/עקיבה).
חלץ ממנו את המתכון והחזר אובייקט JSON תקין בלבד.

חוקים מחייבים:
1. החזר JSON תקין בלבד - ללא טקסט לפני או אחרי.
2. אסור להמציא מידע! אם פרט (כמות, זמן, מספר מנות, רמת קושי) לא מופיע במפורש
   בטקסט - החזר "" עבור מחרוזת או null עבור מספר/ערך מוגבל.
3. ingredients: כל רכיב בשורה נפרדת (\\n), כולל הכמות אם צוינה. ללא תבליטים/מספור.
4. instructions: שלבי ההכנה בלבד, מנוקים מרעש. אפשר מספור 1. 2. 3.
5. נקה אמוג'ים, האשטגים (#), קריאות כמו "תייגו"/"עקבו אחרינו"/"שתפו"/קישורים.
6. title קצר ותמציתי. description = משפט תקציר אחד (לא העתקה של כל הפוסט).

החזר JSON במבנה המדויק הבא (אלה השדות שהמערכת שומרת - אל תשנה שמות מפתחות):
{"title":"","description":"","ingredients":"","instructions":"","prepTime":null,"servings":null,"difficulty":null,"dishType":null}

מקרא השדות (מה כל שדה מכיל):
- title (string): שם המתכון, קצר ותמציתי.
- description (string): משפט תקציר אחד של המתכון.
- ingredients (string): רשימת רכיבים, רכיב בכל שורה (\\n), כולל כמות אם צוינה.
- instructions (string): שלבי ההכנה בלבד, מנוקים מרעש.
- prepTime (number|null): זמן הכנה בדקות (מספר שלם), null אם לא צוין.
- servings (number|null): מספר מנות, null אם לא צוין.
- difficulty (string|null): "קל" | "בינוני" | "מתקדם", אחרת null.
- dishType (string|null): "ראשונה" | "עיקרית" | "קינוח" | "חטיף", אחרת null.

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
{"title":"עוגיות שוקולד צ'יפס","description":"עוגיות שוקולד צ'יפס רכות וקלות להכנה","ingredients":"200 גרם חמאה רכה\\n1 כוס סוכר חום\\n2 ביצים\\n2.5 כוסות קמח\\n1 כפית סודה לשתייה\\n200 גרם שוקולד צ'יפס","instructions":"1. מערבבים חמאה וסוכר עד לתערובת אוורירית ומוסיפים ביצים.\\n2. מוסיפים קמח וסודה לשתייה, ולבסוף את השוקולד צ'יפס.\\n3. אופים ב-180 מעלות כ-12 דקות.","prepTime":12,"servings":null,"difficulty":"קל","dishType":"קינוח"}
--- סוף דוגמה ---

עכשיו חלץ מהטקסט הבא:
"""
${sourceText}
"""`;
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

// נרמול ואימות הפלט של ה-AI לפי הסכמה (מונע ערכים לא חוקיים והזיות)
function normalizeRecipe(raw) {
  return {
    title: cleanString(raw.title),
    description: cleanString(raw.description),
    ingredients: cleanString(raw.ingredients),
    instructions: cleanString(raw.instructions),
    prepTime: cleanNumber(raw.prepTime),
    servings: cleanNumber(raw.servings),
    difficulty: DIFFICULTIES.includes(raw.difficulty) ? raw.difficulty : '',
    dishType: DISH_TYPES.includes(raw.dishType) ? raw.dishType : '',
  };
}

// חילוץ מתכון מובנה מטקסט חופשי באמצעות Groq
async function extractRecipeFromText(text) {
  const completion = await groqWithTracking(
    [{role: 'user', content: buildExtractionPrompt(text)}],
    'llama-3.3-70b-versatile',
    {temperature: 0.2, max_tokens: 1500},
    'import-facebook',
  );

  const responseText = completion.choices[0]?.message?.content || '';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('לא נמצא JSON תקין בתשובת ה-AI');
  }
  const parsed = JSON.parse(jsonMatch[0]);
  return normalizeRecipe(parsed);
}

// POST /api/recipes/import-facebook
// קלט: { url, pastedText? } - מנסה שליפה אוטומטית, ובכישלון מבקש הדבקה ידנית
exports.importFromFacebook = async (req, res) => {
  try {
    const {url, pastedText} = req.body;

    if (!url || typeof url !== 'string') {
      return res
        .status(400)
        .json({message: 'יש לספק קישור פייסבוק', code: 'MISSING_URL'});
    }
    if (!isAllowedFacebookUrl(url)) {
      return res.status(400).json({
        message: 'הקישור אינו קישור פייסבוק תקין',
        code: 'FB_INVALID_URL',
      });
    }

    let sourceText = typeof pastedText === 'string' ? pastedText.trim() : '';
    let ogImage = '';

    // אם המשתמש לא הדביק טקסט - מנסים שליפה אוטומטית (best-effort)
    if (!sourceText) {
      let meta;
      try {
        meta = await fetchFacebookMeta(url);
      } catch (e) {
        // כל כישלון שליפה -> הלקוח יחליט "נסה שוב" / מעבר להדבקה ידנית
        return res.status(502).json({
          message: e.message || 'לא הצלחנו לגשת לפוסט בפייסבוק',
          code: e.code || 'FB_FETCH_FAILED',
          needManualPaste: true,
        });
      }

      ogImage = meta.ogImage || '';
      sourceText = [meta.ogTitle, meta.ogDescription]
        .filter(Boolean)
        .join('\n')
        .trim();

      // ברילז ה-og:description לרוב גנרי/ריק - מבקשים הדבקה ידנית
      if (!sourceText || sourceText.length < 25) {
        return res.status(422).json({
          message:
            'לא נמצא תוכן מתכון בפוסט. ייתכן שהוא פרטי - הדבק/י את תיאור הפוסט ידנית',
          code: 'FB_NO_CONTENT',
          needManualPaste: true,
        });
      }
    }

    const recipe = await extractRecipeFromText(sourceText);

    // ווידוא שיצא מתכון אמיתי ולא תוצאה ריקה
    if (!recipe.title && !recipe.ingredients) {
      return res.status(422).json({
        message:
          'לא הצלחנו לחלץ מתכון מהטקסט. נסה/י להדביק תיאור מלא יותר של הפוסט',
        code: 'NO_RECIPE_FOUND',
        needManualPaste: true,
      });
    }

    res.json({recipe, image: ogImage, sourceUrl: url});
  } catch (err) {
    console.error('Facebook import error:', err.message);
    res
      .status(500)
      .json({message: 'שגיאה בייבוא המתכון מפייסבוק', code: 'SERVER_ERROR'});
  }
};

module.exports.extractRecipeFromText = extractRecipeFromText;
