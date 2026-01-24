import React, {useState, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {toast} from 'react-toastify';
import {useAuth} from '../context/AuthContext';

const Trash = () => {
  const navigate = useNavigate();
  const {user} = useAuth();
  const [deletedRecipes, setDeletedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'posteradmin';

  useEffect(() => {
    fetchDeletedRecipes();
  }, []);

  const fetchDeletedRecipes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.warning('עליך להתחבר כדי לראות פריטים מחוקים');
        navigate('/login');
        return;
      }

      const res = await axios.get('/api/recipes/deleted/all', {
        headers: {Authorization: `Bearer ${token}`},
      });
      setDeletedRecipes(res.data);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בטעינת פריטים מחוקים');
    } finally {
      setLoading(false);
    }
  };

  const restoreRecipe = async (shortId, e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/recipes/${shortId}/restore`,
        {},
        {headers: {Authorization: `Bearer ${token}`}}
      );
      setDeletedRecipes(deletedRecipes.filter(r => r.shortId !== shortId));
      toast.success('המתכון שוחזר בהצלחה');
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בשחזור המתכון');
    }
  };

  const permanentDelete = async (shortId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('האם אתה בטוח? פעולה זו תמחק את המתכון לצמיתות ולא ניתן לשחזר אותו.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/recipes/${shortId}/permanent`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setDeletedRecipes(deletedRecipes.filter(r => r.shortId !== shortId));
      toast.success('המתכון נמחק לצמיתות');
    } catch (err) {
      console.error(err);
      toast.error('שגיאה במחיקת המתכון');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-2xl">טוען פריטים מחוקים...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">
        <span className="bg-gradient-to-r from-gray-500 to-gray-700 bg-clip-text text-transparent">
          סל המיחזור
        </span>
      </h1>

      {isAdmin && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg text-center text-blue-700">
          כמנהל, אתה רואה את כל המתכונים שנמחקו במערכת
        </div>
      )}

      {deletedRecipes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
          <div className="text-6xl mb-4">🗑️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            סל המיחזור ריק
          </h2>
          <p className="text-gray-500 mb-6">
            {isAdmin
              ? 'אין מתכונים מחוקים במערכת'
              : 'אין לך מתכונים מחוקים'}
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200">
            חזור לדף הבית
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deletedRecipes.map(recipe => (
            <div
              key={recipe._id}
              className="group bg-white rounded-2xl shadow-lg overflow-hidden opacity-75 hover:opacity-100 transition-all duration-300">
              {/* תמונה */}
              <div className="relative h-48 overflow-hidden">
                {recipe.mainImage ? (
                  <img
                    src={recipe.mainImage}
                    alt={recipe.title}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                    <span className="text-6xl">🍽️</span>
                  </div>
                )}
                {/* תג מחוק */}
                <div className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-sm rounded-full">
                  נמחק
                </div>
              </div>

              {/* תוכן */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">
                  {recipe.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {recipe.description}
                </p>

                {/* מחבר - מוצג רק לאדמין */}
                {isAdmin && recipe.author && (
                  <div className="mb-2 text-sm text-gray-500">
                    מאת: {recipe.author.name}
                  </div>
                )}

                {/* מי מחק - מוצג אם מישהו אחר מחק */}
                {recipe.deletedBy && recipe.deletedBy._id !== recipe.author?._id && (
                  <div className="mb-2 text-sm text-red-500">
                    נמחק ע"י: {recipe.deletedBy.name}
                  </div>
                )}

                {/* תאריך מחיקה */}
                {recipe.deletedAt && (
                  <div className="mb-3 text-sm text-gray-400">
                    נמחק ב: {new Date(recipe.deletedAt).toLocaleDateString('he-IL')}
                  </div>
                )}

                {/* כפתורי פעולה */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={e => restoreRecipe(recipe.shortId, e)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 text-sm">
                    שחזר
                  </button>
                  {isAdmin && (
                    <button
                      onClick={e => permanentDelete(recipe.shortId, e)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 text-sm">
                      מחק לצמיתות
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Trash;
