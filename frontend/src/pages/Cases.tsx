import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchTransactions } from '../api';
import { Search, Filter, ArrowUpDown, MoreHorizontal, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export default function Cases() {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', filter],
    queryFn: () => fetchTransactions(filter !== 'ALL' ? { status: filter } : {})
  });

  const transactions = data?.data || [];
  
  const filteredTransactions = transactions.filter((tx: any) => 
    tx.customer.name.toLowerCase().includes(search.toLowerCase()) || 
    tx.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Recovery Cases</h1>
          <p className="text-gray-400">Manage and monitor active revenue recovery workflows.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="gap-2">
            <Filter className="w-4 h-4" /> Filters
          </Button>
          <Button>Export CSV</Button>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center bg-surface/50">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Search by customer name or ID..." 
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex bg-background p-1 rounded-lg border border-border">
            {['ALL', 'PENDING', 'IN_PROGRESS', 'RECOVERED', 'FAILED'].map(f => (
              <button
                key={f}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filter === f ? 'bg-surfaceHover text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
                }`}
                onClick={() => setFilter(f)}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-surface/30 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-1 cursor-pointer hover:text-white">Case ID <ArrowUpDown className="w-3 h-3"/></div></th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-1 cursor-pointer hover:text-white">Amount <ArrowUpDown className="w-3 h-3"/></div></th>
                <th className="px-6 py-4 font-medium">Risk Score</th>
                <th className="px-6 py-4 font-medium">Root Cause</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({length: 5}).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({length: 7}).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-surfaceHover rounded animate-pulse w-24"></div></td>
                    ))}
                  </tr>
                ))
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No recovery cases found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx: any) => (
                  <tr key={tx.id} className="border-b border-border/50 hover:bg-surface/50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">
                      <Link to={`/cases/${tx.id}`} className="hover:text-primary transition-colors">
                        {tx.id.substring(0, 16)}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-200">{tx.customer.name}</div>
                      <div className="text-xs text-gray-500">{tx.customer.email}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-surfaceHover rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${tx.recoveryScore > 70 ? 'bg-success' : tx.recoveryScore > 55 ? 'bg-warning' : 'bg-danger'}`}
                            style={{ width: `${tx.recoveryScore}%` }}
                          ></div>
                        </div>
                        <span className="font-mono text-xs">{tx.recoveryScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-300 max-w-[200px] truncate" title={tx.errorDescription}>
                        {tx.errorDescription}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        tx.recoveryStatus === 'RECOVERED' ? 'success' :
                        tx.recoveryStatus === 'IN_PROGRESS' ? 'warning' :
                        tx.recoveryStatus === 'FAILED' ? 'danger' : 'secondary'
                      }>
                        {tx.recoveryStatus === 'RECOVERED' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {tx.recoveryStatus === 'IN_PROGRESS' && <Clock className="w-3 h-3 mr-1" />}
                        {tx.recoveryStatus === 'FAILED' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {tx.recoveryStatus.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/cases/${tx.id}`}>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          View Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-border flex items-center justify-between text-sm text-gray-400">
          <div>Showing {filteredTransactions.length} results</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
