import React, {useState, useEffect} from 'react';
import axios from 'axios';
import RecipeCard from '../components/RecipeCard';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetchUser();
    fetchCart();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/me');
      setUser(res.data);
      fetchUserRecipes(res.data._id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserRecipes = async userId => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/recipes/user/${userId}`,
      );
      setRecipes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await axios.get(
        'http://localhost:5000/api/recipes/user/cart',
      );
      setCart(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = async shortId => {
    try {
      await axios.post(`http://localhost:5000/api/recipes/${shortId}/cart`);
      fetchCart();
      alert('המצרכים נוספו לסל!');
    } catch (err) {
      console.error(err);
    }
  };

  const removeFromCart = async (shortId, ingredient) => {
    try {
      await axios.delete(`http://localhost:5000/api/recipes/${shortId}/cart`, {
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
    <div>
      <h1 className="text-3xl font-bold mb-8">פרופיל</h1>
      {user && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold">{user.name}</h2>
          <div>{user.email}</div>
          <div>{user.role}</div>
          <div>{new Date(user.createdAt).toLocaleDateString()}</div>
        </div>
      )}

      <h2 className="text-2xl font-semibold mb-4">סל קניות</h2>
      <div className="mb-8 bg-white p-4 rounded shadow">
        {cart.length === 0 ? (
          <p>הסל ריק</p>
        ) : (
          <ul className="space-y-2">
            {cart.map((item, index) => (
              <li key={index} className="flex items-center gap-3 border-b pb-2">
                <input
                  type="checkbox"
                  className="w-5 h-5 cursor-pointer"
                  onChange={() => removeFromCart(item.shortId, item.ingredient)}
                  title="סמן כנרכש להסרה"
                />
                <span className="font-medium">{item.ingredient}</span>
                <span className="text-sm text-gray-500">
                  (עבור מתכון: {item.recipeTitle})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2 className="text-2xl font-semibold mb-4">המתכונים שלי</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map(recipe => (
          <div key={recipe.shortId} className="flex flex-col">
            <RecipeCard recipe={recipe} />
            <button
              onClick={() => addToCart(recipe.shortId)}
              className="mt-2 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition">
              הוסף מצרכים לסל
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Profile;
