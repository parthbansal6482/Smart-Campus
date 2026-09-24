import React, { useCallback, useEffect, useState } from 'react';
import { ChefHat, Plus, Soup } from 'lucide-react';
import { cafeteriaService } from '../services/cafeteria.service';
import { MenuCategory, MenuItem, Order, OrderStatus } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select, Switch, Textarea } from '../components/ui/Field';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { Segmented, Tabs } from '../components/ui/Tabs';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { EmptyState, PageHeader, Skeleton, SkeletonRows } from '../components/ui/Feedback';
import { toast } from '../components/ui/Toast';
import { orderLabel, orderNextAction, orderTone } from '../lib/status';
import { cn, formatCurrency, formatDate, formatTime, getErrorMessage, humanize, timeAgo } from '../lib/utils';

type Section = 'live' | 'history' | 'menu';

const categories: MenuCategory[] = ['BREAKFAST', 'LUNCH', 'SNACKS', 'BEVERAGES', 'DESSERTS', 'SPECIAL'];

const columns: { title: string; statuses: OrderStatus[]; empty: string }[] = [
  { title: 'New', statuses: ['PLACED', 'ACCEPTED'], empty: 'New orders land here.' },
  { title: 'Preparing', statuses: ['PREPARING'], empty: 'Nothing on the stove.' },
  { title: 'Ready', statuses: ['READY'], empty: 'Nothing waiting at the counter.' },
];

interface MenuForm {
  id?: string;
  name: string;
  description: string;
  category: MenuCategory;
  price: string;
  isVeg: boolean;
  spiceLevel: string;
}

const emptyForm: MenuForm = { name: '', description: '', category: 'LUNCH', price: '', isVeg: true, spiceLevel: '0' };

