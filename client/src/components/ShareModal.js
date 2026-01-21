import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {toast} from 'react-toastify';

const ShareModal = ({isOpen, onClose, recipe}) => {
  const [visibility, setVisibility] = useState(recipe?.visibility);
  const [copied, setCopied] = useState(false);
  const [isChangingVisibility, setIsChangingVisibility] = useState(false);

  const recipeUrl = `${window.location.origin}/recipe/${recipe?.shortId}`;

  useEffect(() => {
    setVisibility(recipe?.visibility);
  }, [recipe]);

  const handleMakePublic = async () => {
    setIsChangingVisibility(true);
    try {
      const token = localStorage.getItem('token');

      // מכין את נתוני המתכון לעדכון
      const recipeData = {
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        mainImage: recipe.mainImage,
        videoUrl: recipe.videoUrl,
        tags: recipe.tags?.map(t => t.name || t) || [],
        visibility: 'Public',
        prepTime: recipe.prepTime,
        dishType: recipe.dishType,
        difficulty: recipe.difficulty,
        servings: recipe.servings,
      };

      await axios.put(
        `/api/recipes/${recipe.shortId}`,
        recipeData,
        {headers: {Authorization: `Bearer ${token}`}}
      );
      setVisibility('Public');
      toast.success('המתכון שונה לציבורי בהצלחה! 🌍', {icon: '✅'});
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בשינוי הנראות');
    } finally {
      setIsChangingVisibility(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(recipeUrl);
      setCopied(true);
      toast.success('הקישור הועתק ללוח! 📋', {icon: '✅'});
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בהעתקת הקישור');
    }
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`המתכון שלי: ${recipe.title} - ${recipeUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareToFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(recipeUrl)}`,
      '_blank'
    );
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`המתכון שלי: ${recipe.title}`);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(recipeUrl)}`,
      '_blank'
    );
  };

  const shareToEmail = () => {
    const subject = encodeURIComponent(`המתכון שלי: ${recipe.title}`);
    const body = encodeURIComponent(`היי! רציתי לשתף איתך את המתכון הזה:\n\n${recipe.title}\n\n${recipeUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (!isOpen || !recipe) return null;

  const needsVisibilityChange = visibility === 'Private';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold">שתף מתכון</h2>
                <p className="text-indigo-100 text-sm mt-0.5">{recipe.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors">
              <svg
                className="w-5 h-5"
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
        </div>

        <div className="p-6">
          {/* Visibility Warning */}
          {needsVisibilityChange && (
            <div className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-xl p-4 animate-pulse">
              <div className="flex items-start space-x-3 space-x-reverse">
                <div className="flex-shrink-0 text-2xl">🔒</div>
                <div className="flex-1">
                  <h3 className="text-amber-900 font-semibold mb-1">המתכון פרטי</h3>
                  <p className="text-amber-700 text-sm mb-3">
                    כדי לשתף את המתכון, הוא צריך להיות ציבורי
                  </p>
                  <button
                    onClick={handleMakePublic}
                    disabled={isChangingVisibility}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:bg-amber-300 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse">
                    {isChangingVisibility ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>משנה...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                          />
                        </svg>
                        <span>הפוך לציבורי</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Copy Link Section */}
          {(visibility === 'Public' || visibility === 'Shared') && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  העתק קישור
                </label>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="text"
                    value={recipeUrl}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 space-x-reverse ${
                      copied
                        ? 'bg-green-500 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}>
                    {copied ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span>הועתק!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        <span>העתק</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Share to Social Media */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  שתף ברשתות חברתיות
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={shareToWhatsApp}
                    className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={shareToFacebook}
                    className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Facebook</span>
                  </button>

                  <button
                    onClick={shareToTwitter}
                    className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                    <span>Twitter</span>
                  </button>

                  <button
                    onClick={shareToEmail}
                    className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span>אימייל</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ShareModal;
