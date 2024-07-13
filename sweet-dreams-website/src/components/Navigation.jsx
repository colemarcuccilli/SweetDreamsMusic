"use client";
import React, { useState } from "react";
import { HoveredLink, Menu, MenuItem } from "./ui/navbar-menu.jsx";
import { cn } from "../lib/utils";

const Navbar = ({ className }) => {
  const [active, setActive] = useState(null);
  return (
    <div className={cn("fixed top-4 left-0 right-0 z-50", className)}>
      <div className="container mx-auto">
        <Menu setActive={setActive}>
          <MenuItem setActive={setActive} active={active} item="Home">
            <HoveredLink href="/">Home</HoveredLink>
          </MenuItem>
          <MenuItem setActive={setActive} active={active} item="About">
            <HoveredLink href="/about">About Us</HoveredLink>
          </MenuItem>
          <MenuItem setActive={setActive} active={active} item="Services">
            <HoveredLink href="/services">Our Services</HoveredLink>
          </MenuItem>
          <MenuItem setActive={setActive} active={active} item="Contact">
            <HoveredLink href="/contact">Contact Us</HoveredLink>
          </MenuItem>
        </Menu>
      </div>
    </div>
  );
};

export default Navbar;