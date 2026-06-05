import React, {useState, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../context/AuthContext';

const Header = () => {
  const {user, logout: authLogout} = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const navigate = useNavigate();

  const fetchCartCount = async () => {
    try {
      const res = await axios.get('/api/cart');
      setCartItemsCount(res.data?.items?.length || 0);
    } catch (err) {
      console.error('Error fetching cart count:', err);
    }
  };

  const logout = () => {
    authLogout();
    setIsProfileOpen(false);
    navigate('/');
  };

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchCartCount();
    }
  }, [user]);

  const handleSearch = e => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // סגירת תפריטים בלחיצה מחוץ לאזור
  useEffect(() => {
    const handleClickOutside = () => {
      setIsProfileOpen(false);
      setIsAdminOpen(false);
    };
    if (isProfileOpen || isAdminOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isProfileOpen, isAdminOpen]);

  // Check if user has admin/poster permissions
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const canManage = ['poster', 'posteradmin', 'admin'].includes(
    user?.role?.toLowerCase(),
  );

  return (
    <header className="bg-slate-900 text-white shadow-2xl sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* לוגו */}
          <Link to="/" className="flex items-center space-x-3 space-x-reverse">
            <img
              src="https://raw.githubusercontent.com/lidormalich/RecipeMaster/refs/heads/main/client/public/logo192.png"
              alt="RecipeMaster Logo"
              className="h-10 w-10 lg:h-12 lg:w-12"
            />
            <span className="text-xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent hover:from-indigo-300 hover:to-purple-400 transition-all duration-300">
              RecipeMaster
            </span>
          </Link>

          {/* תפריט דסקטופ */}
          <nav className="hidden lg:flex items-center space-x-2 space-x-reverse">
            {/* חיפוש */}
            <form onSubmit={handleSearch} className="flex items-center ml-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="חפש מתכונים..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-64 px-4 py-2 pr-10 rounded-lg bg-slate-800 text-white border border-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-200"
                />
                <button
                  type="submit"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-indigo-400 transition-colors">
                  🔍
                </button>
              </div>
            </form>

            {user ? (
              <>
                {/* כפתור יצירת מתכון - רק ל-Poster, PosterAdmin, Admin */}
                {canManage && (
                  <Link
                    to="/create-recipe"
                    className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-200 hover:scale-105">
                    ➕ צור מתכון
                  </Link>
                )}

                <Link
                  to="/profile"
                  className="px-1 py-2 rounded-lg hover:bg-slate-800 transition-all duration-200 font-medium">
                  📖 המתכונים שלי
                </Link>
                <Link
                  to="/favorites"
                  className="px-1 py-2 rounded-lg hover:bg-slate-800 transition-all duration-200 font-medium">
                  ❤️ מועדפים
                </Link>

                {/* תפריט ניהול - לכל בעלי הרשאות */}
                {canManage && (
                  <div className="relative">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setIsAdminOpen(!isAdminOpen);
                        setIsProfileOpen(false);
                      }}
                      className="flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-lg hover:bg-slate-800 transition-all duration-200 font-medium">
                      <span>⚙️</span>
                      <span>ניהול</span>
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isAdminOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Admin Dropdown */}
                    {isAdminOpen && (
                      <div className="absolute left-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 overflow-hidden animate-fadeIn">
                        <div className="px-4 py-3 border-b border-slate-700 bg-slate-700/50">
                          <p className="font-semibold text-white flex items-center gap-2">
                            <span>⚙️</span>
                            פאנל ניהול
                          </p>
                        </div>

                        <Link
                          to="/manage-tags"
                          onClick={() => setIsAdminOpen(false)}
                          className="flex items-center space-x-3 space-x-reverse px-4 py-3 hover:bg-slate-700 transition-colors">
                          <span>🏷️</span>
                          <span>ניהול תגיות</span>
                        </Link>

                        {isAdmin && (
                          <>
                            <Link
                              to="/manage-users"
                              onClick={() => setIsAdminOpen(false)}
                              className="flex items-center space-x-3 space-x-reverse px-4 py-3 hover:bg-slate-700 transition-colors">
                              <span>👥</span>
                              <span>ניהול משתמשים</span>
                            </Link>

                            <Link
                              to="/admin/analytics"
                              onClick={() => setIsAdminOpen(false)}
                              className="flex items-center space-x-3 space-x-reverse px-4 py-3 hover:bg-slate-700 transition-colors border-t border-slate-700">
                              <span>📊</span>
                              <span>דשבורד אנליטיקה</span>
                            </Link>

                            <Link
                              to="/admin/groq-dashboard"
                              onClick={() => setIsAdminOpen(false)}
                              className="flex items-center space-x-3 space-x-reverse px-4 py-3 hover:bg-slate-700 transition-colors">
                              <span>🤖</span>
                              <span>ניטור AI (Groq)</span>
                            </Link>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* סל קניות עם Badge */}
                <Link
                  to="/cart"
                  className="relative p-2 rounded-lg hover:bg-slate-800 transition-all duration-200 group">
                  <span className="text-2xl group-hover:scale-110 transition-transform inline-block">
                    🛒
                  </span>
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-slate-900 ">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>

                {/* תפריט פרופיל עם Dropdown */}
                <div className="relative">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setIsProfileOpen(!isProfileOpen);
                      setIsAdminOpen(false);
                    }}
                    className="flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-lg hover:bg-slate-800 transition-all duration-200">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm">
                      {user.name?.[0]?.toUpperCase() || '👤'}
                    </div>
                    <span className="font-medium hidden xl:inline">
                      {user.name}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute left-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 overflow-hidden animate-fadeIn">
                      <div className="px-4 py-3 border-b border-slate-700">
                        <p className="text-sm text-slate-400">מחובר בתור</p>
                        <p className="font-semibold text-white truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-3 space-x-reverse px-4 py-3 hover:bg-slate-700 transition-colors">
                        <span>👤</span>
                        <span>הפרופיל שלי</span>
                      </Link>
                      <Link
                        to="/trash"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-3 space-x-reverse px-4 py-3 hover:bg-slate-700 transition-colors">
                        <span>🗑️</span>
                        <span>סל מיחזור</span>
                      </Link>
                      <button
                        onClick={logout}
                        className="w-full flex items-center space-x-3 space-x-reverse px-4 py-3 hover:bg-red-600 transition-colors border-t border-slate-700 text-red-400 hover:text-white">
                        <span>🚪</span>
                        <span>התנתקות</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* כפתורים לאורח */}
                <Link
                  to="/login"
                  className="px-5 py-2 rounded-lg hover:bg-slate-800 transition-all duration-200 font-medium">
                  התחברות
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-200 hover:scale-105">
                  הרשמה
                </Link>
              </>
            )}
          </nav>

          {/* כפתור תפריט המבורגר - מובייל */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* תפריט מובייל */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-800 animate-slideDown">
            {/* חיפוש במובייל */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="חפש מתכונים..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-lg bg-slate-800 text-white border border-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <button
                  type="submit"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  🔍
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {user ? (
                <>
                  {/* כפתור יצירת מתכון - רק ל-Poster, PosterAdmin, Admin */}
                  {canManage && (
                    <Link
                      to="/create-recipe"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold">
                      <span>➕</span>
                      <span>צור מתכון</span>
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                    <span>📖</span>
                    <span>המתכונים שלי</span>
                  </Link>
                  <Link
                    to="/favorites"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                    <span>❤️</span>
                    <span>מועדפים</span>
                  </Link>

                  {/* תפריט ניהול במובייל */}
                  {canManage && (
                    <div className="border-t border-slate-700 mt-2 pt-2">
                      <div className="px-4 py-2 text-sm text-slate-400 font-medium flex items-center gap-2">
                        <span>⚙️</span>
                        ניהול
                      </div>

                      <Link
                        to="/manage-tags"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                        <span>🏷️</span>
                        <span>ניהול תגיות</span>
                      </Link>

                      {isAdmin && (
                        <>
                          <Link
                            to="/manage-users"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                            <span>👥</span>
                            <span>ניהול משתמשים</span>
                          </Link>

                          <Link
                            to="/admin/analytics"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                            <span>📊</span>
                            <span>דשבורד אנליטיקה</span>
                          </Link>

                          <Link
                            to="/admin/groq-dashboard"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                            <span>🤖</span>
                            <span>ניטור AI (Groq)</span>
                          </Link>
                        </>
                      )}
                    </div>
                  )}

                  <Link
                    to="/cart"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <span className="text-xl">🛒</span>
                      <span className="font-medium">סל קניות</span>
                    </div>
                    {cartItemsCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                        {cartItemsCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/trash"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                    <span>🗑️</span>
                    <span>סל מיחזור</span>
                  </Link>

                  <div className="border-t border-slate-800 mt-2 pt-2">
                    <div className="px-4 py-2 text-sm text-slate-400">
                      {user.email}
                    </div>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg hover:bg-red-600 transition-colors text-red-400 hover:text-white">
                      <span>🚪</span>
                      <span>התנתקות</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-center font-medium">
                    התחברות
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold text-center">
                    הרשמה
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* סגנונות CSS לאנימציות */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 1000px;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </header>
  );
};

export default Header;
