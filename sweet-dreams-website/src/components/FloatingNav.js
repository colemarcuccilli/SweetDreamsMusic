// components/FloatingNav.js
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const FloatingNav = ({ navItems, className = "" }) => {
  const path = usePathname();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex items-center space-x-4 bg-black bg-opacity-50 backdrop-blur-md px-4 py-2 rounded-full ${className}`}
    >
      {navItems.map((item, idx) => (
        <Link key={item.name} href={item.link}>
          <motion.div
            className={`px-4 py-2 rounded-full text-sm lg:text-base relative no-underline duration-300 ease-in ${
              path === item.link ? "text-zinc-100" : "text-zinc-400"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">{item.name}</span>
            {path === item.link && (
              <motion.div
                layoutId="active"
                className="absolute inset-0 bg-white bg-opacity-10 rounded-full"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              ></motion.div>
            )}
          </motion.div>
        </Link>
      ))}
    </motion.div>
  );
};