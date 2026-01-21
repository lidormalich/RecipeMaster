import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {toast} from 'react-toastify';
import ShareModal from '../components/ShareModal';

const RecipeDetail = () => {
  const {shortId} = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cookingMode, setCookingMode] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRecipe();
    fetchCurrentUser();
  }, [shortId]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await axios.get('/api/auth/me', {
        headers: {Authorization: `Bearer ${token}`},
      });
      setCurrentUser(res.data);
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const fetchRecipe = async () => {
    try {
      const res = await axios.get(`/api/recipes/${shortId}`);
      setRecipe(res.data);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בטעינת המתכון');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.warning('עליך להתחבר כדי להוסיף לסל קניות', {icon: '🔒'});
      navigate('/login');
      return;
    }

    setAddingToCart(true);
    try {
      // פיצול המרכיבים לפי שורות
      const ingredientsArray = recipe.ingredients
        .split('\n')
        .filter(ing => ing.trim());

      await axios.post(
        '/api/cart/add',
        {
          ingredients: ingredientsArray,
          recipeId: recipe._id,
          recipeTitle: recipe.title,
          shortId: recipe.shortId,
        },
        {
          headers: {Authorization: `Bearer ${token}`},
        },
      );

      toast.success(
        `${ingredientsArray.length} מרכיבים נוספו לסל הקניות! 🛒`,
        {icon: '✅'},
      );
    } catch (err) {
      console.error(err);
      const errorMsg =
        err.response?.data?.msg || 'שגיאה בהוספה לסל הקניות';
      toast.error(errorMsg, {icon: '❌'});
    } finally {
      setAddingToCart(false);
    }
  };

  const isOwner =
    currentUser &&
    recipe &&
    (currentUser._id === recipe.author?._id || currentUser._id === recipe.author);

  const deleteRecipe = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setDeleting(true);
    try {
      await axios.delete(`/api/recipes/${shortId}`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      toast.success('המתכון נמחק בהצלחה');
      navigate('/profile');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || 'שגיאה במחיקת המתכון');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) return <div className="text-center py-8">טוען...</div>;
  if (!recipe) return <div className="text-center py-8">המתכון לא נמצא</div>;

  // מצב בישול - תצוגה מלאה
  if (cookingMode) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 text-white overflow-y-auto">
        {/* כפתור סגירה */}
        <button
          onClick={() => setCookingMode(false)}
          className="fixed top-6 left-6 z-50 bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-2xl transition-all duration-200 hover:scale-110"
          aria-label="סגור מצב בישול"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="container mx-auto px-8 py-12 max-w-5xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-8 text-center bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
            {recipe.title}
          </h1>

          {/* רכיבים */}
          <div className="mb-12 bg-slate-800 rounded-2xl p-8">
            <h2 className="text-4xl font-bold mb-6 flex items-center">
              <span className="text-4xl mr-3">📝</span>
              רכיבים
            </h2>
            <div className="text-2xl leading-relaxed whitespace-pre-line text-slate-200">
              {recipe.ingredients}
            </div>
          </div>

          {/* הוראות הכנה */}
          <div className="bg-slate-800 rounded-2xl p-8">
            <h2 className="text-4xl font-bold mb-6 flex items-center">
              <span className="text-4xl mr-3">👨‍🍳</span>
              הוראות הכנה
            </h2>
            <div className="text-3xl leading-loose whitespace-pre-line text-slate-200">
              {recipe.instructions}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // תצוגה רגילה
  return (
    <div className="max-w-4xl mx-auto">
      {/* כפתורי פעולה עליונים */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <button
          onClick={() => setCookingMode(true)}
          className="flex items-center space-x-2 space-x-reverse px-5 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
          <span className="text-2xl">👨‍🍳</span>
          <span>מצב בישול</span>
        </button>

        <button
          onClick={addToCart}
          disabled={addingToCart}
          className="flex items-center space-x-2 space-x-reverse px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="text-2xl">🛒</span>
          <span>{addingToCart ? 'מוסיף...' : 'הוסף מרכיבים לסל'}</span>
        </button>

        {/* כפתור עריכה - רק לבעלים */}
        {isOwner && (
          <>
            <button
              onClick={() => navigate(`/recipe/${shortId}/edit`)}
              className="flex items-center space-x-2 space-x-reverse px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
              <span className="text-2xl">✏️</span>
              <span>ערוך מתכון</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center space-x-2 space-x-reverse px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
              <span className="text-2xl">🗑️</span>
              <span>מחק מתכון</span>
            </button>
          </>
        )}

        {/* כפתור שיתוף - מינימליסטי בצד שמאל */}
        <button
          onClick={() => setShowShareModal(true)}
          className="mr-auto w-11 h-11 bg-white hover:bg-gray-50 rounded-full shadow-md hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center group border border-gray-200"
          title="שתף מתכון">
          <svg
            className="w-5 h-5 text-gray-700 group-hover:text-indigo-600 transition-colors duration-200"
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
        </button>
      </div>

      {/* כותרת */}
      <h1 className="text-4xl font-bold mb-4 text-gray-800">{recipe.title}</h1>

      {/* תמונה */}
      {recipe.mainImage && (
        <img
          src={recipe.mainImage}
          alt={recipe.title}
          className="w-full h-96 object-cover rounded-lg shadow-lg mb-6"
        />
      )}

      {/* תיאור */}
      <p className="text-gray-600 mb-6 text-lg leading-relaxed">
        {recipe.description}
      </p>

      {/* מידע נוסף */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {recipe.prepTime && (
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl mb-1">⏰</div>
            <div className="text-sm text-gray-600">זמן הכנה</div>
            <div className="font-semibold">{recipe.prepTime} דקות</div>
          </div>
        )}
        {recipe.dishType && (
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl mb-1">🍽️</div>
            <div className="text-sm text-gray-600">סוג מנה</div>
            <div className="font-semibold">{recipe.dishType}</div>
          </div>
        )}
        {recipe.difficulty && (
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl mb-1">👨‍🍳</div>
            <div className="text-sm text-gray-600">רמת קושי</div>
            <div className="font-semibold">{recipe.difficulty}</div>
          </div>
        )}
        {recipe.servings && (
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-2xl mb-1">🍴</div>
            <div className="text-sm text-gray-600">מנות</div>
            <div className="font-semibold">{recipe.servings}</div>
          </div>
        )}
      </div>

      {/* רכיבים */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800">
          <span className="text-3xl mr-2">📝</span>
          רכיבים
        </h2>
        <div className="text-gray-700 leading-relaxed whitespace-pre-line">
          {recipe.ingredients}
        </div>
      </div>

      {/* הוראות הכנה */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800">
          <span className="text-3xl mr-2">👨‍🍳</span>
          הוראות הכנה
        </h2>
        <div className="text-gray-700 leading-relaxed whitespace-pre-line">
          {recipe.instructions}
        </div>
      </div>

      {/* וידאו */}
      {recipe.videoUrl && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800">
            <span className="text-3xl mr-2">🎥</span>
            וידאו
          </h2>
          <iframe
            src={recipe.videoUrl}
            title="Recipe Video"
            className="w-full h-96 rounded-lg"
            allowFullScreen
          ></iframe>
        </div>
      )}

      {/* תגיות */}
      {recipe.populatedTags && recipe.populatedTags.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800">
            <span className="text-3xl mr-2">🏷️</span>
            תגיות
          </h2>
          <div className="flex flex-wrap gap-2">
            {recipe.populatedTags.map(tag => (
              <button
                key={tag.globalId}
                onClick={() => navigate(`/?tag=${tag.globalId}`)}
                className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium hover:bg-indigo-200 transition-colors cursor-pointer">
                #{tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">מחיקת מתכון</h3>
            <p className="text-gray-600 mb-6">
              האם אתה בטוח שברצונך למחוק את המתכון "{recipe.title}"?
              <br />
              <span className="text-red-500 text-sm">פעולה זו אינה ניתנת לביטול.</span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors">
                ביטול
              </button>
              <button
                onClick={deleteRecipe}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                {deleting ? 'מוחק...' : 'מחק'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        recipe={recipe}
      />
    </div>
  );
};

export default RecipeDetail;
