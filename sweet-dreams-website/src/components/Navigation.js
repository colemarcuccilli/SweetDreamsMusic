import React from 'react';
import Link from 'next/link';
import { MoonIcon } from '@heroicons/react/24/solid';
import { FloatingNav } from './FloatingNav';  // Corrected import

const navItems = [
  {
    name: 'Home',
    link: '/',
  },
  {
    name: 'About',
    link: '/about',
  },
  {
    name: 'Services',
    link: '/services',
  },
  {
    name: 'Contact',
    link: '/contact',
  },
];

const Navigation = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] flex justify-between items-center p-4">
      <Link href="/" className="flex items-center space-x-2">
        <MoonIcon className="h-8 w-8 text-white" />
        <span className="text-white font-bold text-xl">SweetDreams</span>
      </Link>
      <div className="flex-grow flex justify-center">
        <FloatingNav
          navItems={navItems}
          className="bg-black bg-opacity-50 backdrop-blur-md"
        />
      </div>
    </div>
  );
};

export default Navigation;