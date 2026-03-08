import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllLogsAPI } from '../services/api';
import {
    Activity, Upload, Eye, Download, Share2,
    ShieldCheck, Trash2, XCircle, RefreshCw,
    Filter, ChevronDown, ChevronUp, Clock,
    AlertTriangle, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Action metadata ──────────────────────────────────────────────────────────
const ACTION_META = {
    upload: { label: 'Upload', icon: Upload, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    view: { label: 'View', icon: Eye, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
    download: { label: 'Download', icon: Download, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    share: { label: 'Share', icon: Share2, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    revoke: { label: 'Revoke', icon: XCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    verify: { label: 'Verify', icon: ShieldCheck, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    delete: { label: 'Delete', icon: Trash2, color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
};

const ALL_ACTIONS = ['all', ...Object.keys(ACTION_META)];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true,
    });
};

const timeAgo = (iso) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

// ─── Single log row ───────────────────────────────────────────────────────────
const LogRow = ({ log, index }) => {
    const [expanded, setExpanded] = useState(false);
    const meta = ACTION_META[log.action] || { label: log.action, icon: Info, color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };
    const Icon = meta.icon;
    const hasExtra = log.extra && Object.keys(log.extra).length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03, type: 'spring', stiffness: 200 }}
            style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                marginBottom: '0.5rem',
                cursor: hasExtra ? 'pointer' : 'default',
                transition: 'background 0.2s, border-color 0.2s',
            }}
            whileHover={{ background: 'rgba(255,255,255,0.055)' }}
            onClick={() => hasExtra && setExpanded(e => !e)}
        >
            {/* Main row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Icon badge */}
                <div style={{
                    width: 36, height: 36, borderRadius: '9px',
                    background: meta.bg, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${meta.color}33`,
                }}>
                    <Icon size={16} color={meta.color} />
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                            fontWeight: 600, fontSize: '0.82rem',
                            color: meta.color, letterSpacing: '0.03em', textTransform: 'uppercase',
                        }}>
                            {meta.label}
                        </span>
                        <span style={{
                            fontSize: '0.88rem',
                            color: 'var(--text-main)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {log.filename || log.file_id}
                        </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} /> {fmtDate(log.timestamp)}
                        </span>
                        <span>·</span>
                        <span title={log.actor_email}>{log.actor_email}</span>
                    </div>
                </div>

                {/* Time-ago + expand toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {timeAgo(log.timestamp)}
                    </span>
                    {hasExtra && (
                        expanded
                            ? <ChevronUp size={14} color="var(--text-muted)" />
                            : <ChevronDown size={14} color="var(--text-muted)" />
                    )}
                </div>
            </div>

            {/* Expandable extra details */}
            <AnimatePresence>
                {expanded && hasExtra && (
                    <motion.div
                        key="extra"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{
                            marginTop: '0.6rem',
                            paddingTop: '0.6rem',
                            borderTop: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex', flexWrap: 'wrap', gap: '10px',
                        }}>
                            {Object.entries(log.extra).map(([k, v]) => (
                                <span key={k} style={{
                                    fontSize: '0.75rem',
                                    background: 'rgba(255,255,255,0.06)',
                                    borderRadius: '6px',
                                    padding: '3px 8px',
                                    color: 'var(--text-muted)',
                                }}>
                                    <strong style={{ color: 'var(--text-main)' }}>{k}:</strong>{' '}
                                    {String(v)}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const ActivityLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const fetchLogs = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await getAllLogsAPI();
            setLogs(res.data.logs || []);
        } catch {
            toast.error('Failed to load activity logs');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    // ── Filter + search ───────────────────────────────────────────────────────
    const filtered = logs.filter((l) => {
        const matchAction = filter === 'all' || l.action === filter;
        const q = search.toLowerCase();
        const matchSearch = !q ||
            (l.filename || '').toLowerCase().includes(q) ||
            (l.actor_email || '').toLowerCase().includes(q);
        return matchAction && matchSearch;
    });

    // ── Count by action ───────────────────────────────────────────────────────
    const counts = {};
    logs.forEach((l) => { counts[l.action] = (counts[l.action] || 0) + 1; });

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
        >
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Activity size={26} style={{ color: 'var(--primary)' }} />
                        File Activity Log
                    </h1>
                    <p className="page-subtitle">
                        Full audit trail for all your uploaded files — only you can see this.
                    </p>
                </div>
                <button
                    className="btn btn-outline"
                    onClick={() => fetchLogs(true)}
                    disabled={refreshing}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                    Refresh
                </button>
            </div>

            {/* ── Summary chips ─────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.25rem' }}
            >
                {Object.entries(ACTION_META).map(([action, meta]) => {
                    const Icon = meta.icon;
                    return counts[action] ? (
                        <div key={action} style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            background: meta.bg, border: `1px solid ${meta.color}33`,
                            borderRadius: '20px', padding: '4px 10px',
                            fontSize: '0.75rem', color: meta.color, fontWeight: 600,
                        }}>
                            <Icon size={12} /> {counts[action]} {meta.label}
                        </div>
                    ) : null;
                })}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px', padding: '4px 10px',
                    fontSize: '0.75rem', color: 'var(--text-muted)',
                }}>
                    {logs.length} total events
                </div>
            </motion.div>

            {/* ── Filter + Search bar ───────────────────────────────────────── */}
            <div style={{
                display: 'flex', gap: '10px', flexWrap: 'wrap',
                alignItems: 'center', marginBottom: '1.5rem',
            }}>
                {/* Action filter pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <Filter size={13} color="var(--text-muted)" />
                    {ALL_ACTIONS.map((a) => {
                        const meta = ACTION_META[a];
                        return (
                            <button
                                key={a}
                                onClick={() => setFilter(a)}
                                style={{
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    border: filter === a
                                        ? `1px solid ${meta?.color || 'var(--primary)'}`
                                        : '1px solid rgba(255,255,255,0.1)',
                                    background: filter === a
                                        ? (meta?.bg || 'rgba(99,102,241,0.15)')
                                        : 'transparent',
                                    color: filter === a ? (meta?.color || 'var(--primary)') : 'var(--text-muted)',
                                    fontSize: '0.78rem', fontWeight: 600,
                                    cursor: 'pointer', textTransform: 'capitalize',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {a === 'all' ? 'All' : ACTION_META[a].label}
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <input
                    type="text"
                    placeholder="Search filename or email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        flex: 1, minWidth: '180px',
                        padding: '6px 12px', borderRadius: '8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--text-main)', fontSize: '0.85rem',
                        outline: 'none',
                    }}
                />
            </div>

            {/* ── Log list ──────────────────────────────────────────────────── */}
            {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
                    <p>Loading activity logs…</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <AlertTriangle className="empty-icon" />
                    <p>{logs.length === 0 ? 'No activity recorded yet.' : 'No events match your filter.'}</p>
                </div>
            ) : (
                <motion.div
                    key={filter + search}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    {filtered.map((log, i) => (
                        <LogRow key={log._id || i} log={log} index={i} />
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
};

export default ActivityLog;
