import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import axios from 'axios';
import {toast} from 'react-toastify';

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await axios.get('/api/cart', {
        headers: {Authorization: `Bearer ${token}`},
      });
      setCart(res.data);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בטעינת סל הקניות');
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = itemId => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const deleteItem = async itemId => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/cart/${itemId}`, {
        headers: {Authorization: `Bearer ${token}`},
      });

      toast.success('הפריט נמחק', {icon: '🗑️'});
      fetchCart();
    } catch (err) {
      console.error(err);
      toast.error('שגיאה במחיקת הפריט');
    }
  };

  const clearCart = async () => {
    if (!window.confirm('האם אתה בטוח שברצונך לנקות את כל הסל?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete('/api/cart/clear/all', {
        headers: {Authorization: `Bearer ${token}`},
      });

      toast.success('הסל נוקה בהצלחה', {icon: '✅'});
      fetchCart();
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בניקוי הסל');
    }
  };

  const groupByRecipe = items => {
    const grouped = {};
    items.forEach(item => {
      const key = item.recipeTitle || 'ללא מתכון';
      if (!grouped[key]) {
        grouped[key] = {
          title: item.recipeTitle,
          shortId: item.shortId,
          items: [],
        };
      }
      grouped[key].items.push(item);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-2xl">טוען...</div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-3xl font-bold mb-4 text-gray-800">סל הקניות ריק</h1>
        <p className="text-gray-600 mb-6">
          עדיין לא הוספת מרכיבים לסל. עבור למתכון והוסף מרכיבים!
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200">
          חזור לדף הבית
        </Link>
      </div>
    );
  }

  const groupedItems = groupByRecipe(cart.items);
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* כותרת */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 flex items-center">
            <span className="text-5xl ml-3">🛒</span>
            סל הקניות שלי
          </h1>

          <p className="text-gray-600 mt-2">
            סה"כ {cart.items.length} מרכיבים | {checkedCount} מסומנים
          </p>
        </div>
        <button
          onClick={clearCart}
          className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 shadow-md">
          🗑️ נקה הכל
        </button>
      </div>
      {/* טיפ */}
      <div className="mt-8 mb-8 bg-blue-50 border-r-4 border-blue-500 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-2xl">💡</span>
          </div>
          <div className="mr-3">
            <h3 className="text-sm font-semibold text-blue-800">טיפ שימושי</h3>
            <p className="text-sm text-blue-700 mt-1">
              סמן מרכיבים שכבר קנית כדי לעקוב אחרי ההתקדמות שלך בסופרמרקט.
              הנתונים נשמרים אוטומטית!
            </p>
          </div>
        </div>
      </div>
      {/* רשימת מרכיבים מקובצת לפי מתכון */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([recipeTitle, group]) => (
          <div
            key={recipeTitle}
            className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* כותרת המתכון */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{recipeTitle}</h2>
                {group.shortId && (
                  <Link
                    to={`/recipe/${group.shortId}`}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
                    👁️ צפה במתכון
                  </Link>
                )}
              </div>
              <p className="text-indigo-100 text-sm mt-1">
                {group.items.length} מרכיבים
              </p>
            </div>

            {/* רשימת המרכיבים */}
            <div className="divide-y divide-gray-200">
              {group.items.map((item, index) => (
                <div
                  key={item._id}
                  className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    checkedItems[item._id] ? 'bg-green-50' : ''
                  }`}>
                  <div className="flex items-center flex-1">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={checkedItems[item._id] || false}
                      onChange={() => handleCheck(item._id)}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer ml-4"
                    />

                    {/* מספר סידורי */}
                    <span className="text-gray-400 font-semibold ml-3 min-w-[30px]">
                      {index + 1}.
                    </span>

                    {/* שם המרכיב */}
                    <span
                      className={`text-gray-800 ${
                        checkedItems[item._id]
                          ? 'line-through text-gray-500'
                          : ''
                      }`}>
                      {item.ingredient}
                    </span>
                  </div>

                  {/* כפתור מחיקה */}
                  <button
                    onClick={() => deleteItem(item._id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    title="מחק מהסל">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cart;
