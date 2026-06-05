import React, {useState, useEffect, useRef, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import {toast} from 'react-toastify';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {useAuth} from '../context/AuthContext';

const RANGE_OPTIONS = [
  {label: '7 ימים', value: 7},
  {label: '30 יום', value: 30},
  {label: '90 יום', value: 90},
];

const ACTION_LABELS = {
  login: 'התחברות',
  logout: 'התנתקות',
  register: 'הרשמה',
  login_failed: 'התחברות נכשלה',
  recipe_view: 'צפייה במתכון',
  recipe_create: 'יצירת מתכון',
  recipe_update: 'עריכת מתכון',
  recipe_delete: 'מחיקת מתכון',
  favorite_add: 'הוספה למועדפים',
  favorite_remove: 'הסרה ממועדפים',
  cart_add: 'הוספה לסל',
  search: 'חיפוש',
  ai_use: 'שימוש ב-AI',
  share: 'שיתוף',
};

const AUDIT_LABELS = {
  role_change: 'שינוי תפקיד',
  suspend: 'השעיה',
  unsuspend: 'ביטול השעיה',
  reset_password: 'איפוס סיסמה',
  delete_user: 'מחיקת משתמש',
};

const PIE_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#14b8a6', '#a855f7', '#f97316',
];

const DAY_NAMES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

