import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const meteorEffect = keyframes`
  0% {
    transform: rotate(215deg) translateX(0);
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: rotate(215deg) translateX(-500px);
    opacity: 0;
  }
`;

const MeteorSpan = styled.span`
  position: absolute;
  top: ${props => props.top}px;
  left: ${props => props.left}px;
  width: 2px;
  height: 2px;
  background-color: ${props => props.color};
  border-radius: 9999px;
  box-shadow: 0 0 0 1px ${props => props.color}10, 0 0 0 2px ${props => props.color}10, 0 0 20px ${props => props.color}80;
  transform: rotate(215deg);
  animation: ${meteorEffect} ${props => props.duration}s linear infinite;
  animation-delay: ${props => props.delay}s;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 50px;
    height: 1px;
    background: linear-gradient(to right, ${props => props.color}, transparent);
  }
`;

const MeteorsContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
`;

const colors = ['#ff4500', '#ffa500', '#ff6347', '#ff7f50', '#ff8c00'];

export const Meteors = ({ number = 20 }) => {
  const [meteorProps, setMeteorProps] = useState([]);

  useEffect(() => {
    const newMeteorProps = new Array(number).fill(true).map(() => ({
      top: Math.floor(Math.random() * window.innerHeight),
      left: Math.floor(Math.random() * window.innerWidth),
      duration: Math.floor(Math.random() * 8) + 2,
      delay: Math.random() * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setMeteorProps(newMeteorProps);
  }, [number]);

  return (
    <MeteorsContainer>
      {meteorProps.map((props, idx) => (
        <MeteorSpan
          key={`meteor-${idx}`}
          {...props}
        />
      ))}
    </MeteorsContainer>
  );
};