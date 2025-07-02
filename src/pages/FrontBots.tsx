import React, { useState, useEffect } from 'react';
import { TextInput, Select, Switch, Button } from '@mantine/core';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  mockHistoricalTrades,
  tradingPairs,
  initialParameters,
  Parameters,
} from '../data/frontmockdata';
import RiskWarning from '../components/RiskWarning';
import { Colors } from '../styles/theme';

// TradingForm component
interface TradingFormProps {
  parameters: Parameters;
  setParameters: React.Dispatch<React.SetStateAction<Parameters>>;
  networkStats: {
    currentGasPrice: string | null;
    blockHeight: number | null;
    pendingTransactions: number | null;
  };
  advancedSettingsOpen: boolean;
  setAdvancedSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSimulate: () => void;
  simulationResult: {
    success: boolean;
    message?: string;
    potentialProfit?: string;
    errors?: string[];
  } | null;
}

const TradingForm: React.FC<TradingFormProps> = ({
  parameters,
  setParameters,
  networkStats,
  advancedSettingsOpen,
  setAdvancedSettingsOpen,
  onSimulate,
  simulationResult,
}) => {
  return (
    <div className="rounded-lg bg-white p-6 shadow-xl dark:bg-boxdark">
      <h2 className="mb-4 text-2xl font-bold">MEV Trading Parameters</h2>

      <div className="space-y-4">
        <TextInput
          label="Token Address"
          value={parameters.tokenAddress}
          onChange={(e) => setParameters((prev) => ({ ...prev, tokenAddress: e.target.value }))}
          placeholder="0x..."
          classNames={{
            input: 'bg-white dark:bg-boxdark text-black dark:text-white',
            label: 'text-black dark:text-white',
          }}
          className="w-full"
        />
        <TextInput
          label="Buy Amount"
          value={parameters.buyAmount}
          onChange={(e) => setParameters((prev) => ({ ...prev, buyAmount: e.target.value }))}
          placeholder="0.0"
          type="number"
          classNames={{
            input: 'bg-white dark:bg-boxdark text-black dark:text-white',
            label: 'text-black dark:text-white',
          }}
          className="w-full"
        />
        <TextInput
          label="Max Gas Fee"
          value={parameters.maxGasFee}
          onChange={(e) => setParameters((prev) => ({ ...prev, maxGasFee: e.target.value }))}
          placeholder="0.0"
          type="number"
          classNames={{
            input: 'bg-white dark:bg-boxdark text-black dark:text-white',
            label: 'text-black dark:text-white',
          }}
          className="w-full"
        />
        <Select
          label="Strategy Type"
          value={parameters.strategyType}
          onChange={(value) =>
            setParameters((prev) => ({
              ...prev,
              strategyType: value as Parameters['strategyType'],
            }))
          }
          data={[
            { value: 'aggressive', label: 'Aggressive' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'conservative', label: 'Conservative' },
          ]}
          classNames={{
            input: 'bg-white dark:bg-boxdark text-black dark:text-white',
            label: 'text-black dark:text-white',
          }}
          className="w-full"
        />

        <div
          className="flex cursor-pointer items-center justify-between"
          onClick={() => setAdvancedSettingsOpen(!advancedSettingsOpen)}
        >
          <span className="font-semibold">Advanced Settings</span>
          {advancedSettingsOpen ? <FiChevronUp /> : <FiChevronDown />}
        </div>

        {advancedSettingsOpen && (
          <div className="mt-4 space-y-4">
            <TextInput
              label="Auto Profit Take Percentage"
              value={parameters.autoProfitTakePercentage}
              onChange={(e) =>
                setParameters((prev) => ({ ...prev, autoProfitTakePercentage: e.target.value }))
              }
              placeholder="0.0"
              type="number"
              classNames={{
                input: 'bg-white dark:bg-boxdark text-black dark:text-white',
                label: 'text-black dark:text-white',
              }}
              className="w-full"
            />
            <TextInput
              label="Stop Loss Percentage"
              value={parameters.stopLossPercentage}
              onChange={(e) =>
                setParameters((prev) => ({ ...prev, stopLossPercentage: e.target.value }))
              }
              placeholder="0.0"
              type="number"
              classNames={{
                input: 'bg-white dark:bg-boxdark text-black dark:text-white',
                label: 'text-black dark:text-white',
              }}
              className="w-full"
            />
            <Switch
              label="Enable Backrunning"
              checked={parameters.backrunningEnabled}
              classNames={{
                input: 'bg-white dark:bg-boxdark text-black dark:text-white',
                label: 'text-black dark:text-white',
              }}
              onChange={(e) =>
                setParameters((prev) => ({ ...prev, backrunningEnabled: e.target.checked }))
              }
            />
            <Switch
              label="Enable Sandwich Trading"
              checked={parameters.sandwichTradingEnabled}
              onChange={(e) =>
                setParameters((prev) => ({ ...prev, sandwichTradingEnabled: e.target.checked }))
              }
            />
          </div>
        )}

        <Button
          onClick={onSimulate}
          className="w-full rounded bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
        >
          Simulate Trade
        </Button>

        {simulationResult && (
          <div
            className={`mt-4 rounded p-4 ${simulationResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
          >
            {simulationResult.success ? (
              <>
                <p>{simulationResult.message}</p>
                <p>Potential Profit: {simulationResult.potentialProfit}</p>
              </>
            ) : (
              <ul>
                {simulationResult.errors?.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="mt-6">
        <h3 className="mb-2 text-xl font-semibold">Network Stats</h3>
        <p>Current Gas Price: {networkStats.currentGasPrice} Gwei</p>
        <p>Block Height: {networkStats.blockHeight}</p>
        <p>Pending Transactions: {networkStats.pendingTransactions}</p>
      </div>
    </div>
  );
};

// PerformanceChart component
const PerformanceChart: React.FC<{ data: typeof mockHistoricalTrades }> = ({ data }) => {
  return (
    <div className="rounded-lg bg-white  p-6 shadow-xl dark:bg-boxdark">
      <h2 className="mb-4 text-2xl font-bold">Performance Chart</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="profit" stroke={Colors.ACCENT} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// TradingPairs component
const TradingPairs: React.FC<{ pairs: typeof tradingPairs }> = ({ pairs }) => {
  return (
    <div className="rounded-lg bg-white  p-6 shadow-xl dark:bg-boxdark">
      <h2 className="mb-4 text-2xl font-bold">Trading Pairs</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Pair</th>
              <th className="px-4 py-2 text-left">Volume</th>
              <th className="px-4 py-2 text-left">24h Change</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((pair, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : ''}>
                <td className="px-4 py-2">{pair.name}</td>
                <td className="px-4 py-2">{pair.volume}</td>
                <td
                  className={`px-4 py-2 ${pair.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}
                >
                  {pair.change}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Main Index component
const FrontBots: React.FC = () => {
  const [parameters, setParameters] = useState<Parameters>(initialParameters);
  const [networkStats, setNetworkStats] = useState({
    currentGasPrice: null as string | null,
    blockHeight: null as number | null,
    pendingTransactions: null as number | null,
  });
  const [riskWarning, setRiskWarning] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    success: boolean;
    message?: string;
    potentialProfit?: string;
    errors?: string[];
  } | null>(null);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);

  useEffect(() => {
    const updateNetworkStats = () => {
      setNetworkStats({
        currentGasPrice: (Math.random() * 100).toFixed(2),
        blockHeight: Math.floor(Math.random() * 1000000),
        pendingTransactions: Math.floor(Math.random() * 10000),
      });
    };

    updateNetworkStats();
    const intervalId = setInterval(updateNetworkStats, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const simulateTrade = () => {
    const errors: string[] = [];

    if (!parameters.tokenAddress) errors.push('Token Address is required');
    if (!parameters.buyAmount || parseFloat(parameters.buyAmount) <= 0)
      errors.push('Buy Amount must be positive');
    if (!parameters.maxGasFee || parseFloat(parameters.maxGasFee) <= 0)
      errors.push('Max Gas Fee must be positive');

    if (errors.length > 0) {
      setSimulationResult({
        success: false,
        errors: errors,
      });
    } else {
      const profitCalc =
        (parseFloat(parameters.buyAmount) *
          parseFloat(parameters.autoProfitTakePercentage || '0')) /
        100;
      setSimulationResult({
        success: true,
        message: 'MEV trading parameters validated successfully!',
        potentialProfit: profitCalc.toFixed(4).toString(),
      });
    }
  };

  if (!riskWarning) {
    return <RiskWarning onAccept={() => setRiskWarning(true)} />;
  }

  return (
    <div className="min-h-screen  p-6 text-black dark:text-white">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TradingForm
            parameters={parameters}
            setParameters={setParameters}
            networkStats={networkStats}
            advancedSettingsOpen={advancedSettingsOpen}
            setAdvancedSettingsOpen={setAdvancedSettingsOpen}
            onSimulate={simulateTrade}
            simulationResult={simulationResult}
          />

          <div className="space-y-6">
            <PerformanceChart data={mockHistoricalTrades} />
            <TradingPairs pairs={tradingPairs} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrontBots;
