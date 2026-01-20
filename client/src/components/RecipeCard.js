import React from 'react';
import {Link} from 'react-router-dom';

const RecipeCard = ({recipe}) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {recipe.mainImage && (
        <img
          src={recipe.mainImage}
          alt={recipe.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">
          <Link
            to={`/recipe/${recipe.shortId}`}
            className="text-blue-600 hover:text-blue-800">
            {recipe.title}
          </Link>
        </h3>
        <p className="text-gray-600 mb-2">{recipe.description}</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {recipe.tags.map(tag => (
            <span
              key={tag._id}
              className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
              {tag.name}
            </span>
          ))}
        </div>
        <p className="text-sm text-gray-500">By {recipe.author.name}</p>
      </div>
    </div>
  );
};

export default RecipeCard;
