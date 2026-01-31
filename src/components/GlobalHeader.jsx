import React from 'react';
import { Activity, Sun, Moon } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useLocation, Link } from 'react-router-dom';

const GlobalHeader = ({ hospitalName }) => {
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const isLanding = location.pathname === '/';

    return (
        <header className="global-header">
            <div className="container-standard header-inner">
                <Link to="/" className="brand-standard">
                    <Activity size={28} />
                    <span>WaitLess</span>
                </Link>

                {isLanding && (
                    <nav className="header-nav-links">
                        <Link to="/#features" className="nav-link">Features</Link>
                        <Link to="/#solutions" className="nav-link">Solutions</Link>
                        <Link to="/#support" className="nav-link">Support</Link>
                    </nav>
                )}

                <div className="nav-meta">
                    <div className="meta-actions">
                        <button className="btn-icon-round theme-toggle" onClick={toggleTheme} title="Toggle Theme">
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>

                        {isLanding ? (
                            <div className="auth-group">
                                <Link to="/login" className="btn-text">Login</Link>
                                <Link to="/register" className="btn-primary-sm">Get Started</Link>
                            </div>
                        ) : (
                            <div className="avatar" title="Admin Profile">A</div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default GlobalHeader;
