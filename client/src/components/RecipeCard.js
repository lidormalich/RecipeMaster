import React from 'react';
import {Link} from 'react-router-dom';

const RecipeCard = ({recipe}) => {
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

        {/* Tags on Image */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="absolute top-3 right-3 flex flex-wrap gap-1.5">
            {recipe.tags.slice(0, 2).map(tag => (
              <span
                key={tag._id || tag}
                className="px-3 py-1 bg-white/90 backdrop-blur-sm text-indigo-600 rounded-full text-xs font-semibold shadow-lg">
                {tag.name || tag}
              </span>
            ))}
            {recipe.tags.length > 2 && (
              <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-600 rounded-full text-xs font-semibold shadow-lg">
                +{recipe.tags.length - 2}
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
