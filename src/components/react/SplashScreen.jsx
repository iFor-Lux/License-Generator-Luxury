import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './SplashScreen.css';

const Dither = lazy(() => import('./Dither'));

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

  const handleEnter = async (e) => {
    // Si ya se hizo clic o el evento viene del panel de debug, no hacer nada
    if (hasClicked || (e && e.target && e.target.closest('.debug-panel'))) return;
    
    setHasClicked(true);
    
    // Ejecutar desbloqueo de audio inmediatamente (Síncrono para móvil)
    if (window.luxuryUnlock) {
      window.luxuryUnlock();
    }

    try {
      // Generar token local firmado
      const seed = Math.random().toString(36).substring(2);
      const timestamp = Date.now();
      const secret = "LUX_GATE_2026_MASTER";
      const signature = await hash(seed + timestamp + secret);
      
      localStorage.setItem('luxury_gate', JSON.stringify({ seed, timestamp, signature }));
    } catch (e) {
      console.error("Error signing gate:", e);
    }
    
    // Redireccionar a /dashboard
    setTimeout(() => {
      window.location.href = 'https://cuty.io/LuxKey';
    }, 1500); // Un pequeño delay para que vean el "ESPERE..."
  };

  const simulateGate = async (e, mode) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (hasClicked) return;
    
    setHasClicked(true);
    localStorage.removeItem('luxury_gate');
    
    if (mode === 'none') {
      window.location.href = '/licencia';
      return;
    }

    const seed = "debug-" + Math.random().toString(36).substring(2);
    let timestamp = Date.now();
    const secret = "LUX_GATE_2026_MASTER";

    if (mode === 'fast') timestamp = Date.now() - 2000; // Simular que ya pasaron sólo 2s
    if (mode === 'valid') timestamp = Date.now() - 25000; // Simular que ya pasaron 25s
    if (mode === 'expired') timestamp = Date.now() - 700000; // Simular que ya pasaron 11m

    const signature = await hash(seed + timestamp + secret);
    localStorage.setItem('luxury_gate', JSON.stringify({ seed, timestamp, signature }));
    
    setTimeout(() => {
      window.location.href = '/licencia';
    }, 800);
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
                {hasClicked ? "ESPERE..." : "CLICK PARA ENTRAR"}
              </span>
            </div>
          </motion.div>

          <div className="splash-footer">
            <div className="splash-footer-box">
              <p className="version-text">v1.0.0  |  HIGH FIDELITY SYSTEM</p>
            </div>
          </div>

          {/* SIMULATION PANEL (DEBUG) */}
          <div className="debug-panel" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
             <button onClick={(e) => simulateGate(e, 'none')}>SIN TOKEN</button>
             <button onClick={(e) => simulateGate(e, 'fast')}>FAST (2s)</button>
             <button onClick={(e) => simulateGate(e, 'valid')}>BIEN (25s)</button>
             <button onClick={(e) => simulateGate(e, 'expired')}>EXPIRADO (11m)</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
