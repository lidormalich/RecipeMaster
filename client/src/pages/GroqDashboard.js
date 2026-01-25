import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../context/AuthContext';

export default function GroqDashboard() {
  const {user} = useAuth();
  const navigate = useNavigate();
  const [usage, setUsage] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is admin
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'Admin') {
      navigate('/');
      return;
    }

    fetchAvailableMonths();
    fetchUsage();
    const interval = setInterval(fetchUsage, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.role === 'Admin') {
      fetchUsage();
    }
  }, [selectedYear, selectedMonth]);

  const fetchAvailableMonths = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/groq/available-months', {
        headers: {Authorization: `Bearer ${token}`},
      });
      setAvailableMonths(response.data);
    } catch (err) {
      console.error('Error fetching available months:', err);
    }
  };

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/groq/usage', {
        headers: {Authorization: `Bearer ${token}`},
        params: {year: selectedYear, month: selectedMonth},
      });
      setUsage(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = num => {
    return new Intl.NumberFormat('he-IL').format(num || 0);
  };

  const getPercentage = (used, limit) => {
    if (!limit) return 0;
    return ((used / limit) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען נתוני שימוש...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-600 font-semibold text-lg mb-2">שגיאה</h3>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchUsage}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition">
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  const todayRequestPercentage = getPercentage(
    usage?.today?.requests,
    usage?.limits?.requestLimit,
  );
  const todayTokenPercentage = getPercentage(
    usage?.today?.tokens,
    usage?.limits?.tokenLimit,
  );
  const rpmPercentage = getPercentage(
    usage?.currentRate?.requestsPerMinute,
    usage?.limits?.rpmLimit,
  );
  const tpmPercentage = getPercentage(
    usage?.currentRate?.tokensPerMinute,
    usage?.limits?.tpmLimit,
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-4xl">📊</span>
            לוח בקרת Groq API
          </h1>
          <p className="text-gray-500 mt-1">מעקב אחר שימוש ומגבלות - {usage?.monthName} {usage?.year}</p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
              <option key={m} value={m}>
                {new Date(2000, m - 1).toLocaleString('he-IL', {month: 'long'})}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl shadow-lg p-6 mb-8 text-white">
        <h2 className="text-xl font-bold mb-4">סיכום חודשי - {usage?.monthName} {usage?.year}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-3xl font-bold">{formatNumber(usage?.monthly?.totalRequests)}</div>
            <div className="text-purple-200 text-sm">בקשות</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-3xl font-bold">{formatNumber(usage?.monthly?.totalTokens)}</div>
            <div className="text-purple-200 text-sm">טוקנים</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-3xl font-bold">{formatNumber(usage?.monthly?.successfulRequests)}</div>
            <div className="text-purple-200 text-sm">בקשות מוצלחות</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-3xl font-bold">{usage?.monthly?.avgResponseTime || 0}ms</div>
            <div className="text-purple-200 text-sm">זמן תגובה ממוצע</div>
          </div>
        </div>
      </div>

      {/* Today's Stats Grid */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">שימוש היום (מגבלות יומיות)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Today's Requests */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl">📨</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              יומי
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {formatNumber(usage?.today?.requests)}
          </div>
          <div className="text-sm text-gray-500">
            מתוך {formatNumber(usage?.limits?.requestLimit)} בקשות
          </div>
          <div className="mt-3 bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(todayRequestPercentage, 100)}%`,
                backgroundColor:
                  todayRequestPercentage >= 90
                    ? '#ef4444'
                    : todayRequestPercentage >= 70
                      ? '#eab308'
                      : '#22c55e',
              }}></div>
          </div>
          <div className="text-xs text-gray-400 mt-1">{todayRequestPercentage}%</div>
        </div>

        {/* Today's Tokens */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl">⚡</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              יומי
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {formatNumber(usage?.today?.tokens)}
          </div>
          <div className="text-sm text-gray-500">
            מתוך {formatNumber(usage?.limits?.tokenLimit)} טוקנים
          </div>
          <div className="mt-3 bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(todayTokenPercentage, 100)}%`,
                backgroundColor:
                  todayTokenPercentage >= 90
                    ? '#ef4444'
                    : todayTokenPercentage >= 70
                      ? '#eab308'
                      : '#22c55e',
              }}></div>
          </div>
          <div className="text-xs text-gray-400 mt-1">{todayTokenPercentage}%</div>
        </div>

        {/* Requests per Minute */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl">⏱️</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              לדקה
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {formatNumber(usage?.currentRate?.requestsPerMinute)}
          </div>
          <div className="text-sm text-gray-500">
            מגבלה: {formatNumber(usage?.limits?.rpmLimit)}/דקה
          </div>
          <div className="mt-3 bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(rpmPercentage, 100)}%`,
                backgroundColor:
                  rpmPercentage >= 90
                    ? '#ef4444'
                    : rpmPercentage >= 70
                      ? '#eab308'
                      : '#22c55e',
              }}></div>
          </div>
          <div className="text-xs text-gray-400 mt-1">{rpmPercentage}%</div>
        </div>

        {/* Tokens per Minute */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl">🔥</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              לדקה
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {formatNumber(usage?.currentRate?.tokensPerMinute)}
          </div>
          <div className="text-sm text-gray-500">
            מגבלה: {formatNumber(usage?.limits?.tpmLimit)}/דקה
          </div>
          <div className="mt-3 bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(tpmPercentage, 100)}%`,
                backgroundColor:
                  tpmPercentage >= 90
                    ? '#ef4444'
                    : tpmPercentage >= 70
                      ? '#eab308'
                      : '#22c55e',
              }}></div>
          </div>
          <div className="text-xs text-gray-400 mt-1">{tpmPercentage}%</div>
        </div>
      </div>

      {/* Models Usage */}
      {usage?.byModel && usage.byModel.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🤖</span>
            שימוש לפי מודל
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">
                    מודל
                  </th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">
                    בקשות
                  </th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">
                    טוקנים
                  </th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">
                    Prompt
                  </th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">
                    Completion
                  </th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">
                    זמן תגובה ממוצע
                  </th>
                </tr>
              </thead>
              <tbody>
                {usage.byModel.map((model, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {model.model || model._id}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatNumber(model.requests)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatNumber(model.totalTokens)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatNumber(model.promptTokens)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatNumber(model.completionTokens)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {model.avgResponseTime}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Endpoint Usage */}
      {usage?.byEndpoint && usage.byEndpoint.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🔗</span>
            שימוש לפי Endpoint
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">
                    Endpoint
                  </th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">
                    בקשות
                  </th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">
                    טוקנים
                  </th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">
                    זמן תגובה ממוצע
                  </th>
                </tr>
              </thead>
              <tbody>
                {usage.byEndpoint.map((endpoint, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {endpoint.endpoint || endpoint._id || 'לא ידוע'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatNumber(endpoint.requests)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatNumber(endpoint.totalTokens)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {endpoint.avgResponseTime}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Breakdown */}
      {usage?.byDay && usage.byDay.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📅</span>
            פירוט יומי
          </h2>
          <div className="overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {usage.byDay.map((day, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 rounded-lg p-3 text-center min-w-[80px]">
                  <div className="text-lg font-bold text-gray-800">{day.day}</div>
                  <div className="text-xs text-gray-500">{formatNumber(day.requests)} בקשות</div>
                  <div className="text-xs text-purple-600">{formatNumber(day.tokens)} טוקנים</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
          <h3 className="font-bold text-lg mb-2">📋 מגבלות Free Tier</h3>
          <ul className="space-y-2 text-purple-100">
            <li>• 14,400 בקשות ליום</li>
            <li>• 30 בקשות לדקה (RPM)</li>
            <li>• 15,000 טוקנים לדקה (TPM)</li>
            <li>• מודלים: Llama 3.3, Mixtral, ועוד</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white">
          <h3 className="font-bold text-lg mb-2">💡 טיפים לחיסכון</h3>
          <ul className="space-y-2 text-green-100">
            <li>• השתמש ב-caching לתשובות דומות</li>
            <li>• הגבל את max_tokens בבקשות</li>
            <li>• השתמש ב-system prompts קצרים</li>
            <li>• בחר מודל מתאים למשימה</li>
          </ul>
        </div>
      </div>

      {/* Available Months */}
      {availableMonths.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📆</span>
            חודשים זמינים
          </h2>
          <div className="flex flex-wrap gap-2">
            {availableMonths.map((m, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedYear(m.year);
                  setSelectedMonth(m.month);
                }}
                className={`px-3 py-2 rounded-lg transition ${
                  selectedYear === m.year && selectedMonth === m.month
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                {new Date(m.year, m.month - 1).toLocaleString('he-IL', {month: 'short'})} {m.year}
                <span className="text-xs mr-1">({formatNumber(m.requests)})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-center text-gray-400 text-sm">
        עדכון אחרון:{' '}
        {usage?.lastUpdated
          ? new Date(usage.lastUpdated).toLocaleString('he-IL')
          : 'לא זמין'}
      </div>
    </div>
  );
}
