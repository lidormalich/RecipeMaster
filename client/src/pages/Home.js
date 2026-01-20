import React, {useState, useEffect} from 'react';
import {useSearchParams} from 'react-router-dom';
import axios from 'axios';
import RecipeCard from '../components/RecipeCard';

const Home = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search');

  useEffect(() => {
    fetchRecipes();
  }, [search]);

  const fetchRecipes = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const res = await axios.get(
        `http://localhost:5000/api/recipes?${params}`,
      );
      setRecipes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>טוען...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">המתכונים האחרונים</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map(recipe => (
          <RecipeCard key={recipe.shortId} recipe={recipe} />
        ))}
      </div>
    </div>
  );
};

export default Home;
