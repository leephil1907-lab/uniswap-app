import { useState } from 'react';
import { Globe, Check, X, Search } from 'lucide-react';
import { useCurrency, SUPPORTED_CURRENCIES } from '../../context/CurrencyContext';

interface CurrencySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CurrencySelectorModal({ isOpen, onClose }: CurrencySelectorModalProps) {
  const { currency, setCurrency, rates } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredCurrencies = SUPPORTED_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.symbol.includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-surface border border-border/80 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-bold font-display text-text-primary">Select Display Currency</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search currency name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-2 border border-border/60 rounded-2xl text-xs text-text-primary focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Currency List */}
        <div className="mt-4 overflow-y-auto space-y-1.5 pr-1 flex-1">
          {filteredCurrencies.map((c) => {
            const isSelected = c.code === currency;
            const rate = rates[c.code] || 1;

            return (
              <button
                key={c.code}
                onClick={() => {
                  setCurrency(c.code);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-accent/15 border-accent text-accent shadow-sm'
                    : 'border-transparent hover:bg-surface-2 text-text-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{c.flag}</span>
                  <div className="text-left">
                    <div className="font-bold text-sm flex items-center gap-1.5">
                      <span>{c.name}</span>
                      <span className="text-xs text-text-tertiary font-mono">({c.code})</span>
                    </div>
                    <div className="text-[11px] text-text-secondary font-mono mt-0.5">
                      1 USD = {c.symbol}{rate.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-border/40 text-[11px] text-text-tertiary text-center">
          Live conversion powered by real-time exchange rate API
        </div>
      </div>
    </div>
  );
}
