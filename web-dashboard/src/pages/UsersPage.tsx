import React, { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { usersService } from '../services/users.service';
import { useAuthStore } from '../store/authStore';
import { Role, User } from '../types';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Field';
import { ConfirmDialog } from '../components/ui/Modal';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { Avatar, EmptyState, PageHeader, SkeletonRows } from '../components/ui/Feedback';
import { toast } from '../components/ui/Toast';
import { roleLabel } from '../lib/status';
import { formatDate, getErrorMessage } from '../lib/utils';

const roles = Object.keys(roleLabel) as Role[];

export const UsersPage: React.FC = () => {
  const currentUser = useAuthStore(state => state.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');
  const [pendingChange, setPendingChange] = useState<{ user: User; role: Role } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    usersService
      .getAll()
      .then(setUsers)
      .catch(err => toast.error(getErrorMessage(err, 'Couldn’t load people.')))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const confirmRoleChange = async () => {
    if (!pendingChange) return;
    setSaving(true);
    try {
      const updated = await usersService.updateRole(pendingChange.user.id, pendingChange.role);
      setUsers(prev => prev.map(u => (u.id === updated.id ? { ...u, role: updated.role } : u)));
      toast.success(`${pendingChange.user.name} is now ${roleLabel[pendingChange.role].toLowerCase()}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Couldn’t change the role.'));
    } finally {
      setSaving(false);
      setPendingChange(null);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="People"
        description="Everyone with a campus account, and what they can access."
      />

      <Card>
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between p-4 border-b border-line">
          <div className="w-full md:w-72">
            <Input
              aria-label="Search people"
              placeholder="Search by name or email"
              value={search}
              onChange={e => setSearch(e.target.value)}
              leading={<Search className="w-4 h-4" />}
              className="h-9"
            />
          </div>
          <div className="w-full md:w-56">
            <Select
              aria-label="Filter by role"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as 'ALL' | Role)}
              className="h-9"
            >
              <option value="ALL">All roles</option>
              {roles.map(r => (
                <option key={r} value={r}>
                  {roleLabel[r]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="pt-5">
            <SkeletonRows rows={5} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No one matches" description="Try a different name or role." />
        ) : (
          <Table>
            <THead className="border-t-0">
              <tr>
                <TH>Name</TH>
                <TH>Phone</TH>
                <TH>Joined</TH>
                <TH className="w-56">Role</TH>
              </tr>
            </THead>
            <TBody>
              {filtered.map(user => {
                const isSelf = user.id === currentUser?.id;
                return (
                  <TR key={user.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} size="sm" />
                        <div className="min-w-0">
                          <p className="text-ink font-medium truncate">
                            {user.name}
                            {isSelf && <span className="ml-2 text-xs text-ink-3 font-normal">You</span>}
                          </p>
                          <p className="text-xs text-ink-3 truncate">{user.email}</p>
                        </div>
                      </div>
                    </TD>
                    <TD className="tabular">{user.phone || '—'}</TD>
                    <TD className="whitespace-nowrap">{formatDate(user.createdAt)}</TD>
                    <TD>
                      <Select
                        aria-label={`Role for ${user.name}`}
                        value={user.role}
                        disabled={isSelf}
                        title={isSelf ? 'You can’t change your own role' : undefined}
                        onChange={e => setPendingChange({ user, role: e.target.value as Role })}
                        className="h-8 text-[13px]"
                      >
                        {roles.map(r => (
                          <option key={r} value={r}>
                            {roleLabel[r]}
                          </option>
                        ))}
                      </Select>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>

      <ConfirmDialog
        isOpen={!!pendingChange}
        title="Change role?"
        description={
          pendingChange
            ? `${pendingChange.user.name} will change from ${roleLabel[pendingChange.user.role].toLowerCase()} to ${roleLabel[pendingChange.role].toLowerCase()}. This changes what they can see and do. It takes effect the next time they sign in.`
            : ''
        }
        confirmLabel="Change role"
        isLoading={saving}
        onConfirm={confirmRoleChange}
        onCancel={() => setPendingChange(null)}
      />
    </>
  );
};
