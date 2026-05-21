import { type ReactNode } from 'react';
import type { QueueStats } from '../types/dashboard';
import { QueueNode } from './QueueNode';

interface PipelineItem {
  title: string;
  queueName: string;
  icon: ReactNode;
  activeColor: string;
  activeBg: string;
}

interface PipelineSectionProps {
  label: string;
  icon: ReactNode;
  items: PipelineItem[];
  queues: QueueStats[];
  clockOffset: number;
}

export function PipelineSection({ label, icon, items, queues, clockOffset }: PipelineSectionProps) {
  const sectionId = `pipeline-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const getQueue = (queueName: string) => queues.find((queue) => queue.name === queueName);

  return (
    <section aria-labelledby={sectionId} className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 id={sectionId} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {label}
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
        {items.map((item) => (
          <QueueNode
            key={item.queueName}
            title={item.title}
            queue={getQueue(item.queueName)}
            icon={item.icon}
            activeColor={item.activeColor}
            activeBg={item.activeBg}
            clockOffset={clockOffset}
          />
        ))}
      </div>
    </section>
  );
}
