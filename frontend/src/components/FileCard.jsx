import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Share2, ShieldQuestion, Calendar, HardDrive, Download, Loader, Trash2, AlertTriangle, X } from 'lucide-react';
import { downloadFileAPI, deleteFileAPI } from '../services/api';
import toast from 'react-hot-toast';

const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const FileCard = ({ file, isShared, onShare, onVerify, onRevoke, onDeleted }) => {
    const [downloading, setDownloading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const fileId = file._id || file.file_id;
    const filename = file.filename || 'Unknown File';
    const hash = file.hash || '';

    const handleDownload = async (e) => {
        e.stopPropagation();
        setDownloading(true);
        try {
            await downloadFileAPI(fileId, filename);
            toast.success('File downloaded!');
        } catch (err) {
            toast.error(err.message || 'Download failed');
        } finally {
            setDownloading(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteFileAPI(fileId);
            toast.success('File deleted successfully');
            setShowConfirm(false);
            if (onDeleted) onDeleted(fileId);
        } catch (err) {
            toast.error(err?.response?.data?.detail || 'Delete failed');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <motion.div
                className="card file-card-inner"
                whileHover={{ y: -5, scale: 1.01, boxShadow: '0 10px 30px rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.5)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                <div className="file-header">
                    <div className="file-icon-box">
                        <FileText size={24} />
                    </div>
                    {isShared ? (
                        <span className="status-badge status-active">Shared with you</span>
                    ) : (
                        <span className="status-badge status-active">Owner</span>
                    )}
                </div>

                <h3 className="file-title" title={filename}>{filename}</h3>

                <div className="file-meta">
                    {file.size !== undefined && (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <HardDrive size={14} /> {formatSize(file.size)}
                        </div>
                    )}
                    {file.uploaded_at && (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <Calendar size={14} /> {new Date(file.uploaded_at).toLocaleDateString()}
                        </div>
                    )}
                    {hash && (
                        <div className="hash-preview" style={{ marginTop: '0.5rem' }}>
                            SHA-256: {hash.substring(0, 16)}...
                        </div>
                    )}
                </div>

                <div className="file-actions">
                    {onVerify && (
                        <button
                            onClick={() => onVerify(fileId)}
                            className="btn btn-outline btn-sm"
                            style={{ flex: 1 }}
                            title="Verify Integrity"
                        >
                            <ShieldQuestion size={16} /> Verify
                        </button>
                    )}
                    {!isShared && onShare && (
                        <button
                            onClick={() => onShare(fileId)}
                            className="btn btn-sm"
                            style={{ flex: 1 }}
                            title="Share this file"
                        >
                            <Share2 size={16} /> Share
                        </button>
                    )}
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1 }}
                        title="Download file"
                    >
                        {downloading ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
                        {downloading ? '' : 'Download'}
                    </button>
                    {onRevoke && (
                        <button
                            onClick={() => onRevoke(fileId)}
                            className="btn btn-danger btn-sm"
                            style={{ flex: 1 }}
                            title="Revoke access"
                        >
                            Revoke
                        </button>
                    )}
                    {/* Delete button — only for files the user owns */}
                    {!isShared && (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="btn btn-sm"
                            style={{
                                flex: 1,
                                background: 'rgba(239, 68, 68, 0.12)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                            }}
                            title="Delete file permanently"
                        >
                            <Trash2 size={16} /> Delete
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Confirm Delete Modal */}
            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 1000,
                            background: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(4px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '1rem',
                        }}
                        onClick={() => !deleting && setShowConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.85, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'var(--card-bg, #1a1a2e)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                borderRadius: '16px',
                                padding: '2rem',
                                maxWidth: '420px',
                                width: '100%',
                                boxShadow: '0 20px 60px rgba(239,68,68,0.2)',
                                position: 'relative',
                            }}
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={deleting}
                                style={{
                                    position: 'absolute', top: '1rem', right: '1rem',
                                    background: 'transparent', border: 'none',
                                    color: 'var(--text-muted)', cursor: 'pointer',
                                    padding: '4px', borderRadius: '6px',
                                    display: 'flex', alignItems: 'center',
                                }}
                            >
                                <X size={18} />
                            </button>

                            {/* Icon */}
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '50%',
                                background: 'rgba(239, 68, 68, 0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '1.25rem',
                            }}>
                                <AlertTriangle size={28} color="#f87171" />
                            </div>

                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                                Delete File?
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                You are about to permanently delete:
                            </p>
                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '8px', padding: '0.6rem 0.9rem',
                                fontSize: '0.875rem', fontWeight: 600,
                                color: 'var(--text-main)', marginBottom: '1.25rem',
                                wordBreak: 'break-all', border: '1px solid var(--border-color)',
                            }}>
                                {filename}
                            </div>
                            <p style={{ color: '#f87171', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                                ⚠️ This will also remove all active shares for this file. This action cannot be undone.
                            </p>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    disabled={deleting}
                                    className="btn btn-outline btn-sm"
                                    style={{ flex: 1, padding: '0.6rem' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="btn btn-sm"
                                    style={{
                                        flex: 1, padding: '0.6rem',
                                        background: '#ef4444', color: '#fff',
                                        border: 'none', opacity: deleting ? 0.7 : 1,
                                    }}
                                >
                                    {deleting ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FileCard;