const VegMark: React.FC<{ isVeg: boolean }> = ({ isVeg }) => (
  <span
    title={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
    className={cn(
      'inline-flex w-3.5 h-3.5 items-center justify-center rounded-[3px] border shrink-0',
      isVeg ? 'border-ok' : 'border-critical'
    )}
  >
    <span className={cn('w-1.5 h-1.5 rounded-full', isVeg ? 'bg-ok' : 'bg-critical')} />
  </span>
);

export const CafeteriaPage: React.FC = () => {
  const [section, setSection] = useState<Section>('live');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | MenuCategory>('ALL');
  const [form, setForm] = useState<MenuForm | null>(null);
  const [saving, setSaving] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      setOrders(await cafeteriaService.getOrders(true));
    } catch {
      /* keep last known board */
    }
  }, []);

  useEffect(() => {
    (async () => {
      const [ordersRes, menuRes] = await Promise.allSettled([cafeteriaService.getOrders(true), cafeteriaService.getMenu()]);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value);
      if (menuRes.status === 'fulfilled') setMenu(menuRes.value);
      setLoading(false);
    })();
    const interval = setInterval(loadOrders, 20000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const liveOrders = orders.filter(o => ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status));
  const pastOrders = orders.filter(o => o.status === 'COLLECTED' || o.status === 'CANCELLED');
  const visibleMenu = menu.filter(m => categoryFilter === 'ALL' || m.category === categoryFilter);
  const unavailableCount = menu.filter(m => !m.isAvailable).length;

  const advanceOrder = async (order: Order, status: OrderStatus) => {
    setBusyId(order.id);
    try {
      const updated = await cafeteriaService.updateOrderStatus(order.id, status);
      setOrders(prev => prev.map(o => (o.id === order.id ? updated : o)));
      if (status === 'READY') toast.success(`${order.orderToken} marked ready for pickup`);
      if (status === 'CANCELLED') toast.success(`${order.orderToken} cancelled`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Couldn’t update the order.'));
    } finally {
      setBusyId(null);
      setCancelTarget(null);
    }
  };

  const toggleAvailability = async (item: MenuItem, isAvailable: boolean) => {
    setMenu(prev => prev.map(m => (m.id === item.id ? { ...m, isAvailable } : m)));
    try {
      await cafeteriaService.updateMenuItem(item.id, { isAvailable });
      toast.success(`${item.name} ${isAvailable ? 'is back on the menu' : 'marked sold out'}`);
    } catch (err) {
      setMenu(prev => prev.map(m => (m.id === item.id ? { ...m, isAvailable: !isAvailable } : m)));
      toast.error(getErrorMessage(err, `Couldn’t update ${item.name}.`));
    }
  };

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    const payload: Partial<MenuItem> = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      price: parseFloat(form.price),
      isVeg: form.isVeg,
      spiceLevel: parseInt(form.spiceLevel, 10),
    };
    try {
      if (form.id) {
        const updated = await cafeteriaService.updateMenuItem(form.id, payload);
        setMenu(prev => prev.map(m => (m.id === form.id ? updated : m)));
        toast.success(`${payload.name} updated`);
      } else {
        const created = await cafeteriaService.createMenuItem(payload);
        setMenu(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success(`${payload.name} added to the menu`);
      }
      setForm(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Couldn’t save the item.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Cafeteria"
        description="Incoming orders, the kitchen queue and today’s menu."
        actions={
          section === 'menu' && (
            <Button size="sm" onClick={() => setForm(emptyForm)}>
              <Plus className="w-4 h-4" /> Add item
            </Button>
          )
        }
      />

      <Tabs
        className="mb-6"
        value={section}
        onChange={setSection}
        items={[
          { value: 'live', label: 'Live orders', count: liveOrders.length },
          { value: 'history', label: 'History' },
          { value: 'menu', label: 'Menu', count: menu.length },
        ]}
      />

      {section === 'live' && (
        <div className="grid gap-4 lg:grid-cols-3 items-start">
          {columns.map(column => {
            const columnOrders = liveOrders
              .filter(o => column.statuses.includes(o.status))
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            return (
              <section key={column.title} className="rounded-xl bg-sunken/60 border border-line p-2">
                <header className="flex items-center justify-between px-2.5 pt-1.5 pb-3">
                  <h2 className="text-sm font-medium text-ink">{column.title}</h2>
                  <span className="text-xs text-ink-3 tabular">{columnOrders.length}</span>
                </header>
                <div className="space-y-2">
                  {loading ? (
                    <Skeleton className="h-40 w-full rounded-lg" />
                  ) : columnOrders.length === 0 ? (
                    <p className="text-[13px] text-ink-4 text-center py-10">{column.empty}</p>
                  ) : (
                    columnOrders.map(order => {
                      const next = orderNextAction[order.status];
                      return (
                        <article key={order.id} className="bg-surface border border-line rounded-lg">
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-mono text-[15px] text-ink">{order.orderToken}</p>
                                <p className="text-[13px] text-ink-2 mt-0.5">{order.user?.name}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-ink-2">
                                  {order.orderType === 'DINE_IN'
                                    ? `Dine in${order.tableNumber ? ` · Table ${order.tableNumber}` : ''}`
                                    : `Pickup${order.pickupTime ? ` · ${formatTime(order.pickupTime)}` : ''}`}
                                </p>
                                <p className="text-xs text-ink-4 mt-0.5">{timeAgo(order.createdAt)}</p>
                              </div>
                            </div>
                            <ul className="mt-3.5 space-y-1.5 text-[13px]">
                              {order.orderItems?.map(item => (
                                <li key={item.id} className="flex justify-between gap-3">
                                  <span className="text-ink">
                                    <span className="text-ink-3 tabular">{item.quantity}×</span> {item.menuItem?.name}
                                  </span>
                                  <span className="text-ink-3 tabular">{formatCurrency(item.unitPrice * item.quantity)}</span>
                                </li>
                              ))}
                            </ul>
                            {order.note && (
                              <p className="mt-3 text-[13px] text-warn bg-warn-soft rounded-md px-2.5 py-2">{order.note}</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-line">
                            <span className="text-sm text-ink tabular">{formatCurrency(order.totalAmount)}</span>
                            <div className="flex items-center gap-1">
                              {(order.status === 'PLACED' || order.status === 'ACCEPTED') && (
                                <Button size="sm" variant="ghost" onClick={() => setCancelTarget(order)}>
                                  Cancel
                                </Button>
                              )}
                              {next && (
                                <Button
                                  size="sm"
                                  variant={order.status === 'READY' ? 'secondary' : 'primary'}
                                  isLoading={busyId === order.id}
                                  onClick={() => advanceOrder(order, next.status)}
                                >
                                  {next.label}
                                </Button>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {section === 'history' && (
        <Card>
          {loading ? (
            <div className="pt-5">
              <SkeletonRows />
            </div>
          ) : pastOrders.length === 0 ? (
            <EmptyState icon={ChefHat} title="No completed orders yet" description="Collected and cancelled orders are kept here." />
          ) : (
            <Table>
              <THead className="border-t-0">
                <tr>
                  <TH>Order</TH>
                  <TH>Customer</TH>
                  <TH>Items</TH>
                  <TH>Placed</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Total</TH>
                </tr>
              </THead>
              <TBody>
                {pastOrders.map(order => (
                  <TR key={order.id}>
                    <TD className="font-mono text-ink">{order.orderToken}</TD>
                    <TD className="text-ink">{order.user?.name}</TD>
                    <TD className="max-w-[280px] truncate">
                      {order.orderItems?.map(i => `${i.quantity}× ${i.menuItem?.name}`).join(', ')}
                    </TD>
                    <TD className="whitespace-nowrap">
                      {formatDate(order.createdAt)}, {formatTime(order.createdAt)}
                    </TD>
                    <TD>
                      <Badge tone={orderTone(order.status)}>{orderLabel[order.status]}</Badge>
                    </TD>
                    <TD className="text-right text-ink tabular">{formatCurrency(order.totalAmount)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      )}

      {section === 'menu' && (
        <Card>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border-b border-line">
            <Segmented
              value={categoryFilter}
              onChange={setCategoryFilter}
              items={[
                { value: 'ALL' as const, label: 'All' },
                ...categories.map(c => ({ value: c, label: humanize(c) })),
              ]}
              className="overflow-x-auto max-w-full"
            />
            {unavailableCount > 0 && <p className="text-[13px] text-ink-3">{unavailableCount} sold out</p>}
          </div>
          {loading ? (
            <div className="pt-5">
              <SkeletonRows />
            </div>
          ) : visibleMenu.length === 0 ? (
            <EmptyState
              icon={Soup}
              title={menu.length === 0 ? 'The menu is empty' : 'Nothing in this category'}
              description="Add dishes so students and faculty can order ahead."
              action={
                <Button size="sm" onClick={() => setForm({ ...emptyForm, category: categoryFilter === 'ALL' ? 'LUNCH' : categoryFilter })}>
                  <Plus className="w-4 h-4" /> Add item
                </Button>
              }
            />
          ) : (
            <Table>
              <THead className="border-t-0">
                <tr>
                  <TH>Item</TH>
                  <TH>Category</TH>
                  <TH className="text-right">Price</TH>
                  <TH>Available</TH>
                  <TH className="text-right">
                    <span className="sr-only">Actions</span>
                  </TH>
                </tr>
              </THead>
              <TBody>
                {visibleMenu.map(item => (
                  <TR key={item.id} className={cn(!item.isAvailable && 'text-ink-4')}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <VegMark isVeg={item.isVeg} />
                        <div className="min-w-0">
                          <p className={cn('font-medium', item.isAvailable ? 'text-ink' : 'text-ink-3')}>{item.name}</p>
                          {item.description && <p className="text-xs text-ink-3 truncate max-w-[360px]">{item.description}</p>}
                        </div>
                      </div>
                    </TD>
                    <TD>{humanize(item.category)}</TD>
                    <TD className="text-right tabular text-ink">{formatCurrency(item.price)}</TD>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <Switch
                          label={`${item.name} available`}
                          checked={item.isAvailable}
                          onChange={value => toggleAvailability(item, value)}
                        />
                        <span className="text-xs text-ink-3">{item.isAvailable ? 'On menu' : 'Sold out'}</span>
                      </div>
                    </TD>
                    <TD className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setForm({
                            id: item.id,
                            name: item.name,
                            description: item.description ?? '',
                            category: item.category,
                            price: String(item.price),
                            isVeg: item.isVeg,
                            spiceLevel: String(item.spiceLevel),
                          })
                        }
                      >
                        Edit
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      )}

      <Modal
        isOpen={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Edit item' : 'Add to menu'}
        description={form?.id ? 'Changes appear in the app right away.' : 'New items are available to order immediately.'}
      >
        {form && (
          <form onSubmit={saveItem} className="space-y-4">
            <Input
              label="Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Rajma rice"
              required
              autoFocus
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Optional — a short line shown in the app"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value as MenuCategory })}>
                {categories.map(c => (
                  <option key={c} value={c}>
                    {humanize(c)}
                  </option>
                ))}
              </Select>
              <Input
                label="Price (₹)"
                type="number"
                min="1"
                step="0.01"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Spice level" value={form.spiceLevel} onChange={e => setForm({ ...form, spiceLevel: e.target.value })}>
                <option value="0">Not spicy</option>
                <option value="1">Mild</option>
                <option value="2">Medium</option>
                <option value="3">Hot</option>
              </Select>
              <Select
                label="Dietary"
                value={form.isVeg ? 'veg' : 'nonveg'}
                onChange={e => setForm({ ...form, isVeg: e.target.value === 'veg' })}
              >
                <option value="veg">Vegetarian</option>
                <option value="nonveg">Non-vegetarian</option>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setForm(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={saving}>
                {form.id ? 'Save changes' : 'Add item'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!cancelTarget}
        title="Cancel this order?"
        description={
          cancelTarget
            ? `${cancelTarget.orderToken} for ${cancelTarget.user?.name} will be cancelled. Let them know at the counter if they’ve already paid.`
            : ''
        }
        confirmLabel="Cancel order"
        destructive
        isLoading={busyId === cancelTarget?.id}
        onConfirm={() => cancelTarget && advanceOrder(cancelTarget, 'CANCELLED')}
        onCancel={() => setCancelTarget(null)}
      />
    </>
  );
};
