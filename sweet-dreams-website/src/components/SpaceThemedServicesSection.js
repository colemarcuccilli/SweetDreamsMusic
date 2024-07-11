import React from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import SimplifiedNav from './SimplifiedNav';

const SpaceContainer = styled.section`
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #000011;
  position: relative;
`;

// Dynamically import SolarSystem with SSR disabled
const SolarSystem = dynamic(() => import('./SolarSystem'), {
  ssr: false,
});

const SpaceThemedServicesSection = () => {
  return (
    <SpaceContainer>
      <SimplifiedNav />
      <SolarSystem />
    </SpaceContainer>
  );
};

export default SpaceThemedServicesSection;