import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {toast} from 'react-toastify';

const RecipeDetail = () => {
  const {shortId} = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cookingMode, setCookingMode] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchRecipe();
  }, [shortId]);

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
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setCookingMode(true)}
          className="flex items-center space-x-2 space-x-reverse px-5 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <span className="text-2xl">👨‍🍳</span>
          <span>מצב בישול</span>
        </button>

        <button
          onClick={addToCart}
          disabled={addingToCart}
          className="flex items-center space-x-2 space-x-reverse px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-2xl">🛒</span>
          <span>{addingToCart ? 'מוסיף...' : 'הוסף מרכיבים לסל'}</span>
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
      {recipe.tags && recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {recipe.tags.map(tag => (
            <span
              key={tag._id}
              className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium hover:bg-indigo-200 transition-colors"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipeDetail;
