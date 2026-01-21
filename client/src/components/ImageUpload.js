import React, {useState, useRef} from 'react';

const ImageUpload = ({onImageSelect, currentImage, loading}) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(currentImage || null);
  const inputRef = useRef(null);

  const handleDrag = e => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = e => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = files => {
    const file = files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('אנא בחר קובץ תמונה בלבד');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('גודל התמונה חייב להיות קטן מ-5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Pass file to parent
    onImageSelect(files);
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  const removeImage = e => {
    e.stopPropagation();
    setPreview(null);
    onImageSelect(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        תמונה ראשית
      </label>

      {preview ? (
        /* Preview Mode */
        <div className="relative group">
          <div className="relative w-full h-72 rounded-2xl overflow-hidden shadow-lg">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="text-center space-y-3">
                <button
                  type="button"
                  onClick={onButtonClick}
                  disabled={loading}
                  className="px-6 py-3 bg-white text-gray-800 rounded-xl font-semibold hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  🔄 החלף תמונה
                </button>
                <button
                  type="button"
                  onClick={removeImage}
                  disabled={loading}
                  className="block mx-auto px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  🗑️ הסר תמונה
                </button>
              </div>
            </div>
          </div>
          {loading && (
            <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-3"></div>
                <p className="text-white font-semibold">מעלה תמונה...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Upload Mode */
        <div
          className={`relative border-3 border-dashed rounded-2xl transition-all duration-300 ${
            dragActive
              ? 'border-indigo-600 bg-indigo-50'
              : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
            disabled={loading}
          />

          <div
            onClick={onButtonClick}
            className="cursor-pointer p-12 text-center">
            <div className="mb-4">
              {dragActive ? (
                <div className="text-7xl animate-bounce">📸</div>
              ) : (
                <div className="text-7xl">🖼️</div>
              )}
            </div>

            <h3 className="text-xl font-bold text-gray-700 mb-2">
              {dragActive ? 'שחרר את התמונה כאן' : 'העלה תמונה'}
            </h3>

            <p className="text-gray-500 mb-4">
              גרור ושחרר תמונה או{' '}
              <span className="text-indigo-600 font-semibold underline">
                לחץ לבחירה
              </span>
            </p>

            <div className="flex items-center justify-center space-x-4 space-x-reverse text-sm text-gray-400">
              <div className="flex items-center space-x-1 space-x-reverse">
                <span>📏</span>
                <span>עד 5MB</span>
              </div>
              <div className="flex items-center space-x-1 space-x-reverse">
                <span>🎨</span>
                <span>JPG, PNG, GIF</span>
              </div>
            </div>
          </div>

          {loading && (
            <div className="absolute inset-0 bg-white/90 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-3"></div>
                <p className="text-gray-700 font-semibold">מעלה תמונה...</p>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="mt-2 text-xs text-gray-500 text-center">
        התמונה תעלה אוטומטית לשרת בעת שמירת המתכון
      </p>
    </div>
  );
};

export default ImageUpload;
