import React, { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'

const ManualTrade: React.FC = () => {
    const [activeTab, setActiveTab] = useState('balances')
    const [buyAmount, setBuyAmount] = useState(0)
    const [sellAmount, setSellAmount] = useState(0)
    const [buyPrice, setBuyPrice] = useState(0)
    const [sellPrice, setSellPrice] = useState(0)
    const [buyPercentage, setBuyPercentage] = useState(0)
    const [sellPercentage, setSellPercentage] = useState(0)
    const [buyOrderType, setBuyOrderType] = useState('limit')
    const [sellOrderType, setSellOrderType] = useState('limit')
    const buyContainerRef = useRef<HTMLDivElement | null>(null)
    const sellContainerRef = useRef<HTMLDivElement | null>(null)

    // Simulated available balances
    const availableUSDT = 10000
    const availableBTC = 0.5

    const orderBookData = [
        { amount: 0.01, total: 1287.49, price: 97908.00 },
        { amount: 0.0001, total: 5.87, price: 97907.73 },
        { amount: 0.03, total: 2642.53, price: 97907.72 },
        { amount: 0.001, total: 99.87, price: 97907.61 },
        { amount: 0.0001, total: 10.77, price: 97905.64 },
        { amount: 0.0001, total: 11.75, price: 97904.01 },
    ]

    const handlePercentageChange = (side: 'buy' | 'sell', value: number) => {
        if (side === 'buy') {
            setBuyPercentage(value)
            const maxBuyAmount = availableUSDT / (buyOrderType === 'limit' ? buyPrice : orderBookData[0].price)
            setBuyAmount(Number(((value / 100) * maxBuyAmount).toFixed(8)))
        } else {
            setSellPercentage(value)
            setSellAmount(Number(((value / 100) * availableBTC).toFixed(8)))
        }
    }

    const updateAmountFromInput = (side: 'buy' | 'sell', value: number) => {
        if (side === 'buy') {
            setBuyAmount(value)
            const maxBuyAmount = availableUSDT / (buyOrderType === 'limit' ? buyPrice : orderBookData[0].price)
            setBuyPercentage(Math.min((value / maxBuyAmount) * 100, 100))
        } else {
            setSellAmount(value)
            setSellPercentage(Math.min((value / availableBTC) * 100, 100))
        }
    }

    useEffect(() => {
        setBuyPrice(orderBookData[0].price)
        setSellPrice(orderBookData[0].price)
    }, [])


// a seprate fuction for handling buy and sell order.
    const TradingForm = ({ side }: { side: 'buy' | 'sell' }) => {

        // select the order is for buy or sell
        const isBuy = side === 'buy'
        const amount = isBuy ? buyAmount : sellAmount
        const setAmount = isBuy ? setBuyAmount : setSellAmount
        const price = isBuy ? buyPrice : sellPrice
        const setPrice = isBuy ? setBuyPrice : setSellPrice
        const percentage = isBuy ? buyPercentage : sellPercentage
        const orderType = isBuy ? buyOrderType : sellOrderType
        const setOrderType = isBuy ? setBuyOrderType : setSellOrderType
        const availableBalance = isBuy ? availableUSDT : availableBTC
        const containerRef = isBuy ? buyContainerRef : sellContainerRef

        const gradientClass = isBuy
            ? 'from-green-500 to-green-600'
            : 'from-red-500 to-red-600'

        return (
            <div className="p-4 rounded-lg bg-white dark:bg-boxdark border dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-lg font-semibold ${isBuy ? 'text-green-600' : 'text-red-600'}`}>
                        {isBuy ? 'Buy' : 'Sell'}
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Available: <span className="font-medium">{availableBalance.toFixed(8)} {isBuy ? 'USDT' : 'BTC'}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Order type</label>
                        <div className="relative">
                            <select
                                className="w-full p-2 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg appearance-none"
                                value={orderType}
                                onChange={(e) => setOrderType(e.target.value)}
                            >
                                <option value="limit">Limit</option>
                                <option value="market">Market</option>
                            </select>
                            <FaChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" />
                        </div>
                    </div>

                    {orderType === 'limit' && (
                        <div>
                            <label className="text-sm font-medium mb-1 block">Limit Price</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(parseFloat(e.target.value))}
                                    className="w-full p-2 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 space-y-1">
                                    <FaChevronUp className={`w-4 h-4 cursor-pointer hover:${isBuy ? 'text-green-500' : 'text-red-500'}`} onClick={() => setPrice(prev => +(prev + 0.01).toFixed(2))} />
                                    <FaChevronDown className={`w-4 h-4 cursor-pointer hover:${isBuy ? 'text-green-500' : 'text-red-500'}`} onClick={() => setPrice(prev => Math.max(0, +(prev - 0.01).toFixed(2)))} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium mb-1 block">Amount</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => updateAmountFromInput(side, parseFloat(e.target.value))}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 space-y-1">
                                <FaChevronUp className={`w-4 h-4 cursor-pointer hover:${isBuy ? 'text-green-500' : 'text-red-500'}`} onClick={() => updateAmountFromInput(side, +(amount + 0.0001).toFixed(8))} />
                                <FaChevronDown className={`w-4 h-4 cursor-pointer hover:${isBuy ? 'text-green-500' : 'text-red-500'}`} onClick={() => updateAmountFromInput(side, Math.max(0, +(amount - 0.0001).toFixed(8)))} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full" ref={containerRef}>
                            <motion.div
                                className={`absolute h-full rounded-full bg-gradient-to-r ${gradientClass}`}
                                style={{ width: `${percentage}%` }}
                            />
                            <motion.div
                                className={`absolute -top-1 w-4 h-4 bg-white dark:bg-gray-200 rounded-full border-2 ${isBuy ? 'border-green-500' : 'border-red-500'} cursor-pointer`}
                                style={{ left: `calc(${percentage}% - 8px)` }}
                                drag="x"
                                dragConstraints={containerRef}
                                dragElastic={0}
                                dragMomentum={false}
                                onDrag={(_, info) => {
                                    const parentWidth = containerRef.current?.clientWidth || 0
                                    const newPercentage = Math.min(100, Math.max(0, (info.point.x / parentWidth) * 100))
                                    handlePercentageChange(side, newPercentage)
                                }}
                            />
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>0%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>Total:</span>
                            <span>{(amount * (orderType === 'limit' ? price : orderBookData[0].price)).toFixed(4)} {isBuy ? 'USDT' : 'BTC'}</span>
                        </div>
                    </div>

                    <button className={`w-full p-3 rounded-lg text-white bg-gradient-to-r ${gradientClass}`}>
                        {isBuy ? 'Buy' : 'Sell'} BTC
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full bg-white dark:bg-boxdark text-black dark:text-white p-4 rounded-xl">
            {/* Top section with chart and orderbook */}
            <div className="grid lg:grid-cols-[1fr,250px] gap-4 mb-4">
                {/* Space for Chart */}
                <div className="w-full h-[500px] bg-white dark:bg-boxdark border dark:border-gray-700 rounded-lg">
                    <div className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Chart</h2>
                        <div className="w-full h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg">
                            {/* Chart will go here */}
                        </div>
                    </div>
                </div>

                {/* Orderbook */}
                <div className="w-full h-[500px] bg-white dark:bg-boxdark border dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="p-4 border-b dark:border-gray-700">
                        <h2 className="text-md font-semibold">Order Book</h2>
                    </div>
                    <div className="h-[440px] overflow-y-auto">
                        <div className="grid grid-cols-3 text-sm p-4 border-b dark:border-gray-700">
                            <div>Amount</div>
                            <div>Total</div>
                            <div>Price</div>
                        </div>
                        {/* Sell orders */}
                        <div className="space-y-1 p-4">
                            {orderBookData.map((order, index) => (
                                <div key={`sell-${index}`} className="grid grid-cols-3 text-xs text-red-500">
                                    <div>{order.amount.toFixed(4)}</div>
                                    <div>{order.total.toFixed(2)}</div>
                                    <div>{order.price.toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                        {/* Current price */}
                        <div className="p-4 border-y dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <div className="text-center font-semibold">{orderBookData[0].price.toFixed(2)}</div>
                        </div>
                        {/* Buy orders */}
                        <div className="space-y-1 p-4">
                            {orderBookData.slice().reverse().map((order, index) => (
                                <div key={`buy-${index}`} className="grid grid-cols-3 text-sm text-green-500">
                                    <div>{order.amount.toFixed(4)}</div>
                                    <div>{order.total.toFixed(2)}</div>
                                    <div>{(order.price - index * 0.5).toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Trading Forms */}
            <div className="grid lg:grid-cols-2 gap-4 mb-4">
                <TradingForm side="buy" />
                <TradingForm side="sell" />
            </div>

            {/* Bottom section with details */}
            <div className="w-full bg-white dark:bg-boxdark border dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="border-b dark:border-gray-700">
                    <div className="flex flex-wrap">
                        {['balances', 'positions', 'orders', 'history'].map((tab) => (
                            <button
                                key={tab}
                                className={`px-4 py-2 text-sm font-medium ${activeTab === tab
                                        ? 'border-b-2 border-blue-500 text-blue-500'
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                    }`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="p-4"
                    >
                        {activeTab === 'balances' && (
                            <div>
                                <div className="grid grid-cols-4 gap-4 text-sm font-medium border-b dark:border-gray-700 pb-2">
                                    <div>Coin</div>
                                    <div>Total Balance</div>
                                    <div>Available Balance</div>
                                    <div>USDT Value</div>
                                </div>
                                <div className="py-8 text-center text-gray-500">
                                    No balances yet
                                </div>
                            </div>
                        )}
                        {activeTab === 'positions' && <div>Positions content</div>}
                        {activeTab === 'orders' && <div>Orders content</div>}
                        {activeTab === 'history' && <div>History content</div>}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}

export default ManualTrade

