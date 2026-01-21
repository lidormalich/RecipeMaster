import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {toast} from 'react-toastify';
import ImageUpload from '../components/ImageUpload';

const EditRecipe = () => {
  const {shortId} = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ingredients: '',
    instructions: '',
    mainImage: '',
    videoUrl: '',
    tags: '',
    visibility: 'Public',
    prepTime: '',
    dishType: '',
    difficulty: '',
    servings: '',
  });
  const [imageSelected, setImageSelected] = useState([]);
  const [load, setLoad] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    title,
    description,
    ingredients,
    instructions,
    mainImage,
    videoUrl,
    tags,
    visibility,
    prepTime,
    dishType,
    difficulty,
    servings,
  } = formData;

  useEffect(() => {
    fetchRecipe();
  }, [shortId]);

  const fetchRecipe = async () => {
    try {
      const res = await axios.get(`/api/recipes/${shortId}`);
      const recipe = res.data;

      // בדיקה שהמשתמש הוא הבעלים
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('עליך להתחבר כדי לערוך מתכון');
        navigate('/login');
        return;
      }

      const userRes = await axios.get('/api/auth/me', {
        headers: {Authorization: `Bearer ${token}`},
      });

      if (userRes.data._id !== recipe.author._id && userRes.data._id !== recipe.author) {
        toast.error('אין לך הרשאה לערוך מתכון זה', {icon: '🔒'});
        navigate(`/recipe/${shortId}`);
        return;
      }

      // מילוי הטופס עם נתוני המתכון
      setFormData({
        title: recipe.title || '',
        description: recipe.description || '',
        ingredients: recipe.ingredients || '',
        instructions: recipe.instructions || '',
        mainImage: recipe.mainImage || '',
        videoUrl: recipe.videoUrl || '',
        tags: recipe.tags?.map(t => t.name || t).join(', ') || '',
        visibility: recipe.visibility || 'Public',
        prepTime: recipe.prepTime || '',
        dishType: recipe.dishType || '',
        difficulty: recipe.difficulty || '',
        servings: recipe.servings || '',
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בטעינת המתכון');
      navigate('/');
    }
  };

  const onChange = e =>
    setFormData({...formData, [e.target.name]: e.target.value});

  const uploadImage = () => {
    return new Promise((resolve, reject) => {
      setLoad(true);
      const formData = new FormData();
      formData.append('image', imageSelected[0]);

      const token = localStorage.getItem('token');

      axios
        .post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        })
        .then(response => {
          setLoad(false);
          resolve(response.data.url);
        })
        .catch(e => {
          console.log(e);
          setLoad(false);
          reject(e);
        });
    });
  };

  const onSubmit = async e => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('עליך להתחבר כדי לערוך מתכון');
      navigate('/login');
      return;
    }

    try {
      let recipeData = {
        ...formData,
        tags: tags.split(',').map(tag => tag.trim()).filter(t => t),
      };

      if (imageSelected.length > 0) {
        const imageUrl = await uploadImage();
        recipeData.mainImage = imageUrl;
      }

      await axios.put(`/api/recipes/${shortId}`, recipeData, {
        headers: {Authorization: `Bearer ${token}`},
      });

      toast.success('המתכון עודכן בהצלחה! ✅');
      navigate(`/recipe/${shortId}`);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בעדכון המתכון');
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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">ערוך מתכון</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            כותרת
          </label>
          <input
            type="text"
            name="title"
            value={title}
            onChange={onChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            תיאור
          </label>
          <textarea
            name="description"
            value={description}
            onChange={onChange}
            required
            rows="3"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            רכיבים
          </label>
          <textarea
            name="ingredients"
            value={ingredients}
            onChange={onChange}
            required
            rows="6"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            הוראות הכנה
          </label>
          <textarea
            name="instructions"
            value={instructions}
            onChange={onChange}
            required
            rows="8"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              זמן הכנה (דקות)
            </label>
            <input
              type="number"
              name="prepTime"
              value={prepTime}
              onChange={onChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              מספר מנות
            </label>
            <input
              type="number"
              name="servings"
              value={servings}
              onChange={onChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              סוג מנה
            </label>
            <select
              name="dishType"
              value={dishType}
              onChange={onChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option value="">בחר...</option>
              <option value="ראשונה">ראשונה</option>
              <option value="עיקרית">עיקרית</option>
              <option value="קינוח">קינוח</option>
              <option value="חטיף">חטיף</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              רמת קושי
            </label>
            <select
              name="difficulty"
              value={difficulty}
              onChange={onChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
              <option value="">בחר...</option>
              <option value="קל">קל</option>
              <option value="בינוני">בינוני</option>
              <option value="מתקדם">מתקדם</option>
            </select>
          </div>
        </div>

        <ImageUpload
          onImageSelect={setImageSelected}
          currentImage={mainImage}
          loading={load}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700">
            קישור לוידאו
          </label>
          <input
            type="url"
            name="videoUrl"
            value={videoUrl}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            תגיות (מופרדות בפסיק)
          </label>
          <input
            type="text"
            name="tags"
            value={tags}
            onChange={onChange}
            placeholder="איטלקי, פסטה, צמחוני"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            נראות
          </label>
          <select
            name="visibility"
            value={visibility}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            <option value="Public">ציבורי</option>
            <option value="Shared">משותף</option>
            <option value="Private">פרטי</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={load}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-200">
            {load ? 'מעלה תמונה...' : 'שמור שינויים'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/recipe/${shortId}`)}
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-all duration-200">
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditRecipe;
