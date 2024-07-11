import React from "react";
import dynamic from "next/dynamic";

const World = dynamic(() => import("./ui/globe").then((m) => m.World), {
  ssr: false,
});

export function GlobeComponent() {
  const globeConfig = {
    pointSize: 4,
    globeColor: "#062056",
    showAtmosphere: true,
    atmosphereColor: "#FFFFFF",
    atmosphereAltitude: 0.1,
    emissive: "#062056",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    polygonColor: "rgba(255,255,255,0.7)",
    ambientLight: "#38bdf8",
    directionalLeftLight: "#ffffff",
    directionalTopLight: "#ffffff",
    pointLight: "#ffffff",
    arcTime: 1000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    initialPosition: { lat: 22.3193, lng: 114.1694 },
    autoRotate: true,
    autoRotateSpeed: 0.5,
  };

  const sampleArcs = [
    {
      order: 1,
      startLat: 40.7128,
      startLng: -74.006,
      endLat: 37.7749,
      endLng: -122.4194,
      arcAlt: 0.3,
      color: "#ff0000",
    },
    // Add more arcs as needed
  ];

  return (
    <div style={{ width: "100%", height: "100vh", position: "absolute", top: 0, left: 0 }}>
      <World data={sampleArcs} globeConfig={globeConfig} />
    </div>
  );
}