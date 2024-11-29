import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Profile from "../pages/Profile";
import MainLayout from "../components/layouts/MainLayout";
import Portfolio from "../pages/Portfolio";
import MyTrades from "../pages/MyTrades";

const Markup = () => {
  const allroutes = [
    { url: "/", component: <Home /> },
    { url: "/profile", component: <Profile /> },
    { url: "/portfolio", component: <Portfolio />},
    { url: "/my-trades", component: <MyTrades />},
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
