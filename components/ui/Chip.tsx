
import React from 'react';

interface ChipProps {
    children: React.ReactNode;
    onRemove: () => void;
}

const Chip: React.FC<ChipProps> = ({ children, onRemove }) => {
    return (
        <div className="flex items-center bg-primary-light text-primary-dark text-sm font-medium px-2.5 py-1 rounded-full">
            <span>{children}</span>
            <button onClick={onRemove} className="ml-2 -mr-1 flex-shrink-0 h-4 w-4 rounded-full inline-flex items-center justify-center text-primary-dark hover:bg-primary-dark/20 focus:outline-none">
                <span className="sr-only">Remove filter</span>
                <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                    <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                </svg>
            </button>
        </div>
    );
};

export default Chip;
