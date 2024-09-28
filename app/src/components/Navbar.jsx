// src/components/Navbar.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './navbar.module.css';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.navbar}>
      <button className={styles.navButton} onClick={() => navigate('/')}>Home</button>
      <button className={styles.navButton} onClick={() => navigate('/main')}>Try</button>
    </div>
  );
};

export default Navbar;
