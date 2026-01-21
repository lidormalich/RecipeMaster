import React, {useState, useEffect} from 'react';
import {useSearchParams, useNavigate} from 'react-router-dom';
import axios from 'axios';
import RecipeCard from '../components/RecipeCard';

const Home = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [activeTagName, setActiveTagName] = useState(null);
  const navigate = useNavigate();
  const search = searchParams.get('search');
  const tag = searchParams.get('tag');

  useEffect(() => {
    fetchRecipes();
    if (tag) {
      fetchTagName(tag);
    } else {
      setActiveTagName(null);
    }
  }, [search, tag]);

  const fetchTagName = async globalId => {
    try {
      const res = await axios.get('/api/tags');
      for (const cat of res.data) {
        const foundTag = cat.tags.find(t => t.globalId === globalId);
        if (foundTag) {
          setActiveTagName(foundTag.he);
          return;
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (tag) params.append('tags', tag);
      const res = await axios.get(`/api/recipes?${params}`);
      setRecipes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearTagFilter = () => {
    navigate('/');
  };

  if (loading) return <div className="text-center py-8">טוען...</div>;

  return (
    <div>
      {tag && activeTagName ? (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-3xl font-bold">מתכונים עם התגית: #{activeTagName}</h1>
            <button
              onClick={clearTagFilter}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300 transition-colors">
              X נקה פילטר
            </button>
          </div>
          <p className="text-gray-600">נמצאו {recipes.length} מתכונים</p>
        </div>
      ) : (
        <h1 className="text-3xl font-bold mb-8">המתכונים האחרונים</h1>
      )}

      {recipes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {tag ? 'לא נמצאו מתכונים עם התגית הזו' : 'אין מתכונים להצגה'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map(recipe => (
            <RecipeCard key={recipe.shortId} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
