import React from 'react';
import { SparklesIcon } from './icons';

interface PromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  onGenerate: () => void;
  isLoading: boolean;
  numChunks: number;
  setNumChunks: (num: number) => void;
  isAutoMode: boolean;
  setIsAutoMode: (isAuto: boolean) => void;
}

export const PromptInput: React.FC<PromptInputProps> = ({ prompt, setPrompt, file, setFile, onGenerate, isLoading, numChunks, setNumChunks, isAutoMode, setIsAutoMode }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleNumChunksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
        setNumChunks(Math.max(1, Math.min(10, value)));
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your story here... A lone astronaut discovers a mysterious signal from an uncharted moon..."
          className="md:col-span-2 w-full h-40 p-4 bg-slate-900 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-slate-200 resize-none"
          disabled={isLoading}
        />
        <div className="space-y-3">
            <div>
                <div className="flex items-center justify-between">
                    <label htmlFor="num-chunks" className="block text-sm font-medium text-slate-300">
                        Number of Scenes
                    </label>
                    <div className="flex items-center">
                        <input
                            id="auto-mode"
                            name="auto-mode"
                            type="checkbox"
                            checked={isAutoMode}
                            onChange={(e) => setIsAutoMode(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-600"
                            disabled={isLoading}
                        />
                        <label htmlFor="auto-mode" className="ml-2 block text-sm text-slate-300">
                            Auto
                        </label>
                    </div>
                </div>
                <input
                    type="number"
                    id="num-chunks"
                    name="num-chunks"
                    value={numChunks}
                    onChange={handleNumChunksChange}
                    min="1"
                    max="10"
                    className="mt-1 w-full p-4 bg-slate-900 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all disabled:bg-slate-800 disabled:cursor-not-allowed"
                    disabled={isLoading || isAutoMode}
                />
            </div>
             <p className="text-xs text-slate-500">Let the AI decide the number of scenes, or set it manually (1-10).</p>
        </div>
      </div>


      <div>
        <label htmlFor="file-upload" className="block text-sm font-medium text-slate-300 mb-2">
          Inspirational Image (Optional)
        </label>
        <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-700 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex text-sm text-slate-400">
              <label htmlFor="file-upload" className="relative cursor-pointer bg-slate-800 rounded-md font-medium text-cyan-400 hover:text-cyan-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-slate-900 focus-within:ring-cyan-500 px-1">
                <span>Upload a file</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" disabled={isLoading} />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-slate-500">The uploaded image will be used as the starting frame for the movie.</p>
          </div>
        </div>

        {file && (
           <div className="mt-4">
            <div className="relative group w-32">
                <img src={URL.createObjectURL(file)} alt="preview" className="h-24 w-full object-cover rounded-md" />
                <button
                  onClick={removeFile}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove file"
                  disabled={isLoading}
                >
                  &times;
                </button>
              </div>
          </div>
        )}
      </div>

      <div className="text-center">
        <button
          onClick={onGenerate}
          disabled={isLoading || !prompt.trim()}
          className="w-full flex items-center justify-center gap-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg shadow-cyan-900/50 disabled:shadow-none"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Cinematic Universe...
            </>
          ) : (
            <>
              <SparklesIcon className="w-6 h-6" />
              Generate Movie
            </>
          )}
        </button>
        <p className="text-xs text-slate-500 mt-3">
          Note: Video generation is a premium feature. Costs are incurred based on the total duration of the final movie.
        </p>
      </div>
    </div>
  );
};