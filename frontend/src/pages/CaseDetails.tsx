import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTransaction } from '../api';
import { ArrowLeft, User, CreditCard, Activity, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

export default function CaseDetails() {
  const { id } = useParams();

  const { data: tx, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => fetchTransaction(id || ''),
    enabled: !!id
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-400 animate-pulse">Loading case details...</div>;
  }

  if (!tx) {
    return <div className="p-8 text-center text-danger">Case not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/cases" className="p-2 hover:bg-surfaceHover rounded-lg text-gray-400 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Case: {tx.id.substring(0, 14)}</h1>
            <Badge variant={
              tx.recoveryStatus === 'RECOVERED' ? 'success' :
              tx.recoveryStatus === 'IN_PROGRESS' ? 'warning' :
              tx.recoveryStatus === 'FAILED' ? 'danger' : 'secondary'
            }>
              {tx.recoveryStatus}
            </Badge>
          </div>
          <p className="text-sm text-gray-400 mt-1">Failed on {new Date(tx.createdAt).toLocaleString('en-IN')}</p>
        </div>
        
        <div className="ml-auto flex gap-3">
          <Link to="/decision-center">
            <Button variant="outline" className="gap-2">
              <Activity className="w-4 h-4" /> AI Analysis
            </Button>
          </Link>
          {tx.recoveryStatus === 'PENDING' && (
            <Button className="bg-primary text-white">Trigger Recovery</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Info */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-gray-300">
              <User className="w-4 h-4" /> Customer Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-lg font-bold text-white">{tx.customer.name}</div>
              <div className="text-sm text-gray-400">{tx.customer.email}</div>
              <div className="text-sm text-gray-400">{tx.customer.phone}</div>
            </div>
            
            <div className="pt-4 border-t border-border">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Lifetime Value</div>
              <div className="text-xl font-semibold text-success">₹{tx.customer.ltv.toLocaleString('en-IN')}</div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-gray-300">
              <CreditCard className="w-4 h-4" /> Original Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Order ID</div>
                  <div className="font-mono text-sm">{tx.orderId}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Amount</div>
                  <div className="text-2xl font-bold text-white">₹{tx.amount.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Payment Method</div>
                  <div className="text-sm capitalize">{tx.paymentMethod} • {tx.bank}</div>
                </div>
              </div>
              
              <div className="space-y-4 border-l border-border pl-6">
                <div>
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-danger" /> Failure Reason
                  </div>
                  <div className="text-sm font-medium text-danger bg-danger-bg p-2 rounded border border-danger/20 mt-1">
                    {tx.errorCode}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Gateway Message</div>
                  <div className="text-sm text-gray-300">{tx.errorDescription}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Retry Count</div>
                  <div className="text-sm">{tx.retryCount} attempts</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
