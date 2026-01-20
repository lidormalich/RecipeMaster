import React, {useState, useEffect} from 'react';
import {useParams} from 'react-router-dom';
import axios from 'axios';

const RecipeDetail = () => {
  const {shortId} = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipe();
  }, [shortId]);

  const fetchRecipe = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/recipes/${shortId}`,
      );
      setRecipe(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>טוען...</div>;
  if (!recipe) return <div>המתכון לא נמצא</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{recipe.title}</h1>
      {recipe.mainImage && (
        <img
          src={recipe.mainImage}
          alt={recipe.title}
          className="w-full h-64 object-cover mb-4"
        />
      )}
      <p className="text-gray-600 mb-4">{recipe.description}</p>
      <h2 className="text-2xl font-semibold mb-2">רכיבים</h2>
      <p className="mb-4">{recipe.ingredients}</p>
      <h2 className="text-2xl font-semibold mb-2">הוראות הכנה</h2>
      <p className="mb-4">{recipe.instructions}</p>
      {recipe.videoUrl && (
        <div className="mb-4">
          <h2 className="text-2xl font-semibold mb-2">וידאו</h2>
          <iframe
            src={recipe.videoUrl}
            title="Recipe Video"
            className="w-full h-64"></iframe>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {recipe.tags.map(tag => (
          <span
            key={tag._id}
            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
            {tag.name}
          </span>
        ))}
      </div>
    </div>
  );
};

export default RecipeDetail;
