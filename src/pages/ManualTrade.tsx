import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CryptoSelector from '../components/CryptoSelector'
import TradingForm from '../components/TradingForm'
import { cryptoData, CryptoData } from '../data/mockdata'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const ManualTrade: React.FC = () => {
    const [selectedCrypto, setSelectedCrypto] = useState<CryptoData>(cryptoData[0])
    const [activeTab, setActiveTab] = useState('balances')

    const handleCryptoChange = (value: string) => {
        const newCrypto = cryptoData.find(crypto => crypto.id === value)
        if (newCrypto) setSelectedCrypto(newCrypto)
    }

    return (
        <div className="min-h-screen w-full bg-white dark:bg-boxdark text-black dark:text-white p-4 rounded-xl">
            {/* Crypto selector */}
           <div className='mb-4'>
           <CryptoSelector
                selectedCrypto={selectedCrypto.id}
                onSelectCrypto={handleCryptoChange} 
            />
           </div>

            {/* Top section with chart and orderbook */}
            <div className="grid lg:grid-cols-[1fr,250px] gap-4 mb-4">
                {/* Chart */}
                <div className="w-full h-[500px] bg-white dark:bg-boxdark border dark:border-gray-700 rounded-lg">
                    <div className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Chart</h2>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={selectedCrypto.chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="close" stroke="#8884d8" />
                            </LineChart>
                        </ResponsiveContainer>
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
                            {selectedCrypto.orderBook.sells.map((order, index) => (
                                <div key={`sell-${index}`} className="grid grid-cols-3 text-xs text-red-500">
                                    <div>{order.amount.toFixed(4)}</div>
                                    <div>{order.total.toFixed(2)}</div>
                                    <div>{order.price.toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                        {/* Current price */}
                        <div className="p-4 border-y dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <div className="text-center font-semibold">{selectedCrypto.currentPrice.toFixed(2)}</div>
                        </div>
                        {/* Buy orders */}
                        <div className="space-y-1 p-4">
                            {selectedCrypto.orderBook.buys.map((order, index) => (
                                <div key={`buy-${index}`} className="grid grid-cols-3 text-xs text-green-500">
                                    <div>{order.amount.toFixed(4)}</div>
                                    <div>{order.total.toFixed(2)}</div>
                                    <div>{order.price.toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Trading Forms */}
            <div className="mb-4">
                <TradingForm selectedCrypto={selectedCrypto} onCryptoChange={setSelectedCrypto} />
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

