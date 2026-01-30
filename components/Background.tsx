import React from 'react';

export const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#fffcf5]">
        {/* Animated Sunny Blobs */}
        <div className="absolute top-[-10%] left-[-20%] w-[120%] h-[120%] opacity-40">
            <div className="absolute w-[800px] h-[800px] bg-gradient-to-br from-yellow-200 to-orange-100 blur-[150px] rounded-full animate-blob-1" />
            <div className="absolute w-[600px] h-[600px] bg-gradient-to-tr from-pink-200 to-yellow-100 blur-[150px] rounded-full animate-blob-2" />
            <div className="absolute w-[700px] h-[700px] bg-gradient-to-bl from-orange-200 to-yellow-200 blur-[150px] rounded-full animate-blob-3" />
        </div>
        
        {/* Playful Dots Layer */}
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(#facc15 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(255,255,255,0.3)_100%)]" />
        
        <style>{`
            @keyframes blob-1 {
                0%, 100% { transform: translate(0, 0) scale(1); }
                33% { transform: translate(100px, -50px) scale(1.1); }
                66% { transform: translate(-50px, 100px) scale(0.9); }
            }
            @keyframes blob-2 {
                0%, 100% { transform: translate(0, 0) scale(1); }
                33% { transform: translate(-80px, 100px) scale(1.1); }
                66% { transform: translate(120px, -80px) scale(0.9); }
            }
            @keyframes blob-3 {
                0%, 100% { transform: translate(0, 0) scale(1); }
                33% { transform: translate(50px, 150px) scale(0.8); }
                66% { transform: translate(-150px, -50px) scale(1.1); }
            }
            .animate-blob-1 { animation: blob-1 25s infinite alternate ease-in-out; }
            .animate-blob-2 { animation: blob-2 30s infinite alternate-reverse ease-in-out; }
            .animate-blob-3 { animation: blob-3 20s infinite alternate ease-in-out; }
        `}</style>
    </div>
  );
};
