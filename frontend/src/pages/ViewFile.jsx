import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { viewFileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Eye, FileText, AlertTriangle, ArrowLeft, Loader } from 'lucide-react';

// ─── Anti-screenshot global CSS injected once ─────────────────
const SHIELD_STYLE = `
  .protected-viewer-root {
    user-select: none !important;
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    -webkit-user-drag: none !important;
    pointer-events: auto;
  }
  .protected-viewer-root img,
  .protected-viewer-root canvas,
  .protected-viewer-root iframe {
    -webkit-user-drag: none !important;
    pointer-events: none !important;
  }
  .protected-viewer-root * {
    user-select: none !important;
  }
  @media print {
    body * { visibility: hidden !important; }
    .protected-viewer-root { display: none !important; }
  }
`;

function injectStyle() {
    if (document.getElementById('__shield_style')) return;
    const el = document.createElement('style');
    el.id = '__shield_style';
    el.textContent = SHIELD_STYLE;
    document.head.appendChild(el);
}

// ─── Detect file category from MIME ───────────────────────────
function getCategory(mime = '') {
    if (mime.startsWith('image/')) return 'image';
    if (mime === 'application/pdf') return 'pdf';
    if (mime.startsWith('text/') || mime.includes('javascript') || mime.includes('json') || mime.includes('xml')) return 'text';
    return 'unsupported';
}

// ─── Image viewer: renders on <canvas> with watermark ─────────
function CanvasImageViewer({ b64, mimeType, watermark }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            // Draw semi-transparent watermark grid
            ctx.save();
            ctx.globalAlpha = 0.18;
            ctx.font = `bold ${Math.max(18, img.width / 25)}px Inter, sans-serif`;
            ctx.fillStyle = '#ffffff';
            ctx.rotate(-Math.PI / 6);
            for (let y = -img.height; y < img.height * 2; y += 130) {
                for (let x = -img.width; x < img.width * 2; x += 350) {
                    ctx.fillText(`🔐 ${watermark}`, x, y);
                }
            }
            ctx.restore();
        };
        img.src = `data:${mimeType};base64,${b64}`;
    }, [b64, mimeType, watermark]);

    return (
        <canvas
            ref={canvasRef}
            style={{ maxWidth: '100%', borderRadius: '8px', display: 'block', margin: '0 auto' }}
        />
    );
}

