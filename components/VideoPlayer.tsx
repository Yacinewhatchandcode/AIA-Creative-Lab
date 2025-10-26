import React from 'react';
import { FilmIcon } from './icons';

interface VideoPlayerProps {
  src: string;
  onReset: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, onReset }) => {
  return (
    <div className="space-y-6 flex flex-col items-center">
      <h2 className="font-orbitron text-2xl font-bold text-center text-cyan-400">Your Movie is Ready!</h2>
      <div className="w-full bg-black rounded-lg shadow-2xl shadow-cyan-900/50 overflow-hidden border-2 border-cyan-700">
        <video 
          key={src}
          src={src} 
          controls 
          autoPlay
          className="w-full aspect-[16/9] object-cover"
        >
          Your browser does not support the video tag.
        </video>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <a 
          href={src} 
          download={`AI_Movie_Final.webm`} 
          className="flex-1 text-center bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300"
        >
          Download Final Movie
        </a>
        <button 
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300"
        >
          <FilmIcon className="w-5 h-5"/>
          Create Another Movie
        </button>
      </div>
    </div>
  );
};