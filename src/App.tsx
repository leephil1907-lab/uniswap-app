import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { ThemeProvider } from './hooks/useTheme';
import { CurrencyProvider } from './context/CurrencyContext';
import { ContractProvider } from './context/ContractContext';
import { ToastProvider } from './components/common/UniswapToast';
import { NetworkSwitchListener } from './components/common/NetworkSwitchModal';
import Header from './components/layout/Header';
import MobileActionMenu from './components/layout/MobileActionMenu';
import SplashScreen from './components/common/SplashScreen';
import BackgroundCoins from './components/common/BackgroundCoins';
import AIAssistant from './components/AIAssistant';

// Direct page imports for instantaneous transitions and robust bundle loading
import Trade from './pages/Trade';
import Explore from './pages/Explore';
import Pools from './pages/Pools';
import Portfolio from './pages/Portfolio';
import AdminPage from './pages/AdminPage';
import TokenDetails from './pages/TokenDetails';

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98, rotateX: 2 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      exit={{ opacity: 0, y: -15, scale: 0.98, rotateX: -2 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex-1 flex flex-col perspective-[1000px]"
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/trade" replace />} />
        <Route path="/trade" element={<PageTransition><Trade /></PageTransition>} />
        <Route path="/explore" element={<PageTransition><Explore /></PageTransition>} />
        <Route path="/explore/:tokenId" element={<PageTransition><TokenDetails /></PageTransition>} />
        <Route path="/tokens/:tokenId" element={<PageTransition><TokenDetails /></PageTransition>} />
        <Route path="/pools" element={<PageTransition><Pools /></PageTransition>} />
        <Route path="/portfolio" element={<PageTransition><Portfolio /></PageTransition>} />
        <Route path="/admin" element={<PageTransition><AdminPage /></PageTransition>} />
        <Route path="/vault" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <ThemeProvider>
      <CurrencyProvider>
        <ToastProvider>
          <ContractProvider>
            <NetworkSwitchListener />
            {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} duration={1800} />}
            <Router>
              <div className="min-h-screen flex flex-col relative bg-background font-body">
                <BackgroundCoins />
                <Header />
                <main className="flex-1 w-full flex flex-col relative z-0">
                  <AnimatedRoutes />
                </main>
                <AIAssistant />
                <MobileActionMenu />
              </div>
            </Router>
          </ContractProvider>
        </ToastProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}


