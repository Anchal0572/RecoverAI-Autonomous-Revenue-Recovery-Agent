import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CheckCircle2, Copy } from 'lucide-react';

export default function Integrations() {
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText('https://api.recoverai.com/v1/webhooks/razorpay');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xl leading-none -mt-1">R</span>
          </div>
          Razorpay Integration
        </h1>
        <p className="text-gray-400">Connect your Razorpay account to start recovering failed payments automatically.</p>
      </div>

      <Card className="border-success/30">
        <CardHeader className="bg-success/5 border-b border-success/20">
          <CardTitle className="text-base text-success flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Connection Active
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-gray-400">Account ID</span>
            <span className="font-mono text-sm">acc_M9q8w2L91Ks</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-gray-400">Environment</span>
            <Badge variant="success">LIVE</Badge>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-gray-400">Last Sync</span>
            <span className="text-sm">2 minutes ago</span>
          </div>
          <div className="pt-4 flex justify-end">
            <Button variant="outline" className="text-danger border-danger/30 hover:bg-danger/10">Disconnect Account</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">Webhook Configuration</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Webhook URL</label>
            <div className="flex gap-2">
              <Input value="https://api.recoverai.com/v1/webhooks/razorpay" readOnly className="bg-surface font-mono text-sm text-gray-400" />
              <Button variant="secondary" onClick={copyUrl} className="shrink-0 w-24">
                {copied ? <CheckCircle2 className="w-4 h-4 text-success" /> : <><Copy className="w-4 h-4 mr-2" /> Copy</>}
              </Button>
            </div>
            <p className="text-xs text-gray-500">Paste this URL into your Razorpay Webhook settings.</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Required Events</label>
            <div className="grid grid-cols-2 gap-3">
              {['payment.failed', 'payment.authorized', 'payment.captured', 'order.paid'].map(event => (
                <div key={event} className="flex items-center gap-2 bg-surface border border-border p-3 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="font-mono text-xs">{event}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">API Credentials</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Key ID</label>
            <Input value="rzp_live_K9xxxxxxxxxxx" readOnly className="font-mono text-sm bg-surface" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Key Secret</label>
            <Input type="password" value="xxxxxxxxxxxxxxxxxxxxxxxx" readOnly className="font-mono text-sm bg-surface" />
          </div>
          <Button variant="secondary" className="mt-2">Rotate Credentials</Button>
        </CardContent>
      </Card>
    </div>
  );
}
