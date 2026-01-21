import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {toast} from 'react-toastify';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // הקטגוריות שנשאל עליהן בסדר
  const questionCategories = [
    'זמן הכנה',
    'רמת קושי',
    'סוג מנה',
    'תזונה',
    'כשרות',
    'סגנון מטבח',
  ];

  useEffect(() => {
    if (isOpen && categories.length === 0) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await axios.get('/api/tags');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בטעינת הקטגוריות');
    } finally {
      setLoadingCategories(false);
    }
  };

  const getCurrentCategory = () => {
    const categoryName = questionCategories[step];
    return categories.find(c => c.category === categoryName);
  };

  const toggleTag = globalId => {
    const categoryName = questionCategories[step];
    const current = selectedTags[categoryName] || [];

    if (current.includes(globalId)) {
      setSelectedTags({
        ...selectedTags,
        [categoryName]: current.filter(id => id !== globalId),
      });
    } else {
      setSelectedTags({
        ...selectedTags,
        [categoryName]: [...current, globalId],
      });
    }
  };

  const isTagSelected = globalId => {
    const categoryName = questionCategories[step];
    return (selectedTags[categoryName] || []).includes(globalId);
  };

  const nextStep = () => {
    if (step < questionCategories.length - 1) {
      setStep(step + 1);
    } else {
      fetchRecommendations();
    }
  };

  const skipStep = () => {
    if (step < questionCategories.length - 1) {
      setStep(step + 1);
    } else {
      fetchRecommendations();
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      // איסוף כל התגיות שנבחרו
      const allSelectedTags = Object.values(selectedTags).flat();

      if (allSelectedTags.length === 0) {
        // אם לא נבחרו תגיות, מביא מתכונים רנדומליים
        const res = await axios.get('/api/recipes');
        const allRecipes = res.data;
        const shuffled = [...allRecipes].sort(() => 0.5 - Math.random());
        setRecommendations(shuffled.slice(0, 5));
        setStep(questionCategories.length);
        return;
      }

      // חיפוש מתכונים עם OR על התגיות
      const res = await axios.get('/api/recipes', {
        params: {
          tags: allSelectedTags.join(','),
        },
      });

      const recipes = res.data;

      if (recipes.length === 0) {
        toast.info('לא נמצאו מתכונים מתאימים. נסה שילוב אחר');
        setRecommendations([]);
      } else {
        // מיון לפי מספר תגיות תואמות (היותר טוב ראשון)
        const sorted = recipes.sort((a, b) => {
          const aMatches = (a.tags || []).filter(t =>
            allSelectedTags.includes(t),
          ).length;
          const bMatches = (b.tags || []).filter(t =>
            allSelectedTags.includes(t),
          ).length;
          return bMatches - aMatches;
        });
        setRecommendations(sorted.slice(0, 5));
      }

      setStep(questionCategories.length); // מעבר לשלב תוצאות
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בטעינת המתכונים');
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setStep(0);
    setSelectedTags({});
    setRecommendations([]);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(resetWizard, 300);
  };

  const getQuestionEmoji = index => {
    const emojis = ['⏰', '👨‍🍳', '🍽️', '🥗', '✡️', '🌍'];
    return emojis[index] || '📝';
  };

  const currentCategory = getCurrentCategory();
  const totalSteps = questionCategories.length;
  const isResultStep = step >= totalSteps;

  return (
    <>
      {/* כפתור FAB */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 group"
        aria-label="AI Assistant">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-yellow-500 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
          <div className="relative bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105 flex items-center space-x-3 space-x-reverse border-2 border-transparent group-hover:border-cyan-400">
            <span className="text-xl animate-bounce">✨</span>
            <span className="font-semibold text-sm">מה אוכלים היום?</span>
          </div>
        </div>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={closeModal}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md"></div>

          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center z-10">
              <div>
                <h2 className="text-2xl font-bold flex items-center space-x-2 space-x-reverse">
                  <span>✨</span>
                  <span>עוזר AI - מה לבשל היום?</span>
                </h2>
                <p className="text-indigo-100 text-sm mt-1">
                  {isResultStep
                    ? 'הנה ההמלצות שלנו!'
                    : `שאלה ${step + 1} מתוך ${totalSteps} - אפשר לדלג`}
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
            {!isResultStep && (
              <div className="bg-gray-200 h-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 transition-all duration-500"
                  style={{width: `${((step + 1) / totalSteps) * 100}%`}}></div>
              </div>
            )}

            {/* Body */}
            <div className="p-6 min-h-[300px]">
              {loadingCategories ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">טוען...</p>
                </div>
              ) : !isResultStep && currentCategory ? (
                <div className="animate-slideIn">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {getQuestionEmoji(step)} {currentCategory.category}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    בחר אפשרות אחת או יותר (לא חובה)
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {currentCategory.tags?.map(tag => (
                      <button
                        key={tag.globalId}
                        onClick={() => toggleTag(tag.globalId)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          isTagSelected(tag.globalId)
                            ? 'bg-indigo-600 text-white shadow-md scale-105'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}>
                        {tag.he}
                      </button>
                    ))}
                  </div>

                  {/* הצגת התגיות שנבחרו בכל הקטגוריות */}
                  {Object.keys(selectedTags).length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500 mb-2">
                        הבחירות שלך עד כה:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(selectedTags).map(([cat, tagIds]) =>
                          tagIds.map(tagId => {
                            const category = categories.find(
                              c => c.category === cat,
                            );
                            const tag = category?.tags?.find(
                              t => t.globalId === tagId,
                            );
                            return tag ? (
                              <span
                                key={tagId}
                                className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                                {tag.he}
                              </span>
                            ) : null;
                          }),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : isResultStep ? (
                <div className="animate-slideIn">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    🎉 מצאנו עבורך {recommendations.length} מתכונים!
                  </h3>

                  {recommendations.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-lg">
                        לא נמצאו מתכונים מתאימים
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        נסה לבחור קריטריונים אחרים
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recommendations.map((recipe, index) => (
                        <a
                          key={recipe._id || index}
                          href={`/recipe/${recipe.shortId}`}
                          className="block p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-400 hover:shadow-lg transition-all duration-200 group">
                          <div className="flex items-start space-x-4 space-x-reverse">
                            {recipe.mainImage ? (
                              <img
                                src={recipe.mainImage}
                                alt={recipe.title}
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                                {index + 1}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors truncate">
                                {recipe.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {recipe.description}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                מאת {recipe.author?.name || 'אנונימי'}
                              </p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  אין קטגוריות להצגה
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl border-t border-gray-200 flex justify-between items-center">
              {!isResultStep ? (
                <>
                  <button
                    onClick={prevStep}
                    disabled={step === 0}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                    ← חזור
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={skipStep}
                      className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium transition-colors">
                      דלג
                    </button>
                    <button
                      onClick={nextStep}
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50">
                      {loading
                        ? 'טוען...'
                        : step === totalSteps - 1
                          ? '🔍 מצא מתכונים'
                          : 'המשך →'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={resetWizard}
                    className="px-6 py-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                    🔄 התחל מחדש
                  </button>
                  <button
                    onClick={closeModal}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200">
                    סגור
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
