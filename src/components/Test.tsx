
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
} from '@mantine/core'

const mockChartData = [
  { date: '2023-01-14', value: 100 },
  { date: '2023-03-27', value: 150 },
  { date: '2023-05-27', value: 200 },
  { date: '2023-07-15', value: 300 },
  { date: '2023-10-01', value: 400 },
  { date: '2023-12-07', value: 600 },
  { date: '2024-02-05', value: 800 },
  { date: '2024-03-22', value: 1000 },
  { date: '2024-05-27', value: 1200 },
  { date: '2024-07-25', value: 1400 },
]

export default function Test() {
  return (
    <Container fluid className="rounded-2xl bg-white dark:bg-boxdark shadow-xl p-6">
      <Stack >
        {/* Bot Details Card */}
        <Paper className="rounded-2xl bg-white dark:bg-boxdark p-6" radius="lg">
          <Stack align="center" gap="md">
            <Avatar size={64} radius="xl" src="/placeholder.svg" />
            <div className="text-center">
              <Title order={2} className='text-black dark:text-white'>HEX - BNB</Title>
              <Text size="sm" c="dimmed">Robot Nik</Text>
            </div>

            <Group gap="xs" wrap="wrap" justify="center">
              {['BNBUSDT', 'LONG_SHORT', 'Binance', 'KuCoin', 'Huobi', 'KuCoin-future', 'Binance-future'].map((tag) => (
                <Badge key={tag} variant="filled" className="bg-[#3d4a61]">
                  {tag}
                </Badge>
              ))}
            </Group>

            <Text size="sm" c="dimmed" ta="center">
              This is a trend based algo we trade with no take profit (uncapped upside) and a trailing SL (tightly managed downside risk).
            </Text>

            <Group grow w="100%">
              <div>
                <Text c="dimmed">Trade/month:</Text>
                <Text className='text-black dark:text-white' fw={700}>29</Text>
              </div>
              <div>
                <Text c="dimmed">MDD:</Text>
                <Text className='text-black dark:text-white' fw={700}>-41.11</Text>
              </div>
            </Group>

            <Group grow w="100%">
              <div>
                <Text c="dimmed">Perf fees:</Text>
                <Text className='text-black dark:text-white' fw={700}>7.0%</Text>
              </div>
              <div>
                <Text c="dimmed">My fees:</Text>
                <Text className='text-black dark:text-white' fw={700}>20%</Text>
              </div>
            </Group>

            <Divider my="sm" w="100%" />

            <Text fw={500} className='text-black dark:text-white'>Performance</Text>
            <Group justify="space-around" w="100%">
              <div className="text-center">
                <Text className="text-[#4cc9f0]" fw={700} size="xl">+95.96%</Text>
                <Text size="xs" c="dimmed">Perf 3M</Text>
              </div>
              <div className="text-center">
                <Text className="text-[#4cc9f0]" fw={700} size="xl">+140.09%</Text>
                <Text size="xs" c="dimmed">Perf 6M</Text>
              </div>
              <div className="text-center">
                <Text className="text-[#4cc9f0]" fw={700} size="xl">+1,394.97%</Text>
                <Text size="xs" c="dimmed">Perf Total</Text>
              </div>
            </Group>
          </Stack>
        </Paper>

        {/* Wallet and Position Size Card */}
        <Paper className="bg-white dark:bg-boxdark p-6" radius="lg">
          <Group grow align="flex-start">
            {/* Wallet Section */}
            <Stack gap="xs">
              <Group gap="xs">
                <Box className="bg-[#5c6ac4] w-6 h-6 rounded-full flex items-center justify-center text-white">
                  1
                </Box>
                <Text fw={500} c="white">
                  Select your Wallet
                </Text>
              </Group>
              <Select
                label="Account"
                placeholder="Select your wallet"
                data={['Wallet 1', 'Wallet 2']}
                className="mb-4"
              />
              <Select
                label="Stable Coin"
                placeholder="Select option"
                data={['USDT', 'USDC', 'DAI']}
              />
            </Stack>

            {/* Position Size Section */}
            <Stack gap="xs">
              <Group gap="xs">
                <Box className="bg-[#4361ee] w-6 h-6 rounded-full flex items-center justify-center text-white">
                  2
                </Box>
                <Text fw={500} c="white">
                  Position Size
                </Text>
              </Group>
              <Text size="sm" c="dimmed">
                Order Size
              </Text>
              <Select placeholder="% available" data={['25%', '50%', '75%', '100%']} />
              <Group grow>
                <Text size="sm" c="dimmed">0%</Text>
                <Text size="sm" c="dimmed" ta="right">100%</Text>
              </Group>
              <Slider
                color="cyan"
                defaultValue={40}
                marks={[
                  { value: 0, label: '0' },
                  { value: 100, label: '100' },
                ]}
              />
            </Stack>
          </Group>
        </Paper>

        {/* Bot History Card */}
        <Paper className="bg-white dark:bg-boxdark p-6" radius="lg">
          <Group justify="space-between" mb="md">
            <Text fw={500} className='text-black dark:text-white'>
              Bot History
            </Text>
            <Select defaultValue="daily" className='bg-white dark:bg-boxdark' data={['Daily', 'Weekly', 'Monthly']} />
          </Group>
          <Box h={400}>
            {/* Placeholder for PortfolioChart */}
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <Text>Portfolio Chart Placeholder</Text>
            </div>
          </Box>
        </Paper>

        {/* Action Buttons */}
        <Group mt="xl" gap="md">
          <Button variant="outline" color="cyan">
            Add Token
          </Button>
          <Button
            variant="gradient"
            gradient={{ from: '#5c6ac4', to: '#4cd9ac', deg: 90 }}
          >
            Add an API key
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}

