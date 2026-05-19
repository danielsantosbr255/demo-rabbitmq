import { useState, useEffect, useRef } from 'react';
import { Send, Activity, AlertOctagon, Mail, MessageSquare, Bell, Zap, Clock, Terminal, RotateCcw, CheckCircle2, Server, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface QueueStats {
  name: string;
  messages: number;
}

interface LogEvent {
  id: string;
  time: Date;
  message: string;
  type: 'info' | 'error' | 'success' | 'warning';
}

interface DeadLetter {
  payload_bytes: number;
  message_count: number;
  properties: {
    message_id?: string;
    headers?: Record<string, any>;
  };
  payload: string;
}

const RETRY_TTLS: Record<string, number> = {
  'retry.0': 10,
  'retry.1': 30,
  'retry.2': 120,
};

function TimerBar({ enteredAt, ttlSeconds }: { enteredAt: number; ttlSeconds: number }) {
  const [progress, setProgress] = useState(100);
  const [secondsLeft, setSecondsLeft] = useState(ttlSeconds);

  useEffect(() => {
    const update = () => {
      const elapsed = (Date.now() - enteredAt) / 1000;
      const remaining = Math.max(0, ttlSeconds - elapsed);
      setProgress((remaining / ttlSeconds) * 100);
      setSecondsLeft(Math.ceil(remaining));
    };

    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [enteredAt, ttlSeconds]);

  return (
    <div className="w-full mt-3">
      <div className="flex justify-between text-[10px] font-semibold text-orange-400/80 mb-1">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 animate-spin" /> Retrying...
        </span>
        <span>{secondsLeft}s remaining</span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden border border-zinc-700/50">
        <div 
          className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}

function App() {
  const [channel, setChannel] = useState('email');
  const [to, setTo] = useState('john@mail.com');
  const [subject, setSubject] = useState('Simulation test');
  const [body, setBody] = useState('Checking advanced monorepo resiliency topology!');
  
  const [queues, setQueues] = useState<QueueStats[]>([]);
  const [dlqMessages, setDlqMessages] = useState<DeadLetter[]>([]);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [isSending, setIsSending] = useState(false);
  
  // Persist queue entry times in LocalStorage so they survive refresh!
  const [queueEntryTimes, setQueueEntryTimes] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('queue_entry_times');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const prevQueuesRef = useRef<QueueStats[]>([]);

  useEffect(() => {
    localStorage.setItem('queue_entry_times', JSON.stringify(queueEntryTimes));
  }, [queueEntryTimes]);

  const addLog = (message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') => {
    setLogs(prev => [{ id: Math.random().toString(), time: new Date(), message, type }, ...prev].slice(0, 50));
  };

  const fetchQueues = async () => {
    try {
      const res = await fetch('/rabbitmq-api/queues');
      if (res.ok) {
        const data: QueueStats[] = await res.json();
        setQueues(data);
        
        const newEntryTimes = { ...queueEntryTimes };
        let timesChanged = false;

        data.forEach(q => {
          const prev = prevQueuesRef.current.find(pq => pq.name === q.name);
          const prevCount = prev ? prev.messages : 0;
          
          if (q.messages > 0) {
            // If message count goes up or if we loaded a refresh and don't have it tracked
            if (prevCount === 0 || !newEntryTimes[q.name]) {
              newEntryTimes[q.name] = Date.now();
              timesChanged = true;
              if (q.name.includes('retry')) {
                addLog(`[RabbitMQ] Routing failed message to ${q.name}`, 'warning');
              } else if (q.name.includes('dlq')) {
                addLog(`[RabbitMQ] Message expired retries. Dead-lettered to DLQ!`, 'error');
                fetchDlq();
              }
            }
          } else {
            // Cleared
            if (newEntryTimes[q.name]) {
              delete newEntryTimes[q.name];
              timesChanged = true;
              if (q.name.includes('retry')) {
                addLog(`[RabbitMQ] Retry delay elapsed for ${q.name}. Processing again...`, 'info');
              }
            }
          }
        });
        
        if (timesChanged) setQueueEntryTimes(newEntryTimes);
        prevQueuesRef.current = data;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDlq = async () => {
    try {
      const res = await fetch('/rabbitmq-api/queues/%2F/q.notifications.dlq/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 20, ackmode: 'ack_requeue_true', encoding: 'auto', truncate: 50000 })
      });
      if (res.ok) {
        const data = await res.json();
        setDlqMessages(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const clearDlq = async () => {
    if (!confirm('Are you sure you want to purge the DLQ? This will acknowledge all dead letters.')) return;
    try {
      // Fetching with ack_requeue_false removes the messages
      const res = await fetch('/rabbitmq-api/queues/%2F/q.notifications.dlq/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 100, ackmode: 'ack_requeue_false', encoding: 'auto', truncate: 50000 })
      });
      if (res.ok) {
        addLog('DLQ successfully purged.', 'success');
        setDlqMessages([]);
        fetchQueues();
      }
    } catch (err) {
      addLog('Failed to purge DLQ', 'error');
    }
  };

  useEffect(() => {
    fetchQueues();
    fetchDlq();
    const interval = setInterval(fetchQueues, 1000);
    return () => clearInterval(interval);
  }, [queueEntryTimes]); // eslint-disable-line

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    addLog(`HTTP Gateway: Received POST /notifications`, 'info');
    
    let payload: any = { channel, body };
    if (channel === 'email') {
      payload.to = to;
      payload.subject = subject;
    } else if (channel === 'sms') {
      payload.to = to;
    } else if (channel === 'push') {
      payload.deviceToken = to;
      payload.title = subject;
    }

    try {
      const res = await fetch('/api-gateway/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, payload })
      });
      
      if (res.ok) {
        addLog(`HTTP Gateway: 202 Accepted. Enqueued to q.${channel}`, 'success');
      } else {
        const err = await res.json();
        addLog(`HTTP Gateway: 400 Bad Request. ${err.message || 'Validation failed'}`, 'error');
      }
    } catch (err: any) {
      addLog(`HTTP Gateway: Connection Refused. ${err.message}`, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const getQueueCount = (name: string) => {
    return queues.find(q => q.name === name)?.messages ?? 0;
  };

  const renderQueueNode = (title: string, queueName: string, icon: any, activeColor: string) => {
    const count = getQueueCount(queueName);
    const hasMessages = count > 0;
    const retryMatch = queueName.match(/retry\.(\d)/);
    const ttl = retryMatch ? RETRY_TTLS[`retry.${retryMatch[1]}`] : null;
    const enteredAt = queueEntryTimes[queueName];

    return (
      <motion.div 
        layout
        animate={{ 
          borderColor: hasMessages ? activeColor : 'rgba(39, 39, 42, 0.5)',
          boxShadow: hasMessages ? `0 0 15px ${activeColor}33` : 'none'
        }}
        className={`bg-zinc-900/90 rounded-xl p-4 border transition-all duration-300 flex flex-col justify-between`}
      >
        <div className="flex justify-between items-start gap-2">
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">{title}</span>
            <span className="text-xs font-mono text-zinc-400 block truncate max-w-[120px]">{queueName}</span>
          </div>
          <div className={`p-2 rounded-lg bg-zinc-800 ${hasMessages ? 'text-white' : 'text-zinc-500'}`} style={{ color: hasMessages ? activeColor : undefined }}>
            {icon}
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-xs text-zinc-500 font-medium">Messages:</span>
          <motion.span 
            key={count}
            initial={{ scale: 1.2, color: activeColor }}
            animate={{ scale: 1, color: hasMessages ? '#ffffff' : '#71717a' }}
            className="text-2xl font-mono font-bold"
          >
            {count}
          </motion.span>
        </div>

        {hasMessages && ttl && enteredAt && (
          <TimerBar enteredAt={enteredAt} ttlSeconds={ttl} />
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6 font-sans antialiased selection:bg-blue-500/30 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Glow Header */}
        <header className="relative flex items-center justify-between pb-5 border-b border-zinc-800/80">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[500px] h-[100px] bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Zap className="w-6 h-6 text-blue-500 fill-blue-500/10" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Resilience Pipeline Center
              </h1>
              <p className="text-xs text-zinc-400 font-medium">Fault-Tolerant Microservices Monitor</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <button 
              onClick={() => { fetchQueues(); fetchDlq(); addLog('Manual synchronization completed.', 'info'); }}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Synchronize
            </button>
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-3.5 py-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.1)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Pipeline Live
            </div>
          </div>
        </header>

        {/* Pipeline Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* STEP 1 & 2: Dispatcher & API Gateway */}
          <div className="lg:col-span-4 bg-zinc-950/40 rounded-2xl border border-zinc-800/50 p-5 flex flex-col justify-between shadow-xl shadow-black/40 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-blue-500/5 blur-[50px] rounded-full pointer-events-none transition-all duration-500 group-hover:bg-blue-500/10"></div>
            
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold flex items-center gap-2 text-white">
                  <Server className="w-4 h-4 text-blue-500" />
                  API Gateway Dispatcher
                </h2>
                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">PORT 3000</span>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Channel Select</label>
                  <div className="grid grid-cols-3 gap-2 bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800/60">
                    {['email', 'sms', 'push'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setChannel(c);
                          if (c === 'email') { setTo('john@mail.com'); setSubject('Simulation Test'); }
                          else if (c === 'sms') { setTo('+5511987654321'); }
                          else { setTo('push_token_device_abc123'); setSubject('Push Alert'); }
                        }}
                        className={`py-2 text-xs font-semibold rounded-lg capitalize transition-all ${channel === c ? 'bg-zinc-800 text-white border border-zinc-700/60 shadow-lg' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                      {channel === 'email' ? 'Recipient (Email)' : channel === 'sms' ? 'Recipient (Phone)' : 'Device Identifier'}
                    </label>
                    <input 
                      type="text"
                      required
                      className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-xs focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all font-mono placeholder:text-zinc-600"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                    />
                  </div>

                  {channel !== 'sms' && (
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                        {channel === 'email' ? 'Subject line' : 'Notification Title'}
                      </label>
                      <input 
                        type="text"
                        required
                        className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-xs focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all font-mono placeholder:text-zinc-600"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Payload Content</label>
                    <textarea 
                      required
                      rows={5}
                      className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-xs focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none resize-none transition-all font-mono placeholder:text-zinc-600"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="pt-4 border-t border-zinc-800/50 mt-6">
              <button 
                onClick={handleSubmit}
                disabled={isSending}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white text-xs font-bold py-3 rounded-xl transition-all shadow-[0_4px_20px_rgba(59,130,246,0.15)] flex items-center justify-center gap-2 border border-blue-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                {isSending ? 'Transmitting...' : 'Transmit Notification'}
              </button>
            </div>
          </div>

          {/* STEP 3 & 4: Pipeline & Worker Queues */}
          <div className="lg:col-span-5 bg-zinc-950/40 rounded-2xl border border-zinc-800/50 p-5 shadow-xl shadow-black/40 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between">
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold flex items-center gap-2 text-white">
                <Activity className="w-4 h-4 text-emerald-500" />
                Active Resilience Pipeline
              </h2>
              <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">RABBITMQ EXCHANGE</span>
            </div>

            <div className="space-y-6 flex-1 flex flex-col justify-center">
              {/* Email Pipeline Row */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-1.5">
                  <Mail className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-zinc-400 tracking-wider">EMAIL TOPOLOGY</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {renderQueueNode('Main', 'q.email', <Activity className="w-3.5 h-3.5" />, '#3b82f6')}
                  {renderQueueNode('Retry 1', 'q.email.retry.0', <Clock className="w-3.5 h-3.5" />, '#f59e0b')}
                  {renderQueueNode('Retry 2', 'q.email.retry.1', <Clock className="w-3.5 h-3.5" />, '#f97316')}
                  {renderQueueNode('Retry 3', 'q.email.retry.2', <Clock className="w-3.5 h-3.5" />, '#ef4444')}
                </div>
              </div>

              {/* SMS Pipeline Row */}
              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-zinc-400 tracking-wider">SMS TOPOLOGY</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {renderQueueNode('Main', 'q.sms', <Activity className="w-3.5 h-3.5" />, '#10b981')}
                  {renderQueueNode('Retry 1', 'q.sms.retry.0', <Clock className="w-3.5 h-3.5" />, '#f59e0b')}
                  {renderQueueNode('Retry 2', 'q.sms.retry.1', <Clock className="w-3.5 h-3.5" />, '#f97316')}
                  {renderQueueNode('Retry 3', 'q.sms.retry.2', <Clock className="w-3.5 h-3.5" />, '#ef4444')}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/50 flex items-center justify-between text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" /> Failover setup active: 3 Retries before DLQ.
              </span>
            </div>
          </div>

          {/* STEP 5: Terminal / Activity Feed */}
          <div className="lg:col-span-3 bg-zinc-950/60 rounded-2xl border border-zinc-800/80 p-5 flex flex-col justify-between shadow-2xl shadow-black/80 relative overflow-hidden h-[600px]">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800/80 pb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2 text-zinc-200">
                <Terminal className="w-4 h-4 text-zinc-500" />
                Live Event Stream
              </h2>
              <span className="text-[9px] font-bold text-zinc-500">POLLING 1S</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar font-mono text-xs text-zinc-400">
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border-l border-zinc-800 pl-3 py-1.5 space-y-0.5"
                  >
                    <span className="text-[9px] text-zinc-600 block">
                      {format(log.time, 'HH:mm:ss.SSS')}
                    </span>
                    <span 
                      className="block leading-relaxed"
                      style={{
                        color: log.type === 'error' ? '#f87171' : log.type === 'success' ? '#4ade80' : log.type === 'warning' ? '#fbbf24' : '#60a5fa'
                      }}
                    >
                      {log.message}
                    </span>
                  </motion.div>
                ))}
                {logs.length === 0 && (
                  <div className="text-zinc-600 text-center py-20 italic">
                    Pipeline idling... waiting for transmissions.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* DLQ Inspector Section */}
        <div className="bg-gradient-to-r from-red-950/20 via-zinc-950/40 to-red-950/20 rounded-2xl border border-red-900/30 p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent"></div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)] text-red-500">
                <AlertOctagon className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-200">Dead Letter Queue (DLQ) Inspector</h2>
                <p className="text-xs text-zinc-500">Visualizing structural processing failures & broken dependencies</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {dlqMessages.length > 0 && (
                <button 
                  onClick={clearDlq}
                  className="px-4 py-2 text-xs bg-red-900/40 text-red-300 border border-red-800/40 rounded-xl font-bold hover:bg-red-900/60 active:scale-95 transition-all flex items-center gap-1.5 shadow-lg shadow-red-950/30"
                >
                  Purge Inspector Queue
                </button>
              )}
              <button 
                onClick={fetchDlq}
                className="px-4 py-2 text-xs bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-xl font-bold hover:bg-zinc-800 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Re-Scan DLQ
              </button>
            </div>
          </div>

          {dlqMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-600 border border-zinc-900 border-dashed rounded-xl bg-zinc-950/10">
              <CheckCircle2 className="w-12 h-12 mb-3 text-zinc-700 opacity-60" />
              <p className="text-sm font-semibold text-zinc-500">Inspector Clear</p>
              <p className="text-xs text-zinc-600 mt-1">Dead Letter Queue is empty. Resiliency pipelines healthy.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence>
                {dlqMessages.map((msg, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={msg.properties.message_id || i}
                    className="bg-[#120707] border border-red-900/30 hover:border-red-900/60 rounded-xl p-4 text-xs shadow-xl transition-all"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-mono text-[10px] text-zinc-500 block truncate max-w-[150px]">ID: {msg.properties.message_id}</span>
                      <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                        Attempts: {msg.properties.headers?.['x-retry-count'] || '3+'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-red-300/80 font-semibold text-[10px] uppercase tracking-wider">Raw Payload</p>
                      <pre className="bg-[#050202] p-3 rounded-lg border border-red-950/60 font-mono text-[10px] overflow-x-auto text-red-200/90 whitespace-pre-wrap max-h-[120px] custom-scrollbar">
                        {msg.payload}
                      </pre>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

      </div>
      
      {/* Scrollbar Customization */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
}

export default App;
