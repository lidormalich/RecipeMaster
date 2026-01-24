import React, {useState, useRef, useEffect} from 'react';
import axios from 'axios';
import {toast} from 'react-toastify';
import {useNavigate} from 'react-router-dom';

const AIAssistant = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('chat'); // 'chat' | 'ingredients' | 'tags'
  const [query, setQuery] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [aiMessage, setAiMessage] = useState('');
  const inputRef = useRef(null);

  // Tags mode state
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Quick suggestions for chat mode
  const quickSuggestions = [
    {text: 'משהו מהיר לארוחת ערב', icon: '⚡'},
    {text: 'מתכון קל לילדים', icon: '👶'},
    {text: 'אוכל בריא וקל', icon: '🥗'},
    {text: 'קינוח מתוק', icon: '🍰'},
  ];

  // Common ingredients for quick add
  const commonIngredients = [
    'עוף', 'בשר', 'דג', 'ביצים', 'אורז', 'פסטה',
    'עגבניות', 'בצל', 'שום', 'גבינה', 'חלב', 'קמח'
  ];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, mode]);

  // Load available tags when tags mode is selected
  useEffect(() => {
    if (mode === 'tags' && availableTags.length === 0) {
      loadAvailableTags();
    }
  }, [mode]);

  const loadAvailableTags = async () => {
    setTagsLoading(true);
    try {
      const res = await axios.get('/api/recipes/available-tags');
      setAvailableTags(res.data);
      // Expand first category by default
      if (res.data.length > 0) {
        setExpandedCategories({[res.data[0].category]: true});
      }
    } catch (err) {
      console.error('Error loading tags:', err);
      toast.error('שגיאה בטעינת התגיות');
    } finally {
      setTagsLoading(false);
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleTag = (globalId, tagName) => {
    setSelectedTags(prev => {
      const exists = prev.find(t => t.globalId === globalId);
      if (exists) {
        return prev.filter(t => t.globalId !== globalId);
      }
      return [...prev, {globalId, name: tagName}];
    });
  };

  const handleSearch = async (customQuery = null) => {
    const searchQuery = customQuery || query;

    if (mode === 'chat' && !searchQuery.trim()) {
      toast.warning('הקלד מה אתה מחפש');
      return;
    }

    if (mode === 'ingredients' && ingredients.length === 0) {
      toast.warning('הוסף לפחות רכיב אחד');
      return;
    }

    setLoading(true);
    setResults(null);
    setAiMessage('');

    try {
      const res = await axios.post('/api/recipes/ai-recommend', {
        query: searchQuery,
        mode: mode,
        ingredients: mode === 'ingredients' ? ingredients : [],
      });

      setResults(res.data.recipes || []);
      setAiMessage(res.data.aiResponse || '');

      if (res.data.recipes?.length === 0) {
        toast.info('לא מצאתי מתכונים מתאימים, נסה חיפוש אחר');
      }
    } catch (err) {
      console.error('AI Search error:', err);
      toast.error('שגיאה בחיפוש');
    } finally {
      setLoading(false);
    }
  };

  const handleTagSearch = async () => {
    if (selectedTags.length === 0) {
      toast.warning('בחר לפחות תגית אחת');
      return;
    }

    setLoading(true);
    setResults(null);
    setAiMessage('');

    try {
      const res = await axios.post('/api/recipes/search-by-tags', {
        tags: selectedTags.map(t => t.globalId),
      });

      setResults(res.data.recipes || []);
      setAiMessage(res.data.message || '');

      if (res.data.partialMatch) {
        toast.info('לא נמצאו מתכונים עם כל התגיות');
      }
    } catch (err) {
      console.error('Tag search error:', err);
      toast.error('שגיאה בחיפוש');
    } finally {
      setLoading(false);
    }
  };

  const handleSurprise = async () => {
    setLoading(true);
    setResults(null);
    setAiMessage('');

    try {
      const res = await axios.post('/api/recipes/ai-recommend', {
        mode: 'surprise',
      });

      setResults(res.data.recipes || []);
      setAiMessage(res.data.aiResponse || 'הנה כמה הפתעות!');
    } catch (err) {
      console.error('Surprise error:', err);
      toast.error('שגיאה');
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = (ingredient) => {
    const trimmed = ingredient.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
      setIngredientInput('');
    }
  };

  const removeIngredient = (ingredient) => {
    setIngredients(ingredients.filter(i => i !== ingredient));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (mode === 'ingredients' && ingredientInput.trim()) {
        e.preventDefault();
        addIngredient(ingredientInput);
      } else if (mode === 'chat') {
        e.preventDefault();
        handleSearch();
      }
    }
  };

  const resetAll = () => {
    setQuery('');
    setIngredients([]);
    setIngredientInput('');
    setSelectedTags([]);
    setResults(null);
    setAiMessage('');
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const goToRecipe = (shortId) => {
    closeModal();
    navigate(`/recipe/${shortId}`);
  };

  // Category icons mapping
  const categoryIcons = {
    'סוג מנה': '🍽️',
    'זמן הכנה': '⏱️',
    'רמת קושי': '📊',
    'מטבח': '🌍',
    'תזונה': '🥗',
    'עונה': '🌸',
    'אירוע': '🎉',
    'מרכיב עיקרי': '🥩',
    'שיטת בישול': '🔥',
    'בריאות': '💚',
    'לילדים': '👶',
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 group"
        aria-label="AI Assistant">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
          <div className="relative bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2 border-2 border-transparent group-hover:border-cyan-400">
            <span className="text-xl">🤖</span>
            <span className="font-semibold text-sm">שף AI</span>
          </div>
        </div>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeModal}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

          <div
            className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scaleIn"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <span>🤖</span>
                    <span>שף AI - מה נבשל היום?</span>
                  </h2>
                  <p className="text-white/80 text-sm mt-1">
                    ספר לי מה בא לך ואמצא לך את המתכון המושלם
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mode Tabs */}
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => { setMode('chat'); resetAll(); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    mode === 'chat'
                      ? 'bg-white text-purple-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}>
                  💬 שיחה חופשית
                </button>
                <button
                  onClick={() => { setMode('ingredients'); resetAll(); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    mode === 'ingredients'
                      ? 'bg-white text-purple-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}>
                  🧊 מה יש במקרר?
                </button>
                <button
                  onClick={() => { setMode('tags'); resetAll(); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    mode === 'tags'
                      ? 'bg-white text-purple-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}>
                  🏷️ חיפוש לפי תגיות
                </button>
                <button
                  onClick={handleSurprise}
                  disabled={loading}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-yellow-400 text-yellow-900 hover:bg-yellow-300 transition-all disabled:opacity-50">
                  🎲 הפתע אותי!
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Chat Mode */}
              {mode === 'chat' && !results && (
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="למשל: משהו מהיר עם עוף, ארוחה בריאה..."
                      className="w-full px-5 py-4 pr-12 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-lg"
                    />
                    <button
                      onClick={() => handleSearch()}
                      disabled={loading || !query.trim()}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-purple-600 text-white p-2 rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-all">
                      {loading ? (
                        <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Quick Suggestions */}
                  <div>
                    <p className="text-sm text-gray-500 mb-2">או נסה:</p>
                    <div className="flex flex-wrap gap-2">
                      {quickSuggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setQuery(suggestion.text);
                            handleSearch(suggestion.text);
                          }}
                          className="px-4 py-2 bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 rounded-full text-sm transition-all">
                          {suggestion.icon} {suggestion.text}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Ingredients Mode */}
              {mode === 'ingredients' && !results && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      אילו רכיבים יש לך?
                    </label>
                    <div className="flex gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={ingredientInput}
                        onChange={(e) => setIngredientInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="הקלד רכיב והקש Enter..."
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 transition-all"
                      />
                      <button
                        onClick={() => addIngredient(ingredientInput)}
                        disabled={!ingredientInput.trim()}
                        className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-all">
                        הוסף
                      </button>
                    </div>
                  </div>

                  {/* Quick Add */}
                  <div>
                    <p className="text-sm text-gray-500 mb-2">הוספה מהירה:</p>
                    <div className="flex flex-wrap gap-2">
                      {commonIngredients.filter(i => !ingredients.includes(i)).slice(0, 8).map((ing, i) => (
                        <button
                          key={i}
                          onClick={() => addIngredient(ing)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-700 rounded-full text-sm transition-all">
                          + {ing}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Ingredients */}
                  {ingredients.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        הרכיבים שלך ({ingredients.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ingredients.map((ing, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm">
                            {ing}
                            <button
                              onClick={() => removeIngredient(ing)}
                              className="hover:text-purple-900">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Button */}
                  <button
                    onClick={() => handleSearch()}
                    disabled={loading || ingredients.length === 0}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        מחפש מתכונים...
                      </>
                    ) : (
                      <>
                        <span>🔍</span>
                        מצא מתכונים
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Tags Mode */}
              {mode === 'tags' && !results && (
                <div className="space-y-4">
                  {tagsLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin text-4xl mb-2">🏷️</div>
                      <p className="text-gray-600">טוען תגיות...</p>
                    </div>
                  ) : availableTags.length === 0 ? (
                    <div className="text-center py-8">
                      <span className="text-5xl mb-4 block">😕</span>
                      <p className="text-gray-600">אין תגיות זמינות</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-2">
                        בחר תגיות כדי למצוא מתכונים מתאימים:
                      </p>

                      {/* Selected Tags Display */}
                      {selectedTags.length > 0 && (
                        <div className="bg-purple-50 rounded-xl p-3">
                          <p className="text-sm font-medium text-purple-700 mb-2">
                            נבחרו {selectedTags.length} תגיות:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedTags.map((tag) => (
                              <span
                                key={tag.globalId}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-full text-sm">
                                {tag.name}
                                <button
                                  onClick={() => toggleTag(tag.globalId, tag.name)}
                                  className="hover:text-purple-200">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Categories Accordion */}
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {availableTags.map((category) => (
                          <div key={category.category} className="border border-gray-200 rounded-xl overflow-hidden">
                            <button
                              onClick={() => toggleCategory(category.category)}
                              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors">
                              <span className="font-medium text-gray-700 flex items-center gap-2">
                                <span>{categoryIcons[category.category] || '📌'}</span>
                                {category.category}
                                <span className="text-sm text-gray-400">({category.tags.length})</span>
                              </span>
                              <svg
                                className={`w-5 h-5 text-gray-400 transition-transform ${expandedCategories[category.category] ? 'rotate-180' : ''}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {expandedCategories[category.category] && (
                              <div className="p-3 bg-white">
                                <div className="flex flex-wrap gap-2">
                                  {category.tags.map((tag) => {
                                    const isSelected = selectedTags.some(t => t.globalId === tag.globalId);
                                    return (
                                      <button
                                        key={tag.globalId}
                                        onClick={() => toggleTag(tag.globalId, tag.name)}
                                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                                          isSelected
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
                                        }`}>
                                        {isSelected && '✓ '}{tag.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Search Button */}
                      <button
                        onClick={handleTagSearch}
                        disabled={loading || selectedTags.length === 0}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            מחפש מתכונים...
                          </>
                        ) : (
                          <>
                            <span>🔍</span>
                            מצא מתכונים ({selectedTags.length} תגיות)
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Loading State */}
              {loading && !results && (
                <div className="text-center py-12">
                  <div className="inline-block animate-bounce text-6xl mb-4">👨‍🍳</div>
                  <p className="text-gray-600 text-lg">השף AI מחפש עבורך...</p>
                </div>
              )}

              {/* Results */}
              {results && (
                <div className="space-y-4">
                  {/* AI Message */}
                  {aiMessage && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🤖</span>
                        <p className="text-gray-700">{aiMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Recipe Cards */}
                  {results.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-800">
                        מצאתי {results.length} מתכונים:
                      </h3>
                      {results.map((recipe, index) => (
                        <button
                          key={recipe._id || index}
                          onClick={() => goToRecipe(recipe.shortId)}
                          className="w-full text-right p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-purple-300 hover:shadow-lg transition-all group">
                          <div className="flex items-center gap-4">
                            {recipe.mainImage ? (
                              <img
                                src={recipe.mainImage}
                                alt={recipe.title}
                                className="w-20 h-20 object-cover rounded-xl"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                                {index + 1}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-lg text-gray-800 group-hover:text-purple-600 transition-colors truncate">
                                {recipe.title}
                              </h4>
                              <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                                {recipe.description}
                              </p>
                              {recipe.populatedTags && recipe.populatedTags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {recipe.populatedTags.slice(0, 3).map((tag, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                      {tag.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <svg className="w-6 h-6 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <span className="text-5xl mb-4 block">😕</span>
                      <p className="text-gray-600">לא מצאתי מתכונים מתאימים</p>
                      <p className="text-gray-400 text-sm mt-1">נסה חיפוש אחר</p>
                    </div>
                  )}

                  {/* Search Again Button */}
                  <button
                    onClick={resetAll}
                    className="w-full py-3 text-purple-600 hover:text-purple-800 font-medium transition-colors">
                    🔄 חיפוש חדש
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default AIAssistant;
