import React from 'react';
import SpaceThemedServicesSection from '../components/SpaceThemedServicesSection';
import Navigation from '../components/Navigation';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <SpaceThemedServicesSection />
    </div>
  );
}