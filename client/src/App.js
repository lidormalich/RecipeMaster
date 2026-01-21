import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {AuthProvider} from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RecipeDetail from './pages/RecipeDetail';
import CreateRecipe from './pages/CreateRecipe';
import EditRecipe from './pages/EditRecipe';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import ManageUsers from './pages/ManageUsers';
import ManageTags from './pages/ManageTags';
import AIWizard from './components/AIWizard';
import AIAssistant from './components/AIAssistant';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100" dir="rtl">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/recipe/:shortId" element={<RecipeDetail />} />
              <Route path="/recipe/:shortId/edit" element={<EditRecipe />} />
              <Route path="/create-recipe" element={<CreateRecipe />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/manage-users" element={<ManageUsers />} />
              <Route path="/manage-tags" element={<ManageTags />} />
              <Route path="/ai-wizard" element={<AIWizard />} />
            </Routes>
          </main>

          {/* Toast Notifications */}
          <ToastContainer
            position="top-center"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={true}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />

          {/* AI Assistant - כפתור צף */}
          <AIAssistant />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
