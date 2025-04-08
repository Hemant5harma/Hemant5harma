import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Text,
  Title,
  Group,
  Flex,
  Badge,
  Avatar,
  Divider,
  Select,
  Slider,
  Button
} from '@mantine/core';
import {
  FaChartLine,
  FaWallet,
  FaCoins,
  FaChartPie
} from 'react-icons/fa';
import { apiClient, pauseBot, resumeBot, deleteBot } from '../utils/apiClient';

export default function BotDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bot, setBot] = useState<any>(null);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [selectedStableCoin, setSelectedStableCoin] = useState('');
  const [positionSize, setPositionSize] = useState(40);

  useEffect(() => {
    apiClient.get(`/bots/${id}`)
      .then((data) => setBot(data))
      .catch((error) => console.error("Error fetching bot:", error));
  }, [id]);

  if (!bot) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Bot not found
      </div>
    );
  }

  const { 
    name, 
    frequency, 
    status, 
    next_execution_time, 
    coins, 
    performance 
  } = bot;

  // Handle pause action
  const handlePause = async () => {
    try {
      await pauseBot(bot.id);
      // Optionally refetch or update local state
      const updatedBot = await apiClient.get(`/bots/${bot.id}`);
      setBot(updatedBot);
    } catch (error) {
      console.error("Error pausing bot:", error);
    }
  };

  // Handle resume action
  const handleResume = async () => {
    try {
      await resumeBot(bot.id);
      // Optionally refetch or update local state
      const updatedBot = await apiClient.get(`/bots/${bot.id}`);
      setBot(updatedBot);
    } catch (error) {
      console.error("Error resuming bot:", error);
    }
  };

  // Handle exit (delete) action
  const handleDelete = async () => {
    try {
      await deleteBot(bot.id);
      navigate('/bots/dca'); // Navigate back to your bots list or another route
    } catch (error) {
      console.error("Error deleting bot:", error);
    }
  };

  return (
    <Container className="max-w-7xl mx-auto py-8 space-y-6">
      {/* Basic Bot Info */}
      <Paper shadow="md" className="bg-white dark:bg-boxdark p-6 shadow-xl rounded-xl">
        <Title
          order={2}
          className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
        >
          {name}
        </Title>
        <Text className="text-gray-600 dark:text-gray-300 mb-2">
          Status: {status.toUpperCase()} | Frequency: {frequency}
        </Text>
        <Text className="text-xs text-gray-600 dark:text-gray-400">
          {next_execution_time
            ? `Next Execution: ${new Date(next_execution_time).toLocaleString()}`
            : "No next execution time"}
        </Text>
      </Paper>

      {/* Performance Metrics */}
      <Paper shadow="md" className="bg-white dark:bg-boxdark p-6 shadow-xl rounded-xl">
        <Flex
          justify="space-between"
          direction={{ base: 'column', sm: 'row' }}
          gap="md"
        >
          {/* 3M Perf */}
          <div className="flex-1 text-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <FaChartLine className="mx-auto mb-2 text-indigo-600" size={20} />
            <Text className="text-gray-600 dark:text-gray-300">3M Perf</Text>
            <Text
              className={`font-bold ${
                performance.three_month_perf >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {performance.three_month_perf >= 0 ? '+' : ''}
              {performance.three_month_perf.toFixed(2)}%
            </Text>
          </div>

          {/* 6M Perf */}
          <div className="flex-1 text-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <FaWallet className="mx-auto mb-2 text-blue-600" size={20} />
            <Text className="text-gray-600 dark:text-gray-300">6M Perf</Text>
            <Text
              className={`font-bold ${
                performance.six_month_perf >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {performance.six_month_perf >= 0 ? '+' : ''}
              {performance.six_month_perf.toFixed(2)}%
            </Text>
          </div>

          {/* Total Perf */}
          <div className="flex-1 text-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <FaCoins className="mx-auto mb-2 text-green-600" size={20} />
            <Text className="text-gray-600 dark:text-gray-300">Total Perf</Text>
            <Text
              className={`font-bold ${
                performance.total_perf >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {performance.total_perf >= 0 ? '+' : ''}
              {performance.total_perf.toFixed(2)}%
            </Text>
          </div>
        </Flex>

        <Divider my="md" />

        <Flex
          justify="space-between"
          direction={{ base: 'column', sm: 'row' }}
          gap="md"
        >
          {/* Total Trades */}
          <div className="flex-1 text-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <Text className="text-gray-600 dark:text-gray-300">Total Trades</Text>
            <Text className="font-bold text-gray-900 dark:text-white">
              {performance.total_trades}
            </Text>
          </div>

          {/* Total Volume */}
          <div className="flex-1 text-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <Text className="text-gray-600 dark:text-gray-300">Total Volume</Text>
            <Text className="font-bold text-gray-900 dark:text-white">
              ${performance.total_volume.toFixed(2)}
            </Text>
          </div>

          {/* APY */}
          <div className="flex-1 text-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <Text className="text-gray-600 dark:text-gray-300">APY</Text>
            <Text className="font-bold text-green-600">
              {performance.apy.toFixed(2)}%
            </Text>
          </div>
        </Flex>
      </Paper>

      {/* Coins Section */}
      <Paper shadow="md" className="bg-white dark:bg-boxdark p-6 shadow-xl rounded-xl">
        <Title
          order={3}
          className="text-xl font-bold text-gray-900 dark:text-white mb-4"
        >
          Coin Allocations
        </Title>
        {coins.length > 0 ? (
          <div className="space-y-3">
            {coins.map((coin: any) => (
              <div 
                key={coin.id} 
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
              >
                <div className="text-sm font-medium">
                  {coin.token_address.toUpperCase()}
                </div>
                <div className="text-right">
                  <Text className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Amount: {coin.amount}
                  </Text>
                  <Text className="text-xs text-gray-600 dark:text-gray-400">
                    Threshold: {coin.threshold}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Text className="text-gray-600 dark:text-gray-400">
            No coin allocations found.
          </Text>
        )}
      </Paper>

      {/* Trading Configuration Section */}
   
      {/* Actions Section */}
      <Paper shadow="md" className="bg-white dark:bg-boxdark p-6 shadow-xl rounded-xl">
        <Title order={3} className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Actions
        </Title>
        <Flex gap="md" wrap="wrap">
          {/* Pause Bot */}
          {status === 'running' && (
            <Button color="yellow" variant="filled" onClick={handlePause}>
              Pause Bot
            </Button>
          )}

          {/* Resume Bot */}
          {status === 'paused' && (
            <Button color="green" variant="filled" onClick={handleResume}>
              Resume Bot
            </Button>
          )}

          {/* Delete Bot */}
          <Button color="red" variant="filled" onClick={handleDelete}>
            Exit Bot
          </Button>
        </Flex>
      </Paper>
    </Container>
  );
}