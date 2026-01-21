import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import {toast} from 'react-toastify';
import {useAuth} from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';

const ManageUsers = () => {
  const {user} = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [actionModal, setActionModal] = useState({
    open: false,
    type: null, // 'suspend', 'unsuspend', 'delete', 'resetPassword'
    userId: null,
    userName: '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/users', {
        headers: {Authorization: `Bearer ${token}`},
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בטעינת המשתמשים');
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId, newRole) => {
    setUpdating(userId);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        '/api/admin/role',
        {userId, role: newRole},
        {headers: {Authorization: `Bearer ${token}`}},
      );
      setUsers(users.map(u => (u._id === userId ? {...u, role: newRole} : u)));
      toast.success('התפקיד עודכן בהצלחה');
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בעדכון התפקיד');
    } finally {
      setUpdating(null);
    }
  };

  const openActionModal = (type, userId, userName) => {
    setActionModal({open: true, type, userId, userName});
    setNewPassword('');
  };

  const closeActionModal = () => {
    setActionModal({open: false, type: null, userId: null, userName: ''});
    setNewPassword('');
  };

  const handleSuspend = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const isSuspending = actionModal.type === 'suspend';
      await axios.patch(
        '/api/admin/suspend',
        {userId: actionModal.userId, suspended: isSuspending},
        {headers: {Authorization: `Bearer ${token}`}},
      );
      setUsers(
        users.map(u =>
          u._id === actionModal.userId ? {...u, suspended: isSuspending} : u,
        ),
      );
      toast.success(isSuspending ? 'המשתמש הושעה' : 'ההשעיה בוטלה');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'שגיאה בעדכון');
    } finally {
      setActionLoading(false);
      closeActionModal();
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        '/api/admin/reset-password',
        {userId: actionModal.userId, newPassword},
        {headers: {Authorization: `Bearer ${token}`}},
      );
      toast.success('הסיסמה אופסה בהצלחה');
    } catch (err) {
      console.error(err);
      toast.error('שגיאה באיפוס הסיסמה');
    } finally {
      setActionLoading(false);
      closeActionModal();
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/users/${actionModal.userId}`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setUsers(users.filter(u => u._id !== actionModal.userId));
      toast.success('המשתמש נמחק בהצלחה');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'שגיאה במחיקת המשתמש');
    } finally {
      setActionLoading(false);
      closeActionModal();
    }
  };

  const getRoleBadgeColor = role => {
    switch (role) {
      case 'Admin':
        return 'bg-red-100 text-red-800';
      case 'Poster':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getModalConfig = () => {
    switch (actionModal.type) {
      case 'suspend':
        return {
          title: 'השעיית משתמש',
          message: `האם אתה בטוח שברצונך להשעות את המשתמש "${actionModal.userName}"? המשתמש לא יוכל להתחבר למערכת.`,
          confirmText: 'השעה',
          confirmColor: 'red',
          onConfirm: handleSuspend,
        };
      case 'unsuspend':
        return {
          title: 'ביטול השעיה',
          message: `האם אתה בטוח שברצונך לבטל את השעיית המשתמש "${actionModal.userName}"?`,
          confirmText: 'בטל השעיה',
          confirmColor: 'green',
          onConfirm: handleSuspend,
        };
      case 'delete':
        return {
          title: 'מחיקת משתמש',
          message: (
            <span>
              האם אתה בטוח שברצונך למחוק את המשתמש "{actionModal.userName}"?
              <br />
              <span className="text-red-500 text-sm">
                פעולה זו אינה ניתנת לביטול!
              </span>
            </span>
          ),
          confirmText: 'מחק',
          confirmColor: 'red',
          onConfirm: handleDelete,
        };
      case 'resetPassword':
        return {
          title: 'איפוס סיסמה',
          message: (
            <div>
              <p className="mb-4">
                הזן סיסמה חדשה עבור המשתמש "{actionModal.userName}":
              </p>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="סיסמה חדשה (מינימום 6 תווים)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                minLength={6}
              />
            </div>
          ),
          confirmText: 'אפס סיסמה',
          confirmColor: 'blue',
          onConfirm: handleResetPassword,
        };
      default:
        return {};
    }
  };

  if (loading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  const modalConfig = getModalConfig();

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">ניהול משתמשים</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                שם
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                אימייל
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                תפקיד
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                סטטוס
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                הצטרפות
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                פעולות
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(u => (
              <tr
                key={u._id}
                className={`hover:bg-gray-50 ${u.suspended ? 'bg-red-50' : ''}`}>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        u.suspended
                          ? 'bg-gray-400'
                          : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                      }`}>
                      {u.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-gray-600 text-sm">{u.email}</td>
                <td className="px-4 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(u.role)}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {u.suspended ? (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      מושעה
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      פעיל
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-gray-600 text-sm">
                  {new Date(u.createdAt).toLocaleDateString('he-IL')}
                </td>
                <td className="px-4 py-4">
                  {u._id !== user._id ? (
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={u.role}
                        onChange={e => updateRole(u._id, e.target.value)}
                        disabled={updating === u._id}
                        className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
                        <option value="User">User</option>
                        <option value="Poster">Poster</option>
                        <option value="Admin">Admin</option>
                      </select>
                      {u.suspended ? (
                        <button
                          onClick={() =>
                            openActionModal('unsuspend', u._id, u.name)
                          }
                          className="px-2 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                          בטל השעיה
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            openActionModal('suspend', u._id, u.name)
                          }
                          className="px-2 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors">
                          השעה
                        </button>
                      )}
                      <button
                        onClick={() =>
                          openActionModal('resetPassword', u._id, u.name)
                        }
                        className="px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                        אפס סיסמה
                      </button>
                      <button
                        onClick={() => openActionModal('delete', u._id, u.name)}
                        className="px-2 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                        מחק
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">אתה</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-gray-600 text-sm">
        סה"כ {users.length} משתמשים
      </div>

      {/* Action Modal */}
      <ConfirmModal
        isOpen={actionModal.open}
        onClose={closeActionModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText="ביטול"
        confirmColor={modalConfig.confirmColor}
        loading={actionLoading}
      />
    </div>
  );
};

export default ManageUsers;
