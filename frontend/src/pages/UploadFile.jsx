import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFileAPI } from '../services/api';
import { UploadCloud, CheckCircle, XCircle, File } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const UploadFile = () => {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null);
    const navigate = useNavigate();

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setResult(null);
        }
    }, []);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.error("Please select a file to upload");
            return;
        }

        setLoading(true);
        setProgress(10); // Fake fast progress start

        try {
            const formData = new FormData();
            formData.append('file', file);

            const interval = setInterval(() => {
                setProgress(prev => prev < 90 ? prev + 15 : prev);
            }, 500);

            const { data } = await uploadFileAPI(formData);

            clearInterval(interval);
            setProgress(100);
            setResult(data);

            toast.success("File uploaded to server securely!");

            // Attempt Blockchain
            const toastId = toast.loading("Saving hash to Blockchain...");
            try {
                const { getContractInstance } = await import('../services/web3');
                const contract = await getContractInstance(true);
                const tx = await contract.uploadFile(data.file_hash);
                await tx.wait();
                toast.success("Secured on Blockchain!", { id: toastId });
            } catch (err) {
                toast.error("Blockchain skipped or rejected", { id: toastId });
            }

            setTimeout(() => navigate('/dashboard'), 2500);
        } catch (err) {
            toast.error(err.response?.data?.detail || "Upload failed");
            setProgress(0);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
            style={{ maxWidth: '600px', margin: '0 auto', marginTop: '2rem' }}
        >
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UploadCloud className="text-primary" /> Secure File Upload
            </h2>

            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                Files uploaded here are encrypted via SHA-256 and anchored to Polygon blockchain to guarantee absolute immutability.
            </p>

            <form onSubmit={handleUpload}>
                <div
                    className={`dropzone ${isDragging ? 'active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-upload').click()}
                >
                    <input
                        id="file-upload"
                        type="file"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            setFile(e.target.files[0]);
                            setResult(null);
                        }}
                    />

                    <AnimatePresence mode="wait">
                        {file ? (
                            <motion.div
                                key="file-selected"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
                            >
                                <div style={{ padding: '1rem', background: 'var(--bg-color)', borderRadius: '50%' }}>
                                    <File size={36} className="text-primary" />
                                </div>
                                <div>
                                    <p className="dropzone-text">{file.name}</p>
                                    <p className="dropzone-subtext">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                >
                                    Remove File
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="drop-prompt"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <UploadCloud className="dropzone-icon" />
                                <p className="dropzone-text">Click to browse or drag file here</p>
                                <p className="dropzone-subtext">Maximum file size: 50MB</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {loading && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                            <span>Uploading & Encrypting...</span>
                            <span>{progress}%</span>
                        </div>
                        <div style={{ height: '6px', width: '100%', background: 'var(--bg-color)', borderRadius: '999px', overflow: 'hidden' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                style={{ height: '100%', background: 'var(--primary)', borderRadius: '999px' }}
                            />
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Cancel</button>
                    <button type="submit" className="btn" disabled={loading || !file}>
                        {loading ? 'Processing...' : 'Upload & Anchor'}
                    </button>
                </div>
            </form>

            {result && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', marginBottom: '1rem' }}>
                        <CheckCircle size={20} /> <strong>Successfully Secured</strong>
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>File Hash (SHA-256):</p>
                        <p style={{ fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--text-main)', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px' }}>
                            {result.file_hash}
                        </p>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default UploadFile;
