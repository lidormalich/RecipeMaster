const ActivityLog = require('../models/ActivityLog');
const AuditLog = require('../models/AuditLog');

// geoip-lite is optional. Require it lazily so the app keeps working
// (just without country data) if the dependency isn't installed.
let geoip = null;
try {
  geoip = require('geoip-lite');
} catch (err) {
  console.log('ℹ️  geoip-lite not installed — country data disabled');
}

// Extract the client IP, accounting for the proxy in front of the app (Render).
function extractIp(req) {
  if (!req) return null;
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || null;
}

// Drop the last IPv4 octet (or trailing IPv6 segment) to reduce identifiability.
function truncateIp(ip) {
  if (!ip) return null;
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      parts[3] = '0';
      return parts.join('.');
    }
  }
  if (ip.includes(':')) {
    return ip.split(':').slice(0, 4).join(':') + '::';
  }
  return ip;
}

function lookupCountry(ip) {
  if (!geoip || !ip) return null;
  try {
    const geo = geoip.lookup(ip);
    return geo?.country || null;
  } catch (err) {
    return null;
  }
}

/**
 * Records a user-facing activity event. Fire-and-forget: errors are swallowed
 * so logging can never break or slow down the request it's tracking.
 */
async function logActivity({req, user, action, targetType, targetId, metadata}) {
  try {
    const fullIp = extractIp(req);
    await ActivityLog.create({
      user: user?._id || user?.id || null,
      userName: user?.name || null,
      action,
      targetType: targetType || null,
      targetId: targetId != null ? String(targetId) : null,
      metadata: metadata || null,
      country: lookupCountry(fullIp),
      ip: truncateIp(fullIp),
      userAgent: req?.headers?.['user-agent'] || null,
    });
  } catch (err) {
    console.error('[logActivity] failed:', err.message);
  }
}

/**
 * Records a sensitive admin action for the audit trail. Also fire-and-forget.
 */
async function logAudit({req, admin, action, targetUser, details}) {
  try {
    await AuditLog.create({
      admin: admin?._id || admin?.id || null,
      adminName: admin?.name || null,
      action,
      targetUser: targetUser?._id || targetUser?.id || null,
      targetName: targetUser?.name || null,
      details: details || null,
      ip: truncateIp(extractIp(req)),
    });
  } catch (err) {
    console.error('[logAudit] failed:', err.message);
  }
}

module.exports = {logActivity, logAudit, extractIp};
