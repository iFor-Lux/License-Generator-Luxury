import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import './ElasticSlider.css';

const MAX_OVERFLOW = 50;

/**
 * ElasticSlider adaptado para el Luxury Audio Player
 * Elimina la dependencia de Chakra UI e integra callbacks para el reproductor.
 */
export default function ElasticSlider({
  value: controlledValue,
  defaultValue = 0,
  startingValue = 0,
  maxValue = 100,
  className = '',
  isStepped = false,
  stepSize = 1,
  leftIcon = null,
  rightIcon = null,
  onChange = null,
  onDragStart = null,
  onDragEnd = null,
  rangeClassName = ''
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const sliderRef = useRef(null);
  const [region, setRegion] = useState('middle');
  const clientX = useMotionValue(0);
  const overflow = useMotionValue(0);
  const scale = useMotionValue(1);

  // Sincronizar con valor controlado desde el padre (ej. currentTime)
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  const currentValue = controlledValue !== undefined ? controlledValue : internalValue;

  useMotionValueEvent(clientX, 'change', (latest) => {
    if (sliderRef.current) {
      const { left, right } = sliderRef.current.getBoundingClientRect();
      let newValue;

      if (latest < left) {
        setRegion('left');
        newValue = left - latest;
      } else if (latest > right) {
        setRegion('right');
        newValue = latest - right;
      } else {
        setRegion('middle');
        newValue = 0;
      }

      overflow.jump(decay(newValue, MAX_OVERFLOW));
    }
  });

  const handlePointerMove = (e) => {
    if (e.buttons > 0 && sliderRef.current) {
      const { left, width } = sliderRef.current.getBoundingClientRect();
      let newValue = startingValue + ((e.clientX - left) / width) * (maxValue - startingValue);

      if (isStepped) {
        newValue = Math.round(newValue / stepSize) * stepSize;
      }

      newValue = Math.min(Math.max(newValue, startingValue), maxValue);
      
      setInternalValue(newValue);
      
      if (onChange) {
        onChange(newValue);
      }
      
      clientX.jump(e.clientX);
    }
  };

  const handlePointerDown = (e) => {
    if (onDragStart) onDragStart();
    handlePointerMove(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = () => {
    if (onDragEnd) onDragEnd();
    animate(overflow, 0, { type: 'spring', bounce: 0.5 });
  };

  const getRangePercentage = () => {
    const totalRange = maxValue - startingValue;
    if (totalRange === 0) return 0;
    return ((currentValue - startingValue) / totalRange) * 100;
  };

  return (
    <div className={`slider-container ${className}`}>
      <motion.div
        onHoverStart={() => animate(scale, 1.15)}
        onHoverEnd={() => animate(scale, 1)}
        onTouchStart={() => animate(scale, 1.15)}
        onTouchEnd={() => animate(scale, 1)}
        style={{
          scale,
          opacity: useTransform(scale, [1, 1.15], [0.8, 1])
        }}
        className="slider-wrapper"
      >
        <motion.div
          className="motion-icon"
          animate={{
            scale: region === 'left' ? [1, 1.3, 1] : 1,
            transition: { duration: 0.25 }
          }}
          style={{
            x: useTransform(() => (region === 'left' ? -overflow.get() / scale.get() : 0))
          }}
        >
          {leftIcon}
        </motion.div>

        <div
          ref={sliderRef}
          className="slider-root"
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <motion.div
            style={{
              scaleX: useTransform(() => {
                if (sliderRef.current) {
                  const { width } = sliderRef.current.getBoundingClientRect();
                  return 1 + overflow.get() / width;
                }
                return 1;
              }),
              scaleY: useTransform(overflow, [0, MAX_OVERFLOW], [1, 0.8]),
              transformOrigin: useTransform(() => {
                if (sliderRef.current) {
                  const { left, width } = sliderRef.current.getBoundingClientRect();
                  return clientX.get() < left + width / 2 ? 'right' : 'left';
                }
                return 'center';
              }),
              height: useTransform(scale, [1, 1.15], [5, 8]), // Grosor aumentado: 5px base, 8px hover
            }}
            className="slider-track-wrapper"
          >
            <div className="slider-track">
              <div 
                className={`slider-range ${rangeClassName}`} 
                style={{ width: `${getRangePercentage()}%` }} 
              />
              {/* Nuevo Thumb indicador */}
              <div 
                className="slider-thumb"
                style={{ left: `${getRangePercentage()}%` }}
              />
            </div>
          </motion.div>
        </div>

        <motion.div
          className="motion-icon"
          animate={{
            scale: region === 'right' ? [1, 1.3, 1] : 1,
            transition: { duration: 0.25 }
          }}
          style={{
            x: useTransform(() => (region === 'right' ? overflow.get() / scale.get() : 0))
          }}
        >
          {rightIcon}
        </motion.div>
      </motion.div>
    </div>
  );
}

function decay(value, max) {
  if (max === 0) return 0;
  const entry = value / max;
  const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);
  return sigmoid * max;
}
