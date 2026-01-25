import React, { useState, useEffect } from 'react';
import { BarChart3, Activity, Zap, Clock } from 'lucide-react';

export default function GroqUsageDashboard() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsage();
    const interval = setInterval(fetchUsage, 60000); // רענון כל דקה
    return () => clearInterval(interval);
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/groq/usage');
      if (!response.ok) throw new Error('Failed to fetch usage data');
      const data = await response.json();
      setUsage(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('he-IL').format(num);
  };

  const getPercentage = (used, limit) => {
    if (!limit) return 0;
    return ((used / limit) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">טוען נתוני שימוש...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md">
          <h3 className="text-red-400 font-semibold text-lg mb-2">שגיאה</h3>
          <p className="text-gray-300">{error}</p>
          <button
            onClick={fetchUsage}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <BarChart3 className="text-purple-500" size={40} />
            לוח בקרת Groq API
          </h1>
          <p className="text-gray-400">מעקב אחר שימוש ומגבלות</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Requests */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 hover:border-purple-500 transition">
            <div className="flex items-center justify-between mb-4">
              <Activity className="text-blue-400" size={24} />
              <span className="text-xs text-gray-400">סה"כ בקשות</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {formatNumber(usage?.totalRequests || 0)}
            </div>
            <div className="text-sm text-gray-400">
              מתוך {formatNumber(usage?.requestLimit || 0)}
            </div>
            <div className="mt-2 bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${getPercentage(usage?.totalRequests, usage?.requestLimit)}%` }}
              ></div>
            </div>
          </div>

          {/* Total Tokens */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 hover:border-purple-500 transition">
            <div className="flex items-center justify-between mb-4">
              <Zap className="text-yellow-400" size={24} />
              <span className="text-xs text-gray-400">סה"כ טוקנים</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {formatNumber(usage?.totalTokens || 0)}
            </div>
            <div className="text-sm text-gray-400">
              מתוך {formatNumber(usage?.tokenLimit || 0)}
            </div>
            <div className="mt-2 bg-gray-700 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{ width: `${getPercentage(usage?.totalTokens, usage?.tokenLimit)}%` }}
              ></div>
            </div>
          </div>

          {/* Requests per Minute */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 hover:border-purple-500 transition">
            <div className="flex items-center justify-between mb-4">
              <Clock className="text-green-400" size={24} />
              <span className="text-xs text-gray-400">בקשות לדקה</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {formatNumber(usage?.requestsPerMinute || 0)}
            </div>
            <div className="text-sm text-gray-400">
              מגבלה: {formatNumber(usage?.rpmLimit || 0)}/דקה
            </div>
            <div className="mt-2 bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${getPercentage(usage?.requestsPerMinute, usage?.rpmLimit)}%` }}
              ></div>
            </div>
          </div>

          {/* Tokens per Minute */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 hover:border-purple-500 transition">
            <div className="flex items-center justify-between mb-4">
              <Zap className="text-purple-400" size={24} />
              <span className="text-xs text-gray-400">טוקנים לדקה</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {formatNumber(usage?.tokensPerMinute || 0)}
            </div>
            <div className="text-sm text-gray-400">
              מגבלה: {formatNumber(usage?.tpmLimit || 0)}/דקה
            </div>
            <div className="mt-2 bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${getPercentage(usage?.tokensPerMinute, usage?.tpmLimit)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Models Usage */}
        {usage?.models && usage.models.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">שימוש לפי מודל</h2>
            <div className="space-y-4">
              {usage.models.map((model, idx) => (
                <div key={idx} className="border-b border-gray-700 pb-4 last:border-b-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-semibold">{model.name}</span>
                    <span className="text-gray-400">{formatNumber(model.requests)} בקשות</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">טוקנים: </span>
                      <span className="text-white">{formatNumber(model.tokens)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">ממוצע זמן תגובה: </span>
                      <span className="text-white">{model.avgResponseTime}ms</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          עדכון אחרון: {usage?.lastUpdated ? new Date(usage.lastUpdated).toLocaleString('he-IL') : 'לא זמין'}
        </div>
      </div>
    </div>
  );
}