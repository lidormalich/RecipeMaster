const cheerio = require('cheerio');

// רשימת היתר (allow-list) לדומייני פייסבוק בלבד - מניעת SSRF.
// השרת מבצע fetch לכתובת שמגיעה מהמשתמש, ולכן חובה להגביל ליעדים מותרים.
const ALLOWED_HOSTS = [
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'web.facebook.com',
  'mbasic.facebook.com',
  'fb.watch',
  'fb.com',
];

// בדיקה שהכתובת היא קישור פייסבוק תקין ומותר
function isAllowedFacebookUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (e) {
    return false;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return false;
  }
  const host = parsed.hostname.toLowerCase();
  return ALLOWED_HOSTS.includes(host) || host.endsWith('.facebook.com');
}

// שגיאה מסווגת כדי שה-controller ידע איזו חוויה להחזיר ללקוח
function fbError(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

// שליפת מטא-תגיות Open Graph מפוסט פייסבוק (best-effort).
// מחזיר { ogTitle, ogDescription, ogImage }. זורק שגיאה מסווגת בכישלון.
async function fetchFacebookMeta(rawUrl) {
  if (!isAllowedFacebookUrl(rawUrl)) {
    throw fbError('הקישור אינו קישור פייסבוק תקין', 'FB_INVALID_URL');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let response;
  try {
    response = await fetch(rawUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        // User-Agent של בוט פייסבוק - לעיתים מחזיר OG tags טובים יותר
        'User-Agent':
          'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
      },
    });
  } catch (e) {
    if (e.name === 'AbortError') {
      throw fbError('הבקשה לפייסבוק נתקעה (timeout)', 'FB_TIMEOUT');
    }
    throw fbError('לא הצלחנו להגיע לפייסבוק', 'FB_FETCH_FAILED');
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 403 || response.status === 401) {
    throw fbError('פייסבוק חסמה את הבקשה', 'FB_BLOCKED');
  }
  if (response.status === 404) {
    throw fbError('הפוסט לא נמצא', 'FB_NOT_FOUND');
  }
  if (!response.ok) {
    throw fbError(`פייסבוק החזירה סטטוס ${response.status}`, 'FB_FETCH_FAILED');
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const meta = name =>
    $(`meta[property="${name}"]`).attr('content') ||
    $(`meta[name="${name}"]`).attr('content') ||
    '';

  return {
    ogTitle: meta('og:title'),
    ogDescription: meta('og:description'),
    ogImage: meta('og:image'),
  };
}

module.exports = {fetchFacebookMeta, isAllowedFacebookUrl};
