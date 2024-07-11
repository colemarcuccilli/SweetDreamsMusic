import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const NavContainer = styled.nav`
  position: fixed;
  top: 0;
  right: 0;
  padding: 20px;
  z-index: 1000;
`;

const NavItem = styled(Link)`
  display: block;
  color: #fff;
  text-decoration: none;
  font-size: 1.2rem;
  margin-bottom: 15px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
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

const MusicStaffNav = () => {
  return (
    <NavContainer>
      <NavItem to="/">Home</NavItem>
      <NavItem to="/work">Work</NavItem>
      <NavItem to="/book">Book</NavItem>
      <NavItem to="/contact">Contact</NavItem>
    </NavContainer>
  );
};

export default MusicStaffNav;