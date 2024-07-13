import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { TextureLoader, Raycaster, Vector2 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Menu, MenuItem, HoveredLink } from './ui/navbar-menu';

// Dynamically import the Meteors component
const Meteors = dynamic(() => import('./Meteors').then((mod) => mod.Meteors), {
  ssr: false
});

const CanvasContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
`;

const NavContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 1rem;
`;

const MeteorsWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
`;

const HoverLabel = styled.div`
  position: absolute;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
  padding: 5px 10px;
  border-radius: 20px;
  white-space: nowrap;
  overflow: hidden;
  display: flex;
  align-items: center;
  pointer-events: none;
  transition: opacity 0.3s ease;
`;

const GlowingLine = styled.div`
  width: 50px;
  height: 2px;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0) 100%);
  margin-right: 10px;
`;

const planetTextures = {
  Sun: '/textures/sun.jpg',
  Mercury: '/textures/mercury.jpg',
  Venus: '/textures/venus.jpg',
  Earth: '/textures/earth.jpg',
  Moon: '/textures/moon.jpg',
  Mars: '/textures/mars.jpg',
  Jupiter: '/textures/jupiter.jpg',
  Saturn: '/textures/saturn.jpg',
  Neptune: '/textures/neptune.jpg',
};

const planets = [
  { name: 'Sun', value: 'Passion', size: 15, orbit: 0, speed: 0, yOffset: 0, texture: planetTextures.Sun, title: "Passion", description: "The driving force behind every project, fueled by a love for music and artistry." },
  { name: 'Mercury', value: 'Innovation', size: 2, orbit: 35, speed: 0.01, yOffset: 2, texture: planetTextures.Mercury, title: "Innovation", description: "Emphasizes the use of cutting-edge technology and techniques in music production." },
  { name: 'Venus', value: 'Experience', size: 3, orbit: 55, speed: 0.0075, yOffset: -3, texture: planetTextures.Venus, title: "Experience", description: "Highlights the extensive experience and expertise of your team." },
  { name: 'Earth', value: 'Collaboration', size: 4, orbit: 78, speed: 0.005, yOffset: 1, texture: planetTextures.Earth, title: "Collaboration", description: "Focuses on working closely with artists to achieve their vision." },
  { name: 'Mars', value: 'Quality', size: 3, orbit: 98, speed: 0.004, yOffset: -2, texture: planetTextures.Mars, title: "Quality", description: "Commitment to delivering high-quality services and productions." },
  { name: 'Jupiter', value: 'Dedication', size: 8, orbit: 125, speed: 0.002, yOffset: 4, texture: planetTextures.Jupiter, title: "Dedication", description: "Represents the hardworking nature and dedication of your team." },
  { name: 'Saturn', value: 'Integrity', size: 7, orbit: 170, speed: 0.0015, yOffset: -5, texture: planetTextures.Saturn, title: "Integrity", description: "Ensures honesty, transparency, and trust in all business dealings." },
  { name: 'Uranus', value: 'Growth', size: 5, orbit: 220, speed: 0.001, yOffset: 3, texture: planetTextures.Neptune, title: "Growth", description: "Focuses on the continuous development and success of your clients." },
  { name: 'Neptune', value: 'Community', size: 5, orbit: 250, speed: 0.0005, yOffset: -1, texture: planetTextures.Neptune, title: "Community", description: "Emphasizes building a supportive and engaging community around music." },
];

const SolarSystem = ({ setPlanetZoomViewVisible, setSelectedPlanet }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameId = useRef(null);
  const raycasterRef = useRef(new Raycaster());
  const mouseRef = useRef(new Vector2());
  const hoveredPlanetRef = useRef(null);
  const controlsRef = useRef(null);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
  const [labelPosition, setLabelPosition] = useState({ x: 0, y: 0 });
  const [activeMenuItem, setActiveMenuItem] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current) return;

    const textureLoader = new TextureLoader();

    // Scene setup
    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });

    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(rendererRef.current.domElement);

    controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    cameraRef.current.position.set(0, 50, 250);
    controlsRef.current.update();
    controlsRef.current.target.set(0, 0, 0);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    sceneRef.current.add(ambientLight);

    // Point light (sun-like)
    const sunLight = new THREE.PointLight(0xffffff, 1.5, 1000);
    sunLight.position.set(0, 0, 0);
    sceneRef.current.add(sunLight);

    // Create starfield
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
    });

    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starField = new THREE.Points(starGeometry, starMaterial);
    sceneRef.current.add(starField);

    // Create planets
    const planetMeshes = planets.map(planet => {
      const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
      const texture = textureLoader.load(planet.texture);
      const material = new THREE.MeshPhongMaterial({ 
        map: texture,
        shininess: 10,
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      // Set random initial position throughout the entire orbit
      const randomAngle = Math.random() * Math.PI * 2;
      mesh.position.set(
        Math.cos(randomAngle) * planet.orbit,
        planet.yOffset,
        Math.sin(randomAngle) * planet.orbit
      );
      
      // Add outline to planets
      const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide });
      const outlineMesh = new THREE.Mesh(new THREE.SphereGeometry(planet.size * 1.05, 32, 32), outlineMaterial);
      outlineMesh.visible = false;
      mesh.add(outlineMesh);

      sceneRef.current.add(mesh);
      return mesh;
    });

    // Add Moon to Earth
    const earthIndex = planets.findIndex(p => p.name === 'Earth');
    if (earthIndex !== -1) {
      const moonGeometry = new THREE.SphereGeometry(1, 32, 32);
      const moonTexture = textureLoader.load(planetTextures.Moon);
      const moonMaterial = new THREE.MeshPhongMaterial({ map: moonTexture, shininess: 10 });
      const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
      
      const moonOrbit = 10;
      const moonAngle = Math.random() * Math.PI * 2;
      moonMesh.position.set(
        Math.cos(moonAngle) * moonOrbit,
        0,
        Math.sin(moonAngle) * moonOrbit
      );

      planetMeshes[earthIndex].add(moonMesh);
    }

    const animate = (time) => {
      planetMeshes.forEach((mesh, index) => {
        const planet = planets[index];
        if (planet.orbit !== 0) {
          const angle = time * 0.001 * planet.speed;
          mesh.position.x = Math.cos(angle) * planet.orbit;
          mesh.position.z = Math.sin(angle) * planet.orbit;
          // Keep the y-offset
          mesh.position.y = planet.yOffset;
        }
        mesh.rotation.y += 0.005;
    
        // Animate moon if this is Earth
        if (planet.name === 'Earth' && mesh.children.length > 1) {
          const moon = mesh.children[1];
          const moonAngle = time * 0.002;
          moon.position.x = Math.cos(moonAngle) * 10;
          moon.position.z = Math.sin(moonAngle) * 10;
          moon.rotation.y += 0.01;
        }
      });

      // Rotate starfield
      starField.rotation.y += 0.0001;

      // Raycasting for planet highlighting and hover effect
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(planetMeshes);

      if (intersects.length > 0) {
        const intersectedPlanet = intersects[0].object;
        if (hoveredPlanetRef.current !== intersectedPlanet) {
          if (hoveredPlanetRef.current && hoveredPlanetRef.current.children.length > 0) {
            hoveredPlanetRef.current.children[0].visible = false;
          }
          hoveredPlanetRef.current = intersectedPlanet;
          if (hoveredPlanetRef.current.children.length > 0) {
            hoveredPlanetRef.current.children[0].visible = true;
          }
          const planetIndex = planetMeshes.indexOf(intersectedPlanet);
          setHoveredPlanet(planets[planetIndex]);

          // Calculate screen position for label
          const screenPosition = intersectedPlanet.position.clone().project(cameraRef.current);
          setLabelPosition({
            x: (screenPosition.x * 0.5 + 0.5) * window.innerWidth,
            y: (-screenPosition.y * 0.5 + 0.5) * window.innerHeight
          });
        }
      } else if (hoveredPlanetRef.current) {
        if (hoveredPlanetRef.current.children.length > 0) {
          hoveredPlanetRef.current.children[0].visible = false;
        }
        hoveredPlanetRef.current = null;
        setHoveredPlanet(null);
      }

      controlsRef.current.update();
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate(0);

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    const handleMouseMove = (event) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = - (event.clientY / window.innerHeight) * 2 + 1;
    };

    const handleClick = () => {
      if (hoveredPlanetRef.current) {
        const planetIndex = planetMeshes.indexOf(hoveredPlanetRef.current);
        const planet = planets[planetIndex];
        zoomToPlanet(hoveredPlanetRef.current, planet);
      }
    };

    const zoomToPlanet = (planetMesh, planet) => {
      const startPosition = cameraRef.current.position.clone();
      const planetPosition = planetMesh.position.clone();
      const direction = planetPosition.clone().sub(startPosition).normalize();
      const distance = Math.max(planet.size * 5, 10); // Adjust this value to change the zoom level
      const endPosition = planetPosition.clone().add(direction.multiplyScalar(distance));

      const duration = 1000; // milliseconds
      const startTime = Date.now();

      const zoomAnimation = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        const easeProgress = easeInOutCubic(progress);

        cameraRef.current.position.lerpVectors(startPosition, endPosition, easeProgress);
        controlsRef.current.target.copy(planetPosition);

        if (progress < 1) {
          requestAnimationFrame(zoomAnimation);
        } else {
          setPlanetZoomViewVisible(true);
          setSelectedPlanet(planet);
        }
      };

      zoomAnimation();
    };

    // Easing function for smooth animation
    const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

    controlsRef.current.minDistance = 10;
    controlsRef.current.maxDistance = 500;

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      cancelAnimationFrame(animationFrameId.current);
      rendererRef.current.dispose();
    };
  }, [setPlanetZoomViewVisible, setSelectedPlanet]);

  return (
    <CanvasContainer>
      <NavContainer>
        <Menu setActive={setActiveMenuItem}>
          <MenuItem setActive={setActiveMenuItem} active={activeMenuItem} item="Home">
            <HoveredLink href="/">Home</HoveredLink>
          </MenuItem>
          <MenuItem setActive={setActiveMenuItem} active={activeMenuItem} item="About">
            <HoveredLink href="/about">About</HoveredLink>
          </MenuItem>
          <MenuItem setActive={setActiveMenuItem} active={activeMenuItem} item="Services">
            <HoveredLink href="/services">Services</HoveredLink>
          </MenuItem>
          <MenuItem setActive={setActiveMenuItem} active={activeMenuItem} item="Contact">
            <HoveredLink href="/contact">Contact</HoveredLink>
          </MenuItem>
        </Menu>
      </NavContainer>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }}>
        {/* This div will contain the Three.js canvas */}
      </div>
      {hoveredPlanet && (
        <HoverLabel style={{ left: labelPosition.x, top: labelPosition.y }}>
          <GlowingLine />
          <span style={{ color: 'white', fontWeight: 'bold' }}>{hoveredPlanet.value}</span>
        </HoverLabel>
      )}
      <MeteorsWrapper>
        <Meteors number={10} />
      </MeteorsWrapper>
    </CanvasContainer>
  );
};

export default SolarSystem;