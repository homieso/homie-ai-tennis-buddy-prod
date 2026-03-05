'use client';

import Image from 'next/image';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Homie 正在赶来...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="relative w-32 h-32 animate-slow-float">
        <Image
          src="/images/homie/homie-run.png"
          alt="Loading"
          fill
          className="object-contain"
          priority
        />
      </div>
      <div className="w-48 h-2 mt-4 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 rounded-full animate-progress"></div>
      </div>
      <p className="mt-2 text-slate-600">{message}</p>
      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 100%; }
          100% { width: 0%; }
        }
        .animate-progress {
          animation: progress 5s ease-in-out infinite;
        }
        @keyframes slowFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-slow-float {
          animation: slowFloat 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;