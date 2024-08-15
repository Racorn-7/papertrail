import React from 'react';
import Navbar from "./presentation/wrappers/Navbar"
import Footer from './presentation/wrappers/Footer';
import WalletInput from './presentation/components/WalletInput';

function App() {
  return (
    <>
      <Navbar/>
      <WalletInput/>
      <Footer/>
    </>
  );
}

export default App;
