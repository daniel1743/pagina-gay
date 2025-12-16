import React, { useState, useEffect, useRef } from 'react';

const AnimatedNumber = ({ value, duration = 2000, format = true }) => {
  const [displayValue, setDisplayValue] = useState(value ?? 0);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    let startTime = null;
    const startValue = displayValue;
    const endValue = value ?? 0;
    const difference = endValue - startValue;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(startValue + difference * easeOut);

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <span>{format ? displayValue.toLocaleString() : displayValue}</span>;
};

export default AnimatedNumber;
