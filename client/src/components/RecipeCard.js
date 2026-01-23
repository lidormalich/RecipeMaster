import React, {useState, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {toast} from 'react-toastify';
import {useAuth} from '../context/AuthContext';

const RecipeCard = ({recipe}) => {
  const {user} = useAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (user?.favorites && recipe?._id) {
      setIsFavorite(user.favorites.includes(recipe._id));
    }
  }, [user, recipe]);

  const toggleFavorite = async e => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.warning('עליך להתחבר כדי להוסיף למועדפים');
      navigate('/login');
      return;
    }

    setIsToggling(true);
    try {
      const token = localStorage.getItem('token');
      if (isFavorite) {
        await axios.delete(`/api/auth/favorites/${recipe._id}`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        setIsFavorite(false);
        toast.success('המתכון הוסר מהמועדפים');
      } else {
        await axios.post(`/api/auth/favorites/${recipe._id}`, {}, {
          headers: {Authorization: `Bearer ${token}`},
        });
        setIsFavorite(true);
        toast.success('המתכון נוסף למועדפים');
      }
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בעדכון המועדפים');
    } finally {
      setIsToggling(false);
    }
  };

  const tagsToDisplay = recipe.populatedTags || recipe.tags;

  return (
    <Link
      to={`/recipe/${recipe.shortId}`}
      className="group block bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2">
      {/* Image Container with Overlay */}
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        {recipe.mainImage ? (
          <>
            <img
              src={recipe.mainImage}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <span className="text-6xl">🍽️</span>
              <p className="text-gray-400 mt-2 font-medium">אין תמונה</p>
            </div>
          </div>
        )}

        {/* Favorite Button */}
        {user && (
          <button
            onClick={toggleFavorite}
            disabled={isToggling}
            className={`absolute top-3 left-3 w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-10 ${
              isFavorite
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-white/90 hover:bg-white'
            } disabled:opacity-50`}
            title={isFavorite ? 'הסר מהמועדפים' : 'הוסף למועדפים'}>
            <svg
              className={`w-5 h-5 transition-colors ${
                isFavorite ? 'text-white' : 'text-gray-400 hover:text-red-500'
              }`}
              fill={isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        )}

        {/* Tags on Image */}
        {tagsToDisplay && tagsToDisplay.length > 0 && (
          <div className="absolute top-3 right-3 flex flex-wrap gap-1.5">
            {tagsToDisplay.slice(0, 2).map(tag => (
              <span
                key={tag._id || tag}
                className="px-3 py-1 bg-white/90 backdrop-blur-sm text-indigo-600 rounded-full text-xs font-semibold shadow-lg">
                {tag.name || tag}
              </span>
            ))}
            {tagsToDisplay.length > 2 && (
              <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-600 rounded-full text-xs font-semibold shadow-lg">
                +{tagsToDisplay.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors duration-200">
          {recipe.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {recipe.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {/* Author */}
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              {recipe.author?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-sm text-gray-700 font-medium">
              {recipe.author?.name || 'Unknown'}
            </span>
          </div>

          {/* Arrow Icon */}
          <div className="w-8 h-8 rounded-full bg-indigo-100 group-hover:bg-indigo-600 flex items-center justify-center transition-colors duration-200">
            <svg
              className="w-4 h-4 text-indigo-600 group-hover:text-white transition-colors duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RecipeCard;
