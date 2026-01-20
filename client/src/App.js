import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RecipeDetail from './pages/RecipeDetail';
import CreateRecipe from './pages/CreateRecipe';
import Profile from './pages/Profile';
import AIWizard from './components/AIWizard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100" dir="rtl">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/recipe/:shortId" element={<RecipeDetail />} />
            <Route path="/create-recipe" element={<CreateRecipe />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/ai-wizard" element={<AIWizard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
