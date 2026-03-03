import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadFile from './pages/UploadFile';
import ShareFile from './pages/ShareFile';
import VerifyFile from './pages/VerifyFile';
import SharedFiles from './pages/SharedFiles';

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Authenticated Layout Wrapper */}
            <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/upload" element={<UploadFile />} />
                <Route path="/shared" element={<SharedFiles />} />
                <Route path="/share/:id" element={<ShareFile />} />
                <Route path="/verify/:id?" element={<VerifyFile />} />
            </Route>

            {/* 404 Catcher */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
    );
}

export default App;
