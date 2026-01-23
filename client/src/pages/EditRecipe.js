import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {toast} from 'react-toastify';
import RecipeForm from '../components/RecipeForm';

const EditRecipe = () => {
  const {shortId} = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipe();
  }, [shortId]);

  const fetchRecipe = async () => {
    try {
      const res = await axios.get(`/api/recipes/${shortId}`);
      const recipeData = res.data;

      // בדיקה שהמשתמש מחובר
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('עליך להתחבר כדי לערוך מתכון');
        navigate('/login');
        return;
      }

      const userRes = await axios.get('/api/auth/me', {
        headers: {Authorization: `Bearer ${token}`},
      });

      const currentUser = userRes.data;
      const isOwner =
        currentUser._id === recipeData.author._id ||
        currentUser._id === recipeData.author;
      const canEditAny =
        currentUser.role?.toLowerCase() === 'admin' ||
        currentUser.role?.toLowerCase() === 'posteradmin';

      // בדיקת הרשאות - בעלים או Admin/PosterAdmin
      if (!isOwner && !canEditAny) {
        toast.error('אין לך הרשאה לערוך מתכון זה');
        navigate(`/recipe/${shortId}`);
        return;
      }

      setRecipe(recipeData);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בטעינת המתכון');
      navigate('/');
    }
  };

  const handleSubmit = async recipeData => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('עליך להתחבר כדי לערוך מתכון');
      navigate('/login');
      return;
    }

    try {
      await axios.put(`/api/recipes/${shortId}`, recipeData, {
        headers: {Authorization: `Bearer ${token}`},
      });
      toast.success('המתכון עודכן בהצלחה!');
      navigate(`/recipe/${shortId}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'שגיאה בעדכון המתכון');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-2xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">
        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          עריכת מתכון
        </span>
      </h1>
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <RecipeForm
          initialData={recipe}
          onSubmit={handleSubmit}
          submitText="שמור שינויים"
          title="עריכת מתכון"
          isEdit={true}
        />
      </div>
    </div>
  );
};

export default EditRecipe;
