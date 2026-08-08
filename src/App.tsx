import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, lazy, Suspense } from 'react';
import { ThemeProvider } from './hooks/useTheme';
import { ContractProvider } from './context/ContractContext';
import { ToastProvider } from './components/common/UniswapToast';
import { NetworkSwitchListener } from './components/common/NetworkSwitchModal';
import Header from './components/layout/Header';
import MobileActionMenu from './components/layout/MobileActionMenu';
import SplashScreen from './components/common/SplashScreen';
import BackgroundCoins from './components/common/BackgroundCoins';
import AIAssistant from './components/AIAssistant';

// Lazy-loaded page components for optimal initial bundle size and split chunks
const Trade = lazy(() => import('./pages/Trade'));
const Explore = lazy(() => import('./pages/Explore'));
const Pools = lazy(() => import('./pages/Pools'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const TokenDetails = lazy(() => import('./pages/TokenDetails'));

function PageLoadingFallback() {
  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center p-8 min-h-[60vh] font-sans">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-accent/20 border-t-accent rounded-full animate-spin" />
        <div className="absolute inset-0 bg-accent/10 rounded-full blur-md" />
      </div>
      <p className="mt-4 text-xs font-mono font-bold text-text-tertiary animate-pulse tracking-wide">Loading module...</p>
    </div>
  );
}

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98, rotateX: 2 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      exit={{ opacity: 0, y: -15, scale: 0.98, rotateX: -2 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex-1 flex flex-col perspective-[1000px]"
    >
      <Suspense fallback={<PageLoadingFallback />}>
        {children}
      </Suspense>
    </motion.div>
  );
}

function AdminShortcutListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        navigate('/admin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return null;
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
      <ContractProvider>
        <ToastProvider>
          <NetworkSwitchListener />
          {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} duration={1800} />}
          <Router>
            <AdminShortcutListener />
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
        </ToastProvider>
      </ContractProvider>
    </ThemeProvider>
  );
}

