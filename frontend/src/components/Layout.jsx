import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth > 768) setMobileOpen(false);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isLoading) {
        return (
            <div className="auth-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return (
        <div className="app-container">
            {isMobile && (
                <AnimatePresence>
                    {mobileOpen && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="modal-overlay" 
                            style={{ zIndex: 35, backdropFilter: 'blur(4px)' }} 
                            onClick={() => setMobileOpen(false)} 
                        />
                    )}
                </AnimatePresence>
            )}
            
            <Sidebar 
                isCollapsed={isMobile ? false : isSidebarCollapsed} 
                setCollapsed={setSidebarCollapsed} 
                isMobile={isMobile}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />
            
            <motion.div
                className="main-content"
                initial={false}
                animate={{ marginLeft: isMobile ? 0 : (isSidebarCollapsed ? 80 : 260) }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                <Navbar isMobile={isMobile} setMobileOpen={setMobileOpen} />
                <main className="page-container">
                    <Outlet />
                </main>
            </motion.div>
        </div>
    );
};

export default Layout;
