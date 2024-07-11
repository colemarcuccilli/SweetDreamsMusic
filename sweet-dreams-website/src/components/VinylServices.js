import React, { useState } from 'react';
import styled from 'styled-components';

const VinylContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
`;

const Vinyl = styled.div`
  width: 300px;
  height: 300px;
  background: #333;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.5s ease;
  cursor: pointer;

  &:hover {
    transform: rotate(30deg);
  }
`;

const ServiceList = styled.ul`
  list-style-type: none;
  padding: 0;
  text-align: center;
`;

const Service = styled.li`
  margin: 10px 0;
  color: white;
`;

const VinylServices = () => {
  const [currentService, setCurrentService] = useState(0);
  const services = ['Recording', 'Mixing', 'Mastering', 'Production'];

  const rotateServices = () => {
    setCurrentService((prev) => (prev + 1) % services.length);
  };

  return (
    <VinylContainer>
      <Vinyl onClick={rotateServices}>
        <ServiceList>
          {services.map((service, index) => (
            <Service key={index} style={{ opacity: index === currentService ? 1 : 0.5 }}>
              {service}
            </Service>
          ))}
        </ServiceList>
      </Vinyl>
    </VinylContainer>
  );
};

export default VinylServices;