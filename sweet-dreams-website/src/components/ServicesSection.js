import React from 'react';
import styled from 'styled-components';

const ServicesContainer = styled.section`
  background-color: #000000;
  padding: 4rem 2rem;
  position: relative;
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
`;

const ColumnLine = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #333;
  left: ${props => props.left};

  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 10px;
    height: 10px;
    background-color: #333;
    border-radius: 50%;
  }

  &::before {
    top: calc(25% - 5px);
  }

  &::after {
    top: calc(75% - 5px);
  }
`;

const ServiceCard = styled.div`
  background-color: #000000;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-10px);
  }
`;

const ServiceIcon = styled.div`
  width: 80px;
  height: 80px;
  background-color: #1a1a1a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
`;

const ServiceTitle = styled.h3`
  color: #fff;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
`;

const ServiceDescription = styled.p`
  color: #b0b0b0;
  font-size: 0.9rem;
`;

const services = [
  { title: 'Recording', icon: '🎙️', description: 'State-of-the-art recording facilities' },
  { title: 'Music Production', icon: '🎚️', description: 'Professional music production services' },
  { title: 'Videography', icon: '🎥', description: 'High-quality video production' },
  { title: 'Web Design', icon: '💻', description: 'Custom website design for artists' },
  { title: 'Marketing', icon: '📈', description: 'Comprehensive marketing strategies' },
  { title: 'Artist Development', icon: '🌟', description: 'Nurturing emerging talent' },
];

const ServicesSection = () => {
  return (
    <ServicesContainer>
      <ServicesGrid>
        <ColumnLine left="33.33%" />
        <ColumnLine left="66.66%" />
        {services.map((service, index) => (
          <ServiceCard key={index}>
            <ServiceIcon>{service.icon}</ServiceIcon>
            <ServiceTitle>{service.title}</ServiceTitle>
            <ServiceDescription>{service.description}</ServiceDescription>
          </ServiceCard>
        ))}
      </ServicesGrid>
    </ServicesContainer>
  );
};

export default ServicesSection;