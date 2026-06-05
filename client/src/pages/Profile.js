import React, {useState, useEffect} from 'react';
import axios from 'axios';
import RecipeCard from '../components/RecipeCard';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchUser();
    fetchCart();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/auth/my-stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data);
      fetchUserRecipes(res.data._id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserRecipes = async userId => {
    try {
      const res = await axios.get(`/api/recipes/user/${userId}`);
      setRecipes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await axios.get('/api/recipes/user/cart');
      setCart(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = async shortId => {
    try {
      await axios.post(`/api/recipes/${shortId}/cart`);
      fetchCart();
      alert('המצרכים נוספו לסל!');
    } catch (err) {
      console.error(err);
    }
  };

  const removeFromCart = async (shortId, ingredient) => {
    try {
      await axios.delete(`/api/recipes/${shortId}/cart`, {
        data: {ingredient},
      });
      setCart(
        cart.filter(
          item => !(item.shortId === shortId && item.ingredient === ingredient),
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>טוען...</div>;

  return (
    <div className="space-y-12">
      {/* User Info Section */}
      {user && (
        <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 transform hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{user.name}</h1>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="mt-6 border-t border-gray-200 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-purple-500">🏷️</span>
              <span>
                תפקיד:{' '}
                <span className="font-semibold text-gray-800 capitalize">
                  {user.role}
                </span>
              </span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-indigo-500">🗓️</span>
              <span>
                הצטרף בתאריך:{' '}
                <span className="font-semibold text-gray-800">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </span>
            </div>
          </div>

          {/* Stats counters */}
          {stats && (
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-indigo-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-extrabold text-indigo-600">
                  {stats.recipes}
                </div>
                <div className="text-xs text-gray-500 mt-1">מתכונים</div>
              </div>
              <div className="bg-pink-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-extrabold text-pink-600">
                  {stats.hearts}
                </div>
                <div className="text-xs text-gray-500 mt-1">לבבות שנצברו</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-extrabold text-emerald-600">
                  {stats.loginCount}
                </div>
                <div className="text-xs text-gray-500 mt-1">התחברויות</div>
              </div>
            </div>
          )}

          {/* Achievement badges */}
          {stats?.badges?.length > 0 && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span>🎖️</span> תגי הישג
              </h3>
              <div className="flex flex-wrap gap-2">
                {stats.badges.map((b, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* My Recipes Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">המתכונים שלי</h2>
        {recipes.length === 0 ? (
          <div className="text-center bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              עדיין לא יצרת מתכונים
            </h3>
            <p className="text-gray-500">
              רוצה להתחיל? לחץ על "צור מתכון" בתפריט הראשי.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 bg-white p-4 rounded-xl shadow text-center text-lg font-bold text-gray-700">
              ✨ יצרת{' '}
              <span className="text-indigo-600 text-xl">{recipes.length}</span>{' '}
              מתכונים בסך הכל ✨
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map(recipe => (
                <div key={recipe.shortId} className="flex flex-col">
                  <RecipeCard recipe={recipe} />
                  {/* <button
                    onClick={() => addToCart(recipe.shortId)}
                    className="mt-2 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition">
                    הוסף מצרכים לסל
                  </button> */}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
