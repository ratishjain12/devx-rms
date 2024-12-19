import { useEffect, useState } from "react";

/**
 * Custom hook for debouncing a value.
 * @param value The value to debounce.
 * @param delay The debounce delay in milliseconds.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
