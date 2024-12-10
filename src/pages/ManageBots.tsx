import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BotCard from '../components/BotCard';
import { bots } from '../data/botmockdata';

export default function ManageBots() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBots = bots.filter(bot => 
    bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bot.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bot.pairs.some(pair => pair.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen dark:bg-boxdark-2 p-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBots.map((bot) => (
          <Link key={bot.id} to={`/bot-details/${bot.id}`}>
            <BotCard {...bot} />
          </Link>
        ))}
      </div>
    </div>
  );
}

