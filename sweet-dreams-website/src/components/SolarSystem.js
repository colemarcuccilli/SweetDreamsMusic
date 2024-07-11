import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';

const THREE = typeof window !== 'undefined' ? require('three') : null;
const OrbitControls = typeof window !== 'undefined' ? require('three/examples/jsm/controls/OrbitControls').OrbitControls : null;

// Dynamically import the Meteors component
const Meteors = dynamic(() => import('./Meteors').then((mod) => mod.Meteors), {
  ssr: false
});

const CanvasContainer = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
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

const planets = [
  { name: 'Sun', value: 'Passion', size: 5, orbit: 0, color: 0xffff00 },
  { name: 'Mercury', value: 'Innovation', size: 1, orbit: 10, color: 0x8c7853 },
  { name: 'Venus', value: 'Experience', size: 1.5, orbit: 15, color: 0xffdab9 },
  { name: 'Earth', value: 'Collaboration', size: 2, orbit: 20, color: 0x6b93d6 },
  { name: 'Mars', value: 'Quality', size: 1.8, orbit: 25, color: 0xff4500 },
  { name: 'Jupiter', value: 'Dedication', size: 4, orbit: 35, color: 0xffa500 },
  { name: 'Saturn', value: 'Integrity', size: 3.5, orbit: 45, color: 0xffd700 },
  { name: 'Uranus', value: 'Growth', size: 3, orbit: 55, color: 0x40e0d0 },
  { name: 'Neptune', value: 'Community', size: 2.8, orbit: 65, color: 0x4169e1 },
];

const SolarSystem = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current || !THREE) return;

    // Scene setup
    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });

    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(rendererRef.current.domElement);

    const controls = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    cameraRef.current.position.set(0, 50, 100);
    controls.update();

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    sceneRef.current.add(ambientLight);

    // Stars (brighter)
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.3, transparent: true, opacity: 0.8 });

    const starVertices = [];
    for (let i = 0; i < 15000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    sceneRef.current.add(stars);

    // Create planets
    const planetMeshes = planets.map(planet => {
      const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
      const material = new THREE.MeshBasicMaterial({ color: planet.color });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = planet.orbit;
      sceneRef.current.add(mesh);
      return mesh;
    });

    // Animation
    const animate = () => {
      planetMeshes.forEach((mesh, index) => {
        const planet = planets[index];
        if (planet.orbit !== 0) {
          const angle = Date.now() * 0.0005 * (1 / planet.orbit);
          mesh.position.x = Math.cos(angle) * planet.orbit;
          mesh.position.z = Math.sin(angle) * planet.orbit;
        }
        mesh.rotation.y += 0.005;
      });

      controls.update();
      rendererRef.current.render(sceneRef.current, cameraRef.current);

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      cancelAnimationFrame(animationFrameId.current);
      rendererRef.current.dispose();
    };
  }, []);

  return (
    <CanvasContainer ref={mountRef}>
      <MeteorsWrapper>
        <Meteors number={20} />
      </MeteorsWrapper>
    </CanvasContainer>
  );
};

export default SolarSystem;