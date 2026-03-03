import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Share2, ShieldQuestion, Calendar, HardDrive, Download, Loader } from 'lucide-react';
import { downloadFileAPI } from '../services/api';
import toast from 'react-hot-toast';

const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const FileCard = ({ file, isShared, onShare, onVerify, onRevoke }) => {
    const [downloading, setDownloading] = useState(false);
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

    return (
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
            </div>
        </motion.div>
    );
};

export default FileCard;
