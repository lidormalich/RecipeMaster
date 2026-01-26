import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../context/AuthContext';

// Groq Free Tier Monthly Limits (estimated based on daily limits * 30)
const MONTHLY_LIMITS = {
  requests: 432000, // 14,400/day * 30
  tokens: 15000000, // ~500K/day * 30
};

// Model information
const MODEL_INFO = {
  'llama-3.3-70b-versatile': {
    name: 'Llama 3.3 70B Versatile',
    description: 'מודל גדול ורב-תכליתי מ-Meta. מתאים למשימות מורכבות הדורשות הבנה עמוקה וכתיבה איכותית.',
    contextWindow: '128K tokens',
    speed: 'מהיר',
    bestFor: 'כתיבה יצירתית, שאלות מורכבות, ניתוח',
    free: true,
  },
  'llama-3.1-70b-versatile': {
    name: 'Llama 3.1 70B Versatile',
    description: 'גרסה קודמת של Llama. עדיין מצוין למשימות כלליות.',
    contextWindow: '128K tokens',
    speed: 'מהיר',
    bestFor: 'משימות כלליות, שיחות',
    free: true,
  },
  'llama-3.1-8b-instant': {
    name: 'Llama 3.1 8B Instant',
    description: 'מודל קטן ומהיר במיוחד. מושלם לתשובות מהירות ופשוטות.',
    contextWindow: '128K tokens',
    speed: 'מהיר מאוד',
    bestFor: 'תשובות מהירות, סיווג, משימות פשוטות',
    free: true,
  },
  'mixtral-8x7b-32768': {
    name: 'Mixtral 8x7B',
    description: 'מודל MoE (Mixture of Experts) מ-Mistral AI. מאזן מצוין בין מהירות לאיכות.',
    contextWindow: '32K tokens',
    speed: 'מהיר',
    bestFor: 'קוד, שפות מרובות, משימות טכניות',
    free: true,
  },
  'gemma2-9b-it': {
    name: 'Gemma 2 9B',
    description: 'מודל קטן מ-Google. יעיל מאוד למשימות בסיסיות.',
    contextWindow: '8K tokens',
    speed: 'מהיר מאוד',
    bestFor: 'משימות פשוטות, chatbots',
    free: true,
  },
  'llama-guard-3-8b': {
    name: 'Llama Guard 3 8B',
    description: 'מודל אבטחה לזיהוי תוכן בעייתי. לא מיועד לשיחות רגילות.',
    contextWindow: '8K tokens',
    speed: 'מהיר',
    bestFor: 'בדיקת תוכן, אבטחה',
    free: true,
  },
};

