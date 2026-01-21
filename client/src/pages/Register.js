import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {toast} from 'react-toastify';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {name, email, password} = formData;

  const onChange = e =>
    setFormData({...formData, [e.target.name]: e.target.value});

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/register', formData);
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['Authorization'] =
        `Bearer ${res.data.token}`;

      toast.success('נרשמת בהצלחה! ברוך הבא למשפחת RecipeMaster 🎉', {
        icon: '✅',
      });

      setTimeout(() => {
        navigate('/');
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error(err);

      // טיפול בשגיאות מפורט
      if (err.response) {
        const errorMsg = err.response.data?.msg || err.response.data?.message || 'שגיאה לא ידועה';

        if (err.response.status === 400) {
          if (errorMsg && errorMsg.includes && errorMsg.includes('exist')) {
            toast.error('המשתמש כבר קיים במערכת. נסה להתחבר', {
              icon: '👤',
            });
          } else {
            toast.error(`שגיאה: ${errorMsg}`, {
              icon: '⚠️',
            });
          }
        } else if (err.response.status === 422) {
          toast.error('נתונים לא תקינים. בדוק שכל השדות מלאים נכון', {
            icon: '📝',
          });
        } else {
          toast.error(`שגיאת שרת: ${errorMsg}`, {
            icon: '🔴',
          });
        }
      } else if (err.request) {
        toast.error('לא ניתן להתחבר לשרת. בדוק את החיבור לאינטרנט', {
          icon: '🌐',
        });
      } else {
        toast.error('שגיאה לא צפויה. אנא נסה שוב', {
          icon: '⚠️',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-8">הרשמה</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">שם</label>
          <input
            type="text"
            name="name"
            value={name}
            onChange={onChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            אימייל
          </label>
          <input
            type="email"
            name="email"
            value={email}
            onChange={onChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            סיסמה
          </label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={onChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-200">
          {loading ? 'נרשם...' : 'הרשם'}
        </button>
      </form>
      <p className="mt-4 text-center">
        כבר יש לך חשבון?{' '}
        <Link to="/login" className="text-blue-600">
          התחבר
        </Link>
      </p>
    </div>
  );
};

export default Register;
