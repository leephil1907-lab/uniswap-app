import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface PriceChartProps {
  data?: { time: string; price: number }[];
  isPositive?: boolean;
  isLoading?: boolean;
}

export default function PriceChart({ data, isPositive = true, isLoading = false }: PriceChartProps) {
  const color = isPositive ? '#40B66B' : 'var(--accent)';
  const gradientId = isPositive ? 'colorPriceGreen' : 'colorPriceAccent';

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center text-text-tertiary gap-2">
        <div className="w-10 h-10 rounded-2xl bg-surface-2 flex items-center justify-center text-text-secondary border border-border/40">
          $
        </div>
        <span className="text-sm font-semibold text-text-secondary">Historical price data unavailable</span>
        <span className="text-xs">Live price stream active</span>
      </div>
    );
  }

  const chartData = data;


  return (
    <div className="w-full h-full min-h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide />
          <YAxis domain={['auto', 'auto']} hide />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const val = payload[0].value as number;
                const timeLabel = payload[0].payload.time;
                return (
                  <div className="bg-surface border border-border/80 rounded-xl px-3 py-2 shadow-2xl text-xs font-mono">
                    <div className="text-text-tertiary mb-0.5">{timeLabel}</div>
                    <div className="text-text-primary font-bold text-sm">
                      ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke={color} 
            strokeWidth={2.5} 
            fillOpacity={1} 
            fill={`url(#${gradientId})`} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
