import React from 'react';

/**
 * Силуэт левого меню Elara.
 * Низ шире и ровнее — чтобы мини-плеер не обрезался кривой.
 */
export const ASTRA_SIDEBAR_PATH_UNIT =
    'M 0,0 ' +
    'L 0.80,0 ' +
    'C 0.93,0 1,0.03 1,0.09 ' +
    'C 1,0.135 0.90,0.16 0.76,0.195 ' +
    'C 0.58,0.245 0.54,0.30 0.58,0.38 ' +
    'C 0.62,0.46 0.76,0.51 0.88,0.56 ' +
    'C 0.97,0.60 1,0.66 1,0.74 ' +
    'C 1,0.84 0.98,0.92 0.90,0.97 ' +
    'C 0.86,1 0.82,1 0.78,1 ' +
    'L 0,1 Z';

export function AstraSidebarShapeDefs() {
    return (
        <svg
            className="astra-sidebar-shape-defs"
            width="0"
            height="0"
            aria-hidden="true"
            focusable="false"
        >
            <defs>
                <clipPath id="astra-sidebar-shape" clipPathUnits="objectBoundingBox">
                    <path d={ASTRA_SIDEBAR_PATH_UNIT} />
                </clipPath>
            </defs>
        </svg>
    );
}
