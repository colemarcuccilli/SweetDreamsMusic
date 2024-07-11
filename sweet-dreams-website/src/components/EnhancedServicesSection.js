import React from 'react';
import styled from 'styled-components';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const ServicesContainer = styled.section`
  background-color: #000000;
  padding: 4rem 2rem;
  position: relative;
  overflow: hidden;
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
`;

const ColumnLine = styled(motion.div)`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(to bottom, #ff00ff, #00ffff);
  left: ${props => props.left};
`;

const Circle = styled(motion.div)`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 15px;
  height: 15px;
  background-color: #ffffff;
  border-radius: 50%;
`;

const ServiceCard = styled(motion.div)`
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  backdrop-filter: blur(5px);
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
  font-size: 2rem;
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

const EnhancedServicesSection = () => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  React.useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <ServicesContainer ref={ref}>
      <ServicesGrid
        as={motion.div}
        variants={containerVariants}
        initial="hidden"
        animate={controls}
      >
        <ColumnLine left="33.33%" 
          animate={{ 
            background: ['linear-gradient(to bottom, #ff00ff, #00ffff)', 'linear-gradient(to bottom, #00ffff, #ff00ff)'] 
          }} 
          transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse' }}
        >
          <Circle top="25%" />
          <Circle top="75%" />
        </ColumnLine>
        <ColumnLine left="66.66%" 
          animate={{ 
            background: ['linear-gradient(to bottom, #00ffff, #ff00ff)', 'linear-gradient(to bottom, #ff00ff, #00ffff)'] 
          }} 
          transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse' }}
        >
          <Circle top="25%" />
          <Circle top="75%" />
        </ColumnLine>
        {services.map((service, index) => (
          <ServiceCard key={index} variants={itemVariants}>
            <ServiceIcon>{service.icon}</ServiceIcon>
            <ServiceTitle>{service.title}</ServiceTitle>
            <ServiceDescription>{service.description}</ServiceDescription>
          </ServiceCard>
        ))}
      </ServicesGrid>
    </ServicesContainer>
  );
};

export default EnhancedServicesSection;