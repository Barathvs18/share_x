import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { shareFileAPI } from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Share2, Clock, Mail, ShieldAlert, Eye, Download, Lock } from 'lucide-react';

const ShareFile = () => {
    const { id } = useParams();
    const [email, setEmail] = useState('');
    const [hours, setHours] = useState(24);
    const [canDownload, setCanDownload] = useState(true); // true = View & Download, false = View Only
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleShare = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const expiry_time = Math.floor(Date.now() / 1000) + (Number(hours) * 3600);
            await shareFileAPI({
                file_id: id,
                shared_with_email: email,
                expiry_time,
                can_download: canDownload
            });
            const permLabel = canDownload ? 'View & Download' : 'View Only';
            toast.success(`Access granted (${permLabel}) to ${email}`);
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to share file');
        } finally {
            setLoading(false);
        }
    };

    const getExpiryPreview = () => {
        if (!hours) return 'Invalid time';
        const expiry = new Date(Date.now() + Number(hours) * 3600 * 1000);
        return expiry.toLocaleString();
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
            <motion.div
                className="card"
                style={{ width: '100%', maxWidth: '500px' }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
                        <Share2 size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '2px' }}>Share Protocol</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Grant zero-trust access to another peer</p>
                    </div>
                </div>

                {/* Warning banner */}
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', gap: '12px', marginBottom: '2rem' }}>
                    <ShieldAlert size={20} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--warning)', margin: 0 }}>
                        Files are shared using temporary access tokens. Once expired, the user will entirely lose decryption and viewing rights.
                    </p>
                </div>

                <form onSubmit={handleShare}>
                    {/* Email */}
                    <div className="form-group">
                        <label className="form-label">Recipient's Identity (Email)</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                className="form-input"
                                style={{ paddingLeft: '2.5rem' }}
                                value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="trusted.peer@network.com"
                                required
                            />
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="form-group">
                        <label className="form-label">Access Duration (Hours)</label>
                        <div style={{ position: 'relative' }}>
                            <Clock size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-muted)' }} />
                            <input
                                type="number"
                                className="form-input"
                                style={{ paddingLeft: '2.5rem' }}
                                value={hours} onChange={e => setHours(e.target.value)}
                                min="1" max="720"
                                required
                            />
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Expiration exact time:</span>
                            <strong style={{ color: 'var(--text-main)' }}>{getExpiryPreview()}</strong>
                        </p>
                    </div>

                    {/* ── Permission Toggle ─────────────────────────────── */}
                    <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Lock size={14} /> Access Permission
                        </label>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                            {/* View & Download */}
                            <button
                                type="button"
                                onClick={() => setCanDownload(true)}
                                style={{
                                    flex: 1,
                                    padding: '0.85rem',
                                    borderRadius: '10px',
                                    border: `2px solid ${canDownload ? 'var(--primary)' : 'var(--border-color)'}`,
                                    background: canDownload ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                    color: canDownload ? 'var(--primary)' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <Download size={20} />
                                <span style={{ fontSize: '0.85rem', fontWeight: canDownload ? '600' : '400' }}>View & Download</span>
                                <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>Can save the file</span>
                            </button>

                            {/* View Only */}
                            <button
                                type="button"
                                onClick={() => setCanDownload(false)}
                                style={{
                                    flex: 1,
                                    padding: '0.85rem',
                                    borderRadius: '10px',
                                    border: `2px solid ${!canDownload ? '#ef4444' : 'var(--border-color)'}`,
                                    background: !canDownload ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                                    color: !canDownload ? '#ef4444' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <Eye size={20} />
                                <span style={{ fontSize: '0.85rem', fontWeight: !canDownload ? '600' : '400' }}>View Only</span>
                                <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>Cannot download</span>
                            </button>
                        </div>

                        {/* Live permission hint */}
                        <motion.div
                            key={canDownload ? 'dl' : 'vo'}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                marginTop: '10px',
                                padding: '0.6rem 0.9rem',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                background: canDownload ? 'rgba(59,130,246,0.07)' : 'rgba(239,68,68,0.07)',
                                color: canDownload ? 'var(--primary)' : '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            {canDownload
                                ? <><Download size={13} /> Recipient can view AND download this file.</>
                                : <><Eye size={13} /> Recipient can only verify the file — download is blocked.</>
                            }
                        </motion.div>
                    </div>
                    {/* ─────────────────────────────────────────────────── */}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate('/dashboard')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn" style={{ flex: 2 }} disabled={loading}>
                            {loading ? 'Processing...' : 'Generate Access Token'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ShareFile;
