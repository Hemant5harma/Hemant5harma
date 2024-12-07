import { useState, useEffect } from 'react'
import { Tabs, Slider, NumberInput } from '@mantine/core'
import { FaExchangeAlt } from 'react-icons/fa'

interface TradingFormProps {
  availableUSDT?: number
  availableBTC?: number
  currentPrice?: number
}

export default function TradingForm({
  availableUSDT = 10000,
  availableBTC = 0.5,
  currentPrice = 25476.55
}: TradingFormProps) {
  const [buyOrderType, setBuyOrderType] = useState('limit')
  const [sellOrderType, setSellOrderType] = useState('limit')
  const [buyPrice, setBuyPrice] = useState(currentPrice)
  const [sellPrice, setSellPrice] = useState(currentPrice)
  const [buyAmount, setBuyAmount] = useState(0)
  const [sellAmount, setSellAmount] = useState(0)
  const [buyTotal, setBuyTotal] = useState(0)
  const [sellTotal, setSellTotal] = useState(0)
  const [buyPercentage, setBuyPercentage] = useState(0)
  const [sellPercentage, setSellPercentage] = useState(0)

  useEffect(() => {
    const calculatedBuyTotal = buyPrice * buyAmount
    setBuyTotal(Number(calculatedBuyTotal.toFixed(2)))
  }, [buyPrice, buyAmount])

  useEffect(() => {
    const calculatedSellTotal = sellPrice * sellAmount
    setSellTotal(Number(calculatedSellTotal.toFixed(2)))
  }, [sellPrice, sellAmount])

  const handleBuyPercentageChange = (value: number) => {
    setBuyPercentage(value)
    setBuyAmount(Number(((availableUSDT * (value / 100)) / buyPrice).toFixed(8)))
  }

  const handleSellPercentageChange = (value: number) => {
    setSellPercentage(value)
    setSellAmount(Number((availableBTC * (value / 100)).toFixed(8)))
  }

  const handleBuyAmountChange = (value: number) => {
    setBuyAmount(value)
    setBuyPercentage(Number(((value * buyPrice * 100) / availableUSDT).toFixed(2)))
  }

  const handleSellAmountChange = (value: number) => {
    setSellAmount(value)
    setSellPercentage(Number(((value * 100) / availableBTC).toFixed(2)))
  }

  const handleBuyTotalChange = (value: number) => {
    setBuyTotal(value)
    if (buyPrice !== 0) {
      const newAmount = Number((value / buyPrice).toFixed(8))
      setBuyAmount(newAmount)
      setBuyPercentage(Number(((value * 100) / availableUSDT).toFixed(2)))
    }
  }

  const handleSellTotalChange = (value: number) => {
    setSellTotal(value)
    if (sellPrice !== 0) {
      const newAmount = Number((value / sellPrice).toFixed(8))
      setSellAmount(newAmount)
      setSellPercentage(Number(((newAmount * 100) / availableBTC).toFixed(2)))
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Crypto buying side*/}
        <div className="p-4 sm:p-6 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h2 className="text-lg font-semibold mb-2 sm:mb-0">Buy BTC</h2>
            <div className="text-sm text-muted-foreground">
              Available: <span className="font-medium">{availableUSDT.toFixed(2)} USDT</span>
            </div>
          </div>

          <Tabs value={buyOrderType} onChange={(value) => setBuyOrderType(value as string)} className="mb-6">
            <Tabs.List grow>
              <Tabs.Tab value="limit">Limit</Tabs.Tab>
              <Tabs.Tab value="market">Market</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Price</label>
              <NumberInput
                value={buyPrice}
                onChange={(value) => setBuyPrice(Number(value))}
                min={0}
                step={0.01}
                rightSection={<span className="pr-2 text-sm">USDT</span>}
                disabled={buyOrderType === 'market'}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Amount</label>
              <NumberInput
                value={buyAmount}
                onChange={(value) => handleBuyAmountChange(Number(value))}
                min={0}
                step={0.0001}
                rightSection={<span className="pr-2 text-sm">BTC</span>}
                className="w-full"
              />
            </div>

            <div>
              <Slider
                value={buyPercentage}
                onChange={handleBuyPercentageChange}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 25, label: '25%' },
                  { value: 50, label: '50%' },
                  { value: 75, label: '75%' },
                  { value: 100, label: '100%' },
                ]}
                className="my-6"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Total</label>
              <NumberInput
                value={buyTotal}
                onChange={(value) => handleBuyTotalChange(Number(value))}
                min={0}
                step={0.01}
                rightSection={<span className="pr-2 text-sm">USDT</span>}
                className="w-full"
              />
            </div>

            <button className="w-full py-3 px-4 rounded-lg font-medium transition-colors bg-green-500 hover:bg-green-600 text-white">
              Buy BTC
            </button>
          </div>
        </div>

        {/* Selling Side of crypto*/}
        <div className="p-4 sm:p-6 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h2 className="text-lg font-semibold mb-2 sm:mb-0">Sell BTC</h2>
            <div className="text-sm text-muted-foreground">
              Available: <span className="font-medium">{availableBTC.toFixed(8)} BTC</span>
            </div>
          </div>

          <Tabs value={sellOrderType} onChange={(value) => setSellOrderType(value as string)} className="mb-6">
            <Tabs.List grow>
              <Tabs.Tab value="limit">Limit</Tabs.Tab>
              <Tabs.Tab value="market">Market</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Price</label>
              <NumberInput
                value={sellPrice}
                onChange={(value) => setSellPrice(Number(value))}
                min={0}
                step={0.01}
                rightSection={<span className="pr-2 text-sm">USDT</span>}
                disabled={sellOrderType === 'market'}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Amount</label>
              <NumberInput
                value={sellAmount}
                onChange={(value) => handleSellAmountChange(Number(value))}
                min={0}
                step={0.0001}
                rightSection={<span className="pr-2 text-sm">BTC</span>}
                className="w-full"
              />
            </div>

            <div>
              <Slider
                value={sellPercentage}
                onChange={handleSellPercentageChange}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 25, label: '25%' },
                  { value: 50, label: '50%' },
                  { value: 75, label: '75%' },
                  { value: 100, label: '100%' },
                ]}
                className="my-6"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Total</label>
              <NumberInput
                value={sellTotal}
                onChange={(value) => handleSellTotalChange(Number(value))}
                min={0}
                step={0.01}
                rightSection={<span className="pr-2 text-sm">USDT</span>}
                className="w-full"
              />
            </div>

            <button className="w-full py-3 px-4 rounded-lg font-medium transition-colors bg-red-500 hover:bg-red-600 text-white">
              Sell BTC
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          <FaExchangeAlt className="w-4 h-4" />
          Zero spot trading fees
        </div>
      </div>
    </div>
  )
}

