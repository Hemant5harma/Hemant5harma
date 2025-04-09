import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Text,
  Title,
  Flex,
  Divider,
  Button,
  Modal,
  Group,
  Loader
} from '@mantine/core';
import {
  FaChartLine,
  FaWallet,
  FaCoins,
} from 'react-icons/fa';
import { apiClient, pauseBot, resumeBot, deleteBot } from '../utils/apiClient';

export default function BotDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bot, setBot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Action loading states
  const [pauseLoading, setPauseLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Modal states
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiClient.get(`/bots/${id}`)
      .then((data) => {
        setBot(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching bot:", error);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        <Loader size="xl" />
        <span className="ml-3">Loading bot details...</span>
      </div>
    );
  }

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
  } = bot;
  
  // Safely access performance data with fallback to empty object
  const performance = bot.performance || {
    total_trades: 0,
    total_volume: 0,
    apy: 0,
    three_month_perf: 0,
    six_month_perf: 0,
    total_perf: 0
  };

  // Handle pause action with confirmation
  const handlePause = async () => {
    setPauseLoading(true);
    try {
      await pauseBot(bot.id);
      // Optionally refetch or update local state
      const updatedBot = await apiClient.get(`/bots/${bot.id}`);
      setBot(updatedBot);
    } catch (error) {
      console.error("Error pausing bot:", error);
    } finally {
      setPauseLoading(false);
      setPauseModalOpen(false);
    }
  };

  // Handle resume action
  const handleResume = async () => {
    setResumeLoading(true);
    try {
      await resumeBot(bot.id);
      // Optionally refetch or update local state
      const updatedBot = await apiClient.get(`/bots/${bot.id}`);
      setBot(updatedBot);
    } catch (error) {
      console.error("Error resuming bot:", error);
    } finally {
      setResumeLoading(false);
    }
  };

  // Handle exit (delete) action with confirmation
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteBot(bot.id);
      navigate('/bots/dca'); // Navigate back to your bots list or another route
    } catch (error) {
      console.error("Error deleting bot:", error);
      setDeleteLoading(false);
      setDeleteModalOpen(false);
    }
  };

  return (
    <Container className="max-w-7xl mx-auto py-8 space-y-6">
      {/* Pause Confirmation Modal */}
      <Modal
        opened={pauseModalOpen}
        onClose={() => setPauseModalOpen(false)}
        title="Confirm Pause"
        centered
      >
        <Text className="mb-4">
          Are you sure you want to pause this bot? It will stop executing trades until resumed.
        </Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={() => setPauseModalOpen(false)}>
            Cancel
          </Button>
          <Button color="yellow" onClick={handlePause} loading={pauseLoading}>
            Pause
          </Button>
        </Group>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Exit"
        centered
      >
        <Text className="mb-4">
          Are you sure you want to exit (delete) this bot? This action cannot be undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDelete} loading={deleteLoading}>
            Exit
          </Button>
        </Group>
      </Modal>

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
        {coins && coins.length > 0 ? (
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

      {/* Actions Section */}
      <Paper shadow="md" className="bg-white dark:bg-boxdark p-6 shadow-xl rounded-xl">
        <Title order={3} className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Actions
        </Title>
        <Flex gap="md" wrap="wrap">
          {/* Pause Bot */}
          {status === 'running' && (
            <Button 
              color="yellow" 
              variant="filled" 
              onClick={() => setPauseModalOpen(true)}
              loading={pauseLoading}
            >
              Pause Bot
            </Button>
          )}

          {/* Resume Bot */}
          {status === 'paused' && (
            <Button 
              color="green" 
              variant="filled" 
              onClick={handleResume}
              loading={resumeLoading}
            >
              Resume Bot
            </Button>
          )}

          {/* Delete Bot */}
          <Button 
            color="red" 
            variant="filled" 
            onClick={() => setDeleteModalOpen(true)}
            loading={deleteLoading}
          >
            Exit Bot
          </Button>
        </Flex>
      </Paper>
    </Container>
  );
}