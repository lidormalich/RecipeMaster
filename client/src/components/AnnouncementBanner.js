import React, {useState, useEffect} from 'react';
import axios from 'axios';

const TYPE_STYLES = {
  info: 'bg-indigo-600',
  warning: 'bg-amber-500',
  success: 'bg-emerald-600',
};

const TYPE_ICONS = {
  info: 'ℹ️',
  warning: '⚠️',
  success: '🎉',
};

// Site-wide broadcast banner. Dismissible per-announcement (remembered locally).
const AnnouncementBanner = () => {
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    let mounted = true;
    axios
      .get('/api/announcements/active')
      .then(res => {
        if (!mounted || !res.data) return;
        const dismissed = localStorage.getItem('dismissedAnnouncement');
        if (dismissed === res.data._id) return;
        setAnnouncement(res.data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (!announcement) return null;

  const dismiss = () => {
    localStorage.setItem('dismissedAnnouncement', announcement._id);
    setAnnouncement(null);
  };

  return (
    <div
      className={`${TYPE_STYLES[announcement.type] || TYPE_STYLES.info} text-white no-print`}
      dir="rtl">
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>{TYPE_ICONS[announcement.type] || TYPE_ICONS.info}</span>
          <span>{announcement.message}</span>
        </div>
        <button
          onClick={dismiss}
          aria-label="סגור הודעה"
          className="text-white/80 hover:text-white text-lg leading-none px-2">
          ✕
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
