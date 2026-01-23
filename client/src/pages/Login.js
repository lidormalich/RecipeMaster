import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {toast} from 'react-toastify';
import {useAuth} from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {login} = useAuth();

  const {email, password} = formData;

  const onChange = e =>
    setFormData({...formData, [e.target.name]: e.target.value});

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/login', formData);

      // Use AuthContext to handle login
      login(res.data.token);

      toast.success('התחברת בהצלחה! ברוך הבא 🎉', {
        icon: '✅',
      });

      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      console.error(err);

      // טיפול בשגיאות מפורט
      if (err.response) {
        // השרת החזיר תשובה עם שגיאה
        let errorMsg =
          err.response.data?.msg ||
          err.response.data?.message ||
          'שגיאה לא ידועה';

        // Handle express-validator errors
        if (
          err.response.data?.errors &&
          Array.isArray(err.response.data.errors)
        ) {
          errorMsg = err.response.data.errors
            .map(error => error.msg)
            .join(', ');
        }

        if (err.response.status === 400) {
          toast.error(`שגיאה: ${errorMsg}`, {
            icon: '⚠️',
          });
        } else if (err.response.status === 401) {
          toast.error('אימייל או סיסמה שגויים', {
            icon: '🔒',
          });
        } else if (err.response.status === 403) {
          toast.warning(errorMsg, {
            icon: '🚫',
          });
        } else if (err.response.status === 404) {
          toast.error('המשתמש לא קיים במערכת', {
            icon: '❌',
          });
        } else {
          toast.error(`שגיאת שרת: ${errorMsg}`, {
            icon: '🔴',
          });
        }
      } else if (err.request) {
        // הבקשה נשלחה אבל לא התקבלה תשובה
        toast.error('לא ניתן להתחבר לשרת. בדוק את החיבור לאינטרנט', {
          icon: '🌐',
        });
      } else {
        // שגיאה בהגדרת הבקשה
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
      <h1 className="text-3xl font-bold mb-8">התחברות</h1>
      <form onSubmit={onSubmit} className="space-y-4">
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
          {loading ? 'מתחבר...' : 'התחבר'}
        </button>
      </form>
      <p className="mt-4 text-center">
        אין לך חשבון?{' '}
        <Link to="/register" className="text-blue-600">
          הרשם
        </Link>
      </p>
      {/* <p className="mt-4 text-center">
        <a
          href="/api/auth/google"
          className="text-blue-600">
          התחבר עם גוגל
        </a>
      </p> */}
    </div>
  );
};

export default Login;
