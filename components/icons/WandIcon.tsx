import React from 'react';

export const WandIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.66 10.34l-1.32-1.32a2 2 0 00-2.83 0l-1.42 1.42a2 2 0 01-2.83 0l-1.83-1.83a2 2 0 00-2.83 0l-1.42 1.42a2 2 0 01-2.83 0L2.34 7.66a2 2 0 000 2.83l1.32 1.32a2 2 0 002.83 0l1.42-1.42a2 2 0 012.83 0l1.83 1.83a2 2 0 002.83 0l1.42-1.42a2 2 0 012.83 0l1.32 1.32a2 2 0 002.83 0zM5 3v2m14-2v2m-7 14v2m-4-8L5 5m14 14l-4-4" />
    </svg>
);