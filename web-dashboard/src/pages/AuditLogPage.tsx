import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, Filter, RefreshCw, Search } from 'lucide-react';
import { auditService } from '../services/audit.service';
import { AuditLog } from '../types';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState, PageHeader, SkeletonRows } from '../components/ui/Feedback';
import { Table, TBody, TD, TH, THead, TR } from '../components/ui/Table';
import { toast } from '../components/ui/Toast';
import { formatDate, formatTime, getErrorMessage, humanize } from '../lib/utils';
import { roleLabel } from '../lib/status';

const PAGE_SIZE = 20;

const targetTypes = ['User', 'Emergency', 'Booking', 'Order', 'Medicine', 'Consultation', 'Room', 'Setting'];

const actionLabel = (action: string) => action.split('.').map(humanize).join(' · ');

export const AuditLogPage: React.FC = () => {
  const [entries, setEntries] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const query = useMemo(
    () => ({ page, limit: PAGE_SIZE, action: action.trim() || undefined, targetType: targetType === 'ALL' ? undefined : targetType, from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined, to: to ? new Date(`${to}T23:59:59.999`).toISOString() : undefined }),
    [action, from, page, targetType, to]
  );

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const result = await auditService.list(query);
        setEntries(result.entries);
        setTotalPages(result.meta.totalPages);
        setTotal(result.meta.total);
      } catch (error) {
        toast.error(getErrorMessage(error, 'Couldn’t load the audit log.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [query]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const applyFilters = () => setPage(1);
  const clearFilters = () => {
    setAction('');
    setTargetType('ALL');
    setFrom('');
    setTo('');
    setPage(1);
  };

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Audit log"
        description="A traceable record of sensitive changes across the campus platform."
        actions={
          <Button variant="secondary" size="sm" onClick={() => void load(true)} disabled={refreshing}>
            <RefreshCw className={refreshing ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5'} />
            Refresh
          </Button>
        }
      />

      <Card>
        <div className="grid gap-3 p-4 border-b border-line md:grid-cols-[minmax(0,1fr)_180px_150px_150px_auto_auto] md:items-end">
          <Input label="Action" aria-label="Filter by action" placeholder="e.g. booking.create" value={action} onChange={e => setAction(e.target.value)} leading={<Search className="w-4 h-4" />} />
          <Select label="Target" aria-label="Filter by target type" value={targetType} onChange={e => setTargetType(e.target.value)}>
            <option value="ALL">All targets</option>
            {targetTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </Select>
          <Input label="From" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          <Input label="To" type="date" value={to} onChange={e => setTo(e.target.value)} />
          <Button size="sm" onClick={applyFilters}><Filter className="w-3.5 h-3.5" />Apply</Button>
          <Button size="sm" variant="ghost" onClick={clearFilters}>Clear</Button>
        </div>

        {loading ? (
          <div className="pt-5"><SkeletonRows rows={6} /></div>
        ) : entries.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No audit entries" description="Try broadening the filters or check back after another operational action." />
        ) : (
          <>
            <Table>
              <THead className="border-t-0">
                <tr><TH>When</TH><TH>Actor</TH><TH>Action</TH><TH>Target</TH><TH>Details</TH></tr>
              </THead>
              <TBody>
                {entries.map(entry => (
                  <TR key={entry.id}>
                    <TD className="whitespace-nowrap"><p className="text-ink">{formatDate(entry.createdAt)}</p><p className="text-xs text-ink-3">{formatTime(entry.createdAt)}</p></TD>
                    <TD><p className="text-ink font-medium">{entry.actor.name}</p><p className="text-xs text-ink-3">{roleLabel[entry.actor.role]}</p></TD>
                    <TD><Badge tone="neutral">{actionLabel(entry.action)}</Badge></TD>
                    <TD><p className="text-ink">{entry.targetType}</p><p className="text-xs text-ink-3 font-mono">{entry.targetId || '—'}</p></TD>
                    <TD className="max-w-[280px]">
                      {entry.metadata ? <details><summary className="cursor-pointer text-ink-2 hover:text-ink">View metadata</summary><pre className="mt-2 max-w-full overflow-x-auto rounded bg-sunken p-2 text-[11px] text-ink-2">{JSON.stringify(entry.metadata, null, 2)}</pre></details> : <span className="text-ink-4">—</span>}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-[13px] text-ink-3">
              <span>{total} {total === 1 ? 'entry' : 'entries'}</span>
              <div className="flex items-center gap-2"><Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</Button><span className="tabular">Page {page} of {totalPages}</span><Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(value => value + 1)}>Next</Button></div>
            </div>
          </>
        )}
      </Card>
    </>
  );
};
