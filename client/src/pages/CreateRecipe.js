import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import {toast} from 'react-toastify';
import RecipeForm from '../components/RecipeForm';
import FacebookImportModal from '../components/FacebookImportModal';

const CreateRecipe = () => {
  const navigate = useNavigate();
  const [showImport, setShowImport] = useState(false);
  const [importedData, setImportedData] = useState(null);

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

  const handleImport = data => {
    // מזרים את המתכון המחולץ לטופס למילוי מראש (אובייקט חדש -> מרענן את הטופס)
    setImportedData({...data});
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">
        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          ✨ צור מתכון חדש
        </span>
      </h1>
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        {/* באנר ייבוא מפייסבוק - ממלא את כל הטופס, לכן ממוקם מעל השדות */}
        <button
          type="button"
          onClick={() => setShowImport(true)}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200">
          <span>📋</span>
          <span>ייבוא מתכון מקישור פייסבוק</span>
        </button>
        <div className="flex items-center gap-3 my-4 text-gray-400 text-sm">
          <span className="flex-1 h-px bg-gray-200" />
          <span>או מלא ידנית</span>
          <span className="flex-1 h-px bg-gray-200" />
        </div>

        <RecipeForm
          initialData={importedData}
          onSubmit={handleSubmit}
          submitText="צור מתכון"
          title="צור מתכון"
        />
      </div>

      <FacebookImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
      />
    </div>
  );
};

export default CreateRecipe;
