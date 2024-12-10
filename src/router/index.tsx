import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Profile from "../pages/Profile";
import MainLayout from "../components/layouts/MainLayout";
import Portfolio from "../pages/Portfolio";
import MyTrades from "../pages/MyTrades";
import DCATrading from "../pages/DCATrading";
import ManageBots from "../pages/ManageBots";
import ManualTrade from "../pages/ManualTrade";
import Test from "../components/Test";
import BotDetails from "../pages/Botdetails";


const Markup = () => {
  const allroutes = [
    { url: "/", component: <Home /> },
    { url: "/profile", component: <Profile /> },
    { url: "/portfolio", component: <Portfolio />},
    { url: "/my-trades", component: <MyTrades />},
    { url: "/bots/dca", component: <DCATrading />},
    { url: "/bots/manage", component: <ManageBots/>},
    { url: "/manual-trade", component: <ManualTrade/>},
    { url: "/test", component: <Test/>},
    { url: "/bot-details/:id", component: <BotDetails/>},
  ];

  return (
    <Routes>
      <Route element={<MainLayout />}>
        {allroutes.map((data, i) => (
          <Route 
            key={i} 
            path={data.url} 
            element={data.component} 
          />
        ))}
      </Route>
    </Routes>
  );
};

export default Markup;
