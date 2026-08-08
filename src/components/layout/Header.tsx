import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Menu, MoreHorizontal, HelpCircle, ChevronDown, ChevronUp, ShieldCheck, Sun, Moon, Compass, Rocket, Waves, Wallet, ArrowLeftRight, Lock, Cpu, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppKitAccount, useAppKit, useAppKitNetwork } from '@reown/appkit/react';
import { useBalance } from 'wagmi';
import { useTheme } from '../../hooks/useTheme';
import UnicornLogo from '../common/UnicornLogo';
import { CONTRACT_ADDRESS, OWNER_ADDRESS } from '../../lib/contract';
import { MIDDLEMAN_CONTRACT_ADDRESS } from '../../lib/middleman';

export default function Header() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [contractDetailsOpen, setContractDetailsOpen] = useState(false);
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const { caipNetwork } = useAppKitNetwork();
  const { data: balanceData } = useBalance({ address: address as `0x${string}` | undefined });
  const { theme, toggleTheme } = useTheme();

  // Smart Contract stability status script
  const [contractLocked, setContractLocked] = useState(true);

  useEffect(() => {
    // Ensure smart contract global hooks are locked into window object
    if (typeof window !== 'undefined') {
      (window as any).__CONTRACT_STATUS__ = {
        vaultAddress: CONTRACT_ADDRESS,
        middlemanAddress: MIDDLEMAN_CONTRACT_ADDRESS,
        ownerAddress: OWNER_ADDRESS,
        isLocked: true,
        network: caipNetwork?.name || 'Ethereum',
        timestamp: Date.now(),
      };
      setContractLocked(true);
    }
  }, [caipNetwork]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Products: false,
    Protocol: false,
    Company: false,
    'Legal & Privacy': false,
  });

  const toggleSection = (sec: string) => {
    setExpandedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleConnect = () => {
    open();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-primary/95 backdrop-blur-md border-b border-border/40 px-4 py-3">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          {/* Left: Logo and Mobile Menu */}
          <div className="flex items-center gap-3 lg:gap-6">
            <button 
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-surface-2 transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <NavLink to="/" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
              <UnicornLogo size={36} className="text-accent drop-shadow-[0_0_12px_rgba(252,12,151,0.4)]" />
            </NavLink>
          
            {/* Navigation Bar for tablet & desktop */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink
                to="/trade"
                className={({ isActive }) =>
                  cn(
                    'px-4 py-2 rounded-xl text-base font-medium transition-colors',
                    isActive ? 'text-text-primary font-bold' : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                  )
                }
              >
                Trade
              </NavLink>
              <NavLink
                to="/explore"
                className={({ isActive }) =>
                  cn(
                    'px-4 py-2 rounded-xl text-base font-medium transition-colors',
                    isActive ? 'text-text-primary font-bold' : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                  )
                }
              >
                Explore
              </NavLink>
              <NavLink
                to="/pools"
                className={({ isActive }) =>
                  cn(
                    'px-4 py-2 rounded-xl text-base font-medium transition-colors',
                    isActive ? 'text-text-primary font-bold' : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                  )
                }
              >
                Pools
              </NavLink>
              <NavLink
                to="/portfolio"
                className={({ isActive }) =>
                  cn(
                    'px-4 py-2 rounded-xl text-base font-medium transition-colors',
                    isActive ? 'text-text-primary font-bold' : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                  )
                }
              >
                Portfolio
              </NavLink>
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-surface-2 transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => navigate('/explore')}
              className="p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-surface-2 transition-colors cursor-pointer"
              title="Search tokens"
            >
              <Search className="w-5 h-5" />
            </button>
            <div className="relative group hidden sm:block">
              <button className="p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-surface-2 transition-colors cursor-pointer" aria-label="More options">
                <MoreHorizontal className="w-5 h-5" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border/80 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col p-2 overflow-hidden z-50">
                <a
                  href="https://docs.uniswap.org"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors flex items-center gap-2"
                >
                  <HelpCircle className="w-4 h-4 text-accent" />
                  Uniswap Docs
                </a>
                <a
                  href="https://support.uniswap.org"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors flex items-center gap-2"
                >
                  <HelpCircle className="w-4 h-4 text-purple-400" />
                  Help Center
                </a>
              </div>
            </div>

            {/* Web3 Network & Connect Button */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <appkit-network-button />
              </div>
              
              {!isConnected ? (
                <button
                  onClick={handleConnect}
                  className="bg-accent text-white hover:bg-accent/90 px-4 py-2 rounded-full font-medium text-sm transition-all shadow-[0_0_20px_var(--color-accent)] cursor-pointer hover:scale-105 active:scale-95"
                >
                  Get started
                </button>
              ) : (
                <button
                  onClick={() => open({ view: 'Account' })}
                  className="flex items-center gap-2 bg-surface-2/80 hover:bg-surface-2 border border-border/80 px-3 py-1.5 rounded-full text-xs font-mono font-medium text-text-primary transition-all cursor-pointer shadow-sm group hover:border-accent/50"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-accent">
                    {balanceData 
                      ? `${(Number(balanceData.value) / (10 ** balanceData.decimals)).toFixed(4)} ${balanceData.symbol}`
                      : '0.0000 ETH'}
                  </span>
                  <span className="text-text-tertiary">|</span>
                  <span className="group-hover:text-accent transition-colors">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Animated Mobile Navigation Drawer / Bottom Sheet */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            />

            {/* Bottom Sheet Drawer Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-lg mx-auto bg-surface border-t border-border rounded-t-[32px] max-h-[88vh] flex flex-col shadow-2xl z-10 overflow-hidden text-text-primary font-sans"
            >
              {/* Grabber handle bar */}
              <div 
                className="w-full py-3 flex justify-center cursor-pointer select-none"
                onClick={() => setDrawerOpen(false)}
              >
                <div className="w-10 h-1 bg-text-tertiary/40 rounded-full" />
              </div>

              {/* Scrollable Drawer Content */}
              <div className="flex-1 overflow-y-auto px-6 pt-1 pb-8 flex flex-col gap-3">
                
                {/* APP Section Label */}
                <div className="text-sm font-medium text-text-tertiary px-1 mt-1">App</div>

                {/* APP Primary Navigation Items with Hot Pink Icons */}
                <div className="flex flex-col gap-1">
                  <DrawerLink 
                    to="/trade" 
                    icon={<ArrowLeftRight className="w-5 h-5 text-[#FF007A]" />} 
                    label="Trade" 
                    onClick={() => setDrawerOpen(false)} 
                  />
                  <DrawerLink 
                    to="/explore" 
                    icon={<Compass className="w-5 h-5 text-[#FF007A]" />} 
                    label="Explore" 
                    onClick={() => setDrawerOpen(false)} 
                  />
                  <DrawerLink 
                    to="/trade" 
                    icon={<Rocket className="w-5 h-5 text-[#FF007A]" />} 
                    label="Launches" 
                    onClick={() => setDrawerOpen(false)} 
                  />
                  <DrawerLink 
                    to="/pools" 
                    icon={<Waves className="w-5 h-5 text-[#FF007A]" />} 
                    label="Pool" 
                    onClick={() => setDrawerOpen(false)} 
                  />
                  <DrawerLink 
                    to="/portfolio" 
                    icon={<Wallet className="w-5 h-5 text-[#FF007A]" />} 
                    label="Portfolio" 
                    onClick={() => setDrawerOpen(false)} 
                  />
                </div>

                {/* Collapsible Dropdown Sections */}
                <div className="flex flex-col gap-1 mt-2">
                  <CollapsibleGroup
                    title="Products"
                    isOpen={expandedSections.Products}
                    onToggle={() => toggleSection('Products')}
                    items={['Wallet', 'UniswapX', 'API', 'Unichain']}
                  />

                  <CollapsibleGroup
                    title="Protocol"
                    isOpen={expandedSections.Protocol}
                    onToggle={() => toggleSection('Protocol')}
                    items={['Vote', 'Governance', 'Developers']}
                  />

                  <CollapsibleGroup
                    title="Company"
                    isOpen={expandedSections.Company}
                    onToggle={() => toggleSection('Company')}
                    items={['About', 'Careers', 'Blog']}
                  />
                </div>

                {/* Divider Line */}
                <div className="h-[1px] bg-border my-2" />

                {/* Legal & Privacy Section */}
                <CollapsibleGroup
                  title="Legal & Privacy"
                  isOpen={expandedSections['Legal & Privacy']}
                  onToggle={() => toggleSection('Legal & Privacy')}
                  items={['Your Privacy Choices', 'Privacy Policy', 'Terms of Service', 'Disclosures']}
                />

                {/* Social & Help Footer */}
                <div className="flex items-center justify-between pt-6 border-t border-border text-text-secondary mt-4 px-1">
                  <button className="p-1 hover:text-text-primary transition-colors cursor-pointer" title="Help & Support">
                    <HelpCircle className="w-6 h-6 text-text-secondary" />
                  </button>
                  
                  <div className="flex items-center gap-5">
                    <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-text-primary transition-colors" title="GitHub">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                    </a>
                    <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-text-primary font-bold text-lg transition-colors" title="X (Twitter)">𝕏</a>
                    <a href="https://discord.com" target="_blank" rel="noreferrer" className="hover:text-text-primary transition-colors" title="Discord">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                    </a>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function DrawerLink({ to, icon, label, onClick }: { to: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3.5 px-2 py-2 rounded-2xl text-[18px] font-semibold transition-colors',
          isActive ? 'text-text-primary font-bold' : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
        )
      }
    >
      <div className="flex items-center justify-center w-6 h-6">{icon}</div>
      <span>{label}</span>
    </NavLink>
  );
}

function CollapsibleGroup({
  title,
  isOpen,
  onToggle,
  items,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  items: string[];
}) {
  return (
    <div className="flex flex-col">
      <button
        onClick={onToggle}
        className="flex items-center justify-between px-1 py-2.5 text-text-secondary hover:text-text-primary text-[17px] font-medium transition-colors cursor-pointer w-full"
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp className="w-5 h-5 text-text-tertiary" /> : <ChevronDown className="w-5 h-5 text-text-tertiary" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-1 pl-1 py-1 overflow-hidden"
          >
            {items.map((item) => (
              <div
                key={item}
                className="text-text-primary text-[16px] font-normal py-2 px-2 hover:bg-surface-2 rounded-xl cursor-pointer flex items-center gap-2 transition-colors"
              >
                {item === 'Your Privacy Choices' && <ShieldCheck className="w-4 h-4 text-[#FF007A]" />}
                <span>{item}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

