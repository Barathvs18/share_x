import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Layout = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

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
            <Sidebar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />
            <motion.div
                className={`main-content ${isSidebarCollapsed ? 'collapsed-margin' : ''}`}
                initial={false}
                animate={{ marginLeft: isSidebarCollapsed ? 80 : 260 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                <Navbar />
                <main className="page-container">
                    <Outlet />
                </main>
            </motion.div>
        </div>
    );
};

export default Layout;
