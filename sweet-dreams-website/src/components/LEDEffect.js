import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';

const LEDContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const LEDOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

const withLEDEffect = (WrappedComponent) => {
  return (props) => {
    const containerRef = useRef(null);
    const overlayRef = useRef(null);

    useEffect(() => {
      const container = containerRef.current;
      const overlay = overlayRef.current;

      const handleMouseMove = (e) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const gradient = `radial-gradient(
          circle 50px at ${x}px ${y}px,
          rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.8),
          transparent
        )`;

        overlay.style.background = gradient;
      };

      const handleMouseLeave = () => {
        overlay.style.background = 'none';
      };

      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }, []);

    return (
      <LEDContainer ref={containerRef}>
        <WrappedComponent {...props} />
        <LEDOverlay ref={overlayRef} />
      </LEDContainer>
    );
  };
};

export default withLEDEffect;