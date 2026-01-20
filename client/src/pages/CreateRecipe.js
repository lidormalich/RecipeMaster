import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';

const CreateRecipe = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ingredients: '',
    instructions: '',
    mainImage: '',
    videoUrl: '',
    tags: '',
    visibility: 'Public',
    allowComments: true,
  });
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

  const onChange = e =>
    setFormData({...formData, [e.target.name]: e.target.value});

  const uploadImage = () => {
    return new Promise((resolve, reject) => {
      setLoad(true);
      const formData = new FormData();
      formData.append('file', imageSelected[0]);
      formData.append('upload_preset', 'nnmxcowx');

      axios
        .post(
          'https://api.cloudinary.com/v1_1/ddk6cfhl0/image/upload',
          formData,
        )
        .then(response => {
          setLoad(false);
          resolve(response.data.secure_url);
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
    try {
      let recipeData = {
        ...formData,
        tags: tags.split(',').map(tag => tag.trim()),
      };
      if (imageSelected.length > 0) {
        const imageUrl = await uploadImage();
        recipeData.mainImage = imageUrl;
      }
      await axios.post('http://localhost:5000/api/recipes', recipeData);
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
        <div>
          <label className="block text-sm font-medium text-gray-700">
            תמונה ראשית
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setImageSelected(e.target.files)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
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
