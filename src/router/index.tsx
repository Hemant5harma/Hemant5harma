import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import MainLayout from "../components/layouts/MainLayout";

const Markup = () => {
  const allroutes = [
    { url: "/", component: <Home /> },
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
