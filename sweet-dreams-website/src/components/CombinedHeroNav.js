import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

const flicker = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.9; }
`;

const NavContainer = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: #000;
  color: #fff;
  height: 80px;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
`;

const LEDText = styled.div`
  font-size: 2rem;
  font-weight: 300;
  font-family: 'Pacifico', cursive;
  color: #fff;
  white-space: nowrap;
  animation: ${flicker} 3s infinite;
  transition: color 0.3s ease;
`;

const CrescentMoon = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  box-shadow: 7px 7px 0 0 #fff;
  transform: rotate(-20deg);
  margin-left: 10px;
  transition: box-shadow 0.3s ease;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
`;

const NavItem = styled(Link)`
  color: #fff;
  text-decoration: none;
  font-size: 1rem;
  position: relative;
  padding-bottom: 5px;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: #fff;
    transition: background-color 0.3s ease;
  }

  &:hover::after {
    background-color: ${props => props.hoverColor || '#ff6b6b'};
  }
`;

const CombinedHeroNav = () => {
  const textRef = useRef(null);
  const moonRef = useRef(null);
  const navItemsRef = useRef([]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      
      const gradient = `linear-gradient(135deg, 
        hsl(${x * 360}, 100%, 50%), 
        hsl(${y * 360}, 100%, 50%)
      )`;

      if (textRef.current) {
        textRef.current.style.webkitTextFillColor = 'transparent';
        textRef.current.style.webkitBackgroundClip = 'text';
        textRef.current.style.backgroundImage = gradient;
      }

      if (moonRef.current) {
        const color = `hsl(${(x + y) * 180}, 100%, 50%)`;
        moonRef.current.style.boxShadow = `7px 7px 0 0 ${color}`;
      }

      navItemsRef.current.forEach(item => {
        if (item) {
          item.style.setProperty('--hover-color', `hsl(${(x + y) * 180}, 100%, 50%)`);
        }
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <NavContainer>
      <LogoSection>
        <LEDText ref={textRef}>Sweet Dreams</LEDText>
        <CrescentMoon ref={moonRef} />
      </LogoSection>
      <NavLinks>
        <NavItem to="/" ref={el => navItemsRef.current[0] = el}>Home</NavItem>
        <NavItem to="/work" ref={el => navItemsRef.current[1] = el}>Work</NavItem>
        <NavItem to="/book" ref={el => navItemsRef.current[2] = el}>Book</NavItem>
        <NavItem to="/contact" ref={el => navItemsRef.current[3] = el}>Contact</NavItem>
      </NavLinks>
    </NavContainer>
  );
};

export default CombinedHeroNav;