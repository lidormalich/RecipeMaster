import React, {useState, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import axios from 'axios';

const Header = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/me');
      setUser(res.data);
    } catch (err) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/');
  };

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = e => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          RecipeMaster
        </Link>
        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="חפש מתכונים..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-4 py-2 rounded text-black"
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 px-4 py-2 rounded">
            חפש
          </button>
        </form>
        <nav className="flex items-center space-x-4">
          <Link
            to="/ai-wizard"
            className="hover:text-blue-200 flex items-center space-x-2">
            <span>🤖</span>
            <span>מה לאכול?</span>
          </Link>
          {user ? (
            <>
              <Link to="/create-recipe" className="hover:text-blue-200">
                צור מתכון
              </Link>
              <Link to="/profile" className="hover:text-blue-200">
                פרופיל
              </Link>
              <button onClick={logout} className="hover:text-blue-200">
                התנתק
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-200">
                התחבר
              </Link>
              <Link to="/register" className="hover:text-blue-200">
                הרשם
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
