import React from 'react';
import { cn } from '../lib/cn';

export interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-label="Tennisillo"
    >
      <circle cx="16" cy="16" r="15" fill="#B9FF5A" fillOpacity="0.12" stroke="#B9FF5A" strokeWidth="1.5" />
      <path
        d="M9 6C9 6 13 11.5 13 16C13 20.5 9 26 9 26"
        stroke="#B9FF5A"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M23 6C23 6 19 11.5 19 16C19 20.5 23 26 23 26"
        stroke="#B9FF5A"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
