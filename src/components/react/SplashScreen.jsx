import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './SplashScreen.css';

const Dither = lazy(() => import('./Dither'));

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [hasClicked, setHasClicked] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const handleEnter = () => {
    if (hasClicked) return;
    
    // Ejecutar desbloqueo de audio inmediatamente (Síncrono para móvil)
    if (window.luxuryUnlock) {
      window.luxuryUnlock();
    }

    setHasClicked(true);
    
    // Redireccionar a /dashboard
    setTimeout(() => {
      window.location.href = '/licencia';
    }, 100);
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
          onClick={handleEnter}
        >
          {/* Background Dither Effect */}
          <div style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
            <Suspense fallback={null}>
              <Dither
                waveColor={[0.5, 0.5, 0.5]}
                disableAnimation={false}
                enableMouseInteraction={true}
                mouseRadius={0.15}
                colorNum={4}
                waveAmplitude={0.3}
                waveFrequency={3}
                waveSpeed={0.05}
              />
            </Suspense>
          </div>
          
          <motion.div 
            className="splash-box"
            initial={{ opacity: 0, y: 20 }}
            animate={isMounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            <div className="splash-logo-wrapper">
              <h1 className="splash-title">LUXURY</h1>
              <div className="splash-divider"></div>
              <p className="splash-subtitle">DASHBOARD CLIENT</p>
            </div>

            <div className={`enter-prompt ${hasClicked ? 'clicked' : ''}`}>
              <span className="enter-text">
                {hasClicked ? "ACCESO CONCEDIDO" : "CLICK PARA ENTRAR"}
              </span>
            </div>
          </motion.div>

          <div className="splash-footer">
            <div className="splash-footer-box">
              <p className="version-text">v1.0.0  |  HIGH FIDELITY SYSTEM</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
