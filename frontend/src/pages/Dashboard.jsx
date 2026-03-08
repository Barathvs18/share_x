import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMyFilesAPI, getSharedFilesAPI, verifyFileAPI } from '../services/api';
import FileCard from '../components/FileCard';
import {
    ShieldCheck, ShieldX, ShieldAlert,
    Share2, Files, HardDrive,
    RefreshCw, Loader, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// ─── How often to auto-poll (ms) ─────────────────────────────────────────────
const POLL_INTERVAL_MS = 15_000; // 15 seconds

// ─── Animation variants ───────────────────────────────────────────────────────
const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' } },
};

// ─── Color + Icon helpers ─────────────────────────────────────────────────────
const getIntegrityColor = (pct) => {
    if (pct === null) return 'var(--text-muted)';
    if (pct === 100) return '#22c55e';
    if (pct >= 50) return '#f59e0b';
    return '#ef4444';
};

const IntegrityIcon = ({ pct, size = 28 }) => {
    if (pct === null) return <ShieldAlert size={size} />;
    if (pct === 100) return <ShieldCheck size={size} />;
    return <ShieldX size={size} />;
};

// ─── Core batch-verify logic (pure async, no state) ──────────────────────────
const batchVerify = async (files) => {
    if (!files || files.length === 0) return { pct: 100, tampered: 0, tamperedFiles: [] };

    const results = await Promise.allSettled(
        files.map((f) => verifyFileAPI({ file_id: f._id, file_hash: f.hash }))
    );

    let passed = 0;
    const tamperedFiles = [];

    results.forEach((r, i) => {
        const authentic = r.status === 'fulfilled' && r.value?.data?.is_authentic_on_server === true;
        if (authentic) {
            passed++;
        } else {
            tamperedFiles.push(files[i]?.filename || `File #${i + 1}`);
        }
    });

    const pct = Math.round((passed / files.length) * 100);
    return { pct, tampered: files.length - passed, tamperedFiles };
};

