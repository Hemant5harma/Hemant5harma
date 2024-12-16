import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TextInput } from '@mantine/core';
import { FaSync, FaChartBar, FaExclamationTriangle, FaDollarSign } from 'react-icons/fa';
import { exchanges, initialArbitrageParams, riskChartData, ArbitrageParams, RiskChartData, ArbitrageOpportunity, initialSimulationResults } from '../data/arbmockdata';

interface SimulationResults {
  totalPotentialProfit: number;
  totalRisk: number;
  opportunities: ArbitrageOpportunity[];
}

const ArbitrageDashboard: React.FC = () => {
  const [arbitrageParams, setArbitrageParams] = useState<ArbitrageParams>(initialArbitrageParams);
  const [simulationResults, setSimulationResults] = useState<SimulationResults>(initialSimulationResults);

  const simulateArbitrage = (): void => {
    const opportunities: ArbitrageOpportunity[] = exchanges.flatMap(sourceExchange =>
      exchanges
        .filter(targetExchange => sourceExchange.name !== targetExchange.name)
        .map(targetExchange => {
          const priceDifference = Math.random() * 2; // Simulated price difference
          return {
            sourceExchange: sourceExchange.name,
            targetExchange: targetExchange.name,
            asset: sourceExchange.assets[Math.floor(Math.random() * sourceExchange.assets.length)],
            priceDifference,
            profitPotential: priceDifference > arbitrageParams.minPriceDifference
          };
        })
    );

    const totalPotentialProfit = opportunities.reduce(
      (sum, opp) => sum + (opp.profitPotential ? 1000 : 0),
      0
    );

    setSimulationResults({
      totalPotentialProfit,
      totalRisk: opportunities.length,
      opportunities
    });
  };

  return (
    <div className="container mx-auto p- text-black dark:text-white min-h-screen">
      <div className="bg-white dark:bg-boxdark shadow-md rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h1 className="text-2xl font-bold mb-4 sm:mb-0">Arbitrage Trading Dashboard</h1>
          <button
            onClick={simulateArbitrage}
            className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full sm:w-auto"
          >
            <FaSync className="mr-2" />
            Simulate Opportunities
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Exchanges</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {exchanges.map((exchange, index) => (
                <div key={index} className="bg-gray-100 dark:bg-gray-600 rounded-lg p-4">
                  <div className="flex items-center">
                    <exchange.icon className="text-2xl mr-2" />
                    <div>
                      <h3 className="font-bold">{exchange.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Blockchain: {exchange.blockchain}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Assets: {exchange.assets.join(', ')}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Liquidity Pool: {exchange.liquidityPool}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Arbitrage Parameters</h2>
            <div className="space-y-4">
              <TextInput
                label="Minimum Price Difference (%)"
                type="number"
                value={arbitrageParams.minPriceDifference.toString()}
                onChange={(event) => {
                  const value = event.currentTarget?.value;
                  if (value !== undefined) {
                    setArbitrageParams(prev => ({
                      ...prev,
                      minPriceDifference: parseFloat(value) || 0
                    }));
                  }
                }}
                className="w-full"
              />
              <TextInput
                label="Max Gas Cost ($)"
                type="number"
                value={arbitrageParams.maxGasCost.toString()}
                onChange={(event) => {
                  const value = event.currentTarget?.value;
                  if (value !== undefined) {
                    setArbitrageParams(prev => ({
                      ...prev,
                      maxGasCost: parseFloat(value) || 0
                    }));
                  }
                }}
                className="w-full"
              />
            </div>
          </div>

          <div className="col-span-1 lg:col-span-2">
            <div className="bg-gray-100 dark:bg-gray-600 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <FaExclamationTriangle className="text-yellow-500 mr-2" />
                <h2 className="text-xl font-semibold">Risk Assessment</h2>
              </div>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskChartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="risk" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-2">
            <div className="bg-gray-100 dark:bg-gray-600 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <FaChartBar className="text-green-500 mr-2" />
                <h2 className="text-xl font-semibold">Arbitrage Opportunities</h2>
              </div>
              <div className="flex items-center mb-4">
                <FaDollarSign className="text-green-500 mr-2" />
                <p className="text-lg font-semibold">Total Potential Profit: ${simulationResults.totalPotentialProfit.toFixed(2)}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-700">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-200 text-xs sm:text-sm leading-normal">
                      <th className="py-3 px-2 sm:px-6 text-left">Source</th>
                      <th className="py-3 px-2 sm:px-6 text-left">Target</th>
                      <th className="py-3 px-2 sm:px-6 text-left">Asset</th>
                      <th className="py-3 px-2 sm:px-6 text-left">Diff (%)</th>
                      <th className="py-3 px-2 sm:px-6 text-left">Potential</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 dark:text-gray-200 text-xs sm:text-sm">
                    {simulationResults.opportunities.map((opp, index) => (
                      <tr key={index} className={`border-b border-gray-200 hover:bg-gray-100 ${opp.profitPotential ? 'bg-green-100 dark:bg-green-800' : 'bg-red-100 dark:bg-red-800'}`}>
                        <td className="py-3 px-2 sm:px-6 text-left whitespace-nowrap">{opp.sourceExchange}</td>
                        <td className="py-3 px-2 sm:px-6 text-left whitespace-nowrap">{opp.targetExchange}</td>
                        <td className="py-3 px-2 sm:px-6 text-left">{opp.asset}</td>
                        <td className="py-3 px-2 sm:px-6 text-left">{opp.priceDifference.toFixed(2)}%</td>
                        <td className="py-3 px-2 sm:px-6 text-left">{opp.profitPotential ? 'High' : 'Low'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArbitrageDashboard;

