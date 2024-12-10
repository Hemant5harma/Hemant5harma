import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { bots, Bot } from '../data/botmockdata';
import {
  Container,
  Paper,
  Stack,
  Avatar,
  Title,
  Text,
  Group,
  Badge,
  Divider,
  Select,
  Box,
  Slider,
  Button,
} from '@mantine/core';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function BotDetails() {
  const { id } = useParams<{ id: string }>();
  const [selectedTimeframe, setSelectedTimeframe] = useState('Daily');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [selectedStableCoin, setSelectedStableCoin] = useState('');
  const [positionSize, setPositionSize] = useState(40);

  const bot = bots.find(b => b.id === id);

  if (!bot) {
    return <div className="text-center text-2xl mt-8">Bot not found</div>;
  }

  return (
    <Container fluid className="rounded-2xl bg-white dark:bg-boxdark shadow-xl p-6">
      <Stack>
        {/* Bot Details Card */}
        <Paper className="rounded-2xl bg-white dark:bg-boxdark p-6" radius="lg">
          <Stack align="center" gap="md">
            <Avatar size={64} radius="xl" src={bot.icon} />
            <div className="text-center">
              <Title order={2} className="text-black dark:text-white">{bot.name}</Title>
              <Text size="sm" className="text-gray-600 dark:text-gray-400">{bot.type}</Text>
            </div>

            <Group gap="xs" wrap="wrap" justify="center">
              {[...bot.tradingTypes, ...bot.pairs].map((tag) => (
                <Badge key={tag} className="bg-indigo-600 text-white">
                  {tag}
                </Badge>
              ))}
            </Group>

            <Text size="sm" className="text-gray-600 dark:text-gray-400 text-center">
              {bot.description}
            </Text>

            <Group grow className="w-full">
              <div>
                <Text className="text-gray-600 dark:text-gray-400">Trade/month:</Text>
                <Text className="text-black dark:text-white font-bold">{bot.tradesPerMonth}</Text>
              </div>
              <div>
                <Text className="text-gray-600 dark:text-gray-400">MDD:</Text>
                <Text className="text-black dark:text-white font-bold">{bot.mdd}%</Text>
              </div>
            </Group>

            <Group grow className="w-full">
              <div>
                <Text className="text-gray-600 dark:text-gray-400">Perf fees:</Text>
                <Text className="text-black dark:text-white font-bold">{bot.fees}%</Text>
              </div>
              <div>
                <Text className="text-gray-600 dark:text-gray-400">My fees:</Text>
                <Text className="text-black dark:text-white font-bold">{bot.myFees}%</Text>
              </div>
            </Group>

            <Divider className="my-4 w-full" />

            <Text className="text-black dark:text-white font-medium">Performance</Text>
            <Group justify="space-around" className="w-full">
              <div className="text-center">
                <Text className="text-cyan-400 font-bold text-xl">
                  {bot.threeMonthPerf >= 0 ? '+' : ''}{bot.threeMonthPerf}%
                </Text>
                <Text size="xs" className="text-gray-600 dark:text-gray-400">Perf 3M</Text>
              </div>
              <div className="text-center">
                <Text className="text-cyan-400 font-bold text-xl">
                  {bot.sixMonthPerf >= 0 ? '+' : ''}{bot.sixMonthPerf}%
                </Text>
                <Text size="xs" className="text-gray-600 dark:text-gray-400">Perf 6M</Text>
              </div>
              <div className="text-center">
                <Text className="text-cyan-400 font-bold text-xl">
                  {bot.totalPerf >= 0 ? '+' : ''}{bot.totalPerf}%
                </Text>
                <Text size="xs" className="text-gray-600 dark:text-gray-400">Perf Total</Text>
              </div>
            </Group>
          </Stack>
        </Paper>

        {/* Wallet and Position Size Card */}
        <Paper className="bg-white dark:bg-boxdark p-6 rounded-lg">
          <Group grow align="flex-start">
            {/* Wallet Section */}
            <Stack gap="xs">
              <Group gap="xs">
                <Box className="bg-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-white">
                  1
                </Box>
                <Text className="font-medium text-black dark:text-white">
                  Select your Wallet
                </Text>
              </Group>
              <Select
                label="Account"
                placeholder="Select your wallet"
                data={['Wallet 1', 'Wallet 2']}
                value={selectedWallet}
                // onChange={setSelectedWallet}
                className="mb-4"
              />
              <Select
                label="Stable Coin"
                placeholder="Select option"
                data={['USDT', 'USDC', 'DAI']}
                value={selectedStableCoin}
                // onChange={setSelectedStableCoin}
              />
            </Stack>

            {/* Position Size Section */}
            <Stack gap="xs">
              <Group gap="xs">
                <Box className="bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-white">
                  2
                </Box>
                <Text className="font-medium text-black dark:text-white">
                  Position Size
                </Text>
              </Group>
              <Text size="sm" className="text-gray-600 dark:text-gray-400">
                Order Size
              </Text>
              <Select 
                placeholder="% available" 
                data={['25%', '50%', '75%', '100%']}
                value={`${positionSize}%`}
                onChange={(value) => setPositionSize(parseInt(value || '0'))}
              />
              <Group grow>
                <Text size="sm" className="text-gray-600 dark:text-gray-400">0%</Text>
                <Text size="sm" className="text-gray-600 dark:text-gray-400 text-right">100%</Text>
              </Group>
              <Slider
                color="cyan"
                value={positionSize}
                onChange={setPositionSize}
                marks={[
                  { value: 0, label: '0' },
                  { value: 100, label: '100' },
                ]}
              />
            </Stack>
          </Group>
        </Paper>

        {/* Bot History Card */}
        <Paper className="bg-white dark:bg-boxdark p-6 rounded-lg">
          <Group justify="space-between" className="mb-4">
            <Text className="font-medium text-black dark:text-white">
              Bot History
            </Text>
            <Select 
              value={selectedTimeframe}
              onChange={(value) => setSelectedTimeframe(value || 'Daily')}
              data={['Daily', 'Weekly', 'Monthly']}
              className="bg-white dark:bg-boxdark"
            />
          </Group>
          <Box className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={bot.chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Action Buttons */}
        {/* <Group className="mt-6" gap="md">
          <Button variant="outline" color="cyan">
            Add Token
          </Button>
          <Button
            variant="gradient"
            gradient={{ from: '#5c6ac4', to: '#4cd9ac', deg: 90 }}
          >
            Add an API key
          </Button>
        </Group> */}
      </Stack>
    </Container>
  );
}

