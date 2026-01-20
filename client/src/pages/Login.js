import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const navigate = useNavigate();

  const {email, password} = formData;

  const onChange = e =>
    setFormData({...formData, [e.target.name]: e.target.value});

  const onSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post(
        'http://localhost:5000/api/auth/login',
        formData,
      );
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['Authorization'] =
        `Bearer ${res.data.token}`;
      navigate('/');
    } catch (err) {
      console.error(err);
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
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
          התחבר
        </button>
      </form>
      <p className="mt-4 text-center">
        אין לך חשבון?{' '}
        <Link to="/register" className="text-blue-600">
          הרשם
        </Link>
      </p>
      <p className="mt-4 text-center">
        <a
          href="http://localhost:5000/api/auth/google"
          className="text-blue-600">
          התחבר עם גוגל
        </a>
      </p>
    </div>
  );
};

export default Login;
