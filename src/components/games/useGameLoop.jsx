import { useEffect, useRef, useState } from 'react';

export const useCountdown = (initialSeconds, isRunning, onEnd) => {
  const [time, setTime] = useState(initialSeconds);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  useEffect(() => {
    if (!isRunning) return;
    if (time <= 0) {
      onEndRef.current?.();
      return;
    }
    const id = setTimeout(() => setTime(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [time, isRunning]);

  const reset = (s = initialSeconds) => setTime(s);
  return [time, reset];
};

export const useAnimationFrame = (callback, isRunning) => {
  const requestRef = useRef();
  const previousTimeRef = useRef();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!isRunning) return;
    const animate = (time) => {
      if (previousTimeRef.current !== undefined) {
        const delta = time - previousTimeRef.current;
        callbackRef.current(delta);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(requestRef.current);
      previousTimeRef.current = undefined;
    };
  }, [isRunning]);
};