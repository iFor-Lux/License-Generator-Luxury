import { animate, motion, useMotionValue } from 'motion/react';
import { useRef, useState, useCallback } from 'react';
import './ElasticSlider.css';

const MAX_OVERFLOW = 50;

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
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(defaultValue);
  const sliderRef = useRef(null);
  const overflow = useMotionValue(0);
  const scale = useMotionValue(1);
  
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : localValue;

  const getPercentage = (val) => {
    const range = maxValue - startingValue;
    if (range === 0) return 0;
    return ((val - startingValue) / range) * 100;
  };

  const updateValue = useCallback((clientX) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    let newValue = startingValue + percentage * (maxValue - startingValue);
    
    if (isStepped) {
      newValue = Math.round(newValue / stepSize) * stepSize;
    }
    
    newValue = Math.max(startingValue, Math.min(maxValue, newValue));
    
    if (!isControlled) {
      setLocalValue(newValue);
    }
    
    if (onChange) {
      onChange(newValue);
    }
  }, [isControlled, startingValue, maxValue, isStepped, stepSize, onChange]);

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    
    if (onDragStart) {
      onDragStart();
    }
    
    updateValue(e.clientX);
    sliderRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    
    updateValue(e.clientX);
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    if (onDragEnd) {
      onDragEnd(currentValue);
    }
    
    animate(overflow, 0, { type: 'spring', bounce: 0.5 });
  };

  const handleMouseLeave = (e) => {
    if (isDragging) {
      handlePointerUp(e);
    }
  };

  return (
    <div className={`slider-container ${className}`}>
      <motion.div
        onHoverStart={() => !isDragging && animate(scale, 1.15, { duration: 0.2 })}
        onHoverEnd={() => !isDragging && animate(scale, 1, { duration: 0.2 })}
        style={{
          scale,
          opacity: 0.8 + scale.get() * 0.2
        }}
        className="slider-wrapper"
      >
        <div className="motion-icon" style={{ minWidth: '20px' }}>
          {leftIcon}
        </div>

        <div
          ref={sliderRef}
          className="slider-root"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handleMouseLeave}
        >
          <motion.div
            style={{
              height: 5 + (scale.get() - 1) * 15,
              scaleX: 1 + overflow.get() / 100,
              scaleY: 1 - (overflow.get() / MAX_OVERFLOW) * 0.2,
            }}
            className="slider-track-wrapper"
          >
            <div className="slider-track">
              <div 
                className={`slider-range ${rangeClassName}`} 
                style={{ width: `${getPercentage(currentValue)}%` }} 
              />
              <div 
                className="slider-thumb"
                style={{ left: `${getPercentage(currentValue)}%` }}
              />
            </div>
          </motion.div>
        </div>

        <div className="motion-icon" style={{ minWidth: '20px' }}>
          {rightIcon}
        </div>
      </motion.div>
    </div>
  );
}
