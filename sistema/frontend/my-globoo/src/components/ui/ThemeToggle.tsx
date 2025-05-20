"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function ThemeToggle() {
  // Initialize with system preference, then read from localStorage
  const [isDarkMode, setIsDarkMode] = useState(false);

  // On mount, check the localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="relative w-12 h-6 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <motion.div
        className="w-5 h-5 rounded-full flex items-center justify-center absolute"
        animate={{
          x: isDarkMode ? 26 : 2,
          backgroundColor: isDarkMode ? "#1a1b25" : "#ffffff"
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {isDarkMode ? (
          <MoonIcon className="h-3 w-3 text-blue-200" />
        ) : (
          <SunIcon className="h-3 w-3 text-yellow-500" />
        )}
      </motion.div>
    </button>
  );
}