// ─── Text / code viewer with watermark overlay ────────────────
function TextViewer({ b64, watermark }) {
    const text = atob(b64);
    return (
        <div style={{ position: 'relative' }}>
            <pre style={{
                background: '#0d1117', color: '#c9d1d9', padding: '1.5rem',
                borderRadius: '8px', overflowX: 'auto', fontSize: '0.85rem',
                lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                maxHeight: '65vh', overflowY: 'auto',
                userSelect: 'none', WebkitUserSelect: 'none',
            }}>
                {text}
            </pre>
            {/* Watermark overlay */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: '40px', overflow: 'hidden',
            }}>
                {[...Array(6)].map((_, i) => (
                    <div key={i} style={{
                        color: 'rgba(255,255,255,0.07)', fontSize: '1.1rem',
                        transform: 'rotate(-20deg)', whiteSpace: 'nowrap', letterSpacing: '2px',
                    }}>
                        🔐&nbsp;PROTECTED&nbsp;·&nbsp;{watermark}&nbsp;·&nbsp;PROTECTED&nbsp;🔐
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Unsupported type fallback ─────────────────────────────────
function UnsupportedViewer({ filename }) {
    return (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>In-browser preview not available for <strong>{filename}</strong>.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                This file type requires a download to open — but the owner has restricted downloads.
            </p>
        </div>
    );
}

// ─── Main ViewFile page ────────────────────────────────────────
const ViewFile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [fileData, setFileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [blurred, setBlurred] = useState(false);     // focus-loss blur
    const [warned, setWarned] = useState(false);        // PrintScreen warning shown

    // ── Inject CSS shield
    useEffect(() => { injectStyle(); }, []);

    // ── Fetch file from backend
    useEffect(() => {
        const load = async () => {
            try {
                const res = await viewFileAPI(id);
                setFileData(res.data);
            } catch (err) {
                setError(err.response?.data?.detail || 'Failed to load file');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    // ── Disable right-click
    useEffect(() => {
        const block = (e) => e.preventDefault();
        document.addEventListener('contextmenu', block);
        return () => document.removeEventListener('contextmenu', block);
    }, []);

    // ── Block keyboard shortcuts (Ctrl+S, Ctrl+P, Ctrl+C, PrintScreen)
    useEffect(() => {
        const handleKey = (e) => {
            const blocked = (
                (e.ctrlKey && ['s', 'p', 'c', 'a', 'u'].includes(e.key.toLowerCase())) ||
                e.key === 'PrintScreen' || e.key === 'F12'
            );
            if (blocked) {
                e.preventDefault();
                e.stopPropagation();
                if (e.key === 'PrintScreen') {
                    setWarned(true);
                    setTimeout(() => setWarned(false), 3000);
                }
            }
        };
        document.addEventListener('keydown', handleKey, true);
        return () => document.removeEventListener('keydown', handleKey, true);
    }, []);

    // ── Blur content when window loses focus (screen recording detection)
    useEffect(() => {
        const onBlur = () => setBlurred(true);
        const onFocus = () => setBlurred(false);
        window.addEventListener('blur', onBlur);
        window.addEventListener('focus', onFocus);
        return () => {
            window.removeEventListener('blur', onBlur);
            window.removeEventListener('focus', onFocus);
        };
    }, []);

    const category = fileData ? getCategory(fileData.mime_type) : null;
    const watermark = fileData?.viewer_email || user?.email || 'PROTECTED';

    return (
        <div
            className="protected-viewer-root"
            style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => navigate('/shared')}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Eye size={18} style={{ color: 'var(--primary)' }} />
                        Secure Viewer
                    </h2>
                    {fileData && (
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {fileData.filename} &nbsp;·&nbsp; View Only
                        </p>
                    )}
                </div>
            </div>

            {/* View-only warning banner */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.5rem',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontSize: '0.85rem', color: '#ef4444',
                }}
            >
                <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                <span>
                    <strong>Protected Content</strong> — This file is shared as <strong>View Only</strong>.
                    Downloading, copying, printing, and screen capture are prohibited.
                    A watermark with your identity (<strong>{watermark}</strong>) is embedded.
                </span>
            </motion.div>

            {/* PrintScreen warning flash */}
            {warned && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
                        zIndex: 9999, background: '#ef4444', color: 'white',
                        padding: '0.75rem 1.5rem', borderRadius: '10px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 20px rgba(239,68,68,0.5)',
                    }}
                >
                    <AlertTriangle size={18} /> Screenshot attempt detected and blocked!
                </motion.div>
            )}

            {/* Main content area */}
            <div
                className="card"
                style={{
                    position: 'relative', overflow: 'hidden', padding: '1.5rem',
                    filter: blurred ? 'blur(20px)' : 'none',
                    transition: 'filter 0.3s ease',
                    userSelect: 'none', WebkitUserSelect: 'none',
                }}
            >
                {/* Blur overlay when window loses focus */}
                {blurred && (
                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'column', gap: '12px',
                        background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(10px)',
                    }}>
                        <ShieldAlert size={40} style={{ color: '#ef4444' }} />
                        <p style={{ color: 'white', fontWeight: '600' }}>Content hidden — click to resume</p>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                            Content is hidden when this window is not in focus
                        </p>
                    </div>
                )}

                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                        <Loader size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
                    </div>
                )}

                {error && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
                        <AlertTriangle size={36} style={{ marginBottom: '0.75rem' }} />
                        <p style={{ fontWeight: '600' }}>{error}</p>
                    </div>
                )}

                {fileData && !loading && (
                    <>
                        {category === 'image' && (
                            <CanvasImageViewer
                                b64={fileData.content_b64}
                                mimeType={fileData.mime_type}
                                watermark={watermark}
                            />
                        )}
                        {category === 'text' && (
                            <TextViewer b64={fileData.content_b64} watermark={watermark} />
                        )}
                        {category === 'pdf' && (
                            <div style={{ position: 'relative' }}>
                                <iframe
                                    src={`data:application/pdf;base64,${fileData.content_b64}`}
                                    style={{ width: '100%', height: '75vh', border: 'none', borderRadius: '8px' }}
                                    title="Protected PDF Viewer"
                                    sandbox="allow-same-origin allow-scripts"
                                />
                                {/* Watermark overlay for PDF */}
                                <div style={{
                                    position: 'absolute', inset: 0, pointerEvents: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.4rem', color: 'rgba(255,255,255,0.06)',
                                    fontWeight: '700', letterSpacing: '4px',
                                    transform: 'rotate(-30deg)', whiteSpace: 'nowrap',
                                }}>
                                    🔐 {watermark} · VIEW ONLY · {watermark} 🔐
                                </div>
                            </div>
                        )}
                        {category === 'unsupported' && (
                            <UnsupportedViewer filename={fileData.filename} />
                        )}
                    </>
                )}
            </div>

            {/* Footer warning */}
            {fileData && (
                <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                    🔐 This session is logged. Unauthorized reproduction is a violation of access terms.
                    Viewer: <strong>{watermark}</strong>
                </p>
            )}
        </div>
    );
};

export default ViewFile;
