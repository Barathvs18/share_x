import React, { useState, useEffect } from 'react';
import { Wallet, Bell, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PAGE_TITLES = {
    '/dashboard': 'Dashboard',
    '/upload': 'Upload File',
    '/shared': 'Shared Files',
    '/verify': 'Verify Integrity',
};

const Navbar = () => {
    const [address, setAddress] = useState('');
    const location = useLocation();
    const { user } = useAuth();

    // Derive page title from the current path
    const pageTitle = Object.entries(PAGE_TITLES).find(([path]) =>
        location.pathname.startsWith(path)
    )?.[1] || 'SecureShare';

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
                if (accounts.length > 0) setAddress(accounts[0]);
            }).catch(() => { });
            window.ethereum.on('accountsChanged', (accounts) => setAddress(accounts[0] || ''));
        }
        return () => {
            if (window.ethereum?.removeListener) {
                window.ethereum.removeListener('accountsChanged', () => { });
            }
        };
    }, []);

    const connectWallet = async () => {
        if (!window.ethereum) return alert('MetaMask not found! Install it to use blockchain features.');
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAddress(accounts[0]);
        } catch (error) {
            console.error('Wallet connection failed', error);
        }
    };

    const shortAddress = address
        ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
        : '';

    return (
        <header className="top-navbar">
            <div className="nav-title" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {pageTitle}
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
                        <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{user.username}</span>
                    </div>
                )}
                {address ? (
                    <div className="wallet-badge">
                        <Wallet size={16} />
                        {shortAddress}
                    </div>
                ) : (
                    <button className="btn btn-outline btn-sm" onClick={connectWallet}>
                        <Wallet size={15} /> Connect Wallet
                    </button>
                )}
            </div>
        </header>
    );
};

export default Navbar;
