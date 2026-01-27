import React, {useState, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {toast} from 'react-toastify';

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.warning('עליך להתחבר כדי לראות מועדפים');
        navigate('/login');
        return;
      }

      const res = await axios.get('/api/auth/favorites', {
        headers: {Authorization: `Bearer ${token}`},
      });
      setFavorites(res.data);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בטעינת המועדפים');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (recipeId, e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/auth/favorites/${recipeId}`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setFavorites(favorites.filter(f => f._id !== recipeId));
      toast.success('המתכון הוסר מהמועדפים');
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בהסרת המתכון');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-2xl">טוען מועדפים...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">
        <span className="bg-gradient-to-r from-red-500 to-pink-600 bg-clip-text text-transparent">
          המועדפים שלי
        </span>
      </h1>

      {favorites.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
          <div className="text-6xl mb-4">💔</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            אין לך מועדפים עדיין
          </h2>
          <p className="text-gray-500 mb-6">
            התחל להוסיף מתכונים למועדפים כדי לגשת אליהם במהירות ובקלות
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200">
            עבור למתכונים
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(recipe => (
            <Link
              key={recipe._id}
              to={`/recipe/${recipe.shortId}`}
              className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              {/* תמונה */}
              <div className="relative h-48 overflow-hidden">
                {recipe.mainImage ? (
                  <img
                    src={recipe.mainImage}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                    <span className="text-6xl">🍽️</span>
                  </div>
                )}
                {/* כפתור הסרה */}
                <button
                  onClick={e => removeFavorite(recipe._id, e)}
                  className="absolute top-3 left-3 w-10 h-10 bg-white/90 hover:bg-red-500 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 group/btn"
                  title="הסר מהמועדפים">
                  <svg
                    className="w-5 h-5 text-red-500 group-hover/btn:text-white transition-colors"
                    fill="currentColor"
                    viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              {/* תוכן */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                  {recipe.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {recipe.description}
                </p>

                {/* מידע נוסף */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {recipe.prepTime && (
                    <span className="flex items-center gap-1">
                      <span>⏰</span>
                      <span>{recipe.prepTime} דק'</span>
                    </span>
                  )}
                  {recipe.difficulty && (
                    <span className="flex items-center gap-1">
                      <span>👨‍🍳</span>
                      <span>{recipe.difficulty}</span>
                    </span>
                  )}
                </div>

                {/* מחבר */}
                {recipe.author && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
                    מאת: {recipe.author.name}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
