import React, {useState} from 'react';
import axios from 'axios';
import {toast} from 'react-toastify';

// מודאל לייבוא מתכון מקישור פייסבוק.
// זרימה: ניסיון שליפה אוטומטי -> בכישלון ראשון "נסה שוב" -> בכישלון שני הדבקה ידנית.
const FacebookImportModal = ({isOpen, onClose, onImport}) => {
  const [url, setUrl] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [mode, setMode] = useState('link'); // 'link' | 'paste'
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const resetAndClose = () => {
    setUrl('');
    setPastedText('');
    setMode('link');
    setAttempts(0);
    setError('');
    setLoading(false);
    onClose();
  };

  // ייצור תגיות אוטומטי על המתכון המחולץ (שימוש חוזר במנוע הקיים)
  const generateTags = async (recipe, token) => {
    if (!recipe.title || !recipe.ingredients) return [];
    try {
      const res = await axios.post(
        '/api/tags/generate-ai',
        {
          title: recipe.title,
          description: recipe.description,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
        },
        {headers: {Authorization: `Bearer ${token}`}},
      );
      const {suggestedTags} = res.data;
      return (suggestedTags || [])
        .map(t => Number(t.globalId))
        .filter(id => Number.isFinite(id) && id > 0);
    } catch (e) {
      console.error('Tag generation failed during import:', e);
      return [];
    }
  };

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError('יש להזין קישור פייסבוק');
      return;
    }
    if (mode === 'paste' && !pastedText.trim()) {
      setError('יש להדביק את תיאור הפוסט');
      return;
    }

    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    const body =
      mode === 'paste' ? {url: url.trim(), pastedText} : {url: url.trim()};

    try {
      const res = await axios.post('/api/recipes/import-facebook', body, {
        headers: {Authorization: `Bearer ${token}`},
      });

      const {recipe, sourceUrl} = res.data;
      const tags = await generateTags(recipe, token);

      onImport({...recipe, tags, sourceUrl});
      toast.success('המתכון יובא בהצלחה! בדקו ועדכנו לפי הצורך ✅');
      resetAndClose();
    } catch (err) {
      const data = err.response?.data;
      setLoading(false);

      if (mode === 'paste') {
        setError(data?.message || 'לא הצלחנו לחלץ מתכון מהטקסט. נסו תיאור מלא יותר');
        return;
      }

      const next = attempts + 1;
      setAttempts(next);

      // כישלון שני (או שאין תוכן בפוסט) -> מעבר להדבקה ידנית
      if (next >= 2 || data?.code === 'FB_NO_CONTENT') {
        setMode('paste');
        setError(
          'לא הצלחנו לגשת לפוסט (ייתכן שהוא פרטי). פתחו את הפוסט בפייסבוק, העתיקו את תיאור המתכון והדביקו כאן.',
        );
      } else {
        setError(
          (data?.message || 'לא הצלחנו לגשת לפוסט') + ' — נסו שוב.',
        );
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={resetAndClose}>
      <div
        dir="rtl"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        {/* כותרת */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            📋 ייבוא מתכון מפייסבוק
          </h2>
          <button
            type="button"
            onClick={resetAndClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>

        {/* שדה קישור */}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          קישור לפוסט
        </label>
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://www.facebook.com/share/..."
          className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-3"
        />

        {/* שדה הדבקה ידנית - מופיע אחרי כישלון */}
        {mode === 'paste' && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              תיאור הפוסט (הדבקה ידנית)
            </label>
            <textarea
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              rows="6"
              placeholder="הדביקו כאן את הטקסט של תיאור הפוסט מפייסבוק..."
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        )}

        {/* הודעת שגיאה / הנחיה */}
        {error && (
          <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            {error}
          </div>
        )}

        {/* כפתורי פעולה */}
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading
              ? 'מחלץ מתכון...'
              : mode === 'paste'
                ? 'חלץ מהטקסט'
                : attempts > 0
                  ? 'נסה שוב'
                  : 'ייבא מתכון'}
          </button>
          <button
            type="button"
            onClick={resetAndClose}
            disabled={loading}
            className="py-3 px-5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50">
            ביטול
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          הערה: רוב הרילז והפוסטים הפרטיים חסומים לשליפה אוטומטית. במקרה כזה
          פשוט הדביקו את תיאור הפוסט וה-AI יחלץ את המתכון.
        </p>
      </div>
    </div>
  );
};

export default FacebookImportModal;
