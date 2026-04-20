import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, Share2, ShieldCheck, LogOut, ChevronLeft, ChevronRight, Activity, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Sidebar = ({ isCollapsed, setCollapsed, isMobile, mobileOpen, setMobileOpen }) => {
    const { logout } = useAuth();

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/upload', label: 'Upload File', icon: <UploadCloud size={20} /> },
        { path: '/shared', label: 'Shared Files', icon: <Share2 size={20} /> },
        { path: '/verify', label: 'Verify Integrity', icon: <ShieldCheck size={20} /> },
        { path: '/activity', label: 'Activity Log', icon: <Activity size={20} /> },
    ];

    const handleLinkClick = () => {
        if (isMobile) {
            setMobileOpen(false);
        }
    };

    return (
        <motion.aside
            className={`sidebar ${isCollapsed && !isMobile ? 'collapsed' : ''}`}
            initial={false}
            animate={{ 
                width: isMobile ? 280 : (isCollapsed ? 80 : 260),
                x: isMobile ? (mobileOpen ? 0 : '-100%') : 0
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
                ...(isMobile ? { position: 'fixed', top: 0, left: 0, zIndex: 40, height: '100vh', boxShadow: mobileOpen ? 'var(--shadow-md)' : 'none' } : {})
            }}
        >
            <div className="sidebar-logo">
                <ShieldCheck className="sidebar-logo-icon" size={28} />
                {(!isCollapsed || isMobile) && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        SecureShare
                    </motion.span>
                )}
                {isMobile && (
                    <button 
                        onClick={() => setMobileOpen(false)}
                        style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={handleLinkClick}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        title={isCollapsed && !isMobile ? item.label : ""}
                    >
                        <div className="sidebar-link-icon">{item.icon}</div>
                        {(!isCollapsed || isMobile) && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {!isMobile && (
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
                )}
                
                <button
                    onClick={() => {
                        handleLinkClick();
                        logout();
                    }}
                    className="sidebar-link"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', width: '100%', color: 'var(--danger)', justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start' }}
                    title={isCollapsed && !isMobile ? "Logout" : ""}
                >
                    <div className="sidebar-link-icon"><LogOut size={20} /></div>
                    {(!isCollapsed || isMobile) && <span>Logout</span>}
                </button>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
