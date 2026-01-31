import React from 'react';
import GlobalHeader from './GlobalHeader';
import GlobalFooter from './GlobalFooter';
import { NotificationBanner } from './UIState';
import { useLayout } from './LayoutContext';

const Layout = ({ children }) => {
    const { hospitalName, notification } = useLayout();

    return (
        <div className="app-layout">
            {notification && <NotificationBanner {...notification} />}
            <GlobalHeader hospitalName={hospitalName} />
            <main className="main-content">
                {children}
            </main>
            <GlobalFooter />
        </div>
    );
};

export default Layout;
