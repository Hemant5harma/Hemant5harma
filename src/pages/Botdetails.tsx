"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Container,
  Paper,
  Text,
  Title,
  Flex,
  Button,
  Modal,
  Group,
  Loader,
  Table,
  Badge,
  Progress,
  Box,
  Card,
  Grid,
  ScrollArea,
} from "@mantine/core"
import {
  FaChartLine,
  FaWallet,
  FaCoins,
  FaCalendarAlt,
  FaExchangeAlt,
  FaMoneyBillWave,
  FaPercentage,
} from "react-icons/fa"
import { apiClient, pauseBot, resumeBot, deleteBot, fetchBotTradeHistory } from "../utils/apiClient"

export default function BotDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bot, setBot] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tradeHistory, setTradeHistory] = useState<any[]>([])
  const [tradeHistoryLoading, setTradeHistoryLoading] = useState(false)

  // Action loading states
  const [pauseLoading, setPauseLoading] = useState(false)
  const [resumeLoading, setResumeLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Modal states
  const [pauseModalOpen, setPauseModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // Add a function to load trade history
  const loadTradeHistory = async () => {
    if (!id) return

    setTradeHistoryLoading(true)
    try {
      const trades = await fetchBotTradeHistory(Number.parseInt(id))
      setTradeHistory(trades)
    } catch (error) {
      console.error("Error loading trade history:", error)
    } finally {
      setTradeHistoryLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)

    const fetchBotData = async () => {
      try {
        const data = await apiClient.get(`/bots/${id}`)
        setBot(data)
        await loadTradeHistory()
      } catch (error) {
        console.error("Error fetching bot:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBotData()
  }, [id])

  if (loading) {
    return (
      <Flex align="center" justify="center" h="100vh" direction="column" gap="md">
        <Loader size="xl" />
        <Text size="lg" c="dimmed">
          Loading bot details...
        </Text>
      </Flex>
    )
  }

  if (!bot) {
    return (
      <Flex align="center" justify="center" h="100vh">
        <Paper p="xl" radius="md" shadow="md" className="bg-white dark:bg-boxdark">
          <Text size="xl" fw={500} ta="center">
            Bot not found
          </Text>
          <Button mt="lg" onClick={() => navigate("/bots/dca")} variant="light" fullWidth>
            Return to Bots
          </Button>
        </Paper>
      </Flex>
    )
  }

  const { name, frequency, status, next_execution_time, coins } = bot

  // Safely access performance data with fallback to empty object
  const performance = bot.performance || {
    total_trades: 0,
    total_volume: 0,
    apy: 0,
    three_month_perf: 0,
    six_month_perf: 0,
    total_perf: 0,
  }

  // Handle pause action with confirmation
  const handlePause = async () => {
    setPauseLoading(true)
    try {
      await pauseBot(bot.id)
      // Optionally refetch or update local state
      const updatedBot = await apiClient.get(`/bots/${bot.id}`)
      setBot(updatedBot)
    } catch (error) {
      console.error("Error pausing bot:", error)
    } finally {
      setPauseLoading(false)
      setPauseModalOpen(false)
    }
  }

  // Handle resume action
  const handleResume = async () => {
    setResumeLoading(true)
    try {
      await resumeBot(bot.id)
      // Optionally refetch or update local state
      const updatedBot = await apiClient.get(`/bots/${bot.id}`)
      setBot(updatedBot)
    } catch (error) {
      console.error("Error resuming bot:", error)
    } finally {
      setResumeLoading(false)
    }
  }

  // Handle exit (delete) action with confirmation
  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteBot(bot.id)
      navigate("/bots/dca") // Navigate back to your bots list or another route
    } catch (error) {
      console.error("Error deleting bot:", error)
      setDeleteLoading(false)
      setDeleteModalOpen(false)
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "running":
        return "green"
      case "paused":
        return "yellow"
      case "stopped":
        return "red"
      default:
        return "gray"
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not scheduled"
    return new Date(dateString).toLocaleString()
  }

  return (
    <Container size="xl" py="xl" px={{ base: "xs", sm: "md", md: "lg" }}>
      {/* Pause Confirmation Modal */}
      <Modal
        opened={pauseModalOpen}
        onClose={() => setPauseModalOpen(false)}
        title={
          <Text fw={600} size="lg">
            Confirm Pause
          </Text>
        }
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <Text mb="lg">Are you sure you want to pause this bot? It will stop executing trades until resumed.</Text>
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
        title={
          <Text fw={600} size="lg" c="red" >
            Confirm Exit
          </Text>
        }
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <Text mb="lg">Are you sure you want to exit (delete) this bot? This action cannot be undone.</Text>
        <Group justify="flex-end">
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDelete} loading={deleteLoading}>
            Exit
          </Button>
        </Group>
      </Modal>

      <Grid gutter={{ base: "md", md: "xl" }}>
        <Grid.Col span={{ base: 12, md: 8 }}>
          {/* Basic Bot Info */}
          <Paper
            shadow="md"
            radius="lg"
            p="lg"
            mb="lg"
            className="bg-white dark:bg-boxdark transition-all duration-300"
          >
            <Flex
              justify="space-between"
              align={{ base: "start", sm: "center" }}
              direction={{ base: "column", sm: "row" }}
              gap={{ base: "xs", sm: 0 }}
            >
              <div>
                <Title order={2} className="text-2xl font-bold text-gray-900 dark:text-white">
                  {name}
                </Title>
                <Flex align="center" gap="xs" mt="xs" wrap="wrap">
                  <Badge color={getStatusColor(status)} size="lg" radius="sm" variant="filled">
                    {status.toUpperCase()}
                  </Badge>
                  <Text size="sm" c="dimmed" className="dark:text-gray-400">
                    Frequency: {frequency}
                  </Text>
                </Flex>
              </div>

              <Flex gap="sm" mt={{ base: "md", sm: 0 }}>
                {status === "running" && (
                  <Button
                    color="yellow"
                    variant="filled"
                    onClick={() => setPauseModalOpen(true)}
                    loading={pauseLoading}
                    radius="md"
                  >
                    Pause Bot
                  </Button>
                )}

                {status === "paused" && (
                  <Button color="green" variant="filled" onClick={handleResume} loading={resumeLoading} radius="md">
                    Resume Bot
                  </Button>
                )}

                <Button
                  color="red"
                  variant="outline"
                  onClick={() => setDeleteModalOpen(true)}
                  loading={deleteLoading}
                  radius="md"
                >
                  Exit Bot
                </Button>
              </Flex>
            </Flex>

            <Box mt="md" p="md" className="bg-gray-50 dark:bg-gray-700 rounded-md">
              <Flex align="center" gap="xs">
                <FaCalendarAlt className="text-indigo-600 dark:text-indigo-400" />
                <Text size="sm" className="text-gray-700 dark:text-gray-300">
                  Next Execution: {formatDate(next_execution_time)}
                </Text>
              </Flex>
            </Box>
          </Paper>

          {/* Performance Metrics */}
          <Paper
            shadow="md"
            radius="lg"
            p="lg"
            mb="lg"
            className="bg-white dark:bg-boxdark transition-all duration-300"
          >
            <Title order={3} className="text-xl font-bold text-gray-900 dark:text-white pb-4">
              Performance Metrics
            </Title>

            <Grid gutter="md">
              {/* 3M, 6M, Total Performance */}
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Card padding="sm" radius="md" className="bg-gray-50 dark:bg-gray-800 ">
                  <Flex direction="column" align="center" gap="xs">
                    <FaChartLine className="text-indigo-600 dark:text-indigo-400" size={20} />
                    <Text fw={500} size="sm" className="text-gray-700 dark:text-gray-300">
                      3M Performance
                    </Text>
                    <Text
                      size="lg"
                      fw={700}
                      className={`${
                        performance.three_month_perf >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {performance.three_month_perf >= 0 ? "+" : ""}
                      {performance.three_month_perf.toFixed(2)}%
                    </Text>
                  </Flex>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Card padding="sm" radius="md" className="bg-gray-50 dark:bg-gray-800 ">
                  <Flex direction="column" align="center" gap="xs">
                    <FaWallet className="text-blue-600 dark:text-blue-400" size={20} />
                    <Text fw={500} size="sm" className="text-gray-700 dark:text-gray-300">
                      6M Performance
                    </Text>
                    <Text
                      size="lg"
                      fw={700}
                      className={`${
                        performance.six_month_perf >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {performance.six_month_perf >= 0 ? "+" : ""}
                      {performance.six_month_perf.toFixed(2)}%
                    </Text>
                  </Flex>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Card padding="sm" radius="md" className="bg-gray-50 dark:bg-gray-800 ">
                  <Flex direction="column" align="center" gap="xs">
                    <FaCoins className="text-green-600 dark:text-green-400" size={20} />
                    <Text fw={500} size="sm" className="text-gray-700 dark:text-gray-300">
                      Total Performance
                    </Text>
                    <Text
                      size="lg"
                      fw={700}
                      className={`${
                        performance.total_perf >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {performance.total_perf >= 0 ? "+" : ""}
                      {performance.total_perf.toFixed(2)}%
                    </Text>
                  </Flex>
                </Card>
              </Grid.Col>

              {/* Total Trades, Volume, APY */}
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Card padding="sm" radius="md" className="bg-gray-50 dark:bg-gray-800 ">
                  <Flex direction="column" align="center" gap="xs">
                    <FaExchangeAlt className="text-purple-600 dark:text-purple-400" size={20} />
                    <Text fw={500} size="sm" className="text-gray-700 dark:text-gray-300">
                      Total Trades
                    </Text>
                    <Text size="lg" fw={700} className="text-gray-900 dark:text-white">
                      {performance.total_trades}
                    </Text>
                  </Flex>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Card padding="sm" radius="md" className="bg-gray-50 dark:bg-gray-800 ">
                  <Flex direction="column" align="center" gap="xs">
                    <FaMoneyBillWave className="text-teal-600 dark:text-teal-400" size={20} />
                    <Text fw={500} size="sm" className="text-gray-700 dark:text-gray-300">
                      Total Volume
                    </Text>
                    <Text size="lg" fw={700} className="text-gray-900 dark:text-white">
                      ${performance.total_volume.toFixed(2)}
                    </Text>
                  </Flex>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Card padding="sm" radius="md" className="bg-gray-50 dark:bg-gray-800 ">
                  <Flex direction="column" align="center" gap="xs">
                    <FaPercentage className="text-amber-600 dark:text-amber-400" size={20} />
                    <Text fw={500} size="sm" className="text-gray-700 dark:text-gray-300">
                      APY
                    </Text>
                    <Text size="lg" fw={700} className="text-green-600 dark:text-green-400">
                      {performance.apy.toFixed(2)}%
                    </Text>
                  </Flex>
                </Card>
              </Grid.Col>
            </Grid>
          </Paper>

          {/* Trade History Section */}
          <Paper shadow="md" radius="lg" p="lg" className="bg-white dark:bg-boxdark transition-all duration-300">
            <Title order={3} className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Trade History
            </Title>

            {tradeHistoryLoading ? (
              <Flex align="center" justify="center" py="xl">
                <Loader size="sm" />
                <Text ml="sm" c="dimmed">
                  Loading trade history...
                </Text>
              </Flex>
            ) : tradeHistory.length === 0 ? (
              <Box py="xl" ta="center" className="bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Text c="dimmed" className="dark:text-gray-400">
                  No trade history available for this bot.
                </Text>
              </Box>
            ) : (
              <>
                {/* Desktop view */}
                <Box className="hidden md:block">
                  <ScrollArea>
                    <Table striped  className="dark:border-gray-700">
                      <Table.Thead className="bg-gray-100 dark:bg-gray-800">
                        <Table.Tr>
                          <Table.Th className="dark:text-gray-300 dark:border-gray-700">Date</Table.Th>
                          <Table.Th className="dark:text-gray-300 dark:border-gray-700">Token</Table.Th>
                          <Table.Th className="dark:text-gray-300 dark:border-gray-700">Amount (USDT)</Table.Th>
                          <Table.Th className="dark:text-gray-300 dark:border-gray-700">Price</Table.Th>
                          <Table.Th className="dark:text-gray-300 dark:border-gray-700">Total Value</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {tradeHistory.map((trade, index) => (
                          <Table.Tr
                            key={trade.id}
                            className={"dark:bg-gray-800 dark:text-white" 
                            }
                          >
                            <Table.Td className="dark:border-gray-700">
                              {new Date(trade.trade_time).toLocaleString()}
                            </Table.Td>
                            <Table.Td className="dark:border-gray-700">
                              <Badge variant="light" color="blue">
                                {trade.token_address.toUpperCase()}
                              </Badge>
                            </Table.Td>
                            <Table.Td className="dark:border-gray-700">{trade.amount}</Table.Td>
                            <Table.Td className="dark:border-gray-700">
                              ${trade.trade_price ? trade.trade_price.toFixed(2) : "N/A"}
                            </Table.Td>
                            <Table.Td className="dark:border-gray-700">
                              {trade.trade_price
                                ? `${(trade.amount / trade.trade_price).toFixed(2)} ${trade.token_address.toUpperCase()}`
                                : "N/A"}
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                </Box>

                {/* Mobile view - card-based layout */}
                <Box className="md:hidden space-y-3">
                  {tradeHistory.map((trade, index) => (
                    <Card
                      key={trade.id}
                      padding="sm"
                      radius="md"
                      className={index % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-900"}
                    >
                      <Text size="xs" c="dimmed" mb="xs" className="dark:text-gray-400">
                        {new Date(trade.trade_time).toLocaleString()}
                      </Text>

                      <Flex justify="space-between" align="center" mb="xs">
                        <Badge variant="light" color="blue">
                          {trade.token_address.toUpperCase()}
                        </Badge>
                        <Text size="sm" fw={600} className="dark:text-white">
                          ${trade.trade_price ? trade.trade_price.toFixed(2) : "N/A"}
                        </Text>
                      </Flex>

                      <Grid>
                        <Grid.Col span={6}>
                          <Text size="xs" className="dark:text-gray-400">
                            Amount (USDT)
                          </Text>
                          <Text size="sm" className="dark:text-white">
                            {trade.amount}
                          </Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Text size="xs" className="dark:text-gray-400">
                            Total Value
                          </Text>
                          <Text size="sm" className="dark:text-white">
                            {trade.trade_price
                              ? `${(trade.amount / trade.trade_price).toFixed(2)} ${trade.token_address.toUpperCase()}`
                              : "N/A"}
                          </Text>
                        </Grid.Col>
                      </Grid>
                    </Card>
                  ))}
                </Box>
              </>
            )}
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          {/* Coins Section */}
          <Paper
            shadow="md"
            radius="lg"
            p="lg"
            className="bg-white dark:bg-boxdark transition-all duration-300"
            style={{ position: "sticky", top: "20px" }}
          >
            <Title order={3} className="text-xl font-bold text-gray-900 dark:text-white pb-4">
              Coin Allocations
            </Title>

            {coins && coins.length > 0 ? (
              <div className="space-y-3">
                {coins.map((coin: any, index: number) => {
                  // Calculate a percentage for the progress bar based on threshold
                  const progressValue = Math.min(100, (coin.amount / (coin.threshold || 1)) * 100)

                  return (
                    <Card key={coin.id || index} padding="xs" radius="md" className="bg-gray-50 dark:bg-gray-800">
                      <Flex justify="space-between" align="center" mb="xs">
                        <Text fw={600} size="sm" className="text-gray-800 dark:text-gray-200">
                          {coin.token_address.toUpperCase()}
                        </Text>
                        <Badge size="sm" variant="dot" color="indigo">
                          Active
                        </Badge>
                      </Flex>

                      <Flex direction="column" gap="xs">
                        <Text size="xs" className="text-gray-700 dark:text-gray-300">
                          Amount (USDT): {coin.amount}
                        </Text>
                        <Text size="xs" className="text-gray-700 dark:text-gray-300">
                          Threshold: {coin.threshold}
                        </Text>

                        <Progress value={progressValue} color="indigo" size="xs" radius="xl" mt="xs" />
                      </Flex>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Box py="xl" ta="center" className="bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Text c="dimmed" className="dark:text-gray-400">
                  No coin allocations found.
                </Text>
              </Box>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  )
}
