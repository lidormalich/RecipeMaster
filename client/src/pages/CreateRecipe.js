import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import {toast} from 'react-toastify';
import ImageUpload from '../components/ImageUpload';
import TagSelector from '../components/TagSelector';

// פונקציה לדחיסת תמונה
const compressImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let {width, height} = img;

        // חישוב הגודל החדש תוך שמירה על יחס
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
              // יצירת קובץ חדש מה-blob
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

const CreateRecipe = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ingredients: '',
    instructions: '',
    mainImage: '',
    videoUrl: '',
    tags: [],
    visibility: 'Public',
    allowComments: true,
  });
  const [userRole, setUserRole] = useState(null);
  const [imageSelected, setImageSelected] = useState([]);
  const [load, setLoad] = useState(false);
  const navigate = useNavigate();

  const {
    title,
    description,
    ingredients,
    instructions,
    mainImage,
    videoUrl,
    tags,
    visibility,
    allowComments,
  } = formData;

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

  const onChange = e =>
    setFormData({...formData, [e.target.name]: e.target.value});

  const handleTagsChange = newTags => {
    setFormData({...formData, tags: newTags});
  };

  const uploadImage = async () => {
    setLoad(true);
    try {
      const token = localStorage.getItem('token');
      const originalFile = imageSelected[0];

      console.log(
        `Original image size: ${(originalFile.size / 1024 / 1024).toFixed(2)}MB`,
      );

      // דחיסת התמונה לפני העלאה
      let fileToUpload = originalFile;
      try {
        // דוחס תמונות מעל 1MB או עם רזולוציה גבוהה
        if (originalFile.size > 1024 * 1024 || originalFile.type.startsWith('image/')) {
          fileToUpload = await compressImage(originalFile, 1920, 1080, 0.85);
        }
      } catch (compressError) {
        console.warn('Image compression failed, using original:', compressError);
        fileToUpload = originalFile;
      }

      // בדיקה שהקובץ לא גדול מדי גם אחרי דחיסה
      if (fileToUpload.size > 5 * 1024 * 1024) {
        // ניסיון דחיסה נוספת עם איכות נמוכה יותר
        console.log('File still too large, trying more compression...');
        fileToUpload = await compressImage(originalFile, 1280, 720, 0.6);
      }

      const formData = new FormData();
      formData.append('image', fileToUpload);

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setLoad(false);
      return response.data.url;
    } catch (e) {
      console.error('Upload error:', e);
      setLoad(false);
      toast.error('שגיאה בהעלאת התמונה');
      throw e;
    }
  };

  const onSubmit = async e => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      alert('עליך להתחבר כדי ליצור מתכון');
      navigate('/login');
      return;
    }

    try {
      let recipeData = {
        ...formData,
        tags: Array.isArray(tags) ? tags : [],
      };
      if (imageSelected.length > 0) {
        const imageUrl = await uploadImage();
        recipeData.mainImage = imageUrl;
      }
      await axios.post('/api/recipes', recipeData, {
        headers: {Authorization: `Bearer ${token}`},
      });
      toast.success('המתכון נוצר בהצלחה! ✅');
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">צור מתכון</h1>
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
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            תגיות
          </label>
          <TagSelector
            selectedTags={tags}
            onTagsChange={handleTagsChange}
            userRole={userRole}
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
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
          צור מתכון
        </button>
      </form>
    </div>
  );
};

export default CreateRecipe;
