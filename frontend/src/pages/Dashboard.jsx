import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getMyFilesAPI, getSharedFilesAPI } from '../services/api';
import FileCard from '../components/FileCard';
import { ShieldCheck, Share2, Files, HardDrive } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' } }
};

const Dashboard = () => {
    const [myFiles, setMyFiles] = useState([]);
    const [sharedFiles, setSharedFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [myRes, sharedRes] = await Promise.all([getMyFilesAPI(), getSharedFilesAPI()]);
                setMyFiles(myRes.data.files || []);
                setSharedFiles(sharedRes.data.shared_files || []);
            } catch (error) {
                toast.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="grid-cards">
                {[...Array(6)].map((_, i) => <div key={i} className="card skeleton" style={{ height: '240px' }} />)}
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="show">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard Overview</h1>
                    <p className="page-subtitle">Manage your secured files and active sharing sessions</p>
                </div>
            </div>

            {/* Stats Row */}
            <motion.div className="grid-stats" variants={itemVariants}>
                <div className="stat-card">
                    <span className="stat-label">Total Uploads</span>
                    <span className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Files size={28} style={{ color: 'var(--primary)' }} /> {myFiles.length}
                    </span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Active Shares (Received)</span>
                    <span className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Share2 size={28} style={{ color: 'var(--accent)' }} /> {sharedFiles.length}
                    </span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Integrity Status</span>
                    <span className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--success)' }}>
                        <ShieldCheck size={28} /> 100%
                    </span>
                </div>
            </motion.div>

            {/* My Files Section */}
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

            {/* Shared Files Section */}
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
