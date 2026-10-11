// src/components/pages/UnderDevelopmentPage.jsx
import React from 'react';

export function UnderDevelopmentPage({ pageName }) {
    return (
        <div className="under-development-page">
            <h2 className="under-development-page-title">{pageName}</h2>
            <p className="under-development-page-text">
                Страница &laquo;{pageName}&raquo; в разработке
            </p>
            <div className="under-development-page-icon">🚧</div>
        </div>
    );
}

export default UnderDevelopmentPage;