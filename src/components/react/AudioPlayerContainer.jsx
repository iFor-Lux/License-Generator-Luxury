import React, { useState, useEffect, useRef } from 'react';
import { RiPlayFill, RiPauseFill, RiSkipBackFill, RiSkipForwardFill, RiVolumeMuteFill, RiVolumeUpFill, RiTimer2Fill, RiDiscFill, RiShuffleFill } from 'react-icons/ri';
import ElasticSlider from './ElasticSlider';

const PLAYLIST = [
  {
    title: "SNOWFLAKE.001",
    url: "https://r2.guns.lol/731d32ac-a7ba-4060-b459-323660f26afa.mp3"
  },
  {
    title: "SPINNIN",
    url: "https://r2.guns.lol/9971dbad-4cae-4454-86b9-24fe32bd3492.mp3"
  }
];

export default function AudioPlayerContainer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [status, setStatus] = useState("STOPPED");
  const [trackIndex, setTrackIndex] = useState(() => Math.floor(Math.random() * PLAYLIST.length));
  const [isDraggingProgress, _setIsDraggingProgress] = useState(false);
  const isDraggingRef = useRef(false);

  const setIsDraggingProgress = (val) => {
    isDraggingRef.current = val;
    _setIsDraggingProgress(val);
  };

  const audio1Ref = useRef(null);
  const audio2Ref = useRef(null);
  const [activePlayer, setActivePlayer] = useState(1); // 1 o 2
  const [src1, setSrc1] = useState(() => PLAYLIST[trackIndex].url);
  const [src2, setSrc2] = useState("");
  const barsRef = useRef([]);

  const getActiveAudio = () => activePlayer === 1 ? audio1Ref.current : audio2Ref.current;
  const getInactiveAudio = () => activePlayer === 1 ? audio2Ref.current : audio1Ref.current;

  // Formatear Segundos a MM:SS
  const formatTime = (seconds) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Elegir track inicial aleatorio eliminado (ahora se hace en el useState inicial)

  // 1. DESBLOQUEO DE AUDIO (Solución Definitiva para Móvil)
  useEffect(() => {
    const unlock = () => {
      const a1 = audio1Ref.current;
      const a2 = audio2Ref.current;

      if (a1) {
        a1.muted = false;
        a1.volume = volume;
        a1.play().then(() => {
            setIsPlaying(true);
            setStatus("NOW PLAYING");
        }).catch(err => console.log("Unlock A1 failed:", err));
      }
      
      if (a2) {
        a2.muted = false;
        a2.volume = 0;
        // Priming A2 con un source válido
        if (!a2.src || a2.src === window.location.href) {
            a2.src = PLAYLIST[(trackIndex + 1) % PLAYLIST.length].url;
        }
        a2.play().then(() => a2.pause()).catch(() => {});
      }

      ["click", "touchstart", "touchend"].forEach(ev => {
        document.removeEventListener(ev, unlock);
      });
      delete window.luxuryUnlock;
    };

    window.luxuryUnlock = unlock;
    return () => {
        ["click", "touchstart", "touchend"].forEach(ev => {
            document.removeEventListener(ev, unlock);
        });
        delete window.luxuryUnlock;
    }
  }, [trackIndex, volume]); // Dependencias para asegurar refs frescas

  // 2. Lógica Principal (Events y Updates)
  useEffect(() => {
    const audio = getActiveAudio();
    if (!audio) return;

    // Sincronizar volumen actual al empezar (si no estamos en crossfade)
    audio.volume = volume;

    const onPlay = () => {
      setIsPlaying(true);
      setStatus("NOW PLAYING");
    };
    const onPause = () => {
      setIsPlaying(false);
      setStatus("PAUSED");
    };
    const onTimeUpdate = () => {
      if (!isDraggingRef.current && audio) {
        setCurrentTime(audio.currentTime);
        
        // PRECARGA: Si faltan 6 segundos, preparar el siguiente en el otro reproductor
        if (audio.duration - audio.currentTime < 6 && audio.duration > 0) {
            prepareNextTrack();
        }
      }
    };
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    
    if (audio.readyState >= 1) {
      setDuration(audio.duration);
    }

    const onEnded = () => {
      handleTransition();
    };

    const onError = (e) => {
        console.error("Audio Error:", e);
        // Fallback: saltar si hay error
        setTimeout(handleTransition, 1000);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('durationchange', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('durationchange', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [trackIndex, activePlayer]);

  // Función para preparar la siguiente canción en el reproductor inactivo (Sigue la cola)
  const prepareNextTrack = () => {
    const nextIndex = (trackIndex + 1) % PLAYLIST.length;
    if (activePlayer === 1) {
        if (src2 !== PLAYLIST[nextIndex].url) setSrc2(PLAYLIST[nextIndex].url);
    } else {
        if (src1 !== PLAYLIST[nextIndex].url) setSrc1(PLAYLIST[nextIndex].url);
    }
  };

  const isTransitioning = useRef(false);

  const handleTransition = () => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    const oldAudio = getActiveAudio();
    const newAudio = getInactiveAudio();
    
    // Al entrar es aleatorio, pero las siguientes siguen la cola secuencial
    const nextIdx = (trackIndex + 1) % PLAYLIST.length;
    const nextSrc = PLAYLIST[nextIdx].url;

    // Asignar el nuevo track al reproductor inactivo
    if (activePlayer === 1) {
        setSrc2(nextSrc);
    } else {
        setSrc1(nextSrc);
    }

    // Esperar a que el nuevo audio esté listo y reproducir
    setTimeout(() => {
        newAudio.volume = 0;
        newAudio.play().then(() => {
            // Fade In
            let vol = 0;
            const fadeIn = setInterval(() => {
                vol += 0.05;
                if (vol >= volume) {
                    newAudio.volume = volume;
                    clearInterval(fadeIn);
                } else {
                    newAudio.volume = vol;
                }
            }, 150);
        }).catch(() => {
            // Fallback: Si falla el play (ej. móvil bloqueado), saltar directo
            newAudio.volume = volume;
            newAudio.play().catch(() => {});
        });

        // Fade Out viejo
        let oldVol = oldAudio.volume;
        const fadeOut = setInterval(() => {
            oldVol -= 0.05;
            if (oldVol <= 0) {
                oldAudio.volume = 0;
                oldAudio.pause();
                oldAudio.currentTime = 0;
                clearInterval(fadeOut);
                isTransitioning.current = false;
            } else {
                oldAudio.volume = oldVol;
            }
        }, 150);

        setTrackIndex(nextIdx);
        setActivePlayer(activePlayer === 1 ? 2 : 1);
    }, 100);
  };

  // Animación del Visualizador (Zig-Zag)
  useEffect(() => {
    let animationFrame;
    const animate = () => {
      const time = performance.now() / 1000;
      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        let val = 0.1;
        if (isPlaying && getActiveAudio() && !getActiveAudio().paused) {
          const wave = Math.sin(time * 12 + (3 - i) * 1.2);
          val = Math.abs(wave) * 0.8 + 0.2;
        }
        bar.style.transform = `scaleY(${val})`;
        bar.style.opacity = (0.3 + val * 0.7).toString();
        bar.style.filter = val > 0.85 ? "brightness(1.2) drop-shadow(0 0 4px rgba(255,255,255,0.5))" : "none";
      });
      animationFrame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying]);

  const togglePlay = () => {
    const audio = getActiveAudio();
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  };

  const skipNext = () => {
    handleTransition();
  };

  const skipPrev = () => {
    // Para simplificar el crossfade hacia atras, solo reiniciamos pista o implementamos logic similar
    // De momento, hagamos el swap igual
    handleTransition(); 
  };

  const handleProgressChange = (val) => {
    setCurrentTime(val);
    if (!isDraggingProgress) {
        getActiveAudio().currentTime = val;
    }
  };

  const handleVolumeChange = (val) => {
    const v = val / 100;
    setVolume(v);
    getActiveAudio().volume = v;
  };

  return (
    <div className={`audio-master-card ${isPlaying ? 'playing' : ''}`}>
      <audio ref={audio1Ref} src={src1} preload="auto" muted />
      <audio ref={audio2Ref} src={src2} preload="auto" muted />
      
      
      {/* Top Section */}
      <div className="master-top">
        <div className="master-info-group">
          <div className="master-avatar-circle">
            <img src="https://images.guns.lol/31c0364b9e0a58a873bbe97f0378895eefe318fa/ds0qCk.gif" alt="Art" />
          </div>
          <div className="master-text">
            <span className="now-playing">{status}</span>
            <div className="master-title-wrapper">
              <span className="master-title">{PLAYLIST[trackIndex].title}</span>
            </div>
          </div>
        </div>

        <div className="master-controls-group">
          <div className="visualizer-bars">
            {[0, 1, 2, 3].map(i => (
              <div key={i} ref={el => barsRef.current[i] = el} className="bar"></div>
            ))}
          </div>
          <div className="circle-controls">
            <button onClick={skipPrev} className="circle-btn" title="Prev"><RiSkipBackFill /></button>
            <button onClick={togglePlay} className={`circle-btn main-active ${isPlaying ? 'playing' : ''}`} title="Play/Pause">
              {isPlaying ? <RiPauseFill /> : <RiPlayFill />}
            </button>
            <button onClick={skipNext} className="circle-btn" title="Next"><RiSkipForwardFill /></button>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="master-bottom">
        <div className="progress-section">
          <ElasticSlider 
            value={currentTime}
            maxValue={duration || 100}
            onChange={handleProgressChange}
            onDragStart={() => setIsDraggingProgress(true)}
            onDragEnd={() => {
              setIsDraggingProgress(false);
              getActiveAudio().currentTime = currentTime;
            }}
          />
          <div className="time-labels-bottom">
            <span className="time-label">{formatTime(currentTime)}</span>
            <span className="time-label">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="volume-section">
          <ElasticSlider 
            value={volume * 100}
            maxValue={100}
            onChange={handleVolumeChange}
            leftIcon={<RiVolumeMuteFill style={{fontSize: '0.8rem'}} />}
            rightIcon={<RiVolumeUpFill style={{fontSize: '0.8rem'}} />}
            rangeClassName="white"
            className="volume-slider-compact"
          />
        </div>
      </div>
    </div>
  );
}
