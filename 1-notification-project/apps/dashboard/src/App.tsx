import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Activity, AlertOctagon, Mail, MessageSquare, Zap, Clock, Terminal, RotateCcw, CheckCircle2, Server, HelpCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface QueueStats {
  name: string;
  messages: number;
  messagesUnacked?: number;
  ttl: number | null;
  headTimestamp: number | null;
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

const INSPECTOR_URL = import.meta.env.VITE_INSPECTOR_URL ?? 'http://localhost:3001';
const GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL ?? 'http://localhost:3000';

function TimerBar({ headTimestamp, ttlMs, clockOffset }: { headTimestamp: number; ttlMs: number, clockOffset: number }) {
  const [progress, setProgress] = useState(100);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const update = () => {
      const enteredAtMs = headTimestamp * 1000;
      const expiresAtMs = enteredAtMs + ttlMs;
      const now = Date.now() + clockOffset;
      const remainingMs = Math.max(0, expiresAtMs - now);
      setProgress((remainingMs / ttlMs) * 100);
      setSecondsLeft(Math.ceil(remainingMs / 1000));
    };
    update();
    const interval = setInterval(update, 200);
    return () => clearInterval(interval);
  }, [headTimestamp, ttlMs, clockOffset]);

  return (
    <div className="w-full mt-2">
      <div className="flex justify-between text-[9px] font-semibold text-amber-600 mb-1">
        <span className="flex items-center gap-1">
          <Clock className="w-2.5 h-2.5 animate-spin" /> Reprocessando...
        </span>
        <span>{secondsLeft}s</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-400 to-orange-400 h-full transition-all duration-200 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function App() {
  const [channel, setChannel] = useState('email');
  const [to, setTo] = useState('john@mail.com');
  const [subject, setSubject] = useState('Teste de simulação');
  const [body, setBody] = useState('Verificando topologia avançada de resiliência do monorepo!');

  const [queues, setQueues] = useState<QueueStats[]>([]);
  const [dlqMessages, setDlqMessages] = useState<DeadLetter[]>([]);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [clockOffset, setClockOffset] = useState(0);

  // Use refs for tracking transitions — avoids the re-render loop
  const prevQueuesRef = useRef<QueueStats[]>([]);
  const hasLoggedRef = useRef<Set<string>>(new Set());

  const addLog = useCallback((message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') => {
    setLogs(prev => [{ id: crypto.randomUUID(), time: new Date(), message, type }, ...prev].slice(0, 80));
  }, []);

  const fetchDlq = useCallback(async () => {
    try {
      const res = await fetch(INSPECTOR_URL + '/dlq');
      if (res.ok) {
        const data = await res.json();
        setDlqMessages(Array.isArray(data) ? data : []);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchQueues = useCallback(async () => {
    try {
      const res = await fetch(INSPECTOR_URL + '/queues');
      if (!res.ok) return;

      const payload = await res.json() as { serverTime: number, queues: QueueStats[] };
      const data = payload.queues;
      
      const offset = payload.serverTime - Date.now();
      setClockOffset(offset);

      // Detect real transitions (0→N or N→0) using refs — no state loop
      const prevMap = new Map(prevQueuesRef.current.map(q => [q.name, q.messages]));

      data.forEach(q => {
        const prevCount = prevMap.get(q.name) ?? 0;
        const key = q.name;

        if (q.name.includes('dlq') && q.messages !== prevCount) {
          fetchDlq();
        }

        if (q.messages > 0 && prevCount === 0) {
          // Transition: empty → has messages
          if (!hasLoggedRef.current.has(key)) {
            hasLoggedRef.current.add(key);
            if (q.name.includes('retry')) {
              addLog(`[Pipeline] Mensagem encaminhada para ${q.name}`, 'warning');
            } else if (q.name.includes('dlq')) {
              addLog(`[Pipeline] Tentativas esgotadas — mensagem na fila morta!`, 'error');
            }
          }
        } else if (q.messages === 0 && prevCount > 0) {
          // Transition: had messages → empty
          hasLoggedRef.current.delete(key);
          if (q.name.includes('retry')) {
            addLog(`[Pipeline] Atraso de ${q.name} expirado — reprocessando...`, 'info');
          }
        }
      });

      prevQueuesRef.current = data;
      setQueues(data);
    } catch {
      // silent
    }
  }, [addLog, fetchDlq]);

  const clearDlq = async () => {
    if (!confirm('Tem certeza que deseja limpar a DLQ? Isso removerá permanentemente todas as mensagens mortas.')) return;
    setIsPurging(true);
    try {
      const res = await fetch(INSPECTOR_URL + '/dlq', { method: 'DELETE' });
      if (res.ok) {
        addLog('DLQ limpa com sucesso.', 'success');
        setDlqMessages([]);
        await fetchQueues();
      } else {
        addLog(`Falha ao limpar DLQ: ${res.statusText}`, 'error');
      }
    } catch (err: any) {
      addLog(`Falha ao limpar DLQ: ${err.message}`, 'error');
    } finally {
      setIsPurging(false);
    }
  };

  // Single stable effect — no dependency loop
  useEffect(() => {
    fetchQueues();
    fetchDlq();
    const interval = setInterval(() => {
      fetchQueues();
    }, 500);
    return () => clearInterval(interval);
  }, [fetchQueues, fetchDlq]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    addLog(`Gateway: POST /notifications [canal=${channel}]`, 'info');

    const payload: any = { channel, body };
    if (channel === 'email') {
      payload.to = to;
      payload.subject = subject;
    } else if (channel === 'sms') {
      payload.to = to;
    }

    try {
      const res = await fetch(GATEWAY_URL + '/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, payload }),
      });

      if (res.ok) {
        addLog(`Gateway: 202 Aceito — enfileirado em q.${channel}`, 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        addLog(`Gateway: ${res.status} — ${err.message ?? 'Validação falhou'}`, 'error');
      }
    } catch (err: any) {
      addLog(`Gateway: Conexão recusada — ${err.message}`, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const getQueue = (name: string) => queues.find(q => q.name === name);

  const renderQueueNode = (title: string, queueName: string, icon: React.ReactNode, activeColor: string, activeBg: string) => {
    const q = getQueue(queueName);
    const count = q?.messages ?? 0;
    const unacked = q?.messagesUnacked ?? 0;
    const isProcessing = unacked > 0;
    const isActive = count > 0 || isProcessing;

    return (
      <motion.div
        layout
        animate={{
          borderColor: isActive ? activeColor : '#e2e8f0',
          boxShadow: isActive ? `0 0 12px ${activeColor}40` : 'none',
        }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl p-3 border-2 flex flex-col gap-1 min-w-0"
      >
        <div className="flex items-center justify-between gap-1">
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">{title}</span>
            <span className="text-[10px] font-mono text-slate-500 block truncate">{queueName}</span>
          </div>
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="flex items-center gap-1 text-[9px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-md"
                >
                  <Activity className="w-3 h-3 animate-pulse" /> Processando...
                </motion.div>
              )}
            </AnimatePresence>
            <div
              className="p-1.5 rounded-lg flex-shrink-0"
              style={{ backgroundColor: isActive ? activeBg : '#f1f5f9', color: isActive ? activeColor : '#94a3b8' }}
            >
              {icon}
            </div>
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

        {isActive && q?.ttl && q?.headTimestamp && (
          <TimerBar headTimestamp={q.headTimestamp} ttlMs={q.ttl} clockOffset={clockOffset} />
        )}
      </motion.div>
    );
  };

  const logColors = {
    info: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100">
            <Zap className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-tight">Centro de Resiliência</h1>
            <p className="text-[11px] text-slate-400 font-medium">Monitor de Microsserviços Tolerante a Falhas</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchQueues(); fetchDlq(); addLog('Sincronização manual realizada.', 'info'); }}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Sincronizar
          </button>
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Pipeline Ativo
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex gap-0 h-[calc(100vh-57px)] overflow-hidden">

        {/* Column 1: Dispatcher */}
        <div className="w-80 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-y-auto">
          <div className="p-5 flex flex-col gap-4 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                <Server className="w-4 h-4 text-indigo-400" /> Despachante API Gateway
              </h2>
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">:3000</span>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Canal</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  {['email', 'sms'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setChannel(c);
                        if (c === 'email') { setTo('john@mail.com'); setSubject('Teste de Simulação'); }
                        else { setTo('+5511987654321'); setSubject(''); }
                      }}
                      className={`py-2 text-xs font-semibold rounded-lg capitalize transition-all ${channel === c
                        ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      {c === 'email' ? '✉ E-mail' : '💬 SMS'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  {channel === 'email' ? 'E-mail do Destinatário' : 'Número de Telefone'}
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all font-mono"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                />
              </div>

              {channel === 'email' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Assunto</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Corpo da Mensagem</label>
                <textarea
                  required
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none resize-none transition-all font-mono"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 active:scale-[0.98] text-white text-sm font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
                {isSending ? 'Enviando...' : 'Enviar Notificação'}
              </button>
            </form>
          </div>
        </div>

        {/* Column 2: Pipeline + DLQ */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Pipeline */}
          <div className="flex-shrink-0 border-b border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                <Activity className="w-4 h-4 text-emerald-500" /> Pipeline de Resiliência Ativo
              </h2>
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">RABBITMQ</span>
            </div>

            <div className="flex flex-col gap-4">
              {/* Email Row */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-3.5 h-3.5 text-sky-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Topologia E-mail</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {renderQueueNode('Principal', 'q.email', <Activity className="w-3 h-3" />, '#3b82f6', '#eff6ff')}
                  {renderQueueNode('Tentativa 1', 'q.email.retry.0', <Clock className="w-3 h-3" />, '#f59e0b', '#fffbeb')}
                  {renderQueueNode('Tentativa 2', 'q.email.retry.1', <Clock className="w-3 h-3" />, '#f97316', '#fff7ed')}
                  {renderQueueNode('Tentativa 3', 'q.email.retry.2', <Clock className="w-3 h-3" />, '#ef4444', '#fef2f2')}
                </div>
              </div>

              {/* SMS Row */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Topologia SMS</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {renderQueueNode('Principal', 'q.sms', <Activity className="w-3 h-3" />, '#10b981', '#f0fdf4')}
                  {renderQueueNode('Tentativa 1', 'q.sms.retry.0', <Clock className="w-3 h-3" />, '#f59e0b', '#fffbeb')}
                  {renderQueueNode('Tentativa 2', 'q.sms.retry.1', <Clock className="w-3 h-3" />, '#f97316', '#fff7ed')}
                  {renderQueueNode('Tentativa 3', 'q.sms.retry.2', <Clock className="w-3 h-3" />, '#ef4444', '#fef2f2')}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> 3 tentativas com atraso exponencial antes da fila morta (DLQ).
            </p>
          </div>

          {/* DLQ Inspector */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
                  <AlertOctagon className="w-4 h-4 text-rose-500" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-700">Inspetor de Fila Morta (DLQ)</h2>
                  <p className="text-[11px] text-slate-400">Mensagens que esgotaram todas as tentativas de reprocessamento</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {dlqMessages.length > 0 && (
                  <button
                    onClick={clearDlq}
                    disabled={isPurging}
                    className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {isPurging ? 'Limpando...' : 'Limpar DLQ'}
                  </button>
                )}
                <button
                  onClick={fetchDlq}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Atualizar
                </button>
              </div>
            </div>

            {dlqMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white">
                <CheckCircle2 className="w-10 h-10 text-emerald-300 mb-3" />
                <p className="text-sm font-semibold text-slate-500">DLQ Limpa</p>
                <p className="text-xs text-slate-400 mt-1">Todos os pipelines saudáveis — sem mensagens mortas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                <AnimatePresence>
                  {dlqMessages.map((msg, i) => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      key={msg.properties.message_id ?? i}
                      className="bg-white border border-rose-100 hover:border-rose-200 rounded-xl p-4 text-xs shadow-sm transition-all"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]">
                          {msg.properties.message_id ?? `msg-${i}`}
                        </span>
                        <span className="bg-rose-50 border border-rose-200 text-rose-500 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide flex-shrink-0">
                          {msg.properties.headers?.['x-retry-count'] ?? 3} tentativas
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payload Original</p>
                      <pre className="bg-rose-50 p-2.5 rounded-lg border border-rose-100 font-mono text-[10px] overflow-x-auto text-rose-700 whitespace-pre-wrap max-h-[100px]">
                        {msg.payload}
                      </pre>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Event Log */}
        <div className="w-72 flex-shrink-0 border-l border-slate-200 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
              <Terminal className="w-4 h-4 text-slate-400" /> Stream de Eventos
            </h2>
            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">500ms POLL</span>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 font-mono text-[11px]">
            <AnimatePresence initial={false}>
              {logs.map(log => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-l-2 pl-2.5 py-1"
                  style={{ borderColor: logColors[log.type] }}
                >
                  <span className="text-[9px] text-slate-400 block">
                    {format(log.time, 'HH:mm:ss.SSS')}
                  </span>
                  <span className="block leading-relaxed break-words" style={{ color: logColors[log.type] }}>
                    {log.message}
                  </span>
                </motion.div>
              ))}
              {logs.length === 0 && (
                <div className="text-slate-400 text-center py-16 italic text-xs">
                  Aguardando eventos...
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
