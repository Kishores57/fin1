import React, { useState, useRef } from 'react';

export const LiquidGlassCard = ({
  children,
  glowIntensity = 'sm',
  shadowIntensity = 'sm',
  blurIntensity = 'sm',
  borderRadius = '20px',
  draggable = false,
  className = '',
  style = {},
}) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const posStartRef = useRef({ x: 0, y: 0 });
  const dragHandleRef = useRef(null);

  const handlePointerDown = (e) => {
    if (!draggable) return;
    if (!dragHandleRef.current?.contains(e.target)) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    posStartRef.current = { ...pos };
    dragHandleRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPos({
      x: posStartRef.current.x + dx,
      y: posStartRef.current.y + dy,
    });
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    // Snap back to original position with spring
    setPos({ x: 0, y: 0 });
    try { dragHandleRef.current?.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  const blurValues = {
    none: 'none',
    sm: 'blur(10px) saturate(170%)',
    md: 'blur(14px) saturate(185%)',
    lg: 'blur(18px) saturate(200%)',
  };

  const glowValues = {
    none: 'none',
    sm: '0 0 20px rgba(16, 185, 129, 0.18)',
    md: '0 0 30px rgba(16, 185, 129, 0.3)',
    lg: '0 0 40px rgba(16, 185, 129, 0.45)',
  };

  const shadowValues = {
    none: 'none',
    sm: '0 12px 28px rgba(0, 0, 0, 0.13), inset 0 1.5px 1px rgba(255, 255, 255, 0.96), inset 0 -1px 2px rgba(0, 0, 0, 0.04)',
    md: '0 20px 45px rgba(0, 0, 0, 0.18), inset 0 2px 2px rgba(255, 255, 255, 0.95), inset 0 -1px 2px rgba(0, 0, 0, 0.05)',
    lg: '0 28px 60px rgba(0, 0, 0, 0.22), inset 0 2px 2px rgba(255, 255, 255, 0.95)',
  };

  const shadow = shadowValues[shadowIntensity] || shadowValues.sm;
  const glow = glowValues[glowIntensity] || glowValues.sm;
  const combinedShadow = [shadow, glow].filter(v => v !== 'none').join(', ');

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.62)',
    backdropFilter: blurValues[blurIntensity] || blurValues.sm,
    WebkitBackdropFilter: blurValues[blurIntensity] || blurValues.sm,
    border: '1.5px solid rgba(255, 255, 255, 0.88)',
    borderTop: '1.5px solid rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius,
    boxShadow: combinedShadow,
    transform: `translate(${pos.x}px, ${pos.y}px)`,
    transition: isDragging
      ? 'box-shadow 0.15s ease'
      : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
    touchAction: draggable ? 'none' : 'auto',
    userSelect: isDragging ? 'none' : 'auto',
    cursor: draggable && isDragging ? 'grabbing' : 'default',
    position: 'relative',
    ...style,
  };

  return (
    <div
      className={`liquid-glass-card ${className}`}
      style={cardStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: '8%',
        right: '8%',
        height: '38%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0) 100%)',
        borderRadius: `${borderRadius} ${borderRadius} 60% 60%`,
        pointerEvents: 'none',
        zIndex: 1,
      }} />
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: '20%',
        right: '20%',
        height: '30%',
        background: 'linear-gradient(0deg, rgba(16, 185, 129, 0.06) 0%, rgba(255,255,255,0) 100%)',
        borderRadius: '0 0 60% 60%',
        pointerEvents: 'none',
        zIndex: 1,
      }} />
      {draggable && (
        <div
          ref={dragHandleRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '22px',
            cursor: isDragging ? 'grabbing' : 'grab',
            zIndex: 10,
            borderRadius: `${borderRadius} ${borderRadius} 0 0`,
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 2, paddingTop: draggable ? '18px' : 0 }}>
        {children}
      </div>
    </div>
  );
};

export default LiquidGlassCard;
