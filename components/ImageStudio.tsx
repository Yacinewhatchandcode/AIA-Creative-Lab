import React, { useState } from 'react';
import { generateImage, editImage } from '../services/imageService';
import { generateImageWithSeedream, editImageWithSeedream } from '../services/seedreamService';
import { SparklesIcon, SpinnerIcon } from './icons';

type StudioMode = 'generate' | 'edit';
type ImageModel = 'gpt4o' | 'seedream';

// Fix: Export the component to make it accessible to other modules.
export const ImageStudio: React.FC = () => {
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
        <div className="space-y-6">
            <div className="flex justify-center p-1 bg-slate-800 border border-slate-700 rounded-lg">
                <button onClick={() => setMode('generate')} className={`px-4 py-2 w-full rounded-md ${mode === 'generate' ? 'bg-cyan-600 text-white' : 'text-slate-300'}`}>Generate</button>
                <button onClick={() => setMode('edit')} className={`px-4 py-2 w-full rounded-md ${mode === 'edit' ? 'bg-cyan-600 text-white' : 'text-slate-300'}`}>Edit</button>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">AI Model</label>
                <div className="grid grid-cols-2 gap-4">
                    <div 
                        onClick={() => setModelType('gpt4o')}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            modelType === 'gpt4o' 
                                ? 'border-cyan-500 bg-slate-800' 
                                : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                        }`}
                    >
                        <div className="font-medium text-white">4O Image</div>
                        <div className="text-xs text-slate-400 mt-1">Google's vision model</div>
                    </div>
                    <div 
                        onClick={() => setModelType('seedream')}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            modelType === 'seedream' 
                                ? 'border-cyan-500 bg-slate-800' 
                                : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                        }`}
                    >
                        <div className="font-medium text-white">Seedream 4.0</div>
                        <div className="text-xs text-slate-400 mt-1">ByteDance's advanced model</div>
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
                    
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={mode === 'generate' ? "A majestic lion wearing a crown, photorealistic..." : "Add a vintage film filter..."} className="w-full h-24 p-4 bg-slate-900 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 transition-all" />

                    {mode === 'generate' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Aspect Ratio</label>
                            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full p-3 bg-slate-900 border-2 border-slate-700 rounded-lg">
                                <option value="1:1">Square (1:1)</option>
                                <option value="16:9">Landscape (16:9)</option>
                                <option value="9:16">Portrait (9:16)</option>
                                <option value="4:3">Standard (4:3)</option>
                                <option value="3:4">Tall (3:4)</option>
                            </select>
                        </div>
                    )}

                    <button onClick={handleSubmit} disabled={isLoading || !prompt.trim() || (mode === 'edit' && !sourceImage)} className="w-full flex items-center justify-center gap-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg transition-all">
                        {isLoading ? <SpinnerIcon className="w-6 h-6" /> : <SparklesIcon className="w-6 h-6" />}
                        {mode === 'generate' ? 'Generate Image' : 'Edit Image'}
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