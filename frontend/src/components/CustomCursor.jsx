import { useEffect, useRef } from 'react';

export default function CustomCursor() {
    const dotRef = useRef(null);
    const ringRef = useRef(null);

    useEffect(() => {
        const dot = dotRef.current;
        const ring = ringRef.current;
        if (!dot || !ring) return;

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let ringX = mouseX;
        let ringY = mouseY;
        let animId;
        let isClicking = false;

        /* ─── Mouse position tracker ─── */
        const onMouseMove = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            // Dot snaps instantly
            dot.style.left = mouseX + 'px';
            dot.style.top = mouseY + 'px';
        };

        /* ─── Click: shrink ring ─── */
        const onMouseDown = () => {
            isClicking = true;
            ring.style.transform = 'translate(-50%, -50%) scale(0.5)';
            ring.style.background = 'rgba(99,102,241,0.25)';
            ring.style.borderColor = 'rgba(165,180,252,0.9)';
        };

        const onMouseUp = () => {
            isClicking = false;
            ring.style.transform = 'translate(-50%, -50%) scale(1)';
            ring.style.background = 'rgba(20,20,40,0.5)';
            ring.style.borderColor = 'rgba(255,255,255,0.75)';
        };

        /* ─── Hover any interactive element: enlarge ring slightly ─── */
        const onMouseOver = (e) => {
            const tag = e.target.tagName?.toLowerCase();
            const isInteractive = tag === 'button' || tag === 'a' || tag === 'input' || e.target.closest('button, a');
            if (isInteractive && !isClicking) {
                ring.style.transform = 'translate(-50%, -50%) scale(1)';
                ring.style.borderColor = 'rgba(129,140,248,0.9)';
            }
        };

        const onMouseOut = () => {
            if (!isClicking) {
                ring.style.transform = 'translate(-50%, -50%) scale(1)';
                ring.style.borderColor = 'rgba(255,255,255,0.75)';
            }
        };

        /* ─── RAF loop: ring follows with lerp ─── */
        const LERP = 0.10;
        const animate = () => {
            ringX += (mouseX - ringX) * LERP;
            ringY += (mouseY - ringY) * LERP;
            ring.style.left = ringX + 'px';
            ring.style.top = ringY + 'px';
            animId = requestAnimationFrame(animate);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('mouseover', onMouseOver);
        document.addEventListener('mouseout', onMouseOut);
        animId = requestAnimationFrame(animate);

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('mouseover', onMouseOver);
            document.removeEventListener('mouseout', onMouseOut);
            cancelAnimationFrame(animId);
        };
    }, []);

    return (
        <>
            {/* ── Small dot — snaps to cursor ── */}
            <div
                ref={dotRef}
                style={{
                    position: 'fixed',
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: '#ffffff',
                    pointerEvents: 'none',
                    zIndex: 99999,
                    left: 0,
                    top: 0,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 6px rgba(255,255,255,0.8)',
                }}
            />

            {/* ── Big ring — follows with lag ── */}
            <div
                ref={ringRef}
                style={{
                    position: 'fixed',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'rgba(20,20,40,0.50)',
                    border: '2px solid rgba(255,255,255,0.75)',
                    pointerEvents: 'none',
                    zIndex: 99998,
                    left: 0,
                    top: 0,
                    transform: 'translate(-50%, -50%) scale(1)',
                    transition: 'transform 0.22s cubic-bezier(.23,1,.32,1), background 0.2s, border-color 0.2s',
                }}
            />
        </>
    );
}
