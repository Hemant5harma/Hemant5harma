import React from 'react';
import { Button } from '@mantine/core';

interface RiskWarningProps {
  onAccept: () => void;
}

const RiskWarning: React.FC<RiskWarningProps> = ({ onAccept }) => {
  return (
    <div className="fixed inset-0 bg-white dark:bg-boxdark flex items-center justify-center p-4">
      <div className="bg-white dark:bg-boxdark border-2 border-red-600 p-6 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Risk Warning</h2>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          MEV trading involves significant risks and may result in the loss of your funds. 
          Only proceed if you understand and accept these risks.
        </p>
        <Button 
          onClick={onAccept}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          I Understand and Accept the Risks
        </Button>
      </div>
    </div>
  );
};

export default RiskWarning;

