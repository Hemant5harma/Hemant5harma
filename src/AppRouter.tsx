import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import MainLayout from './components/layouts/MainLayout';
import NotFound from './pages/NotFound';

// Lazy-loaded pages to reduce initial bundle size
const Home = lazy(() => import('./pages/Home'));
const Profile = lazy(() => import('./pages/Profile'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const MyTrades = lazy(() => import('./pages/MyTrades'));
const DCATrading = lazy(() => import('./pages/DCATrading'));
const ManageBots = lazy(() => import('./pages/ManageBots'));
const ManualTrade = lazy(() => import('./pages/ManualTrade'));
const Test = lazy(() => import('./components/Test'));
const BotDetails = lazy(() => import('./pages/Botdetails'));
const TrendTrading = lazy(() => import('./pages/TrendTrading'));
const ArbitrageDashboard = lazy(() => import('./pages/ArbitrageBots'));
const FrontBots = lazy(() => import('./pages/FrontBots'));
const SettingsPage = lazy(() => import('./pages/setting'));

const AppRouter = () => {
  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname]);

  const allroutes = [
    { url: '/', component: Home },
    { url: '/profile', component: Profile },
    { url: '/portfolio', component: Portfolio },
    { url: '/my-trades', component: MyTrades },
    { url: '/bots/dca', component: DCATrading },
    { url: '/bots/manage', component: ManageBots },
    { url: '/manual-trade', component: ManualTrade },
    { url: '/test', component: Test },
    { url: '/bot-details/:id', component: BotDetails },
    { url: '/bots/trend', component: TrendTrading },
    { url: '/bots/arbitrage', component: ArbitrageDashboard },
    { url: '/bots/frontrunner', component: FrontBots },
    { url: '/settings', component: SettingsPage },
  ];

  const LoaderFallback = (
    <Center style={{ paddingTop: '10vh' }}>
      <Loader size="lg" />
    </Center>
  );

  return (
    <Suspense fallback={LoaderFallback}>
      <Routes>
        <Route element={<MainLayout />}>
          {allroutes.map(({ url, component: Component }, i) => (
            <Route key={i} path={url} element={<Component />} />
          ))}
        </Route>

        {/* 404 outside layout for cleaner page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter; 