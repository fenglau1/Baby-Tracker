import React from 'react';

interface Button3DProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'white';
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const Button3D: React.FC<Button3DProps> = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  fullWidth = false,
  ...props 
}) => {
  const baseStyles = "relative font-bold uppercase tracking-wide transition-all active:translate-y-1 active:shadow-none border-2 rounded-2xl select-none flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-yellow-400 border-yellow-600 text-yellow-900 shadow-[0_4px_0_rgb(202,138,4)] hover:bg-yellow-300",
    secondary: "bg-orange-400 border-orange-600 text-white shadow-[0_4px_0_rgb(194,65,12)] hover:bg-orange-300",
    accent: "bg-cyan-400 border-cyan-600 text-cyan-900 shadow-[0_4px_0_rgb(8,145,178)] hover:bg-cyan-300",
    danger: "bg-pink-400 border-pink-600 text-white shadow-[0_4px_0_rgb(219,39,119)] hover:bg-pink-300",
    white: "bg-white border-slate-200 text-slate-600 shadow-[0_4px_0_rgb(203,213,225)] hover:bg-slate-50"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
