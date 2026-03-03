import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSharedFilesAPI, revokeFileAPI, getMyFilesAPI } from '../services/api';
import { Share2, ShieldQuestion, Clock, FileText, HardDrive, Calendar } from 'lucide-react';
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
    const date = new Date(ts * 1000);
    const now = new Date();
    const diffMs = date - now;
    const diffH = Math.floor(diffMs / 1000 / 3600);
    if (diffH < 0) return 'Expired';
    if (diffH < 24) return `Expires in ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    return `Expires in ${diffD}d`;
};

const SharedFiles = () => {
    const [receivedFiles, setReceivedFiles] = useState([]);
    const [mySharedOut, setMySharedOut] = useState([]);
    const [loading, setLoading] = useState(true);
    const [revoking, setRevoking] = useState(null);
    const [activeTab, setActiveTab] = useState('received'); // 'received' | 'shared-out'
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sharedRes, myFilesRes] = await Promise.all([
                getSharedFilesAPI(),
                getMyFilesAPI()
            ]);
            setReceivedFiles(sharedRes.data.shared_files || []);
            // My files that have been shared out — for now just show my files with share button
            setMySharedOut(myFilesRes.data.files || []);
        } catch {
            toast.error('Could not load shared files');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

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
                <button
                    className={`btn ${activeTab === 'received' ? '' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('received')}
                >
                    <Share2 size={16} /> Received ({receivedFiles.length})
                </button>
                <button
                    className={`btn ${activeTab === 'shared-out' ? '' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('shared-out')}
                >
                    <FileText size={16} /> My Files ({mySharedOut.length})
                </button>
            </motion.div>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div key="loading" className="grid-cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="card skeleton" style={{ height: '200px' }} />
                        ))}
                    </motion.div>
                ) : activeTab === 'received' ? (
                    <motion.div key="received" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0 }}>
                        {receivedFiles.length === 0 ? (
                            <div className="empty-state" style={{ marginTop: '2rem' }}>
                                <Share2 className="empty-icon" />
                                <p>No files have been shared with you yet.</p>
                            </div>
                        ) : (
                            <div className="grid-cards">
                                {receivedFiles.map(file => (
                                    <motion.div
                                        key={file._id || file.file_id}
                                        variants={itemVariants}
                                        className="card file-card-inner"
                                        whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.5)' }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                    >
                                        <div className="file-header">
                                            <div className="file-icon-box">
                                                <FileText size={24} />
                                            </div>
                                            <span className="status-badge status-active">
                                                Shared with you
                                            </span>
                                        </div>
                                        <h3 className="file-title" title={file.filename}>{file.filename}</h3>
                                        <div className="file-meta">
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
                                        <div className="file-actions">
                                            <button
                                                onClick={() => navigate(`/verify/${file.file_id}`)}
                                                className="btn btn-outline btn-sm"
                                                style={{ flex: 1 }}
                                            >
                                                <ShieldQuestion size={16} /> Verify
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="shared-out" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0 }}>
                        {mySharedOut.length === 0 ? (
                            <div className="empty-state" style={{ marginTop: '2rem' }}>
                                <FileText className="empty-icon" />
                                <p>You have not uploaded any files yet.</p>
                                <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => navigate('/upload')}>
                                    Upload a File
                                </button>
                            </div>
                        ) : (
                            <div className="grid-cards">
                                {mySharedOut.map(file => (
                                    <motion.div
                                        key={file._id}
                                        variants={itemVariants}
                                        className="card file-card-inner"
                                        whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.5)' }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                    >
                                        <div className="file-header">
                                            <div className="file-icon-box">
                                                <FileText size={24} />
                                            </div>
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
                                        <div className="file-actions">
                                            <button
                                                onClick={() => navigate(`/verify/${file._id}`)}
                                                className="btn btn-outline btn-sm"
                                                style={{ flex: 1 }}
                                            >
                                                <ShieldQuestion size={16} /> Verify
                                            </button>
                                            <button
                                                onClick={() => navigate(`/share/${file._id}`)}
                                                className="btn btn-sm"
                                                style={{ flex: 1 }}
                                            >
                                                <Share2 size={16} /> Share
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default SharedFiles;
