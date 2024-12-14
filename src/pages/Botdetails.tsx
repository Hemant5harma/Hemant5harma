import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
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
  Slider
} from '@mantine/core';
import {
  FaChartLine,
  FaWallet,
  FaCoins,
  FaChartPie
} from 'react-icons/fa';
import { bots } from '../data/botmockdata';

export default function BotDetails() {
  const { id } = useParams();
  const [selectedWallet, setSelectedWallet] = useState('');
  const [selectedStableCoin, setSelectedStableCoin] = useState('');
  const [positionSize, setPositionSize] = useState(40);

  const bot = bots.find(b => b.id === id);

  if (!bot) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Bot not found
      </div>
    );
  }

  return (
    <Container className="max-w-7xl mx-auto py-8 space-y-6">
      {/* // upper section basic details of bot */}
      <Paper
        shadow="md"
        className="bg-white dark:bg-boxdark p-6  shadow-xl -xl"
      >
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          align="center"
          gap="md"
          className="w-full"
        >
          <Avatar
            src={bot.icon}
            alt={bot.name}
            size={96}
            radius="xl"
            className="shrink-0"
          />

          <div className="text-center space-y-2 sm:text-left w-full">
            <Title
              order={2}
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              {bot.name}
            </Title>
            <Text className="text-gray-600 dark:text-gray-300 mb-2">
              {bot.type}
            </Text>

            <Group justify="center sm:justify-start" wrap="wrap" gap="xs">
              {[...bot.tradingTypes, ...bot.pairs].map((tag) => (
                <Badge
                  key={tag}
                  variant="light"
                  color="indigo"
                >
                  {tag}
                </Badge>
              ))}
            </Group>
            <Text className="text-center text-gray-600 dark:text-gray-300">
              {bot.description}
            </Text>
          </div>
        </Flex>



        <Divider my="md" />

        {/* Performance Metrics */}
        <Flex
          justify="space-between"
          direction={{ base: 'column', sm: 'row' }}
          gap="md"
        >
          <div className="flex-1 text-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <FaChartLine className="mx-auto mb-2 text-indigo-600" size={24} />
            <Text className="text-gray-600 dark:text-gray-300">3M Perf</Text>
            <Text
              className={`
                font-bold 
                ${bot.threeMonthPerf >= 0 ? 'text-green-600' : 'text-red-600'}
              `}
            >
              {bot.threeMonthPerf >= 0 ? '+' : ''}{bot.threeMonthPerf}%
            </Text>
          </div>

          <div className="flex-1 text-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <FaWallet className="mx-auto mb-2 text-blue-600" size={24} />
            <Text className="text-gray-600 dark:text-gray-300">6M Perf</Text>
            <Text
              className={`
                font-bold 
                ${bot.sixMonthPerf >= 0 ? 'text-green-600' : 'text-red-600'}
              `}
            >
              {bot.sixMonthPerf >= 0 ? '+' : ''}{bot.sixMonthPerf}%
            </Text>
          </div>

          <div className="flex-1 text-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <FaCoins className="mx-auto mb-2 text-green-600" size={24} />
            <Text className="text-gray-600 dark:text-gray-300">Total Perf</Text>
            <Text
              className={`
                font-bold 
                ${bot.totalPerf >= 0 ? 'text-green-600' : 'text-red-600'}
              `}
            >
              {bot.totalPerf >= 0 ? '+' : ''}{bot.totalPerf}%
            </Text>
          </div>
        </Flex>

        <Divider my="md" />



        <Flex
          justify="space-between"
          direction={{ base: 'column', sm: 'row' }}
          gap="md"
        >
          <div className="flex-1 text-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <FaChartLine className="mx-auto mb-2 text-indigo-600" size={24} />
            <Text className="text-gray-600 dark:text-gray-300">Trades/Month</Text>
            <Text className="font-bold text-gray-900 dark:text-white">
              {bot.tradesPerMonth}
            </Text>
          </div>

          <div className="flex-1 text-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <FaChartPie className="mx-auto mb-2 text-red-600" size={24} />
            <Text className="text-gray-600 dark:text-gray-300">MDD</Text>
            <Text className="font-bold text-gray-900 dark:text-white">
              {bot.mdd}%
            </Text>
          </div>

          <div className="flex-1 text-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <FaCoins className="mx-auto mb-2 text-green-600" size={24} />
            <Text className="text-gray-600 dark:text-gray-300">Perf Fees</Text>
            <Text className="font-bold text-gray-900 dark:text-white">
              {bot.fees}%
            </Text>
          </div>
        </Flex>
      </Paper>

      {/* Additional Bot Details */}



      {/* Trading Configuration Section */}
      <Paper
        shadow="md"
        className="bg-white dark:bg-boxdark p-6 shadow-xl rounded-xl"
      >
        <Title
          order={3}
          className="text-xl font-bold text-gray-900 dark:text-white mb-6"
        >
          Trading Configuration
        </Title>

        <Flex
          direction={{ base: 'column', sm: 'row' }}
          gap="md"
          className="w-full"
        >
          {/* Wallet Selection */}
          <div className="flex-1 space-y-4">
            <Group gap="xs">
              <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                1
              </div>
              <Text className="font-medium text-gray-900 dark:text-white">
                Select Wallet
              </Text>
            </Group>

            <Select
              label="Account"
              placeholder="Select wallet"
              data={['Wallet 1', 'Wallet 2', 'Wallet 3']}
              value={selectedWallet}
              onChange={(value) => setSelectedWallet(value || '')}
              className="w-full"
            />

            <Select
              label="Stable Coin"
              placeholder="Select stable coin"
              data={['USDT', 'USDC', 'DAI']}
              value={selectedStableCoin}
              onChange={(value) => setSelectedStableCoin(value || '')}
              className="w-full"
            />
          </div>

          {/* Position Size */}
          <div className="flex-1 space-y-4">
            <Group gap="xs">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white">
                2
              </div>
              <Text className="font-medium text-gray-900 dark:text-white">
                Position Size
              </Text>
            </Group>

            <Select
              label="Order Size"
              placeholder="% available"
              data={['25%', '50%', '75%', '100%']}
              value={`${positionSize}%`}
              onChange={(value) => setPositionSize(parseInt(value || '40'))}
              className="w-full"
            />

            <div className="space-y-2">
              <Slider
                value={positionSize}
                onChange={setPositionSize}
                min={0}
                max={100}
                step={1}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 50, label: '50%' },
                  { value: 100, label: '100%' }
                ]}
                color="indigo"
              />
            </div>
          </div>
        </Flex>
      </Paper>

      {/* Bot History Section  */}
      <Paper
        shadow="md"
        className="bg-white dark:bg-boxdark p-6 rounded-xl"
      >
        {/* ... Bot History content ... */}
        <Paper
          shadow="md"
          className="bg-white dark:bg-boxdark p-6 rounded-lg"
        >
          <Title
            order={3}
            className="text-xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Bot History
          </Title>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
              {bot.history && bot.history.map((entry, index) => (
                <tr 
                  key={index} 
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <td className="p-3 text-sm text-gray-900 dark:text-white">
                    {entry.date}
                  </td>
                  <td className="p-3 text-sm text-gray-900 dark:text-white">
                    {entry.performance}
                  </td>
                  <td className="p-3 text-sm text-gray-900 dark:text-white">
                    {entry.trades}
                  </td>
                  {/* <td className="p-3">
                    <span 
                      className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        ${entry.status === 'Completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'}
                      `}
                    >
                      {entry.status}
                    </span>
                  </td> */}
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </Paper>
      </Paper>
    </Container>
  );
}