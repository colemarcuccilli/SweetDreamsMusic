import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const VisualizerContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  padding: 20px;
`;

const Project = styled.div`
  width: 200px;
  height: 200px;
  background: ${props => props.color};
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

const PortfolioVisualizer = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    // Simulating fetching projects from an API
    setProjects([
      { id: 1, name: 'Project 1', color: '#ff6b6b' },
      { id: 2, name: 'Project 2', color: '#4ecdc4' },
      { id: 3, name: 'Project 3', color: '#45b7d1' },
      { id: 4, name: 'Project 4', color: '#f7b731' },
    ]);
  }, []);

  const handleProjectClick = (project) => {
    // Here you would handle playing a sample or showing more details
    console.log(`Clicked on ${project.name}`);
  };

  return (
    <VisualizerContainer>
      {projects.map(project => (
        <Project 
          key={project.id} 
          color={project.color}
          onClick={() => handleProjectClick(project)}
        >
          {project.name}
        </Project>
      ))}
    </VisualizerContainer>
  );
};

export default PortfolioVisualizer;