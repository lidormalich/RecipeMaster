import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {toast} from 'react-toastify';
import ImageUpload from './ImageUpload';
import TagSelector from './TagSelector';

// פונקציה לדחיסת תמונה
const compressImage = (
  file,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8,
) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let {width, height} = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          blob => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              console.log(
                `Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
              );
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality,
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

const RecipeForm = ({
  initialData = null,
  onSubmit,
  submitText = 'שמור',
  title = 'מתכון',
  isEdit = false,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ingredients: '',
    instructions: '',
    mainImage: '',
    videoUrl: '',
    tags: [],
    visibility: 'Public',
    prepTime: '',
    dishType: '',
    difficulty: '',
    servings: '',
  });

  const [imageSelected, setImageSelected] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [generatingTags, setGeneratingTags] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        ingredients: initialData.ingredients || '',
        instructions: initialData.instructions || '',
        mainImage: initialData.mainImage || '',
        videoUrl: initialData.videoUrl || '',
        tags: Array.isArray(initialData.tags) ? initialData.tags : [],
        visibility: initialData.visibility || 'Public',
        prepTime: initialData.prepTime || '',
        dishType: initialData.dishType || '',
        difficulty: initialData.difficulty || '',
        servings: initialData.servings || '',
      });
    }
  }, [initialData]);

  useEffect(() => {
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await axios.get('/api/auth/me', {
        headers: {Authorization: `Bearer ${token}`},
      });
      setUserRole(res.data.role);
    } catch (err) {
      console.error('Error fetching user role:', err);
    }
  };

  const onChange = e => {
    const {name, value, type, checked} = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleTagsChange = newTags => {
    setFormData({...formData, tags: newTags});
  };

  const generateTagsWithAI = async () => {
    if (!formData.title || !formData.ingredients) {
      toast.warning('יש למלא כותרת ורכיבים לפני יצירת תגיות אוטומטית');
      return;
    }

    setGeneratingTags(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        '/api/tags/generate-ai',
        {
          title: formData.title,
          description: formData.description,
          ingredients: formData.ingredients,
          instructions: formData.instructions,
        },
        {headers: {Authorization: `Bearer ${token}`}}
      );

      const {suggestedTags, createdTags} = res.data;

      if (suggestedTags && suggestedTags.length > 0) {
        // Merge with existing tags (avoid duplicates)
        const existingTagIds = formData.tags.map(id => Number(id));
        const newTagIds = suggestedTags
          .map(t => Number(t.globalId))
          .filter(id => !existingTagIds.includes(id));

        setFormData({
          ...formData,
          tags: [...formData.tags, ...newTagIds],
        });

        // Show different message based on whether new tags were created
        if (createdTags && createdTags.length > 0) {
          toast.success(`נוספו ${newTagIds.length} תגיות (${createdTags.length} חדשות נוצרו)! 🏷️✨`);
        } else {
          toast.success(`נוספו ${newTagIds.length} תגיות אוטומטית! 🏷️`);
        }
      } else {
        toast.info('לא נמצאו תגיות מתאימות');
      }
    } catch (err) {
      console.error('Error generating tags:', err);
      toast.error('שגיאה ביצירת תגיות אוטומטית');
    } finally {
      setGeneratingTags(false);
    }
  };

  const uploadImage = async () => {
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const originalFile = imageSelected[0];

      console.log(
        `Original image size: ${(originalFile.size / 1024 / 1024).toFixed(2)}MB`,
      );

      let fileToUpload = originalFile;
      try {
        if (
          originalFile.size > 1024 * 1024 ||
          originalFile.type.startsWith('image/')
        ) {
          fileToUpload = await compressImage(originalFile, 1920, 1080, 0.85);
        }
      } catch (compressError) {
        console.warn(
          'Image compression failed, using original:',
          compressError,
        );
        fileToUpload = originalFile;
      }

      if (fileToUpload.size > 5 * 1024 * 1024) {
        console.log('File still too large, trying more compression...');
        fileToUpload = await compressImage(originalFile, 1280, 720, 0.6);
      }

      const uploadData = new FormData();
      uploadData.append('image', fileToUpload);

      const response = await axios.post('/api/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setUploading(false);
      return response.data.url;
    } catch (e) {
      console.error('Upload error:', e);
      setUploading(false);
      toast.error('שגיאה בהעלאת התמונה');
      throw e;
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      let recipeData = {
        ...formData,
        tags: Array.isArray(formData.tags) ? formData.tags : [],
      };

      if (imageSelected.length > 0) {
        const imageUrl = await uploadImage();
        recipeData.mainImage = imageUrl;
      }

      await onSubmit(recipeData);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* כותרת */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          כותרת *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={onChange}
          required
          placeholder="שם המתכון"
          className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* תיאור */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          תיאור *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={onChange}
          required
          rows="3"
          placeholder="תיאור קצר של המתכון"
          className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* רכיבים */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          רכיבים *
        </label>
        <textarea
          name="ingredients"
          value={formData.ingredients}
          onChange={onChange}
          required
          rows="6"
          placeholder="רכיב אחד בכל שורה..."
          className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          הכנס רכיב אחד בכל שורה עם הכמות
        </p>
      </div>

      {/* הוראות הכנה */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          הוראות הכנה *
        </label>
        <textarea
          name="instructions"
          value={formData.instructions}
          onChange={onChange}
          required
          rows="8"
          placeholder="הוראות ההכנה שלב אחרי שלב..."
          className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* תמונה */}
      <div>
        <ImageUpload
          onImageSelect={setImageSelected}
          currentImage={formData.mainImage}
          loading={uploading}
        />
      </div>

      {/* פרטי המתכון - Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            זמן הכנה (דקות)
          </label>
          <input
            type="number"
            name="prepTime"
            value={formData.prepTime}
            onChange={onChange}
            min="0"
            placeholder="30"
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            מספר מנות
          </label>
          <input
            type="number"
            name="servings"
            value={formData.servings}
            onChange={onChange}
            min="1"
            placeholder="4"
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            סוג מנה
          </label>
          <select
            name="dishType"
            value={formData.dishType}
            onChange={onChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">בחר...</option>
            <option value="ראשונה">ראשונה</option>
            <option value="עיקרית">עיקרית</option>
            <option value="קינוח">קינוח</option>
            <option value="חטיף">חטיף</option>
            <option value="סלט">סלט</option>
            <option value="מרק">מרק</option>
            <option value="לחם">לחם</option>
            <option value="תוספת">תוספת</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            רמת קושי
          </label>
          <select
            name="difficulty"
            value={formData.difficulty}
            onChange={onChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">בחר...</option>
            <option value="קל">קל</option>
            <option value="בינוני">בינוני</option>
            <option value="קשה">קשה</option>
            <option value="מתקדם">מתקדם</option>
          </select>
        </div>
      </div>

      {/* קישור לוידאו */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          קישור לוידאו (אופציונלי)
        </label>
        <input
          type="url"
          name="videoUrl"
          value={formData.videoUrl}
          onChange={onChange}
          placeholder="https://youtube.com/..."
          className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* תגיות */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            תגיות
          </label>
          <button
            type="button"
            onClick={generateTagsWithAI}
            disabled={generatingTags || !formData.title || !formData.ingredients}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md">
            {generatingTags ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                מייצר תגיות...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                יצירת תגיות אוטומטית
              </>
            )}
          </button>
        </div>
        <TagSelector
          selectedTags={formData.tags}
          onTagsChange={handleTagsChange}
          userRole={userRole}
        />
      </div>

      {/* נראות */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          נראות
        </label>
        <select
          name="visibility"
          value={formData.visibility}
          onChange={onChange}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option value="Public">ציבורי - כולם יכולים לראות</option>
          <option value="Shared">משותף - רק מי שקיבל קישור</option>
          <option value="Private">פרטי - רק אני</option>
        </select>
      </div>

      {/* כפתור שליחה */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={uploading}
          className="w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
          {uploading ? 'מעלה תמונה...' : submitText}
        </button>
      </div>
    </form>
  );
};

export default RecipeForm;
