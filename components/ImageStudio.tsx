import React, { useState, useEffect } from 'react';
import { generateImage, editImage } from '../services/imageService';
import { generateImageWithSeedream, editImageWithSeedream } from '../services/seedreamService';
import { SparklesIcon, SpinnerIcon } from './icons';
import { preferences } from '../utils/preferences';

type StudioMode = 'generate' | 'edit';
type ImageModel = 'gpt4o' | 'seedream';

// Fix: Export the component to make it accessible to other modules.
export const ImageStudio: React.FC = () => {
    // Load preferences on mount
    useEffect(() => {
        const savedModel = preferences.getPreferredModel();
        const savedAspectRatio = preferences.getDefaultAspectRatio();
        
        setModelType(savedModel);
        setAspectRatio(savedAspectRatio);
    }, []);

    const [mode, setMode] = useState<StudioMode>('generate');
    const [modelType, setModelType] = useState<ImageModel>('gpt4o');
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [sourceImage, setSourceImage] = useState<File | null>(null);
    const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSourceImage(file);
            setSourceImageUrl(URL.createObjectURL(file));
            setResultImage(null);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim() || isLoading) return;
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        try {
            const imageUrl = modelType === 'seedream' 
                ? await generateImageWithSeedream(prompt, aspectRatio)
                : await generateImage(prompt, aspectRatio);
            setResultImage(imageUrl);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async () => {
        if (!prompt.trim() || !sourceImage || isLoading) return;
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        try {
            const imageUrl = modelType === 'seedream'
                ? await editImageWithSeedream(prompt, sourceImage)
                : await editImage(prompt, sourceImage);
            setResultImage(imageUrl);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = () => {
        if (mode === 'generate') handleGenerate();
        else handleEdit();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Mode selector */}
            <div className="flex justify-center">
                <div className="glass-dark rounded-xl p-1 border border-slate-600/30 shadow-glow-cyan">
                    <button 
                        onClick={() => setMode('generate')} 
                        className={`px-6 py-3 w-full rounded-lg transition-all duration-300 ${
                            mode === 'generate' 
                                ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-lg transform scale-105' 
                                : 'text-slate-300 hover:bg-slate-700/50'
                        }`}
                    >
                        <span className="font-medium">Generate</span>
                    </button>
                    <button 
                        onClick={() => setMode('edit')} 
                        className={`px-6 py-3 w-full rounded-lg transition-all duration-300 ${
                            mode === 'edit' 
                                ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-lg transform scale-105' 
                                : 'text-slate-300 hover:bg-slate-700/50'
                        }`}
                    >
                        <span className="font-medium">Edit</span>
                    </button>
                </div>
            </div>
            
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                    <label className="text-sm font-medium text-slate-300">AI Model</label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div 
                        onClick={() => {
                            setModelType('gpt4o');
                            preferences.setPreferredModel('gpt4o');
                        }}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                            modelType === 'gpt4o' 
                                ? 'border-cyan-500/50 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 shadow-lg shadow-cyan-500/20 transform scale-105' 
                                : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600/50 hover:bg-slate-700/30'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                                <span className="text-cyan-400 font-bold text-sm">G</span>
                            </div>
                            <div>
                                <div className="font-medium text-white">4O Image</div>
                                <div className="text-xs text-slate-400 mt-1">Google's vision model</div>
                            </div>
                        </div>
                    </div>
                    <div 
                        onClick={() => {
                            setModelType('seedream');
                            preferences.setPreferredModel('seedream');
                        }}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                            modelType === 'seedream' 
                                ? 'border-cyan-500/50 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 shadow-lg shadow-cyan-500/20 transform scale-105' 
                                : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600/50 hover:bg-slate-700/30'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <span className="text-purple-400 font-bold text-sm">S</span>
                            </div>
                            <div>
                                <div className="font-medium text-white">Seedream 4.0</div>
                                <div className="text-xs text-slate-400 mt-1">ByteDance's advanced model</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Left Side: Inputs */}
                <div className="space-y-4">
                    {mode === 'edit' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Source Image</label>
                            <div className="mt-2 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-slate-700 border-dashed rounded-md h-60 bg-slate-900">
                                {sourceImageUrl ? (
                                    <img src={sourceImageUrl} alt="Source Preview" className="max-h-full rounded-md" />
                                ) : (
                                    <div className="space-y-1 text-center">
                                         <svg className="mx-auto h-12 w-12 text-slate-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        <div className="flex text-sm text-slate-400">
                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-slate-800 rounded-md font-medium text-cyan-400 hover:text-cyan-300 px-1">
                                                <span>Upload a file</span>
                                                <input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <textarea 
    value={prompt} 
    onChange={(e) => setPrompt(e.target.value)} 
    placeholder={mode === 'generate' ? "A majestic lion wearing a crown, photorealistic..." : "Add a vintage film filter..."} 
    className="w-full h-24 p-4 bg-slate-900/50 backdrop-blur-sm border-2 border-slate-700/50 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all resize-none text-slate-200 placeholder-slate-500" 
/>

                    {mode === 'generate' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Aspect Ratio</label>
                            <select value={aspectRatio} onChange={(e) => {
    setAspectRatio(e.target.value);
    preferences.setDefaultAspectRatio(e.target.value);
}} className="w-full p-3 bg-slate-900 border-2 border-slate-700 rounded-lg">
                                <option value="1:1">Square (1:1)</option>
                                <option value="16:9">Landscape (16:9)</option>
                                <option value="9:16">Portrait (9:16)</option>
                                <option value="4:3">Standard (4:3)</option>
                                <option value="3:4">Tall (3:4)</option>
                            </select>
                        </div>
                    )}

                    <button 
                        onClick={handleSubmit} 
                        disabled={isLoading || !prompt.trim() || (mode === 'edit' && !sourceImage)} 
                        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg shadow-cyan-500/30 disabled:shadow-none"
                    >
                        {isLoading ? 
                            <><SpinnerIcon className="w-6 h-6 animate-spin" /> Processing...</> : 
                            <><SparklesIcon className="w-6 h-6" /> {mode === 'generate' ? 'Generate Image' : 'Edit Image'}</>
                        }
                    </button>
                </div>

                {/* Right Side: Output */}
                <div className="flex justify-center items-center h-full min-h-[300px] bg-slate-900 border-2 border-slate-700 border-dashed rounded-lg p-4">
                    {isLoading && <SpinnerIcon className="w-12 h-12 text-cyan-500" />}
                    {error && <div className="text-red-400 text-center">{error}</div>}
                    {resultImage && (
                        <div className="space-y-4">
                             <img src={resultImage} alt="Generated result" className="max-h-[400px] object-contain rounded-md" />
                             <a href={resultImage} download="ai-generated-image.png" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">Download Image</a>
                        </div>
                    )}
                    {!isLoading && !error && !resultImage && <div className="text-slate-500">Your generated image will appear here</div>}
                </div>
            </div>
        </div>
    );
};