export default function GroqDashboard() {
  const {user, loading: authLoading} = useAuth();
  const navigate = useNavigate();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // Check if user is admin
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'Admin') {
      navigate('/');
      return;
    }

    fetchUsage();
  }, [user, authLoading, navigate]);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Always fetch current month
      const now = new Date();
      const response = await axios.get('/api/groq/usage', {
        headers: {Authorization: `Bearer ${token}`},
        params: {year: now.getFullYear(), month: now.getMonth() + 1},
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

  const getProgressColor = percentage => {
    if (percentage >= 90) return '#ef4444';
    if (percentage >= 70) return '#eab308';
    return '#22c55e';
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{authLoading ? 'בודק הרשאות...' : 'טוען נתוני שימוש...'}</p>
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

  // Calculate percentages
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

  // Monthly percentages
  const monthlyRequestPercentage = getPercentage(
    usage?.monthly?.totalRequests,
    MONTHLY_LIMITS.requests,
  );
  const monthlyTokenPercentage = getPercentage(
    usage?.monthly?.totalTokens,
    MONTHLY_LIMITS.tokens,
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <span className="text-4xl">📊</span>
          לוח בקרת Groq API
        </h1>
        <p className="text-gray-500 mt-1">מעקב אחר שימוש ומגבלות - {usage?.monthName} {usage?.year}</p>
      </div>

      {/* Monthly Summary with Limits */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl shadow-lg p-6 mb-8 text-white">
        <h2 className="text-xl font-bold mb-4">סיכום חודשי - {usage?.monthName} {usage?.year}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Requests */}
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-3xl font-bold">{formatNumber(usage?.monthly?.totalRequests)}</div>
                <div className="text-purple-200 text-sm">בקשות חודשיות</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{monthlyRequestPercentage}%</div>
                <div className="text-purple-200 text-xs">מתוך {formatNumber(MONTHLY_LIMITS.requests)}</div>
              </div>
            </div>
            <div className="bg-white/20 rounded-full h-3 mt-2">
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${Math.min(monthlyRequestPercentage, 100)}%`,
                  backgroundColor: getProgressColor(monthlyRequestPercentage),
                }}></div>
            </div>
          </div>

          {/* Monthly Tokens */}
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-3xl font-bold">{formatNumber(usage?.monthly?.totalTokens)}</div>
                <div className="text-purple-200 text-sm">טוקנים חודשיים</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{monthlyTokenPercentage}%</div>
                <div className="text-purple-200 text-xs">מתוך {formatNumber(MONTHLY_LIMITS.tokens)}</div>
              </div>
            </div>
            <div className="bg-white/20 rounded-full h-3 mt-2">
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${Math.min(monthlyTokenPercentage, 100)}%`,
                  backgroundColor: getProgressColor(monthlyTokenPercentage),
                }}></div>
            </div>
          </div>

          {/* Additional Monthly Stats */}
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-3xl font-bold">{formatNumber(usage?.monthly?.successfulRequests)}</div>
            <div className="text-purple-200 text-sm">בקשות מוצלחות</div>
            <div className="text-xs text-purple-300 mt-1">
              {usage?.monthly?.totalRequests > 0
                ? `${((usage?.monthly?.successfulRequests / usage?.monthly?.totalRequests) * 100).toFixed(1)}% הצלחה`
                : '0% הצלחה'}
            </div>
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
                backgroundColor: getProgressColor(todayRequestPercentage),
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
                backgroundColor: getProgressColor(todayTokenPercentage),
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
                backgroundColor: getProgressColor(rpmPercentage),
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
                backgroundColor: getProgressColor(tpmPercentage),
              }}></div>
          </div>
          <div className="text-xs text-gray-400 mt-1">{tpmPercentage}%</div>
        </div>
      </div>

      {/* Models Usage with Percentages */}
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
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">מודל</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">בקשות</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">% מהמגבלה</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">טוקנים</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">% מהמגבלה</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">זמן ממוצע</th>
                </tr>
              </thead>
              <tbody>
                {usage.byModel.map((model, idx) => {
                  const requestPct = ((model.requests / MONTHLY_LIMITS.requests) * 100).toFixed(2);
                  const tokenPct = ((model.totalTokens / MONTHLY_LIMITS.tokens) * 100).toFixed(2);
                  return (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {model.model || model._id}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{formatNumber(model.requests)}</td>
                      <td className="py-3 px-4 text-purple-600 font-medium">{requestPct}%</td>
                      <td className="py-3 px-4 text-gray-600">{formatNumber(model.totalTokens)}</td>
                      <td className="py-3 px-4 text-purple-600 font-medium">{tokenPct}%</td>
                      <td className="py-3 px-4 text-gray-600">{model.avgResponseTime}ms</td>
                    </tr>
                  );
                })}
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
            שימוש לפי פיצ׳ר
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">פיצ׳ר</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">בקשות</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">% מהמגבלה</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">טוקנים</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">% מהמגבלה</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">זמן ממוצע</th>
                </tr>
              </thead>
              <tbody>
                {usage.byEndpoint.map((endpoint, idx) => {
                  const requestPct = ((endpoint.requests / MONTHLY_LIMITS.requests) * 100).toFixed(2);
                  const tokenPct = ((endpoint.totalTokens / MONTHLY_LIMITS.tokens) * 100).toFixed(2);
                  return (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {endpoint.endpoint || endpoint._id || 'לא ידוע'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{formatNumber(endpoint.requests)}</td>
                      <td className="py-3 px-4 text-purple-600 font-medium">{requestPct}%</td>
                      <td className="py-3 px-4 text-gray-600">{formatNumber(endpoint.totalTokens)}</td>
                      <td className="py-3 px-4 text-purple-600 font-medium">{tokenPct}%</td>
                      <td className="py-3 px-4 text-gray-600">{endpoint.avgResponseTime}ms</td>
                    </tr>
                  );
                })}
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

      {/* Model Information Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📚</span>
          מידע על המודלים הזמינים (חינמי)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(MODEL_INFO).map(([modelId, info]) => (
            <div key={modelId} className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-800">{info.name}</h3>
                {info.free && (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">חינמי</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">{info.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-500">חלון הקשר:</span>
                  <span className="font-medium text-gray-700 mr-1">{info.contextWindow}</span>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-500">מהירות:</span>
                  <span className="font-medium text-gray-700 mr-1">{info.speed}</span>
                </div>
              </div>
              <div className="mt-2 text-xs">
                <span className="text-gray-500">מתאים ל:</span>
                <span className="text-purple-600 mr-1">{info.bestFor}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Free Tier Limits Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
          <h3 className="font-bold text-lg mb-2">📋 מגבלות Free Tier</h3>
          <ul className="space-y-2 text-purple-100">
            <li>• <strong>יומי:</strong> 14,400 בקשות</li>
            <li>• <strong>יומי:</strong> ~500,000 טוקנים</li>
            <li>• <strong>לדקה:</strong> 30 בקשות (RPM)</li>
            <li>• <strong>לדקה:</strong> 15,000 טוקנים (TPM)</li>
            <li>• <strong>חודשי (משוער):</strong> ~432,000 בקשות</li>
            <li>• <strong>חודשי (משוער):</strong> ~15,000,000 טוקנים</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white">
          <h3 className="font-bold text-lg mb-2">💡 טיפים לחיסכון</h3>
          <ul className="space-y-2 text-green-100">
            <li>• השתמש ב-<strong>llama-3.1-8b-instant</strong> למשימות פשוטות</li>
            <li>• הגבל את max_tokens בבקשות</li>
            <li>• השתמש ב-system prompts קצרים</li>
            <li>• <strong>llama-3.3-70b</strong> למשימות מורכבות בלבד</li>
          </ul>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-gray-400 text-sm">
        נטען ב:{' '}
        {usage?.lastUpdated
          ? new Date(usage.lastUpdated).toLocaleString('he-IL')
          : 'לא זמין'}
        <button
          onClick={fetchUsage}
          className="mr-4 text-purple-600 hover:text-purple-800 underline">
          רענן נתונים
        </button>
      </div>
    </div>
  );
}
