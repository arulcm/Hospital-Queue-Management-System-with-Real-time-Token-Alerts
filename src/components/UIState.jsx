import React from 'react';
import { Activity, AlertCircle, RefreshCw } from 'lucide-react';

export const LoadingState = ({ message = "Loading healthcare data..." }) => (
    <div className="loading-wrapper">
        <Activity className="animate-spin" size={48} color="var(--primary)" />
        <p style={{ fontWeight: 600, color: 'var(--muted-foreground)' }}>{message}</p>
    </div>
);

export const ErrorState = ({ title = "Something went wrong", message, onRetry }) => (
    <div className="error-card">
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h2>{title}</h2>
        <p style={{ margin: '1rem 0 2rem', color: 'var(--muted-foreground)' }}>{message}</p>
        {onRetry && (
            <button className="btn-standard" onClick={onRetry}>
                <RefreshCw size={18} style={{ marginRight: '0.5rem' }} />
                Try Again
            </button>
        )}
    </div>
);

export const NotificationBanner = ({ type = "info", message }) => {
    const bgColor = type === 'success' ? '#ecfdf5' : type === 'error' ? '#fef2f2' : '#eff6ff';
    const textColor = type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : '#1e40af';

    if (!message) return null;

    return (
        <div style={{
            background: bgColor,
            color: textColor,
            padding: '0.75rem 1rem',
            textAlign: 'center',
            fontSize: '0.875rem',
            fontWeight: 600
        }}>
            {message}
        </div>
    );
};
