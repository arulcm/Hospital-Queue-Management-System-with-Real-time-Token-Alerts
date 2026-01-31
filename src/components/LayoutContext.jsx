import React, { createContext, useContext, useState } from 'react';

const LayoutContext = createContext();

export const LayoutProvider = ({ children }) => {
    const [hospitalName, setHospitalName] = useState('');
    const [notification, setNotification] = useState(null);

    const notify = (message, type = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    return (
        <LayoutContext.Provider value={{ hospitalName, setHospitalName, notification, notify }}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => useContext(LayoutContext);
