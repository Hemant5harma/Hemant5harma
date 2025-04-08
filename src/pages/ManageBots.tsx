import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BotCard from '../components/BotCard';
import { fetchBots } from '../utils/apiClient';

export default function ManageBots() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bots, setBots] = useState<any[]>([]);

  useEffect(() => {
    fetchBots()
      .then(data => setBots(data))
      .catch(error => console.error(error));
  }, []);

  const filteredBots = bots.filter(bot =>
    bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bot.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bot.coins.some((coin: any) =>
      coin.token_address.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen dark:bg-boxdark-2">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black dark:text-white">Trading Bots</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage and monitor your trading bots</p>
      </div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search bots..."
          className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-boxdark text-black dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBots.map(bot => (
          <BotCard key={bot.id} bot={bot} />
        ))}
      </div>
    </div>
  );
}

