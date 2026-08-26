import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMonitoringStatus } from '../api';
import { Power, Settings, ShieldAlert, Cpu, Network, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export default function AgentControl() {
  const [isAgentRunning, setIsAgentRunning] = useState(true);

  const { data: monitoring, isLoading } = useQuery({
    queryKey: ['monitoringStatus'],
    queryFn: fetchMonitoringStatus,
    refetchInterval: 5000 // Poll every 5s to simulate live monitoring
  });

  const toggleAgent = () => setIsAgentRunning(!isAgentRunning);

  if (isLoading) return <div className="p-8 text-center text-gray-400 animate-pulse">Connecting to agent supervisor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Agent Control Center</h1>
          <p className="text-gray-400">Master controls and live telemetry for the autonomous recovery engine.</p>
        </div>
        
        <div className="bg-surface border border-border p-2 rounded-lg flex items-center gap-4 pr-6">
          <Button 
            onClick={toggleAgent}
            variant={isAgentRunning ? 'destructive' : 'default'}
            className={!isAgentRunning ? 'bg-success hover:bg-success/90 text-white' : ''}
          >
            <Power className="w-4 h-4 mr-2" />
            {isAgentRunning ? 'Halt Agent' : 'Start Agent'}
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-400">Status:</span>
            {isAgentRunning ? (
              <Badge variant="success" className="animate-pulse">ONLINE</Badge>
            ) : (
              <Badge variant="danger">OFFLINE</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Core Telemetry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Engine Version</span>
              <span className="font-mono text-sm">{monitoring?.monitoringVersion || 'v1.4.2'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Memory Usage</span>
              <span className="font-mono text-sm">482 MB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Active Threads</span>
              <span className="font-mono text-sm">12</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Last Heartbeat</span>
              <span className="font-mono text-xs text-success">{new Date().toLocaleTimeString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <Network className="w-4 h-4" /> Pipeline Throughput
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Processed Today</span>
              <span className="font-mono text-sm font-bold text-white">{monitoring?.metrics?.totalRecoveredToday || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Active Tasks</span>
              <span className="font-mono text-sm text-primary">{monitoring?.activeRecoveries || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Queue Depth</span>
              <span className="font-mono text-sm">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Avg Inference Time</span>
              <span className="font-mono text-sm">245ms</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Razorpay API</span>
              <Badge variant="success" className="bg-transparent border-none p-0"><CheckCircle2 className="w-4 h-4 text-success mr-1"/> OK</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Email Gateway</span>
              <Badge variant="success" className="bg-transparent border-none p-0"><CheckCircle2 className="w-4 h-4 text-success mr-1"/> OK</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">SMS Gateway</span>
              <Badge variant="success" className="bg-transparent border-none p-0"><CheckCircle2 className="w-4 h-4 text-success mr-1"/> OK</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">ML Model Server</span>
              <Badge variant="success" className="bg-transparent border-none p-0"><CheckCircle2 className="w-4 h-4 text-success mr-1"/> OK</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-warning/20">
        <CardHeader>
          <CardTitle className="text-sm text-warning">Critical Alerts & Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black/50 border border-border rounded-lg p-4 font-mono text-xs text-gray-300 h-64 overflow-y-auto space-y-2">
            <div>[11:42:01] INFO: Agent heartbeat acknowledged.</div>
            <div>[11:42:05] INFO: Polling Razorpay webhooks...</div>
            <div>[11:42:15] WARN: Rate limit approaching for SMS gateway (85%).</div>
            <div>[11:43:00] INFO: Processed 3 pending recovery tasks.</div>
            <div className="text-success">[11:43:02] SUCCESS: Transaction pay_K9Q8s2 completed recovery workflow.</div>
            {isAgentRunning ? (
              <div className="animate-pulse text-gray-500">_ Listening for events...</div>
            ) : (
              <div className="text-danger font-bold">[11:44:00] FATAL: Agent manually halted by user.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
