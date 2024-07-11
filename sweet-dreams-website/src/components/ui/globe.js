import React, { useRef, useEffect } from "react";
import { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight, Vector3 } from "three";
import ThreeGlobe from "three-globe";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export function World({ data, globeConfig }) {
  const containerRef = useRef();

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    let scene, camera, renderer, globe, controls;

    const init = () => {
      // Scene setup
      scene = new Scene();
      
      // Camera setup
      camera = new PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
      camera.position.z = 300;

      // Renderer setup
      renderer = new WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      containerRef.current.appendChild(renderer.domElement);

      // Globe setup
      globe = new ThreeGlobe()
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
        .arcColor(() => globeConfig.arcColor || "white")
        .arcDashLength(globeConfig.arcLength)
        .arcDashGap(2)
        .arcDashAnimateTime(globeConfig.arcTime)
        .arcsData(data)
        .arcStroke(0.5);

      scene.add(globe);

      // Lights
      const ambientLight = new AmbientLight(0xbbbbbb, 0.3);
      scene.add(ambientLight);
      const directionalLight = new DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);

      // Controls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.enableZoom = true;

      // Animation
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();
    };

    init();

    // Cleanup
    return () => {
      if (renderer && renderer.domElement && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      if (renderer) {
        renderer.dispose();
      }
      if (controls) {
        controls.dispose();
      }
    };
  }, [data, globeConfig]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}