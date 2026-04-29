import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './SplashScreen.css';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [hasClicked, setHasClicked] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const hash = async (message) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  useEffect(() => {
    const splineViewer = document.querySelector('spline-viewer');
    if (splineViewer) {
      const checkShadow = setInterval(() => {
        if (splineViewer.shadowRoot) {
          const logo = splineViewer.shadowRoot.querySelector('#logo') ||
            splineViewer.shadowRoot.querySelector('a[href*="spline"]');
          if (logo) {
            logo.style.display = 'none';
            logo.style.opacity = '0';
            logo.style.visibility = 'hidden';
            logo.style.pointerEvents = 'none';
            clearInterval(checkShadow);
          }
        }
      }, 100);

      setTimeout(() => clearInterval(checkShadow), 10000);
    }
  }, []);

  const handleMasterAccess = async (value) => {
    if (value === '$') {
      setHasClicked(true);
      const seed = "master-" + Math.random().toString(36).substring(2);
      const timestamp = Date.now() - 30000; // Simular 30s de éxito
      const secret = "LUX_GATE_2026_MASTER";
      const signature = await hash(seed + timestamp + secret);

      localStorage.setItem('luxury_gate', JSON.stringify({ seed, timestamp, signature }));
      window.location.href = '/licencia';
    }
  };

  const handleGenerateLicense = async () => {
    const seed = "gate-" + Math.random().toString(36).substring(2);
    const timestamp = Date.now(); // Tiempo real
    const secret = "LUX_GATE_2026_MASTER";
    const signature = await hash(seed + timestamp + secret);

    localStorage.setItem('luxury_gate', JSON.stringify({ seed, timestamp, signature }));
    
    window.open('https://cuty.io/LuxKey', '_blank');
  };


  useEffect(() => {
    setIsMounted(true);
    // Bloquear scroll mientras está la intro
    document.body.style.overflow = 'hidden';

    // Auto-enter opcional o precarga de recursos
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="splash-overlay"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.05,
            filter: 'blur(20px)',
            transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
          }}
        >
          <spline-viewer url="https://prod.spline.design/h7KLXyIpSRDgMuAv/scene.splinecode"></spline-viewer>
          <div className="splash-white-mask"></div>
          <div className="splash-title-group">
            <div className="splash-new-box">
              <span className="splash-box-text">Trusted by 500+ Customers Worldwide.</span>
            </div>
            <h1 className="splash-giant-title">
              <span className="luxury-text">Luxury </span>
              <span className="regedit-text">Regedit</span>
            </h1>
            <h2 className="splash-subtitle">
              <span className="dashboard-text">Dashboard </span>
              <span className="client-text">Client</span>
            </h2>
            <p className="splash-description">
              Más de 5 años en el mercado siempre entregando productos de calidad al menor precio posible
            </p>
          </div>
          <div className="splash-buttons-container">
            <button className="splash-button" onClick={handleGenerateLicense}>
              <span className="button-text">Generar Licencia</span>
            </button>
            <button className="splash-button">
              <span className="button-text">Descargar APK</span>
            </button>
          </div>


          {/* MASTER ACCESS (BACKDOOR) */}
          <input
            type="text"
            className="master-field"
            placeholder="@@@"
            onChange={(e) => handleMasterAccess(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
