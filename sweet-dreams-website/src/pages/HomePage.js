import React from 'react';
import SpaceThemedServicesSection from '../components/SpaceThemedServicesSection';
import SimplifiedNav from '../components/SimplifiedNav';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      <SimplifiedNav />
      <SpaceThemedServicesSection />
    </div>
  );
}