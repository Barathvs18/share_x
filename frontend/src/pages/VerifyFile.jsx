import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyFileAPI } from '../services/api';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, ShieldAlert, Key, Link2, HardDrive, CheckCircle2 } from 'lucide-react';

const VerifyFile = () => {
    const { id } = useParams();
    const [fileId, setFileId] = useState(id || '');
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isTampered, setIsTampered] = useState(false);
    const navigate = useNavigate();

    const handleVerifyClick = async (e) => {
        if (e) e.preventDefault();
        if (!fileId) return toast.error("Please enter a valid File ID");

        setLoading(true);
        setDetails(null);
        setIsTampered(false);
        const toastId = toast.loading('Synchronizing with blockchain records...');

        try {
            const { data } = await verifyFileAPI({ file_id: fileId });

            const isAuthentic = data.is_authentic_on_server;
            setDetails({
                filename: data.filename,
                originalHash: data.original_hash,
                currentHash: data.current_hash,
                isAuthentic
            });

            if (isAuthentic) {
                toast.success('Integrity verified: 100% Match', { id: toastId });
            } else {
                toast.error('TAMPERING DETECTED! Hashes do not match!', { id: toastId, duration: 5000 });
                setIsTampered(true);
            }

        } catch (err) {
            toast.error(err.response?.data?.detail || 'Verification protocol failed', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <motion.div
                className="card"
                style={{ width: '100%', maxWidth: '600px', marginTop: '2rem' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', color: 'var(--primary)', marginBottom: '1rem' }}>
                        <ShieldCheck size={36} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Secure Integrity Verification</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Cryptographically verify files against Blockchain anchors</p>
                </div>

                {!id && !details && (
                    <form onSubmit={handleVerifyClick} style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Key size={14} /> Enter Unique Decryption ID
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                value={fileId}
                                onChange={(e) => setFileId(e.target.value)}
                                placeholder="e.g. 64dcf3..."
                                required
                            />
                        </div>
                        <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Initializing Protocol...' : 'Run Integrity Engine'}
                        </button>
                    </form>
                )}

                {id && !details && (
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <p style={{ color: 'var(--text-muted)' }}>Verifying ID: <strong style={{ color: 'var(--accent)' }}>{id}</strong></p>
                        <button onClick={handleVerifyClick} className="btn" style={{ marginTop: '1rem', padding: '0.75rem 2rem' }} disabled={loading}>
                            {loading ? 'Scanning Hash Matrix...' : 'Authenticate File Now'}
                        </button>
                    </div>
                )}

                <AnimatePresence>
                    {details && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={isTampered ? {
                                opacity: 1, scale: 1, y: 0,
                                x: [0, -10, 10, -10, 10, 0] // Shake animation
                            } : {
                                opacity: 1, scale: 1, y: 0
                            }}
                            transition={{ duration: 0.5 }}
                        >
                            <div style={{
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-md)',
                                background: details.isAuthentic ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                                border: `2px solid ${details.isAuthentic ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.5)'}`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <HardDrive size={24} style={{ color: 'var(--text-muted)' }} />
                                        <div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target File</p>
                                            <p style={{ fontWeight: '600', color: 'var(--text-main)', display: 'block', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {details.filename}
                                            </p>
                                        </div>
                                    </div>
                                    {details.isAuthentic ? (
                                        <span className="status-badge status-active"><CheckCircle2 size={14} /> SECURE</span>
                                    ) : (
                                        <span className="status-badge status-revoked"><ShieldAlert size={14} /> COMPROMISED</span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Link2 size={14} /> Anchored Original Hash (Immutable)
                                        </p>
                                        <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '4px', color: 'var(--text-muted)', wordBreak: 'break-all', borderLeft: '3px solid var(--accent)' }}>
                                            {details.originalHash}
                                        </div>
                                    </div>

                                    <div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <HardDrive size={14} /> Live Computed Hash (Server State)
                                        </p>
                                        <div style={{
                                            fontFamily: 'monospace', fontSize: '0.85rem', padding: '0.75rem', borderRadius: '4px', wordBreak: 'break-all',
                                            background: details.isAuthentic ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.15)',
                                            color: details.isAuthentic ? 'var(--success)' : 'var(--danger)',
                                            borderLeft: `3px solid ${details.isAuthentic ? 'var(--success)' : 'var(--danger)'}`
                                        }}>
                                            {details.currentHash}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem' }}>
                                Return to Dashboard
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default VerifyFile;
