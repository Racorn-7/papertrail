import React, { useState } from 'react';
import "../styling/Navbar.css";
// import logo from '../../lightmode.svg'

const Navbar: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.className = isDarkMode ? 'light-mode' : 'dark-mode';
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        {/* <img src={logo} alt="Logo" /> */}
      </div>
      <div className="theme-toggle">
        <button onClick={toggleTheme}>
          {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
