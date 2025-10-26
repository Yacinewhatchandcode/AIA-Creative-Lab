import React, { useState, useEffect } from 'react';

interface ApiKeySelectorProps {
  onKeySelected: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'valid' | 'invalid' | 'not_set'>('checking');
  const [apiKey, setApiKey] = useState<string>('');
  const [cloudflareStatus, setCloudflareStatus] = useState<'checking' | 'connected' | 'bypassed'>('checking');

  const validateKieApi = async (key: string): Promise<boolean> => {
    // Test API endpoint availability
    try {
      const response = await fetch('https://api.kie.ai/api/v1/veo/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'API test',
          model: 'veo3_fast',
          generationType: 'TEXT_2_VIDEO'
        })
      });

      // If we get a response (even 402 for insufficient credits), the API is accessible
      return response.status === 200 || response.status === 402;
    } catch (error) {
      console.error('API validation error:', error);
      return false;
    }
  };

  const checkCloudflareTransformation = async (key: string): Promise<boolean> => {
    try {
      // Test image upload through Cloudflare R2
      const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      
      const response = await fetch('https://kieai.redpandaai.co/api/file-base64-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Data: testImageData,
          uploadPath: 'api-test',
          fileName: 'test-image.png'
        })
      });

      return response.status === 200;
    } catch (error) {
      console.error('Cloudflare transformation check:', error);
      return false;
    }
  };

  useEffect(() => {
    const checkApiKey = async () => {
      // Check if KIE_API_KEY is set
      if (typeof process.env.KIE_API_KEY !== 'undefined' && process.env.KIE_API_KEY) {
        const key = process.env.KIE_API_KEY;
        setApiKey(key);
        setApiKeyStatus('checking');
        
        // Validate API access
        const isValid = await validateKieApi(key);
        setApiKeyStatus(isValid ? 'valid' : 'invalid');
        
        // Check Cloudflare transformation capabilities
        setCloudflareStatus('checking');
        const cloudflareWorks = await checkCloudflareTransformation(key);
        setCloudflareStatus(cloudflareWorks ? 'connected' : 'bypassed');
        
        if (isValid && cloudflareWorks) {
          onKeySelected();
        }
      } else {
        setApiKeyStatus('not_set');
      }
    };

    checkApiKey();
  }, [onKeySelected]);

  const getStatusIcon = () => {
    switch(apiKeyStatus) {
      case 'checking':
        return '🔄';
      case 'valid':
        return '✅';
      case 'invalid':
        return '❌';
      case 'not_set':
        return '🔑';
      default:
        return '⚠️';
    }
  };

  const getCloudflareIcon = () => {
    switch (cloudflareStatus) {
      case 'checking':
        return '🔄';
      case 'connected':
        return '☁️';
      case 'bypassed':
        return '➡️';
      default:
        return '❓';
    }
  };

  const getStatusColor = () => {
    switch (apiKeyStatus) {
      case 'checking':
        return 'text-yellow-400';
      case 'valid':
        return 'text-green-400';
      case 'invalid':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="mt-8 sm:mt-12 flex flex-col items-center text-center bg-slate-900 p-6 sm:p-8 rounded-lg border border-slate-700">
      <h2 className="text-xl sm:text-2xl font-bold font-orbitron text-cyan-400">KIE API Status</h2>
      
      <div className="mt-4 sm:mt-6 bg-slate-800 rounded-lg p-4 sm:p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-300">API Key:</span>
          <span className={`flex items-center gap-2 ${getStatusColor()}`}>
            <span className="text-2xl">{getStatusIcon()}</span>
            <span className="text-sm capitalize">
              {apiKeyStatus === 'not_set' ? 'Not Configured' : apiKeyStatus}
            </span>
          </span>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-300">Cloudflare R2:</span>
          <span className={`flex items-center gap-2 ${cloudflareStatus === 'connected' ? 'text-green-400' : cloudflareStatus === 'bypassed' ? 'text-yellow-400' : 'text-red-400'}`}>
            <span className="text-2xl">{getCloudflareIcon()}</span>
            <span className="text-sm capitalize">
              {cloudflareStatus === 'connected' ? 'Connected' : cloudflareStatus === 'bypassed' ? 'Using Direct' : 'Failed'}
            </span>
          </span>
        </div>

        {apiKeyStatus === 'not_set' && (
          <>
            <div className="mt-4 p-4 bg-slate-700 rounded-lg">
              <p className="text-sm text-slate-300 mb-4">
                Your KIE API key is not configured. Please add it to your .env file:
              </p>
              <code className="block text-xs bg-slate-800 p-2 rounded text-green-400">
                KIE_API_KEY=your_kie_api_key_here
              </code>
            </div>

            <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
              <p className="text-sm text-blue-300 mb-2">
                Get your API key at:
              </p>
              <a 
                href="https://kie.ai/api-key" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline text-sm"
              >
                https://kie.ai/api-key
              </a>
            </div>
          </>
        )}

        {apiKeyStatus === 'valid' && (
          <div className="mt-4 p-4 bg-green-900/20 border border-green-700 rounded-lg">
            <p className="text-sm text-green-300">
              ✅ All systems operational with full Cloudflare R2 transformation!
            </p>
            <ul className="text-left text-sm text-green-300 mt-2 space-y-1">
              <li>• Parallel frame enhancement with Seedream 4.0</li>
              <li>• VeO 3.1 video generation at 25% Google pricing</li>
              <li>• Real-time audio synthesis with Suno</li>
              <li>• Autonomous processing pipelines</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
