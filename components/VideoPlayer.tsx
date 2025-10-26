import React from 'react';
import { FilmIcon } from './icons';

interface VideoPlayerProps {
  src: string;
  onReset: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, onReset }) => {
  return (
    <div className="space-y-8 flex flex-col items-center">
      {/* Success message with animation */}
      <div className="text-center relative glass-dark rounded-2xl p-6 border border-green-500/20 shadow-glow-cyan">
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-2xl">✨</span>
          </div>
          <h2 className="font-orbitron text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
            Your Movie is Ready!
          </h2>
        </div>
        <p className="text-slate-300 text-sm">Your cinematic creation has been successfully generated</p>
      </div>
      
      {/* Video player with enhanced styling */}
      <div className="w-full relative group animate-slide-up">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-black rounded-xl shadow-2xl shadow-cyan-900/50 overflow-hidden border border-cyan-500/30">
          <video 
            key={src}
            src={src} 
            controls 
            autoPlay
            className="w-full aspect-[16/9] object-cover"
          >
            Your browser does not support the video tag.
          </video>
          {/* Video overlay decorations */}
          <div className="absolute top-4 left-4 px-3 py-1 bg-cyan-500/20 backdrop-blur-md text-cyan-300 rounded-full text-xs font-medium border border-cyan-500/30">
            HD Quality
          </div>
          <div className="absolute top-4 right-4 px-3 py-1 bg-purple-500/20 backdrop-blur-md text-purple-300 rounded-full text-xs font-medium border border-purple-500/30">
            AI Generated
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md animate-fade-in">
        <a 
          href={src} 
          download={`AI_Movie_Final.webm`} 
          className="flex-1 text-center bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download Final Movie
        </a>
        <button 
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-slate-500/30"
        >
          <FilmIcon className="w-5 h-5"/>
          Create Another Movie
        </button>
      </div>
    </div>
  );
};