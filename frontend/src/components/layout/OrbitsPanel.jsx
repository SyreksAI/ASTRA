import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CONSTELLATIONS } from '../../utils/constellations';

const ORBITS = [
    { id: 'me', label: 'Моя орбита', tone: 'me' },
    ...CONSTELLATIONS.map((c, i) => ({
        id: c.id,
        label: c.label,
        tone: String.fromCharCode(97 + i), // a,b,c...
    })),
];

const RADIUS = 148;

export function OrbitsPanel({ user, hidden = false }) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [rotation, setRotation] = useState(-20);
    const dragRef = useRef({
        active: false,
        lastAngle: 0,
        velocity: 0,
        lastTs: 0,
    });
    const wheelRef = useRef(null);
    const rafRef = useRef(0);
    const rotationRef = useRef(-20);

    useEffect(() => {
        rotationRef.current = rotation;
    }, [rotation]);

    useEffect(() => {
        if (!open) return undefined;

        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    useEffect(() => {
        if (hidden) setOpen(false);
    }, [hidden]);

    useEffect(() => () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }, []);

    if (hidden) return null;

    const step = 360 / ORBITS.length;

    const getPointerAngle = (clientX, clientY) => {
        const el = wheelRef.current;
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
    };

    const startInertia = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        const tick = () => {
            const v = dragRef.current.velocity;
            if (Math.abs(v) < 0.05) {
                dragRef.current.velocity = 0;
                return;
            }
            dragRef.current.velocity *= 0.94;
            const next = rotationRef.current + dragRef.current.velocity;
            rotationRef.current = next;
            setRotation(next);
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
    };

    const onWheel = (e) => {
        e.preventDefault();
        dragRef.current.velocity = 0;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setRotation((r) => r + e.deltaY * 0.22);
    };

    const onPointerDown = (e) => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        dragRef.current = {
            active: true,
            lastAngle: getPointerAngle(e.clientX, e.clientY),
            velocity: 0,
            lastTs: performance.now(),
        };
        e.currentTarget.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e) => {
        if (!dragRef.current.active) return;
        const angle = getPointerAngle(e.clientX, e.clientY);
        let delta = angle - dragRef.current.lastAngle;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;

        const now = performance.now();
        const dt = Math.max(now - dragRef.current.lastTs, 1);
        dragRef.current.velocity = (delta / dt) * 16;
        dragRef.current.lastAngle = angle;
        dragRef.current.lastTs = now;
        setRotation((r) => r + delta);
    };

    const onPointerUp = () => {
        if (!dragRef.current.active) return;
        dragRef.current.active = false;
        startInertia();
    };

    return (
        <div className={`orbits-fab ${open ? 'orbits-fab--open' : ''}`}>
            {open && (
                <button
                    type="button"
                    className="orbits-fab__backdrop"
                    aria-label="Закрыть орбиты"
                    onClick={() => setOpen(false)}
                />
            )}

            <div className="orbits-fab__wall" aria-hidden={!open}>
                <div className={`orbits-fab__dial ${open ? 'orbits-fab__dial--open' : ''}`}>
                    <div className="orbits-fab__orbit-line" aria-hidden />

                    <div
                        ref={wheelRef}
                        className="orbits-fab__wheel"
                        onWheel={onWheel}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                    >
                        <div
                            className="orbits-fab__ring"
                            style={{ transform: `rotate(${rotation}deg)` }}
                        >
                            {ORBITS.map((orbit, i) => {
                                const letter = orbit.tone === 'me'
                                    ? (user?.username?.[0]?.toUpperCase() || 'S')
                                    : orbit.label.slice(0, 1);
                                const angle = i * step;
                                return (
                                    <button
                                        key={orbit.id}
                                        type="button"
                                        className={`orbits-fab__planet orbits-fab__planet--${orbit.tone}`}
                                        style={{
                                            transform: `rotate(${angle}deg) translateY(-${RADIUS}px) rotate(${-(angle + rotation)}deg)`,
                                        }}
                                        title={orbit.label}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpen(false);
                                            if (orbit.id === 'me') {
                                                navigate('/profile');
                                                return;
                                            }
                                            navigate(`/constellation/${encodeURIComponent(orbit.id)}`);
                                        }}
                                    >
                                        <span className="orbits-fab__planet-mark">{letter}</span>
                                        <span className="orbits-fab__planet-label">{orbit.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <button
                type="button"
                className={`orbits-fab__btn orbits-fab__btn--image ${open ? 'orbits-fab__btn--open' : ''}`}
                aria-expanded={open}
                aria-label={open ? 'Закрыть орбиты' : 'Открыть орбиты'}
                onClick={() => setOpen((v) => !v)}
            >
                {open ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                        <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                ) : (
                    <img src="/auth/orbits-fab-btn.png" alt="" className="orbits-fab__btn-img" draggable="false" />
                )}
            </button>
        </div>
    );
}
