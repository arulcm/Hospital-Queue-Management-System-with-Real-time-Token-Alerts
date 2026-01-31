import React from 'react';

const GlobalFooter = () => {
    return (
        <footer className="global-footer">
            <div className="container-standard footer-inner">
                <div>
                    <h4 style={{ color: 'var(--foreground)', marginBottom: '1rem' }}>WaitLess SaaS</h4>
                    <p>Streamlining patient experiences with <br /> real-time token management.</p>
                </div>

                <div style={{ textAlign: 'right' }}>
                    <p>Support: support@waitless.com</p>
                    <p>Version v1.0.0</p>
                    <p style={{ marginTop: '1rem' }}>&copy; 2026 WaitLess Ecosystem.</p>
                </div>
            </div>
        </footer>
    );
};

export default GlobalFooter;
