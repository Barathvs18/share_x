import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSharedFilesAPI, revokeFileAPI, getMyFilesAPI, getMySharesAPI, downloadFileAPI } from '../services/api';
import { Share2, ShieldQuestion, Clock, FileText, HardDrive, Calendar, Users, Loader, XCircle, Download, Eye, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' } }
};

const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatExpiry = (ts) => {
    if (!ts) return 'N/A';
    const diffH = Math.floor((ts * 1000 - Date.now()) / 1000 / 3600);
    if (diffH < 0) return 'Expired';
    if (diffH < 24) return `Expires in ${diffH}h`;
    return `Expires in ${Math.floor(diffH / 24)}d`;
};

const SharedFiles = () => {
    const [receivedFiles, setReceivedFiles] = useState([]);
    const [myFiles, setMyFiles] = useState([]);
    const [myShares, setMyShares] = useState([]);
    const [loading, setLoading] = useState(true);
    const [revoking, setRevoking] = useState(null);
    const [downloading, setDownloading] = useState(null);
    const [activeTab, setActiveTab] = useState('received');
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sharedRes, myFilesRes, mySharesRes] = await Promise.all([
                getSharedFilesAPI(),
                getMyFilesAPI(),
                getMySharesAPI()
            ]);
            setReceivedFiles(sharedRes.data.shared_files || []);
            setMyFiles(myFilesRes.data.files || []);
            setMyShares(mySharesRes.data.shares || []);
        } catch {
            toast.error('Could not load shared files');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleDownload = async (fileId, filename) => {
        setDownloading(fileId);
        try {
            await downloadFileAPI(fileId, filename);
            toast.success('File downloaded!');
        } catch (err) {
            toast.error(err.message || 'Download failed');
        } finally {
            setDownloading(null);
        }
    };

    const handleRevoke = async (fileId, revokedEmail) => {
        setRevoking(`${fileId}-${revokedEmail}`);
        try {
            await revokeFileAPI({ file_id: fileId, revoked_user_email: revokedEmail });
            toast.success(`Access revoked from ${revokedEmail}`);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to revoke access');
        } finally {
            setRevoking(null);
        }
    };

    const sharesByFileId = myShares.reduce((acc, share) => {
        if (!acc[share.file_id]) acc[share.file_id] = [];
        acc[share.file_id].push(share);
        return acc;
    }, {});

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="show">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Shared Files</h1>
                    <p className="page-subtitle">Manage files shared with you or by you</p>
                </div>
            </div>

            {/* Tabs */}
            <motion.div variants={itemVariants} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                <button className={`btn ${activeTab === 'received' ? '' : 'btn-secondary'}`} onClick={() => setActiveTab('received')}>
                    <Share2 size={16} /> Received ({receivedFiles.length})
                </button>
                <button className={`btn ${activeTab === 'shared-out' ? '' : 'btn-secondary'}`} onClick={() => setActiveTab('shared-out')}>
                    <FileText size={16} /> My Files ({myFiles.length})
                </button>
            </motion.div>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div key="loading" className="grid-cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {[...Array(4)].map((_, i) => <div key={i} className="card skeleton" style={{ height: '200px' }} />)}
                    </motion.div>

                ) : activeTab === 'received' ? (
                    /* ── RECEIVED TAB ─────────────────────────────────── */
                    <motion.div key="received" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0 }}>
                        {receivedFiles.length === 0 ? (
                            <div className="empty-state" style={{ marginTop: '2rem' }}>
                                <Share2 className="empty-icon" />
                                <p>No files have been shared with you yet.</p>
                            </div>
                        ) : (
                            <div className="grid-cards">
                                {receivedFiles.map(file => {
                                    const canDownload = file.can_download !== false;
                                    return (
                                        <motion.div
                                            key={file._id || file.file_id}
                                            variants={itemVariants}
                                            className="card file-card-inner"
                                            onClick={!canDownload ? () => navigate(`/view/${file.file_id}`) : undefined}
                                            whileHover={{ y: -4, boxShadow: canDownload ? '0 10px 30px rgba(59,130,246,0.15)' : '0 10px 30px rgba(239,68,68,0.15)', borderColor: canDownload ? 'rgba(59,130,246,0.5)' : 'rgba(239,68,68,0.4)' }}
                                            transition={{ type: 'spring', stiffness: 300 }}
                                            style={{ cursor: !canDownload ? 'pointer' : 'default' }}
                                        >
                                            {/* Header with permission badge */}
                                            <div className="file-header">
                                                <div className="file-icon-box"
                                                    style={{ background: !canDownload ? 'rgba(239,68,68,0.1)' : undefined, color: !canDownload ? '#ef4444' : undefined }}
                                                >
                                                    <FileText size={24} />
                                                </div>
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                    <span className="status-badge status-active">Shared with you</span>
                                                    <span style={{
                                                        fontSize: '0.72rem', padding: '2px 8px', borderRadius: '99px',
                                                        display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500',
                                                        background: canDownload ? 'rgba(59,130,246,0.12)' : 'rgba(239,68,68,0.12)',
                                                        color: canDownload ? 'var(--primary)' : '#ef4444',
                                                        border: `1px solid ${canDownload ? 'rgba(59,130,246,0.25)' : 'rgba(239,68,68,0.25)'}`,
                                                    }}>
                                                        {canDownload ? <><Download size={11} /> View &amp; Download</> : <><Eye size={11} /> View Only</>}
                                                    </span>
                                                </div>
                                            </div>

                                            <h3 className="file-title" title={file.filename}>{file.filename}</h3>

                                            {/* "Click to open" hint for view-only */}
                                            {!canDownload && (
                                                <p style={{ fontSize: '0.78rem', color: '#ef4444', margin: '4px 0 0', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Eye size={12} /> Click anywhere on this card to open
                                                </p>
                                            )}

                                            <div className="file-meta" style={{ marginTop: '0.5rem' }}>
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                    <Share2 size={14} /> From: <strong style={{ color: 'var(--text-main)' }}>{file.owner_email}</strong>
                                                </div>
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                    <Clock size={14} />
                                                    <span style={{ color: file.expiry_time * 1000 - Date.now() < 3600000 ? 'var(--warning)' : 'var(--text-muted)' }}>
                                                        {formatExpiry(file.expiry_time)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="file-actions" onClick={e => e.stopPropagation()}>
                                                {canDownload ? (
                                                    <>
                                                        <button onClick={() => navigate(`/verify/${file.file_id}`)} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                                                            <ShieldQuestion size={16} /> Verify
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownload(file.file_id, file.filename)}
                                                            disabled={downloading === file.file_id}
                                                            className="btn btn-secondary btn-sm"
                                                            style={{ flex: 1 }}
                                                        >
                                                            {downloading === file.file_id ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
                                                            {downloading === file.file_id ? '' : 'Download'}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => navigate(`/view/${file.file_id}`)}
                                                            className="btn btn-sm"
                                                            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                                                        >
                                                            <Eye size={16} /> Open Viewer
                                                        </button>
                                                        <div style={{
                                                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            gap: '6px', padding: '0.4rem 0.75rem', borderRadius: '8px',
                                                            fontSize: '0.82rem', background: 'rgba(100,100,100,0.07)',
                                                            color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'not-allowed',
                                                        }}>
                                                            <Lock size={13} /> No Download
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>

                ) : (
                    /* ── MY FILES TAB ─────────────────────────────────── */
                    <motion.div key="shared-out" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0 }}>
                        {myFiles.length === 0 ? (
                            <div className="empty-state" style={{ marginTop: '2rem' }}>
                                <FileText className="empty-icon" />
                                <p>You have not uploaded any files yet.</p>
                                <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => navigate('/upload')}>
                                    Upload a File
                                </button>
                            </div>
                        ) : (
                            <div className="grid-cards">
                                {myFiles.map(file => {
                                    const fileShares = sharesByFileId[file._id] || [];
                                    return (
                                        <motion.div
                                            key={file._id}
                                            variants={itemVariants}
                                            className="card file-card-inner"
                                            whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.5)' }}
                                            transition={{ type: 'spring', stiffness: 300 }}
                                        >
                                            <div className="file-header">
                                                <div className="file-icon-box"><FileText size={24} /></div>
                                                <span className="status-badge status-active">Owner</span>
                                            </div>

                                            <h3 className="file-title" title={file.filename}>{file.filename}</h3>

                                            <div className="file-meta">
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                    <HardDrive size={14} /> {formatSize(file.size)}
                                                </div>
                                                {file.uploaded_at && (
                                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                        <Calendar size={14} /> {new Date(file.uploaded_at).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Active shares with permission info */}
                                            {fileShares.length > 0 && (
                                                <div style={{
                                                    marginTop: '0.75rem', padding: '0.75rem',
                                                    background: 'rgba(59, 130, 246, 0.06)',
                                                    borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.12)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        <Users size={14} /> Active Shares ({fileShares.length})
                                                    </div>
                                                    {fileShares.map(share => (
                                                        <div key={share.shared_with_email} style={{
                                                            display: 'flex', justifyContent: 'space-between',
                                                            alignItems: 'center', padding: '0.4rem 0',
                                                            borderBottom: '1px solid rgba(255,255,255,0.05)', gap: '8px'
                                                        }}>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {share.shared_with_email}
                                                                </div>
                                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                                    <Clock size={11} /> {formatExpiry(share.expiry_time)}
                                                                    <span style={{
                                                                        marginLeft: '6px', padding: '1px 6px', borderRadius: '99px',
                                                                        background: share.can_download !== false ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)',
                                                                        color: share.can_download !== false ? 'var(--primary)' : '#ef4444',
                                                                        display: 'inline-flex', alignItems: 'center', gap: '3px'
                                                                    }}>
                                                                        {share.can_download !== false ? <><Download size={10} /> DL</> : <><Eye size={10} /> View</>}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRevoke(share.file_id, share.shared_with_email)}
                                                                disabled={revoking === `${share.file_id}-${share.shared_with_email}`}
                                                                className="btn btn-danger btn-sm"
                                                                style={{ padding: '4px 10px', fontSize: '0.75rem', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                                                            >
                                                                {revoking === `${share.file_id}-${share.shared_with_email}` ? <Loader size={13} className="animate-spin" /> : <XCircle size={13} />}
                                                                Revoke
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="file-actions" style={{ marginTop: fileShares.length > 0 ? '0.75rem' : undefined }}>
                                                <button onClick={() => navigate(`/verify/${file._id}`)} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                                                    <ShieldQuestion size={16} /> Verify
                                                </button>
                                                <button onClick={() => navigate(`/share/${file._id}`)} className="btn btn-sm" style={{ flex: 1 }}>
                                                    <Share2 size={16} /> Share
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default SharedFiles;
