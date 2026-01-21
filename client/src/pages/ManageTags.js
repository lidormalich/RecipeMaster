import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import {toast} from 'react-toastify';
import {useAuth} from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';

const ManageTags = () => {
  const {user} = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [newTagCategory, setNewTagCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [editName, setEditName] = useState('');
  const [deleteModal, setDeleteModal] = useState({open: false, categoryId: null, tagId: null, tagName: ''});
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const canManage =
    user?.role?.toLowerCase() === 'admin' ||
    user?.role?.toLowerCase() === 'poster';

  useEffect(() => {
    if (!canManage) {
      navigate('/');
      return;
    }
    fetchTags();
  }, [user, navigate, canManage]);

  const fetchTags = async () => {
    try {
      const res = await axios.get('/api/tags');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בטעינת התגיות');
    } finally {
      setLoading(false);
    }
  };

  const addTag = async e => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setAdding(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        '/api/tags/quick',
        {
          tagName: newTagName.trim(),
          category: newTagCategory || 'כללי',
        },
        {headers: {Authorization: `Bearer ${token}`}},
      );

      toast.success(res.data.isNew ? 'תגית נוספה בהצלחה' : 'התגית כבר קיימת');
      setNewTagName('');
      fetchTags();
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בהוספת תגית');
    } finally {
      setAdding(false);
    }
  };

  const addCategory = async e => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setAdding(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/tags',
        {
          category: newCategoryName.trim(),
          tags: [],
        },
        {headers: {Authorization: `Bearer ${token}`}},
      );

      toast.success('קטגוריה נוספה בהצלחה');
      setNewCategoryName('');
      fetchTags();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'שגיאה בהוספת קטגוריה');
    } finally {
      setAdding(false);
    }
  };

  const updateTag = async (categoryId, tagId) => {
    if (!editName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/tags/${tagId}`,
        {
          categoryId,
          tagId,
          he: editName.trim(),
        },
        {headers: {Authorization: `Bearer ${token}`}},
      );

      toast.success('התגית עודכנה');
      setEditingTag(null);
      setEditName('');
      fetchTags();
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בעדכון התגית');
    }
  };

  const openDeleteModal = (categoryId, tagId, tagName) => {
    setDeleteModal({open: true, categoryId, tagId, tagName});
  };

  const closeDeleteModal = () => {
    setDeleteModal({open: false, categoryId: null, tagId: null, tagName: ''});
  };

  const confirmDeleteTag = async () => {
    const {categoryId, tagId} = deleteModal;
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/tags/${tagId}`, {
        headers: {Authorization: `Bearer ${token}`},
        data: {categoryId, tagId},
      });

      toast.success('התגית נמחקה');
      fetchTags();
    } catch (err) {
      console.error(err);
      toast.error('שגיאה במחיקת התגית');
    } finally {
      setDeleting(false);
      closeDeleteModal();
    }
  };

  if (loading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">ניהול תגיות</h1>

      {/* הוספת תגית חדשה */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">הוספת תגית חדשה</h2>
        <form onSubmit={addTag} className="flex flex-wrap gap-3">
          <input
            type="text"
            value={newTagName}
            onChange={e => setNewTagName(e.target.value)}
            placeholder="שם התגית"
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={newTagCategory}
            onChange={e => setNewTagCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">בחר קטגוריה</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat.category}>
                {cat.category}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={adding || !newTagName.trim()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {adding ? 'מוסיף...' : 'הוסף תגית'}
          </button>
        </form>
      </div>

      {/* הוספת קטגוריה חדשה - רק לאדמין */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">הוספת קטגוריה חדשה</h2>
          <form onSubmit={addCategory} className="flex gap-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="שם הקטגוריה"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={adding || !newCategoryName.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
              {adding ? 'מוסיף...' : 'הוסף קטגוריה'}
            </button>
          </form>
        </div>
      )}

      {/* רשימת תגיות לפי קטגוריה */}
      <div className="space-y-6">
        {categories.map(category => (
          <div
            key={category._id}
            className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3">
              <h3 className="text-lg font-semibold text-white">
                {category.category}
                <span className="text-indigo-200 text-sm mr-2">
                  ({category.tags?.length || 0} תגיות)
                </span>
              </h3>
            </div>
            <div className="p-4">
              {category.tags && category.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {category.tags.map(tag => (
                    <div
                      key={tag._id}
                      className="group relative inline-flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full">
                      {editingTag === tag._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="px-2 py-1 text-sm border rounded"
                            autoFocus
                          />
                          <button
                            onClick={() => updateTag(category._id, tag._id)}
                            className="text-green-600 hover:text-green-700">
                            V
                          </button>
                          <button
                            onClick={() => {
                              setEditingTag(null);
                              setEditName('');
                            }}
                            className="text-red-600 hover:text-red-700">
                            X
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-indigo-800 text-sm">
                            {tag.he}
                          </span>
                          {isAdmin && (
                            <div className="hidden group-hover:flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingTag(tag._id);
                                  setEditName(tag.he);
                                }}
                                className="text-indigo-600 hover:text-indigo-800 text-xs">
                                ערוך
                              </button>
                              <button
                                onClick={() =>
                                  openDeleteModal(category._id, tag._id, tag.he)
                                }
                                className="text-red-600 hover:text-red-800 text-xs">
                                מחק
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">אין תגיות בקטגוריה זו</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          אין תגיות במערכת. התחל להוסיף תגיות חדשות!
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteTag}
        title="מחיקת תגית"
        message={
          <span>
            האם אתה בטוח שברצונך למחוק את התגית "{deleteModal.tagName}"?
          </span>
        }
        confirmText="מחק"
        cancelText="ביטול"
        confirmColor="red"
        loading={deleting}
      />
    </div>
  );
};

export default ManageTags;
