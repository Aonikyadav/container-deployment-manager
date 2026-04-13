import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="layout-container">
      <Navbar />
      <main className="main-content" style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', marginTop: '60px' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;


