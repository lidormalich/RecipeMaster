import React, {useState, useEffect, useRef} from 'react';
import axios from 'axios';
import {toast} from 'react-toastify';

const TagSelector = ({selectedTags, onTagsChange, userRole}) => {
  const [allTags, setAllTags] = useState([]);
  const [filteredTags, setFilteredTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const isAdminOrPoster = userRole === 'Admin' || userRole === 'Poster';

  useEffect(() => {
    fetchAllTags();
  }, []);

  useEffect(() => {
    if (selectedTags.length > 0) {
      fetchRecommendations();
    }
  }, [selectedTags]);

  useEffect(() => {
    // Filter tags based on search query
    if (searchQuery.trim() === '') {
      setFilteredTags([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = [];

    allTags.forEach(category => {
      const matchingTags = category.tags.filter(
        tag =>
          tag.he.toLowerCase().includes(query) ||
          (tag.en && tag.en.toLowerCase().includes(query))
      );

      if (matchingTags.length > 0) {
        results.push({
          category: category.category,
          tags: matchingTags,
        });
      }
    });

    setFilteredTags(results);
  }, [searchQuery, allTags]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAllTags = async () => {
    try {
      const res = await axios.get('/api/tags');
      setAllTags(res.data);
    } catch (err) {
      console.error('Error fetching tags:', err);
      toast.error('שגיאה בטעינת התגיות');
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await axios.get('/api/tags/recommend', {
        params: {selectedTags: selectedTags.join(',')},
      });
      setRecommendations(res.data);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    }
  };

  const handleInputChange = e => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(true);
  };

  const handleInputKeyDown = async e => {
    // Handle comma press for quick tag creation (Admin/Poster only)
    if (e.key === ',' && isAdminOrPoster) {
      e.preventDefault();

      const tagName = searchQuery.trim();
      if (tagName === '') return;

      await createQuickTag(tagName);
    } else if (e.key === 'Enter') {
      e.preventDefault();

      // Select first filtered tag
      if (filteredTags.length > 0 && filteredTags[0].tags.length > 0) {
        handleTagSelect(filteredTags[0].tags[0].globalId);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const createQuickTag = async tagName => {
    setIsCreating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        '/api/tags/quick',
        {tagName, category: 'כללי'},
        {headers: {Authorization: `Bearer ${token}`}}
      );

      const {tag, isNew} = res.data;

      if (isNew) {
        toast.success(`תגית חדשה נוצרה: ${tag.he} ✨`, {icon: '🏷️'});
      }

      // Add tag to selected
      if (!selectedTags.includes(tag.globalId)) {
        onTagsChange([...selectedTags, tag.globalId]);
      }

      // Refresh tags list
      await fetchAllTags();

      setSearchQuery('');
      setShowDropdown(false);
    } catch (err) {
      console.error('Error creating tag:', err);
      toast.error('שגיאה ביצירת תגית חדשה');
    } finally {
      setIsCreating(false);
    }
  };

  const handleTagSelect = globalId => {
    if (selectedTags.includes(globalId)) {
      // Remove tag
      onTagsChange(selectedTags.filter(id => id !== globalId));
    } else {
      // Add tag
      onTagsChange([...selectedTags, globalId]);
    }

    setSearchQuery('');
    setShowDropdown(false);
    inputRef.current.focus();
  };

  const handleRecommendationClick = globalId => {
    if (!selectedTags.includes(globalId)) {
      onTagsChange([...selectedTags, globalId]);
    }
  };

  const removeTag = globalId => {
    onTagsChange(selectedTags.filter(id => id !== globalId));
  };

  const getTagDisplay = globalId => {
    for (const category of allTags) {
      const tag = category.tags.find(t => t.globalId === globalId);
      if (tag) {
        return {he: tag.he, category: category.category};
      }
    }
    return {he: globalId, category: ''};
  };

  return (
    <div className="space-y-4">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(globalId => {
            const {he, category} = getTagDisplay(globalId);
            return (
              <div
                key={globalId}
                className="inline-flex items-center space-x-1 space-x-reverse px-3 py-1.5 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium hover:bg-indigo-200 transition-colors">
                <span>{he}</span>
                {category && (
                  <span className="text-xs text-indigo-600">({category})</span>
                )}
                <button
                  type="button"
                  onClick={() => removeTag(globalId)}
                  className="mr-1 text-indigo-600 hover:text-indigo-900">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setShowDropdown(true)}
          placeholder={
            isAdminOrPoster
              ? 'חפש תגיות או הקלד והקש פסיק (,) ליצירת תגית חדשה'
              : 'חפש והוסף תגיות'
          }
          disabled={isCreating}
          className="mt-1 block w-full px-4 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:bg-gray-100"
        />

        {isCreating && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg
              className="animate-spin h-5 w-5 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}

        {/* Dropdown */}
        {showDropdown && filteredTags.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-2xl border-2 border-gray-200 max-h-96 overflow-y-auto">
            {filteredTags.map((category, catIndex) => (
              <div key={catIndex} className="p-2">
                <div className="text-xs font-bold text-gray-500 uppercase px-3 py-2">
                  {category.category}
                </div>
                <div className="space-y-1">
                  {category.tags.map(tag => {
                    const isSelected = selectedTags.includes(tag.globalId);
                    return (
                      <button
                        key={tag.globalId}
                        type="button"
                        onClick={() => handleTagSelect(tag.globalId)}
                        className={`w-full text-right px-4 py-2 rounded-md transition-colors ${
                          isSelected
                            ? 'bg-indigo-100 text-indigo-800 font-medium'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}>
                        <div className="flex items-center justify-between">
                          <span>{tag.he}</span>
                          {isSelected && (
                            <svg
                              className="w-5 h-5 text-indigo-600"
                              fill="currentColor"
                              viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        {tag.en && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {tag.en}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-indigo-200">
          <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <svg
              className="w-5 h-5 ml-2 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            תגיות מומלצות
          </div>
          <div className="flex flex-wrap gap-2">
            {recommendations.map(tag => (
              <button
                key={tag.globalId}
                type="button"
                onClick={() => handleRecommendationClick(tag.globalId)}
                className="inline-flex items-center space-x-1 space-x-reverse px-3 py-1.5 bg-white text-indigo-700 rounded-full text-sm font-medium border-2 border-indigo-300 hover:bg-indigo-100 hover:border-indigo-400 transition-all shadow-sm hover:shadow">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>{tag.he}</span>
                <span className="text-xs text-indigo-500">({tag.category})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Helper Text */}
      <div className="text-xs text-gray-500">
        {isAdminOrPoster ? (
          <span>💡 טיפ: הקלד תגית חדשה והקש פסיק (,) כדי ליצור אותה במהירות</span>
        ) : (
          <span>חפש והוסף תגיות כדי לסווג את המתכון שלך</span>
        )}
      </div>
    </div>
  );
};

export default TagSelector;
