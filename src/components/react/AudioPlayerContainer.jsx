import React, { useState, useEffect, useRef } from 'react';
import { RiPlayFill, RiPauseFill, RiSkipBackFill, RiSkipForwardFill, RiVolumeMuteFill, RiVolumeUpFill } from 'react-icons/ri';
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
  const [trackIndex, setTrackIndex] = useState(() => Math.floor(Math.random() * PLAYLIST.length));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [status, setStatus] = useState("STOPPED");
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  
  const audioRef = useRef(null);
  const barsRef = useRef([]);
  const animationRef = useRef(null);
  const isFirstSongRef = useRef(true);
  const sequentialIndexRef = useRef(0);
  const isChangingTrackRef = useRef(false);
  const shouldAutoPlayRef = useRef(false);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      if (!isChangingTrackRef.current) {
        setIsPlaying(true);
        setStatus("NOW PLAYING");
      }
    };

    const handlePause = () => {
      if (!isChangingTrackRef.current) {
        setIsPlaying(false);
        setStatus("PAUSED");
      }
    };

    const handleEnded = () => {
      const wasPlaying = shouldAutoPlayRef.current;
      
      isChangingTrackRef.current = true;
      
      let nextIdx;
      if (isFirstSongRef.current) {
        nextIdx = 0;
        isFirstSongRef.current = false;
        sequentialIndexRef.current = 0;
      } else {
        nextIdx = (sequentialIndexRef.current + 1) % PLAYLIST.length;
        sequentialIndexRef.current = nextIdx;
      }

      const nextTrack = PLAYLIST[nextIdx];
      
      audio.src = nextTrack.url;
      audio.load();
      setTrackIndex(nextIdx);
      setCurrentTime(0);
      shouldAutoPlayRef.current = false;
      
      if (wasPlaying) {
        const playWhenReady = () => {
          audio.play().then(() => {
            isChangingTrackRef.current = false;
            setIsPlaying(true);
            setStatus("NOW PLAYING");
            shouldAutoPlayRef.current = true;
          }).catch((e) => {
            isChangingTrackRef.current = false;
            setIsPlaying(false);
            setStatus("STOPPED");
          });
        };

        if (audio.readyState >= 3) {
          playWhenReady();
        } else {
          audio.addEventListener('canplay', function onCanPlay() {
            audio.removeEventListener('canplay', onCanPlay);
            playWhenReady();
          });
        }
      } else {
        isChangingTrackRef.current = false;
        setIsPlaying(false);
        setStatus("PAUSED");
      }
    };

    const handleTimeUpdate = () => {
      if (!isDraggingProgress) {
        setCurrentTime(audio.currentTime);
        
        if (!isChangingTrackRef.current && audio.duration > 0 && !audio.paused) {
          if (audio.duration - audio.currentTime < 6) {
            shouldAutoPlayRef.current = true;
          }
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [isDraggingProgress]);

  useEffect(() => {
    const unlock = () => {
      const audio = audioRef.current;
      if (!audio) return;

      audio.muted = false;
      audio.volume = volume;

      audio.play().then(() => {
        setIsPlaying(true);
        setStatus("NOW PLAYING");
        shouldAutoPlayRef.current = true;
      }).catch(() => {});

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
    };
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      barsRef.current.forEach(bar => {
        if (bar) {
          bar.style.transform = 'scaleY(0.1)';
          bar.style.opacity = '0.4';
        }
      });
      return;
    }

    const animate = () => {
      const time = performance.now() / 1000;
      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        const wave = Math.sin(time * 12 + (3 - i) * 1.2);
        const val = Math.abs(wave) * 0.8 + 0.2;
        bar.style.transform = `scaleY(${val})`;
        bar.style.opacity = String(0.3 + val * 0.7);
        bar.style.filter = val > 0.85 ? "brightness(1.2) drop-shadow(0 0 4px rgba(255,255,255,0.5))" : "none";
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  const handleNext = () => {
    const audio = audioRef.current;
    if (!audio || isChangingTrackRef.current) return;

    isChangingTrackRef.current = true;
    const wasPlaying = shouldAutoPlayRef.current;

    let nextIdx;
    if (isFirstSongRef.current) {
      nextIdx = 0;
      isFirstSongRef.current = false;
      sequentialIndexRef.current = 0;
    } else {
      nextIdx = (sequentialIndexRef.current + 1) % PLAYLIST.length;
      sequentialIndexRef.current = nextIdx;
    }

    const nextTrack = PLAYLIST[nextIdx];
    
    audio.pause();
    audio.src = nextTrack.url;
    audio.load();
    setTrackIndex(nextIdx);
    setCurrentTime(0);

    if (wasPlaying) {
      const playWhenReady = () => {
        audio.play().then(() => {
          isChangingTrackRef.current = false;
          setIsPlaying(true);
          setStatus("NOW PLAYING");
          shouldAutoPlayRef.current = true;
        }).catch((e) => {
          isChangingTrackRef.current = false;
          setIsPlaying(false);
          setStatus("STOPPED");
        });
      };

      if (audio.readyState >= 3) {
        playWhenReady();
      } else {
        audio.addEventListener('canplay', function onCanPlay() {
          audio.removeEventListener('canplay', onCanPlay);
          playWhenReady();
        });
      }
    } else {
      isChangingTrackRef.current = false;
      setIsPlaying(false);
      setStatus("PAUSED");
    }
  };

  const handlePrev = () => {
    const audio = audioRef.current;
    if (!audio || isChangingTrackRef.current) return;

    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    isChangingTrackRef.current = true;
    const wasPlaying = shouldAutoPlayRef.current;

    let prevIdx;
    if (isFirstSongRef.current) {
      prevIdx = 0;
    } else {
      prevIdx = sequentialIndexRef.current === 0 ? PLAYLIST.length - 1 : sequentialIndexRef.current - 1;
    }

    audio.pause();
    audio.src = PLAYLIST[prevIdx].url;
    audio.load();
    setTrackIndex(prevIdx);
    setCurrentTime(0);

    if (wasPlaying) {
      const playWhenReady = () => {
        audio.play().then(() => {
          isChangingTrackRef.current = false;
          setIsPlaying(true);
          setStatus("NOW PLAYING");
          shouldAutoPlayRef.current = true;
        }).catch(() => {
          isChangingTrackRef.current = false;
          setIsPlaying(false);
          setStatus("STOPPED");
        });
      };

      if (audio.readyState >= 3) {
        playWhenReady();
      } else {
        audio.addEventListener('canplay', function onCanPlay() {
          audio.removeEventListener('canplay', onCanPlay);
          playWhenReady();
        });
      }
    } else {
      isChangingTrackRef.current = false;
      setIsPlaying(false);
      setStatus("PAUSED");
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || isChangingTrackRef.current) return;

    if (audio.paused) {
      audio.play().then(() => {
        setIsPlaying(true);
        setStatus("NOW PLAYING");
        shouldAutoPlayRef.current = true;
      }).catch(() => {});
    } else {
      audio.pause();
      setIsPlaying(false);
      setStatus("PAUSED");
      shouldAutoPlayRef.current = false;
    }
  };

  const handleProgressChange = (val) => {
    setCurrentTime(val);
    const audio = audioRef.current;
    if (audio && !isDraggingProgress) {
      audio.currentTime = val;
    }
  };

  const handleDragStart = () => setIsDraggingProgress(true);

  const handleDragEnd = (val) => {
    setIsDraggingProgress(false);
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (val) => {
    setVolume(val / 100);
  };

  return (
    <div className={`audio-master-card ${isPlaying ? 'playing' : ''}`}>
      <audio 
        ref={audioRef} 
        src={PLAYLIST[trackIndex].url} 
        preload="auto" 
      />
      
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
            <button 
              onClick={handlePrev} 
              className="circle-btn" 
              title="Previous"
            >
              <RiSkipBackFill />
            </button>
            <button 
              onClick={togglePlay} 
              className={`circle-btn main-active ${isPlaying ? 'playing' : ''}`} 
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <RiPauseFill /> : <RiPlayFill />}
            </button>
            <button 
              onClick={handleNext} 
              className="circle-btn" 
              title="Next"
            >
              <RiSkipForwardFill />
            </button>
          </div>
        </div>
      </div>

      <div className="master-bottom">
        <div className="progress-section">
          <ElasticSlider 
            value={currentTime}
            maxValue={duration || 100}
            onChange={handleProgressChange}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
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