// ─── Component ────────────────────────────────────────────────────────────────
const Dashboard = () => {
    const [myFiles, setMyFiles] = useState([]);
    const [sharedFiles, setSharedFiles] = useState([]);
    const [loading, setLoading] = useState(true);

    // Integrity state
    const [integrityPct, setIntegrityPct] = useState(null);
    const [tamperedCount, setTamperedCount] = useState(0);
    const [tamperedNames, setTamperedNames] = useState([]);
    const [checkingIntegrity, setCheckingIntegrity] = useState(false);
    const [lastChecked, setLastChecked] = useState(null);

    // Keep a ref to current files so the poll interval always uses the latest list
    const myFilesRef = useRef([]);
    // Keep previous tampered count to detect new tampering events
    const prevTamperedRef = useRef(0);
    // Ref to the poll interval timer
    const pollTimerRef = useRef(null);

    const navigate = useNavigate();

    // ── Run integrity check (updates state + detects new tampering) ───────────
    const runIntegrityCheck = useCallback(async (files, silent = false) => {
        const fileList = files ?? myFilesRef.current;
        if (!silent) setCheckingIntegrity(true);

        try {
            const { pct, tampered, tamperedFiles } = await batchVerify(fileList);
            setIntegrityPct(pct);
            setTamperedCount(tampered);
            setTamperedNames(tamperedFiles);
            setLastChecked(new Date());

            // ── Alert on newly detected tampering ─────────────────────────────
            const prev = prevTamperedRef.current;
            if (tampered > 0 && tampered > prev) {
                const newlyTampered = tamperedFiles.slice(0, 3).join(', ');
                toast.error(
                    `⚠️ Tampering detected!\n${newlyTampered}${tamperedFiles.length > 3 ? ` +${tamperedFiles.length - 3} more` : ''}`,
                    { duration: 8000, id: 'tamper-alert' }
                );
            } else if (tampered === 0 && prev > 0) {
                // Files restored to normal
                toast.success('✅ All files are intact again!', { id: 'tamper-alert' });
            }
            prevTamperedRef.current = tampered;
        } catch {
            if (!silent) setIntegrityPct(null);
        } finally {
            if (!silent) setCheckingIntegrity(false);
        }
    }, []);

    // ── Start / restart the polling loop ─────────────────────────────────────
    const startPolling = useCallback((files) => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        pollTimerRef.current = setInterval(() => {
            runIntegrityCheck(myFilesRef.current, true /* silent */);
        }, POLL_INTERVAL_MS);
    }, [runIntegrityCheck]);

    // ── Initial data fetch ────────────────────────────────────────────────────
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [myRes, sharedRes] = await Promise.all([getMyFilesAPI(), getSharedFilesAPI()]);
                const files = myRes.data.files || [];
                setMyFiles(files);
                myFilesRef.current = files;
                setSharedFiles(sharedRes.data.shared_files || []);

                // First check immediately, then start polling
                await runIntegrityCheck(files);
                startPolling(files);
            } catch {
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();

        // Cleanup: stop polling when component unmounts
        return () => {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        };
    }, [runIntegrityCheck, startPolling]);

    // ── Handle file deletion ──────────────────────────────────────────────────
    const handleDeleted = useCallback((deletedId) => {
        setMyFiles((prev) => {
            const updated = prev.filter((f) => f._id !== deletedId);
            myFilesRef.current = updated;
            runIntegrityCheck(updated);
            return updated;
        });
    }, [runIntegrityCheck]);

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="grid-cards">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="card skeleton" style={{ height: '240px' }} />
                ))}
            </div>
        );
    }

    const integrityColor = getIntegrityColor(integrityPct);
    const isTampered = integrityPct !== null && integrityPct < 100;

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="show">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard Overview</h1>
                    <p className="page-subtitle">Manage your secured files and active sharing sessions</p>
                </div>
            </div>

            {/* ── Global tamper alert banner ────────────────────────────────── */}
            <AnimatePresence>
                {isTampered && (
                    <motion.div
                        key="tamper-banner"
                        initial={{ opacity: 0, y: -16, scaleY: 0.8 }}
                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                        exit={{ opacity: 0, y: -16, scaleY: 0.8 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            background: 'rgba(239,68,68,0.10)',
                            border: '1px solid rgba(239,68,68,0.4)',
                            borderRadius: '12px',
                            padding: '0.85rem 1.1rem',
                            marginBottom: '1.5rem',
                            boxShadow: '0 0 24px rgba(239,68,68,0.12)',
                        }}
                    >
                        <AlertTriangle size={20} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.9rem' }}>
                                File Integrity Compromised!&nbsp;
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {tamperedCount} file{tamperedCount !== 1 ? 's' : ''} may have been tampered with on the server.
                            </span>
                            {tamperedNames.length > 0 && (
                                <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#fca5a5' }}>
                                    {tamperedNames.slice(0, 5).map((n, i) => (
                                        <span key={i} style={{
                                            display: 'inline-block',
                                            background: 'rgba(239,68,68,0.15)',
                                            borderRadius: '4px',
                                            padding: '1px 6px',
                                            marginRight: '4px',
                                            marginTop: '2px',
                                        }}>{n}</span>
                                    ))}
                                    {tamperedNames.length > 5 && (
                                        <span style={{ color: 'var(--text-muted)' }}>
                                            +{tamperedNames.length - 5} more
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Stats Row ─────────────────────────────────────────────────── */}
            <motion.div className="grid-stats" variants={itemVariants}>
                {/* Total Uploads */}
                <div className="stat-card">
                    <span className="stat-label">Total Uploads</span>
                    <span className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Files size={28} style={{ color: 'var(--primary)' }} /> {myFiles.length}
                    </span>
                </div>

                {/* Active Shares */}
                <div className="stat-card">
                    <span className="stat-label">Active Shares (Received)</span>
                    <span className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Share2 size={28} style={{ color: 'var(--accent)' }} /> {sharedFiles.length}
                    </span>
                </div>

                {/* ── Live Integrity Stat ──────────────────────────────────── */}
                <div
                    className="stat-card"
                    style={{
                        border: isTampered
                            ? '1px solid rgba(239,68,68,0.5)'
                            : undefined,
                        boxShadow: isTampered
                            ? '0 0 20px rgba(239,68,68,0.15)'
                            : undefined,
                        transition: 'border 0.4s, box-shadow 0.4s',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Animated pulse ring on tamper */}
                    {isTampered && (
                        <span style={{
                            position: 'absolute', top: 10, right: 10,
                            width: 10, height: 10, borderRadius: '50%',
                            background: '#ef4444',
                            boxShadow: '0 0 0 0 rgba(239,68,68,0.7)',
                            animation: 'pulseRing 1.4s ease-in-out infinite',
                        }} />
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="stat-label">Integrity Status</span>
                        <button
                            onClick={() => runIntegrityCheck(myFiles)}
                            disabled={checkingIntegrity || myFiles.length === 0}
                            title="Re-check now"
                            style={{
                                background: 'transparent', border: 'none',
                                cursor: myFiles.length === 0 ? 'default' : 'pointer',
                                color: 'var(--text-muted)', padding: '2px',
                                display: 'flex', alignItems: 'center',
                                opacity: myFiles.length === 0 ? 0.3 : 1,
                                transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                            <RefreshCw
                                size={15}
                                style={{ animation: checkingIntegrity ? 'spin 1s linear infinite' : 'none' }}
                            />
                        </button>
                    </div>

                    <span className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: integrityColor, transition: 'color 0.4s' }}>
                        {checkingIntegrity
                            ? <Loader size={28} style={{ animation: 'spin 1s linear infinite' }} />
                            : <IntegrityIcon pct={integrityPct} size={28} />
                        }
                        <span style={{ transition: 'all 0.4s' }}>
                            {checkingIntegrity ? 'Checking…' : integrityPct === null ? 'N/A' : `${integrityPct}%`}
                        </span>
                    </span>

                    <span style={{ fontSize: '0.75rem', marginTop: '4px', display: 'block', color: integrityColor, transition: 'color 0.4s' }}>
                        {checkingIntegrity
                            ? `Scanning ${myFiles.length} file${myFiles.length !== 1 ? 's' : ''}…`
                            : myFiles.length === 0
                                ? 'No files to check'
                                : integrityPct === 100
                                    ? `All ${myFiles.length} file${myFiles.length !== 1 ? 's' : ''} intact ✓`
                                    : `${tamperedCount} file${tamperedCount !== 1 ? 's' : ''} tampered or unreadable`
                        }
                    </span>

                    {lastChecked && !checkingIntegrity && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                            Last checked: {lastChecked.toLocaleTimeString()} · auto-polls every {POLL_INTERVAL_MS / 1000}s
                        </span>
                    )}
                </div>
            </motion.div>

            {/* ── My Files ─────────────────────────────────────────────────── */}
            <motion.h2 variants={itemVariants} style={{ fontSize: '1.25rem', marginBottom: '1rem', marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HardDrive size={20} /> My Uploaded Files
            </motion.h2>
            <motion.div className="grid-cards" variants={itemVariants} style={{ marginBottom: '3rem' }}>
                {myFiles.map(file => (
                    <FileCard
                        key={file._id}
                        file={file}
                        isShared={false}
                        onShare={(id) => navigate(`/share/${id}`)}
                        onVerify={(id) => navigate(`/verify/${id}`)}
                        onDeleted={handleDeleted}
                    />
                ))}
                {myFiles.length === 0 && (
                    <div className="empty-state">
                        <Files className="empty-icon" />
                        <p>No files uploaded yet.</p>
                        <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => navigate('/upload')}>
                            Upload First File
                        </button>
                    </div>
                )}
            </motion.div>

            {/* ── Shared With Me ────────────────────────────────────────────── */}
            <motion.h2 variants={itemVariants} style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={20} /> Shared With Me
            </motion.h2>
            <motion.div className="grid-cards" variants={itemVariants}>
                {sharedFiles.map(file => (
                    <FileCard
                        key={file.file_id}
                        file={file}
                        isShared={true}
                        onVerify={(id) => navigate(`/verify/${id}`)}
                    />
                ))}
                {sharedFiles.length === 0 && (
                    <div className="empty-state" style={{ gridColumn: 'span 3' }}>
                        <Share2 className="empty-icon" />
                        <p>No files shared with you.</p>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default Dashboard;
