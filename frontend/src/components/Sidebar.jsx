import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, Share2, ShieldCheck, LogOut, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Sidebar = ({ isCollapsed, setCollapsed }) => {
    const { logout } = useAuth();

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/upload', label: 'Upload File', icon: <UploadCloud size={20} /> },
        { path: '/shared', label: 'Shared Files', icon: <Share2 size={20} /> },
        { path: '/verify', label: 'Verify Integrity', icon: <ShieldCheck size={20} /> },
        { path: '/activity', label: 'Activity Log', icon: <Activity size={20} /> },
    ];

    return (
        <motion.aside
            className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
            initial={false}
            animate={{ width: isCollapsed ? 80 : 260 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
            <div className="sidebar-logo">
                <ShieldCheck className="sidebar-logo-icon" size={28} />
                {!isCollapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        SecureShare
                    </motion.span>
                )}
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        title={isCollapsed ? item.label : ""}
                    >
                        <div className="sidebar-link-icon">{item.icon}</div>
                        {!isCollapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                    onClick={() => setCollapsed(!isCollapsed)}
                    className="sidebar-link"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', width: '100%', justifyContent: isCollapsed ? 'center' : 'flex-start' }}
                >
                    <div className="sidebar-link-icon">
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </div>
                    {!isCollapsed && <span>Collapse Sidebar</span>}
                </button>
                <button
                    onClick={logout}
                    className="sidebar-link"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', width: '100%', color: 'var(--danger)', justifyContent: isCollapsed ? 'center' : 'flex-start' }}
                    title={isCollapsed ? "Logout" : ""}
                >
                    <div className="sidebar-link-icon"><LogOut size={20} /></div>
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