// Animated count-up number
function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target == null) return;
    let raf;
    const start = performance.now();
    const tick = now => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function KpiCard({icon, label, value, accent, sub}) {
  const animated = useCountUp(value);
  return (
    <div className="bg-white rounded-xl shadow-md p-5 border-t-4" style={{borderTopColor: accent}}>
      <div className="flex items-center justify-between">
        <span className="text-3xl">{icon}</span>
        <span className="text-3xl font-extrabold text-gray-800">
          {animated.toLocaleString('he-IL')}
        </span>
      </div>
      <p className="mt-2 text-gray-500 text-sm font-medium">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function Section({title, icon, children, action}) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

// Lightweight confetti burst (no dependency)
function Confetti({fire}) {
  if (!fire) return null;
  const pieces = Array.from({length: 60});
  return (
    <div className="confetti-wrap">
      {pieces.map((_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            background: PIE_COLORS[i % PIE_COLORS.length],
            animationDelay: `${Math.random() * 0.5}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
      <style jsx>{`
        .confetti-wrap {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          overflow: hidden;
        }
        .confetti-piece {
          position: absolute;
          top: -10px;
          width: 10px;
          height: 14px;
          border-radius: 2px;
          animation: fall 2.5s linear forwards;
        }
        @keyframes fall {
          to {
            top: 110%;
            opacity: 0.2;
          }
        }
      `}</style>
    </div>
  );
}

// Activity heatmap (7 days × 24 hours)
function Heatmap({data}) {
  const grid = Array.from({length: 7}, () => Array(24).fill(0));
  let max = 0;
  (data || []).forEach(({day, hour, count}) => {
    if (day >= 0 && day < 7 && hour >= 0 && hour < 24) {
      grid[day][hour] = count;
      if (count > max) max = count;
    }
  });
  const shade = c => {
    if (!c) return '#f1f5f9';
    const t = c / max;
    const alpha = 0.15 + t * 0.85;
    return `rgba(99, 102, 241, ${alpha})`;
  };
  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="flex gap-1 mb-1 pr-8">
          {Array.from({length: 24}).map((_, h) => (
            <div key={h} className="w-4 text-[9px] text-gray-400 text-center">
              {h % 6 === 0 ? h : ''}
            </div>
          ))}
        </div>
        {grid.map((row, d) => (
          <div key={d} className="flex gap-1 items-center mb-1">
            {row.map((c, h) => (
              <div
                key={h}
                title={`יום ${DAY_NAMES[d]} ${h}:00 — ${c} פעולות`}
                className="w-4 h-4 rounded-sm"
                style={{background: shade(c)}}
              />
            ))}
            <span className="text-xs text-gray-500 w-6 text-center mr-1">
              {DAY_NAMES[d]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'עכשיו';
  if (mins < 60) return `לפני ${mins} ד'`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `לפני ${hrs} ש'`;
  return new Date(date).toLocaleDateString('he-IL');
}

export default function AdminAnalytics() {
  const {user, loading: authLoading} = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [live, setLive] = useState(null);
  const [audit, setAudit] = useState(null);
  const [reports, setReports] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [annForm, setAnnForm] = useState({message: '', type: 'info', expiresAt: ''});
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confetti, setConfetti] = useState(false);
  const celebrated = useRef(false);

  const fetchOverview = useCallback(async d => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/analytics/overview?days=${d}`);
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLive = useCallback(async () => {
    try {
      const res = await axios.get('/api/analytics/live');
      setLive(res.data);
    } catch (err) {
      /* live is best-effort */
    }
  }, []);

  const fetchAudit = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/audit-log?limit=15');
      setAudit(res.data);
    } catch (err) {
      /* best-effort */
    }
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      const res = await axios.get('/api/reports?status=open&limit=20');
      setReports(res.data);
    } catch (err) {
      /* best-effort */
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await axios.get('/api/announcements');
      setAnnouncements(res.data);
    } catch (err) {
      /* best-effort */
    }
  }, []);

  const resolveReport = async (id, status) => {
    try {
      await axios.patch(`/api/reports/${id}`, {status});
      fetchReports();
    } catch (err) {
      toast.error('שגיאה בעדכון הדיווח');
    }
  };

  const createAnnouncement = async () => {
    if (!annForm.message.trim()) {
      toast.error('יש להזין תוכן הודעה');
      return;
    }
    try {
      await axios.post('/api/announcements', {
        message: annForm.message,
        type: annForm.type,
        expiresAt: annForm.expiresAt || null,
      });
      setAnnForm({message: '', type: 'info', expiresAt: ''});
      toast.success('ההודעה פורסמה');
      fetchAnnouncements();
    } catch (err) {
      toast.error('שגיאה בפרסום ההודעה');
    }
  };

  const toggleAnnouncement = async (id, active) => {
    try {
      await axios.patch(`/api/announcements/${id}`, {active});
      fetchAnnouncements();
    } catch (err) {
      toast.error('שגיאה בעדכון ההודעה');
    }
  };

  const deleteAnnouncement = async id => {
    try {
      await axios.delete(`/api/announcements/${id}`);
      fetchAnnouncements();
    } catch (err) {
      toast.error('שגיאה במחיקת ההודעה');
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'Admin') {
      navigate('/');
      return;
    }
    fetchOverview(days);
    fetchLive();
    fetchAudit();
    fetchReports();
    fetchAnnouncements();
  }, [
    user,
    authLoading,
    navigate,
    days,
    fetchOverview,
    fetchLive,
    fetchAudit,
    fetchReports,
    fetchAnnouncements,
  ]);

  // Poll live data every 30s
  useEffect(() => {
    if (!user || user.role !== 'Admin') return;
    const id = setInterval(fetchLive, 30000);
    return () => clearInterval(id);
  }, [user, fetchLive]);

  // Celebrate a round-number user milestone, once
  useEffect(() => {
    if (data && !celebrated.current && data.kpis.totalUsers > 0 &&
        data.kpis.totalUsers % 100 === 0) {
      celebrated.current = true;
      setConfetti(true);
      setTimeout(() => setConfetti(false), 3000);
    }
  }, [data]);

  const recomputeBadges = async () => {
    try {
      const res = await axios.post('/api/analytics/recompute-badges');
      toast.success(`עודכנו תגי הישג ל-${res.data.usersUpdated} משתמשים`);
    } catch (err) {
      toast.error('שגיאה בעדכון תגי הישג');
    }
  };

  const exportUsersCsv = async () => {
    try {
      const res = await axios.get('/api/admin/export/users.csv', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('שגיאה בייצוא CSV');
    }
  };

  const printReport = () => window.print();

  if (authLoading || loading) {
    return <div className="text-center py-16 text-gray-500">טוען נתונים...</div>;
  }
  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => fetchOverview(days)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
          נסה שוב
        </button>
      </div>
    );
  }
  if (!data) return null;

  const {kpis} = data;

  // Merge registrations + logins + views into one time-series for the chart
  const seriesMap = {};
  const addSeries = (arr, key) =>
    (arr || []).forEach(({date, count}) => {
      seriesMap[date] = seriesMap[date] || {date};
      seriesMap[date][key] = count;
    });
  addSeries(data.registrationsByDay, 'הרשמות');
  addSeries(data.loginsByDay, 'התחברויות');
  addSeries(data.viewsByDay, 'צפיות');
  const timeSeries = Object.values(seriesMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      ...d,
      label: d.date.slice(5), // MM-DD
      הרשמות: d['הרשמות'] || 0,
      התחברויות: d['התחברויות'] || 0,
      צפיות: d['צפיות'] || 0,
    }));

  const pieData = (data.actionBreakdown || []).map(a => ({
    name: ACTION_LABELS[a.action] || a.action,
    value: a.count,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Confetti fire={confetti} />

      <style jsx global>{`
        @media print {
          header,
          .no-print,
          .Toastify {
            display: none !important;
          }
          body {
            background: white !important;
          }
          .shadow-md,
          .shadow-lg,
          .shadow-sm {
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Header + range selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            📊 דשבורד אנליטיקה
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            עודכן: {new Date(data.lastUpdated).toLocaleString('he-IL')}
          </p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <div className="flex gap-2 bg-white rounded-lg shadow-sm p-1">
            {RANGE_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => setDays(o.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  days === o.value
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}>
                {o.label}
              </button>
            ))}
          </div>
          <button
            onClick={exportUsersCsv}
            title="ייצוא משתמשים ל-CSV"
            className="px-3 py-2 bg-white rounded-lg shadow-sm text-sm font-medium text-gray-600 hover:bg-gray-100">
            📥 CSV
          </button>
          <button
            onClick={printReport}
            title="הדפסה / שמירה כ-PDF"
            className="px-3 py-2 bg-white rounded-lg shadow-sm text-sm font-medium text-gray-600 hover:bg-gray-100">
            🖨️ PDF
          </button>
        </div>
      </div>

      {/* Live: who's online now */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
            <span className="text-lg font-bold">
              {live?.onlineCount || 0} מחוברים עכשיו
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(live?.onlineUsers || []).slice(0, 12).map(u => (
              <span
                key={u._id}
                title={`${u.name} · ${timeAgo(u.lastActiveAt)}`}
                className="px-3 py-1 rounded-full bg-white/10 text-sm">
                {u.name}
              </span>
            ))}
            {(!live || live.onlineCount === 0) && (
              <span className="text-white/50 text-sm">אין משתמשים פעילים כרגע</span>
            )}
          </div>
        </div>
        {live?.trending?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-sm text-white/60 mb-2">🔥 מתחמם עכשיו (שעה אחרונה)</p>
            <div className="flex flex-wrap gap-2">
              {live.trending.map(t => (
                <span key={t.shortId} className="px-3 py-1 rounded-lg bg-orange-500/20 text-sm">
                  {t.title || t.shortId} · {t.views} צפיות
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <KpiCard icon="👥" label="סה״כ משתמשים" value={kpis.totalUsers} accent="#6366f1" />
        <KpiCard icon="✨" label="חדשים בטווח" value={kpis.newUsers} accent="#8b5cf6" />
        <KpiCard icon="🟢" label="פעילים היום" value={kpis.dau} accent="#10b981" />
        <KpiCard icon="📅" label="פעילים השבוע" value={kpis.wau} accent="#14b8a6" />
        <KpiCard icon="🗓️" label="פעילים בחודש" value={kpis.mau} accent="#0ea5e9" />
        <KpiCard icon="🍳" label="סה״כ מתכונים" value={kpis.totalRecipes} accent="#f59e0b" />
        <KpiCard icon="👁️" label="צפיות בטווח" value={kpis.totalViews} accent="#ec4899" />
      </div>

      {/* Activity over time */}
      <Section title="פעילות לאורך זמן" icon="📈">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timeSeries}>
            <defs>
              <linearGradient id="gReg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gLogin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gView" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="label" tick={{fontSize: 11}} />
            <YAxis tick={{fontSize: 11}} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="צפיות" stroke="#ec4899" fill="url(#gView)" />
            <Area type="monotone" dataKey="התחברויות" stroke="#10b981" fill="url(#gLogin)" />
            <Area type="monotone" dataKey="הרשמות" stroke="#8b5cf6" fill="url(#gReg)" />
          </AreaChart>
        </ResponsiveContainer>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Action breakdown pie */}
        <Section title="פילוח פעולות" icon="🧩">
          {pieData.length === 0 ? (
            <p className="text-gray-400 text-sm">אין נתונים בטווח שנבחר</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Section>

        {/* Top recipes */}
        <Section title="מתכונים מובילים" icon="🏅">
          {data.topRecipes.length === 0 ? (
            <p className="text-gray-400 text-sm">אין צפיות בטווח שנבחר</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.topRecipes.slice(0, 8)} layout="vertical">
                <XAxis type="number" tick={{fontSize: 11}} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="title"
                  width={120}
                  tick={{fontSize: 11}}
                />
                <Tooltip />
                <Bar dataKey="views" fill="#6366f1" radius={[0, 4, 4, 0]} name="צפיות" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>

      {/* Leaderboard */}
      <Section
        title="היכל התהילה 🏆"
        icon="🏆"
        action={
          <button
            onClick={recomputeBadges}
            className="text-xs px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200">
            🎮 עדכן תגי הישג
          </button>
        }>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LeaderColumn title="🍳 הכי הרבה מתכונים" rows={data.leaderboard.mostRecipes} valueKey="recipes" />
          <LeaderColumn title="❤️ הכי אהובים" rows={data.leaderboard.mostLoved} valueKey="hearts" />
          <LeaderColumn title="⚡ הכי פעילים" rows={data.leaderboard.mostActive} valueKey="events" />
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap */}
        <Section title="מפת חום — מתי האתר חי" icon="🌡️">
          <Heatmap data={data.heatmap} />
        </Section>

        {/* Top searches */}
        <Section title="חיפושים פופולריים" icon="🔍">
          {data.topSearches.length === 0 ? (
            <p className="text-gray-400 text-sm">אין חיפושים בטווח שנבחר</p>
          ) : (
            <ul className="space-y-2">
              {data.topSearches.map((s, i) => (
                <li key={i} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                  <span className="text-gray-700">🔎 {s.query}</span>
                  <span className="font-bold text-indigo-600">{s.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by country */}
        <Section title="פילוח גיאוגרפי" icon="🗺️">
          {(!data.usersByCountry || data.usersByCountry.length === 0) ? (
            <p className="text-gray-400 text-sm">אין נתוני מיקום זמינים</p>
          ) : (
            <ul className="space-y-2">
              {data.usersByCountry.map((c, i) => (
                <li key={i} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                  <span className="text-gray-700">{flagEmoji(c.country)} {c.country}</span>
                  <span className="font-bold text-indigo-600">{c.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Recent activity feed */}
        <Section title="פעילות אחרונה" icon="📡">
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {data.recentActivity.map((a, i) => (
              <li key={i} className="flex justify-between items-start text-sm border-b border-gray-100 pb-2">
                <span className="text-gray-700">
                  <span className="font-medium">{a.userName || 'אורח'}</span>{' '}
                  {ACTION_LABELS[a.action] || a.action}
                  {a.metadata?.recipeTitle && (
                    <span className="text-gray-400"> · {a.metadata.recipeTitle}</span>
                  )}
                  {a.metadata?.query && (
                    <span className="text-gray-400"> · "{a.metadata.query}"</span>
                  )}
                </span>
                <span className="text-xs text-gray-400 whitespace-nowrap mr-2">
                  {timeAgo(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* Content reports */}
      <Section
        title="דיווחים פתוחים"
        icon="🚩"
        action={
          reports?.openCount > 0 && (
            <span className="text-xs px-2.5 py-1 bg-red-100 text-red-700 rounded-full font-bold">
              {reports.openCount} ממתינים
            </span>
          )
        }>
        {(!reports || reports.entries.length === 0) ? (
          <p className="text-gray-400 text-sm">אין דיווחים פתוחים — הכל נקי! ✨</p>
        ) : (
          <div className="space-y-3">
            {reports.entries.map(r => (
              <div
                key={r._id}
                className="flex items-start justify-between gap-3 border border-gray-100 rounded-lg p-3">
                <div className="text-sm">
                  <a
                    href={`/recipe/${r.targetId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-indigo-600 hover:underline">
                    {r.recipeTitle || r.targetId}
                  </a>
                  <p className="text-gray-600 mt-0.5">{r.reason}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    דווח ע״י {r.reporterName || 'משתמש'} · {timeAgo(r.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => resolveReport(r._id, 'resolved')}
                    className="px-2.5 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                    ✓ טופל
                  </button>
                  <button
                    onClick={() => resolveReport(r._id, 'dismissed')}
                    className="px-2.5 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                    התעלם
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Broadcast / announcements */}
      <Section title="הודעת מערכת (Broadcast)" icon="📣">
        <div className="flex flex-col md:flex-row gap-3 mb-4 no-print">
          <input
            type="text"
            value={annForm.message}
            onChange={e => setAnnForm({...annForm, message: e.target.value})}
            placeholder="תוכן ההודעה שתוצג לכל המשתמשים..."
            maxLength={300}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={annForm.type}
            onChange={e => setAnnForm({...annForm, type: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="info">ℹ️ מידע</option>
            <option value="warning">⚠️ אזהרה</option>
            <option value="success">🎉 חגיגי</option>
          </select>
          <input
            type="date"
            value={annForm.expiresAt}
            onChange={e => setAnnForm({...annForm, expiresAt: e.target.value})}
            title="תאריך תפוגה (אופציונלי)"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={createAnnouncement}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium whitespace-nowrap">
            פרסם
          </button>
        </div>
        {announcements.length === 0 ? (
          <p className="text-gray-400 text-sm">לא פורסמו הודעות עדיין</p>
        ) : (
          <div className="space-y-2">
            {announcements.map(a => (
              <div
                key={a._id}
                className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2">
                  <span>
                    {a.type === 'warning' ? '⚠️' : a.type === 'success' ? '🎉' : 'ℹ️'}
                  </span>
                  <span className={a.active ? 'text-gray-800' : 'text-gray-400 line-through'}>
                    {a.message}
                  </span>
                  {a.expiresAt && (
                    <span className="text-xs text-gray-400">
                      (עד {new Date(a.expiresAt).toLocaleDateString('he-IL')})
                    </span>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => toggleAnnouncement(a._id, !a.active)}
                    className={`px-2.5 py-1 text-xs rounded-lg ${
                      a.active
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}>
                    {a.active ? 'השבת' : 'הפעל'}
                  </button>
                  <button
                    onClick={() => deleteAnnouncement(a._id)}
                    className="px-2.5 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                    מחק
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Audit log */}
      <Section title="יומן פעולות מנהלים" icon="🛡️">
        {(!audit || audit.entries.length === 0) ? (
          <p className="text-gray-400 text-sm">לא נרשמו פעולות מנהל עדיין</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-right">מנהל</th>
                  <th className="px-3 py-2 text-right">פעולה</th>
                  <th className="px-3 py-2 text-right">יעד</th>
                  <th className="px-3 py-2 text-right">פרטים</th>
                  <th className="px-3 py-2 text-right">מתי</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {audit.entries.map((e, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{e.adminName || '—'}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs">
                        {AUDIT_LABELS[e.action] || e.action}
                      </span>
                    </td>
                    <td className="px-3 py-2">{e.targetName || '—'}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">
                      {e.details
                        ? Object.entries(e.details).map(([k, v]) => `${k}: ${v}`).join(', ')
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-400 text-xs whitespace-nowrap">
                      {timeAgo(e.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

function LeaderColumn({title, rows, valueKey}) {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-semibold text-gray-700 mb-3 text-sm">{title}</h3>
      {(!rows || rows.length === 0) ? (
        <p className="text-gray-400 text-xs">אין נתונים</p>
      ) : (
        <ol className="space-y-2">
          {rows.map((r, i) => (
            <li key={i} className="flex justify-between items-center text-sm">
              <span className="text-gray-700">
                {medals[i] || `${i + 1}.`} {r.name || 'לא ידוע'}
              </span>
              <span className="font-bold text-indigo-600">{r[valueKey]}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// Convert ISO country code to a flag emoji
function flagEmoji(code) {
  if (!code || code.length !== 2) return '🏳️';
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map(c => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}
