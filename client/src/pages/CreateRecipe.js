import React from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import {toast} from 'react-toastify';
import RecipeForm from '../components/RecipeForm';

const CreateRecipe = () => {
  const navigate = useNavigate();

  const handleSubmit = async recipeData => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('עליך להתחבר כדי ליצור מתכון');
      navigate('/login');
      return;
    }

    try {
      await axios.post('/api/recipes', recipeData, {
        headers: {Authorization: `Bearer ${token}`},
      });
      toast.success('המתכון נוצר בהצלחה! ✅');
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'שגיאה ביצירת המתכון');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">
        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          ✨ צור מתכון חדש
        </span>
      </h1>
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <RecipeForm
          onSubmit={handleSubmit}
          submitText="צור מתכון"
          title="צור מתכון"
        />
      </div>
    </div>
  );
};

export default CreateRecipe;
