import React, { useState, useEffect, useRef } from 'react';
import { RiPlayLargeFill, RiPauseLargeFill, RiSkipBackLargeFill, RiSkipForwardLargeFill, RiVolumeMuteFill, RiVolumeUpFill, RiTimer2Fill, RiDiscFill } from 'react-icons/ri';
import ElasticSlider from './ElasticSlider';

const AUDIO_URL = "https://r2.guns.lol/731d32ac-a7ba-4060-b459-323660f26afa.mp3";

export default function AudioPlayerContainer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [status, setStatus] = useState("STOPPED");
  const [isDraggingProgress, _setIsDraggingProgress] = useState(false);
  const isDraggingRef = useRef(false);

  const setIsDraggingProgress = (val) => {
    isDraggingRef.current = val;
    _setIsDraggingProgress(val);
  };

  const audioRef = useRef(null);
  const barsRef = useRef([]);

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

  // Inicialización y Autoplay
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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
      }
    };
    const onLoadedMetadata = () => {
      console.log("Metadata cargada:", audio.duration);
      setDuration(audio.duration);
    };
    
    // Si los metadatos ya están cargados por el navegador
    if (audio.readyState >= 1) {
      setDuration(audio.duration);
    }

    const onEnded = () => {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('durationchange', onLoadedMetadata); // Listener extra para seguridad
    audio.addEventListener('ended', onEnded);

    // Lógica de desbloqueo de audio (Interacción inicial)
    const startAudio = () => {
      if (audio.muted) audio.muted = false;
      if (audio.paused) audio.play().catch(() => {});
      ["click", "keydown", "touchstart", "mousedown"].forEach(ev => {
        document.removeEventListener(ev, startAudio);
      });
    };
    ["click", "keydown", "touchstart", "mousedown"].forEach(ev => {
      document.addEventListener(ev, startAudio, { once: true });
    });

    // Intento de autoplay silenciado
    audio.muted = true;
    audio.play().catch(() => {
      console.log("Autoplay bloqueado, esperando interacción.");
    });

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('durationchange', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  // Animación del Visualizador (Zig-Zag)
  useEffect(() => {
    let animationFrame;
    const animate = () => {
      const time = performance.now() / 1000;
      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        let val = 0.1;
        if (isPlaying && audioRef.current && !audioRef.current.paused) {
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
    if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  const skip = () => {
    audioRef.current.currentTime = 0;
  };

  const handleProgressChange = (val) => {
    setCurrentTime(val);
    if (!isDraggingProgress) {
        audioRef.current.currentTime = val;
    }
  };

  const handleVolumeChange = (val) => {
    const v = val / 100;
    setVolume(v);
    audioRef.current.volume = v;
  };

  return (
    <div className={`audio-master-card ${isPlaying ? 'playing' : ''}`}>
      <audio ref={audioRef} src={AUDIO_URL} preload="auto" autoPlay muted />
      
      {/* Top Section */}
      <div className="master-top">
        <div className="master-info-group">
          <div className="master-avatar-circle">
            <img src="https://images.guns.lol/31c0364b9e0a58a873bbe97f0378895eefe318fa/ds0qCk.gif" alt="Art" />
          </div>
          <div className="master-text">
            <span className="now-playing">{status}</span>
            <div className="master-title-wrapper">
              <span className="master-title">SNOWFLAKE.001</span>
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
            <button onClick={skip} className="circle-btn" title="Prev"><RiSkipBackLargeFill /></button>
            <button onClick={togglePlay} className={`circle-btn main-active ${isPlaying ? 'playing' : ''}`} title="Play/Pause">
              {isPlaying ? <RiPauseLargeFill /> : <RiPlayLargeFill />}
            </button>
            <button onClick={skip} className="circle-btn" title="Next"><RiSkipForwardLargeFill /></button>
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
              audioRef.current.currentTime = currentTime;
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
