import { motion } from 'framer-motion';
import { type ReactNode } from 'react';
import { TimerBar } from './TimerBar';
import type { QueueStats } from '../types/dashboard';

interface QueueNodeProps {
  title: string;
  queue?: QueueStats;
  icon: ReactNode;
  activeColor: string;
  activeBg: string;
  clockOffset: number;
}

export function QueueNode({ title, queue, icon, activeColor, activeBg, clockOffset }: QueueNodeProps) {
  const count = queue?.messages ?? 0;
  const unacked = queue?.messagesUnacked ?? 0;
  const isProcessing = unacked > 0;
  const isActive = count > 0 || isProcessing;
  const labelId = `${title.toLowerCase().replace(/\s+/g, '-')}-label`;

  return (
    <motion.article
      layout
      aria-labelledby={labelId}
      animate={{
        borderColor: isActive ? activeColor : '#e2e8f0',
        boxShadow: isActive ? `0 0 12px ${activeColor}40` : 'none',
      }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl p-3 border-2 flex flex-col gap-1 min-w-0"
    >
      <div className="flex items-center justify-between gap-1">
        <div className="min-w-0">
          <span id={labelId} className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">{title}</span>
          <span className="text-[10px] font-mono text-slate-500 block truncate">{queue?.name ?? title}</span>
        </div>

        <div
          className="p-1.5 rounded-lg flex-shrink-0"
          style={{ backgroundColor: isActive ? activeBg : '#f1f5f9', color: isActive ? activeColor : '#94a3b8' }}
        >
          {icon}
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <span className="text-[10px] text-slate-400">Mensagens</span>
        <motion.span
          key={count}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="text-xl font-mono font-bold"
          style={{ color: isActive ? activeColor : '#cbd5e1' }}
        >
          {count}
        </motion.span>
      </div>

      {isActive && queue?.ttl && queue?.headTimestamp && (
        <TimerBar headTimestamp={queue.headTimestamp} ttlMs={queue.ttl} clockOffset={clockOffset} />
      )}
    </motion.article>
  );
}
