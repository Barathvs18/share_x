import React from 'react';
import { User, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PAGE_TITLES = {
    '/dashboard': 'Dashboard',
    '/upload': 'Upload File',
    '/shared': 'Shared Files',
    '/verify': 'Verify Integrity',
};

const Navbar = ({ isMobile, setMobileOpen }) => {
    const location = useLocation();
    const { user } = useAuth();

    // Derive page title from the current path
    const pageTitle = Object.entries(PAGE_TITLES).find(([path]) =>
        location.pathname.startsWith(path)
    )?.[1] || 'SecureShare';

    return (
        <header className="top-navbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isMobile && (
                    <button 
                        onClick={() => setMobileOpen(true)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-main)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '4px'
                        }}
                    >
                        <Menu size={24} />
                    </button>
                )}
                <div className="nav-title" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    {pageTitle}
                </div>
            </div>
            <div className="nav-actions">
                {user && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '0.35rem 0.75rem',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '20px',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.875rem',
                        color: 'var(--text-muted)'
                    }}>
                        <User size={15} />
                        <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                            {isMobile ? user.username.substring(0, 6) + '...' : user.username}
                        </span>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Navbar;
