import React from 'react';

const svgProps = {
    viewBox: '0 0 24 24',
    width: 24,
    height: 24,
    fill: 'none',
    'aria-hidden': true,
};

export const MenuIcons = {
    home: (
        <svg {...svgProps}>
            <path
                d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-6.2H10.2V21H5a1 1 0 0 1-1-1v-9.5Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
            />
        </svg>
    ),
    explore: (
        <svg {...svgProps}>
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
            <path d="M16.2 16.2 20 20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
    ),
    constellation: (
        <svg {...svgProps}>
            <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7" />
            <ellipse
                cx="12"
                cy="12"
                rx="9"
                ry="3.4"
                stroke="currentColor"
                strokeWidth="1.5"
                transform="rotate(-22 12 12)"
            />
        </svg>
    ),
    messages: (
        <svg {...svgProps}>
            <path
                d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v7.2a1.5 1.5 0 0 1-1.5 1.5H10l-4.2 3.1V16.7H5A1.5 1.5 0 0 1 3.5 15.2V8A1.5 1.5 0 0 1 5 6.5Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
            />
        </svg>
    ),
    music: (
        <svg {...svgProps}>
            <path
                d="M10 17.5V7.2l9-2.2v10.3"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="7.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="1.7" />
            <circle cx="16.5" cy="15.3" r="2.5" stroke="currentColor" strokeWidth="1.7" />
        </svg>
    ),
    notifications: (
        <svg {...svgProps}>
            <path
                d="M12 4.5a5 5 0 0 1 5 5v2.2c0 .8.3 1.6.8 2.2l.9 1.1H5.3l.9-1.1c.5-.6.8-1.4.8-2.2V9.5a5 5 0 0 1 5-5Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
            />
            <path
                d="M10 18.8a2.2 2.2 0 0 0 4 0"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
            />
        </svg>
    ),
    bookmarks: (
        <svg {...svgProps}>
            <path
                d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.5L6 20V5.5a1 1 0 0 1 1-1Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
            />
        </svg>
    ),
    mateai: (
        <svg {...svgProps}>
            <path
                d="M12 3.2 13.2 8.4 18.5 9.2l-4 3.6 1.2 5.2L12 15.6 8.3 18l1.2-5.2-4-3.6 5.3-.8L12 3.2Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
            <circle cx="18.5" cy="5.5" r="1.4" fill="currentColor" stroke="none" />
        </svg>
    ),
    profile: (
        <svg {...svgProps}>
            <circle cx="12" cy="9" r="3.4" stroke="currentColor" strokeWidth="1.7" />
            <path
                d="M5.5 19.2c1.3-2.5 3.5-3.8 6.5-3.8s5.2 1.3 6.5 3.8"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
            />
        </svg>
    ),
    more: (
        <svg {...svgProps}>
            <circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
            <circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none" />
        </svg>
    ),
};
