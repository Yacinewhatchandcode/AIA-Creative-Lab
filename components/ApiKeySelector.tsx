import React from 'react';

interface ApiKeySelectorProps {
  onKeySelected: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
  
  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        onKeySelected();
      } catch (e) {
        console.error("Error opening API key selection:", e);
      }
    } else {
      alert("API key selection is not available in this environment. Please ensure your API_KEY is set in the environment variables.");
    }
  };

  return (
    <div className="mt-12 flex flex-col items-center text-center bg-slate-900 p-8 rounded-lg border border-slate-700">
      <h2 className="text-2xl font-bold font-orbitron text-cyan-400">Google API Key Required</h2>
      <p className="mt-4 text-slate-300 max-w-md">
        To use the AI Movie Generator with Google's Veo model, you need to select a Google API key. This will be used for all story planning and video generation requests.
      </p>
      <p className="mt-2 text-sm text-slate-400">
        For more information, please see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">billing documentation</a>.
      </p>
      <button
        onClick={handleSelectKey}
        className="mt-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-900/50"
      >
        Select Your API Key
      </button>
    </div>
  );
};
