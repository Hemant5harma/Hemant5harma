import React from 'react';
import { Button } from '@mantine/core';

interface RiskWarningProps {
  onAccept: () => void;
}

const RiskWarning: React.FC<RiskWarningProps> = ({ onAccept }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white p-4 dark:bg-boxdark">
      <div className="w-full max-w-md rounded-lg border-2 border-red-600 bg-white p-6 dark:bg-boxdark">
        <h2 className="mb-4 text-2xl font-bold text-red-600">Risk Warning</h2>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          MEV trading involves significant risks and may result in the loss of your funds. Only
          proceed if you understand and accept these risks.
        </p>
        <Button
          onClick={onAccept}
          className="w-full rounded bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700"
        >
          I Understand and Accept the Risks
        </Button>
      </div>
    </div>
  );
};

export default RiskWarning;
