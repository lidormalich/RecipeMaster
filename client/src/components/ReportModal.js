import React, {useState} from 'react';
import axios from 'axios';
import {toast} from 'react-toastify';

const REASONS = [
  'תוכן פוגעני או לא הולם',
  'ספאם או פרסומת',
  'תוכן מועתק / הפרת זכויות יוצרים',
  'מידע שגוי או מסוכן',
  'אחר',
];

// Lets a logged-in user flag a recipe for admin review.
const ReportModal = ({isOpen, onClose, recipe}) => {
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !recipe) return null;

  const submit = async () => {
    setSubmitting(true);
    try {
      const fullReason = details.trim()
        ? `${reason} — ${details.trim()}`
        : reason;
      const res = await axios.post('/api/reports', {
        targetId: recipe.shortId,
        reason: fullReason,
      });
      toast.success(res.data?.message || 'הדיווח נשלח. תודה!');
      onClose();
      setDetails('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'שגיאה בשליחת הדיווח');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-red-600 p-5 text-white flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            🚩 דיווח על מתכון
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            מדווח על: <span className="font-semibold">{recipe.title}</span>
          </p>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              סיבת הדיווח
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
              {REASONS.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              פירוט (אופציונלי)
            </label>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              rows={3}
              maxLength={400}
              placeholder="ספר לנו עוד..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={submit}
              disabled={submitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium disabled:bg-red-300">
              {submitting ? 'שולח...' : 'שלח דיווח'}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
