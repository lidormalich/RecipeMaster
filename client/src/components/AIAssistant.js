import React, {useState} from 'react';
import axios from 'axios';
import {toast} from 'react-toastify';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    prepTime: '',
    dishType: '',
    difficulty: '',
  });
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const prepTimeOptions = [
    {value: '15', label: 'מהיר (עד 15 דקות)'},
    {value: '30', label: 'בינוני (15-30 דקות)'},
    {value: '60', label: 'ארוך (30-60 דקות)'},
    {value: '120', label: 'מאוד ארוך (יותר משעה)'},
  ];

  const dishTypeOptions = [
    {value: 'ראשונה', label: '🥗 ראשונה'},
    {value: 'עיקרית', label: '🍽️ עיקרית'},
    {value: 'קינוח', label: '🍰 קינוח'},
    {value: 'חטיף', label: '🍪 חטיף'},
  ];

  const difficultyOptions = [
    {value: 'קל', label: '😊 קל'},
    {value: 'בינוני', label: '🤔 בינוני'},
    {value: 'מתקדם', label: '👨‍🍳 מתקדם'},
  ];

  const handleAnswer = (field, value) => {
    setAnswers({...answers, [field]: value});
  };

  const nextStep = () => {
    if (step === 1 && !answers.prepTime) {
      toast.warning('אנא בחר זמן הכנה');
      return;
    }
    if (step === 2 && !answers.dishType) {
      toast.warning('אנא בחר סוג מנה');
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      fetchRecommendations();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const fetchRecommendations = async () => {
    if (!answers.difficulty) {
      toast.warning('אנא בחר רמת קושי');
      return;
    }

    setLoading(true);
    try {
      // קריאת API לקבלת מתכונים לפי הסינון
      const res = await axios.get('/api/recipes', {
        params: {
          prepTime: answers.prepTime,
          dishType: answers.dishType,
          difficulty: answers.difficulty,
        },
      });

      // בחירת 3 מתכונים רנדומליים
      const allRecipes = res.data;
      if (allRecipes.length === 0) {
        toast.info('לא נמצאו מתכונים מתאימים. נסה שילוב אחר 🔍');
        setRecommendations([]);
        return;
      }

      const shuffled = [...allRecipes].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(3, shuffled.length));
      setRecommendations(selected);
      setStep(4); // מעבר לשלב תוצאות
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בטעינת המתכונים. נסה שוב');
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setAnswers({prepTime: '', dishType: '', difficulty: ''});
    setRecommendations([]);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => {
      resetWizard();
    }, 300);
  };

  return (
    <>
      {/* כפתור FAB - Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 group"
        aria-label="AI Assistant">
        <div className="relative">
          {/* הגרדיאנט הזוהר */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-yellow-500 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>

          {/* הכפתור עצמו */}
          <div className="relative bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105 flex items-center space-x-3 space-x-reverse border-2 border-transparent group-hover:border-cyan-400">
            <span className="text-xl animate-bounce">✨</span>
            <span className="font-semibold text-sm">מצא מתכון עם AI</span>
          </div>
        </div>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={closeModal}>
          {/* Backdrop עם אפקט זכוכית חלבית */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md"></div>

          {/* תוכן ה-Modal */}
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center space-x-2 space-x-reverse">
                  <span>✨</span>
                  <span>עוזר AI - מה לבשל היום?</span>
                </h2>
                <p className="text-indigo-100 text-sm mt-1">
                  ענה על 3 שאלות ונמצא עבורך את המתכון המושלם
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Progress Bar */}
            {step <= 3 && (
              <div className="bg-gray-200 h-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 transition-all duration-500"
                  style={{width: `${(step / 3) * 100}%`}}></div>
              </div>
            )}

            {/* Body */}
            <div className="p-6 min-h-[300px]">
              {/* שאלה 1 - זמן הכנה */}
              {step === 1 && (
                <div className="animate-slideIn">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    ⏰ כמה זמן יש לך להכנה?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {prepTimeOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer('prepTime', option.value)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 text-right ${
                          answers.prepTime === option.value
                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                            : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
                        }`}>
                        <span className="font-medium text-gray-800">
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* שאלה 2 - סוג מנה */}
              {step === 2 && (
                <div className="animate-slideIn">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    🍽️ איזה סוג מנה אתה מחפש?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dishTypeOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer('dishType', option.value)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 text-right ${
                          answers.dishType === option.value
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : 'border-gray-300 hover:border-purple-300 hover:bg-gray-50'
                        }`}>
                        <span className="font-medium text-gray-800 text-lg">
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* שאלה 3 - רמת קושי */}
              {step === 3 && (
                <div className="animate-slideIn">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    👨‍🍳 מה רמת הבישול שלך?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {difficultyOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer('difficulty', option.value)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                          answers.difficulty === option.value
                            ? 'border-green-500 bg-green-50 shadow-md'
                            : 'border-gray-300 hover:border-green-300 hover:bg-gray-50'
                        }`}>
                        <span className="font-medium text-gray-800 text-lg">
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* תוצאות */}
              {step === 4 && (
                <div className="animate-slideIn">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    🎉 מצאנו עבורך את המתכונים המושלמים!
                  </h3>

                  {recommendations.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">אין המלצות להצגה</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recommendations.map((recipe, index) => (
                        <a
                          key={recipe._id || index}
                          href={`/recipe/${recipe.shortId}`}
                          className="block p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-400 hover:shadow-lg transition-all duration-200 group">
                          <div className="flex items-start space-x-4 space-x-reverse">
                            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors">
                                {recipe.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {recipe.description}
                              </p>
                              <div className="flex items-center space-x-4 space-x-reverse mt-2 text-xs text-gray-500">
                                <span>⏰ {recipe.prepTime} דקות</span>
                                <span>🍽️ {recipe.dishType}</span>
                                <span>👨‍🍳 {recipe.difficulty}</span>
                              </div>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer - כפתורי ניווט */}
            <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl border-t border-gray-200 flex justify-between items-center">
              {step > 1 && step < 4 && (
                <button
                  onClick={prevStep}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors">
                  ← חזור
                </button>
              )}

              {step === 4 && (
                <button
                  onClick={resetWizard}
                  className="px-6 py-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                  🔄 התחל מחדש
                </button>
              )}

              {step <= 3 && (
                <button
                  onClick={nextStep}
                  disabled={loading}
                  className="mr-auto px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading
                    ? 'טוען...'
                    : step === 3
                      ? '🔍 מצא מתכונים'
                      : 'המשך →'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* אנימציות CSS */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }

        .animate-slideIn {
          animation: slideIn 0.4s ease-out;
        }
      `}</style>
    </>
  );
};

export default AIAssistant;
