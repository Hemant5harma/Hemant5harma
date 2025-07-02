import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TextInput } from '@mantine/core';
import { FaSync, FaChartBar, FaExclamationTriangle, FaDollarSign } from 'react-icons/fa';
import {
  exchanges,
  initialArbitrageParams,
  riskChartData,
  ArbitrageParams,
  ArbitrageOpportunity,
  initialSimulationResults,
} from '../data/arbmockdata';
import { Colors } from '../styles/theme';

interface SimulationResults {
  totalPotentialProfit: number;
  totalRisk: number;
  opportunities: ArbitrageOpportunity[];
}

const ArbitrageDashboard: React.FC = () => {
  const [arbitrageParams, setArbitrageParams] = useState<ArbitrageParams>(initialArbitrageParams);
  const [simulationResults, setSimulationResults] =
    useState<SimulationResults>(initialSimulationResults);

  const simulateArbitrage = (): void => {
    const opportunities: ArbitrageOpportunity[] = exchanges.flatMap((sourceExchange) =>
      exchanges
        .filter((targetExchange) => sourceExchange.name !== targetExchange.name)
        .map((targetExchange) => {
          const priceDifference = Math.random() * 2; // Simulated price difference
          return {
            sourceExchange: sourceExchange.name,
            targetExchange: targetExchange.name,
            asset: sourceExchange.assets[Math.floor(Math.random() * sourceExchange.assets.length)],
            priceDifference,
            profitPotential: priceDifference > arbitrageParams.minPriceDifference,
          };
        }),
    );

    const totalPotentialProfit = opportunities.reduce(
      (sum, opp) => sum + (opp.profitPotential ? 1000 : 0),
      0,
    );

    setSimulationResults({
      totalPotentialProfit,
      totalRisk: opportunities.length,
      opportunities,
    });
  };

  return (
    <div className="p- container mx-auto min-h-screen text-black dark:text-white">
      <div className="rounded-lg bg-white p-4 shadow-md dark:bg-boxdark sm:p-6">
        <div className="mb-6 flex flex-col items-center justify-between sm:flex-row">
          <h1 className="mb-4 text-2xl font-bold sm:mb-0">Arbitrage Trading Dashboard</h1>
          <button
            onClick={simulateArbitrage}
            className="flex w-full items-center rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600 sm:w-auto"
          >
            <FaSync className="mr-2" />
            Simulate Opportunities
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-xl font-semibold">Exchanges</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {exchanges.map((exchange, index) => (
                <div key={index} className="rounded-lg bg-white p-4 shadow-lg dark:bg-boxdark">
                  <div className="flex items-center">
                    <exchange.icon className="mr-2 text-2xl" />
                    <div>
                      <h3 className="font-bold">{exchange.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Blockchain: {exchange.blockchain}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Assets: {exchange.assets.join(', ')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Liquidity Pool: {exchange.liquidityPool}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">Arbitrage Parameters</h2>
            <div className="space-y-4">
              <TextInput
                label="Minimum Price Difference (%)"
                type="number"
                value={arbitrageParams.minPriceDifference.toString()}
                onChange={(event) => {
                  const value = event.currentTarget?.value;
                  if (value !== undefined) {
                    setArbitrageParams((prev) => ({
                      ...prev,
                      minPriceDifference: parseFloat(value) || 0,
                    }));
                  }
                }}
                classNames={{
                  input: 'bg-white dark:bg-boxdark text-black dark:text-white',
                  label: 'text-black dark:text-white',
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
                    setArbitrageParams((prev) => ({
                      ...prev,
                      maxGasCost: parseFloat(value) || 0,
                    }));
                  }
                }}
                classNames={{
                  input: 'bg-white dark:bg-boxdark text-black dark:text-white',
                  label: 'text-black dark:text-white',
                }}
                className="w-full"
              />
            </div>
          </div>

          <div className="col-span-1 lg:col-span-2">
            <div className="rounded-lg bg-white p-4 shadow-lg dark:bg-boxdark">
              <div className="mb-4 flex items-center">
                <FaExclamationTriangle className="mr-2 text-yellow-500" />
                <h2 className="text-xl font-semibold">Risk Assessment</h2>
              </div>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskChartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="risk" fill={Colors.ACCENT} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-2">
            <div className="rounded-lg bg-white p-4 shadow-xl dark:bg-boxdark">
              <div className="mb-4 flex items-center">
                <FaChartBar className="mr-2 text-green-500" />
                <h2 className="text-xl font-semibold">Arbitrage Opportunities</h2>
              </div>
              <div className="mb-4 flex items-center">
                <FaDollarSign className="mr-2 text-green-500" />
                <p className="text-lg font-semibold">
                  Total Potential Profit: ${simulationResults.totalPotentialProfit.toFixed(2)}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-700">
                  <thead>
                    <tr className="bg-gray-200 text-xs leading-normal text-gray-600 dark:bg-gray-600 dark:text-gray-200 sm:text-sm">
                      <th className="px-2 py-3 text-left sm:px-6">Source</th>
                      <th className="px-2 py-3 text-left sm:px-6">Target</th>
                      <th className="px-2 py-3 text-left sm:px-6">Asset</th>
                      <th className="px-2 py-3 text-left sm:px-6">Diff (%)</th>
                      <th className="px-2 py-3 text-left sm:px-6">Potential</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-gray-600 dark:text-gray-200 sm:text-sm">
                    {simulationResults.opportunities.map((opp, index) => (
                      <tr
                        key={index}
                        className={`border-b border-gray-200 hover:bg-gray-100 ${opp.profitPotential ? 'bg-green-100 dark:bg-green-800' : 'bg-red-100 dark:bg-red-800'}`}
                      >
                        <td className="whitespace-nowrap px-2 py-3 text-left sm:px-6">
                          {opp.sourceExchange}
                        </td>
                        <td className="whitespace-nowrap px-2 py-3 text-left sm:px-6">
                          {opp.targetExchange}
                        </td>
                        <td className="px-2 py-3 text-left sm:px-6">{opp.asset}</td>
                        <td className="px-2 py-3 text-left sm:px-6">
                          {opp.priceDifference.toFixed(2)}%
                        </td>
                        <td className="px-2 py-3 text-left sm:px-6">
                          {opp.profitPotential ? 'High' : 'Low'}
                        </td>
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
