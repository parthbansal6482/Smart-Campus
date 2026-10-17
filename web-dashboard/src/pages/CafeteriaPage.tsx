import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChefHat, Plus, Search, Soup, Star } from 'lucide-react';
import { cafeteriaService, MenuItemInput, OrderSearch } from '../services/cafeteria.service';
import { REALTIME_EVENTS } from '../services/socket';
import { CafeteriaStats, CampusSettings, MenuCategory, MenuItem, MenuReview, Order, OrderStatus } from '../types';
import { settingsService } from '../services/settings.service';
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
  // First photo is the cover; the rest form the gallery.
  photos: string[];
  stock: string;
  servingSize: string;
  calories: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  fiberG: string;
  sugarG: string;
  sodiumMg: string;
  ingredients: string;
  allergens: string;
}

const emptyForm: MenuForm = {
  name: '',
  description: '',
  category: 'LUNCH',
  price: '',
  isVeg: true,
  spiceLevel: '0',
  photos: [],
  stock: '',
  servingSize: '',
  calories: '',
  proteinG: '',
  carbsG: '',
  fatG: '',
  fiberG: '',
  sugarG: '',
  sodiumMg: '',
  ingredients: '',
  allergens: '',
};

const nutritionInputs: { key: 'calories' | 'proteinG' | 'carbsG' | 'fatG' | 'fiberG' | 'sugarG' | 'sodiumMg'; label: string }[] = [
  { key: 'calories', label: 'Calories (kcal)' },
  { key: 'proteinG', label: 'Protein (g)' },
  { key: 'carbsG', label: 'Carbs (g)' },
  { key: 'fatG', label: 'Fat (g)' },
  { key: 'fiberG', label: 'Fiber (g)' },
  { key: 'sugarG', label: 'Sugar (g)' },
  { key: 'sodiumMg', label: 'Sodium (mg)' },
];

const toList = (value: string) =>
  value
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);

const toNumber = (value: string) => (value.trim() === '' ? undefined : Number(value));

const formFromItem = (item: MenuItem): MenuForm => ({
  id: item.id,
  name: item.name,
  description: item.description ?? '',
  category: item.category,
  price: String(item.price),
  isVeg: item.isVeg,
  spiceLevel: String(item.spiceLevel),
  photos: [...(item.imageUrl ? [item.imageUrl] : []), ...(item.galleryUrls ?? [])],
  stock: item.stock != null ? String(item.stock) : '',
  servingSize: item.servingSize ?? '',
  calories: item.calories != null ? String(item.calories) : '',
  proteinG: item.proteinG != null ? String(item.proteinG) : '',
  carbsG: item.carbsG != null ? String(item.carbsG) : '',
  fatG: item.fatG != null ? String(item.fatG) : '',
  fiberG: item.fiberG != null ? String(item.fiberG) : '',
  sugarG: item.sugarG != null ? String(item.sugarG) : '',
  sodiumMg: item.sodiumMg != null ? String(item.sodiumMg) : '',
  ingredients: (item.ingredients ?? []).join(', '),
  allergens: (item.allergens ?? []).join(', '),
});

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
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<CafeteriaStats | null>(null);
  const [showRemoved, setShowRemoved] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<MenuItem | null>(null);
  const [reviewsFor, setReviewsFor] = useState<MenuItem | null>(null);
  const [reviews, setReviews] = useState<MenuReview[] | null>(null);
  const [settings, setSettings] = useState<CampusSettings | null>(null);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuSort, setMenuSort] = useState<'name' | 'price' | 'rating' | 'stock'>('name');

  // History is queried on the server (search, status, dates, paging) rather than filtered from the live list.
  const [historyStatus, setHistoryStatus] = useState<'ALL' | 'COLLECTED' | 'CANCELLED'>('ALL');
  const [historySearch, setHistorySearch] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [history, setHistory] = useState<{ orders: Order[]; total: number; totalPages: number } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const historyRequest = useRef(0);

  const loadStats = useCallback(async () => {
    try {
      setStats(await cafeteriaService.getStats());
    } catch {
      /* the board works without the summary */
    }
  }, []);

  const loadMenu = useCallback(async () => {
    try {
      setMenu(await cafeteriaService.getMenu({ includeArchived: showRemoved }));
    } catch {
      /* keep last known menu */
    }
  }, [showRemoved]);

  const loadSettings = useCallback(() => {
    settingsService
      .get()
      .then(setSettings)
      .catch(() => undefined);
  }, []);

  const loadReviews = useCallback(async (item: MenuItem) => {
    try {
      setReviews(await cafeteriaService.getReviews(item.id));
    } catch {
      /* keep what is shown */
    }
  }, []);

  // Bumped on menu changes so an open reviews dialog refetches.
  const [reviewsVersion, setReviewsVersion] = useState(0);
  useEffect(() => {
    if (reviewsFor) loadReviews(reviewsFor);
    else setReviews(null);
  }, [reviewsFor, reviewsVersion, loadReviews]);

  // Bumped whenever orders change so the History tab refetches its current query.
  const [historyVersion, setHistoryVersion] = useState(0);

  const loadOrders = useCallback(async () => {
    try {
      setOrders(await cafeteriaService.getOrders(true));
      loadStats();
    } catch {
      /* keep last known board */
    }
  }, [loadStats]);

  useEffect(() => {
    (async () => {
      const [ordersRes, menuRes] = await Promise.allSettled([cafeteriaService.getOrders(true), cafeteriaService.getMenu({ includeArchived: showRemoved })]);
      loadSettings();
      loadStats();
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value);
      if (menuRes.status === 'fulfilled') setMenu(menuRes.value);
      setLoading(false);
    })();
    // Polling is only a safety net for a missed socket event.
    const interval = setInterval(() => {
      loadOrders();
      loadMenu();
    }, 20000);
    const onOrders = () => {
      loadOrders();
      setHistoryVersion(v => v + 1);
    };
    const onMenu = () => {
      loadMenu();
      loadStats();
      setReviewsVersion(v => v + 1);
    };
    window.addEventListener(REALTIME_EVENTS.cafeteriaOrdersChanged, onOrders);
    window.addEventListener(REALTIME_EVENTS.cafeteriaMenuChanged, onMenu);
    window.addEventListener(REALTIME_EVENTS.settingsChanged, loadSettings);
    return () => {
      window.removeEventListener(REALTIME_EVENTS.settingsChanged, loadSettings);
      clearInterval(interval);
      window.removeEventListener(REALTIME_EVENTS.cafeteriaOrdersChanged, onOrders);
      window.removeEventListener(REALTIME_EVENTS.cafeteriaMenuChanged, onMenu);
    };
  }, [loadOrders, loadMenu, loadStats, loadSettings]);

  // Debounce typing in the history search so each keystroke doesn't hit the API.
  useEffect(() => {
    if (section !== 'history') return;
    const handle = setTimeout(async () => {
      const query: OrderSearch = {
        status: historyStatus === 'ALL' ? undefined : historyStatus,
        search: historySearch.trim() || undefined,
        from: historyFrom ? new Date(`${historyFrom}T00:00:00`).toISOString() : undefined,
        to: historyTo ? new Date(`${historyTo}T23:59:59.999`).toISOString() : undefined,
        page: historyPage,
        // History is finished orders only; live ones belong on the board.
        active: historyStatus === 'ALL' ? false : undefined,
      };
      // A slow earlier response must not overwrite the result of a newer query.
      const request = ++historyRequest.current;
      setHistoryLoading(true);
      try {
        const result = await cafeteriaService.searchOrders(query);
        if (request === historyRequest.current) setHistory(result);
      } catch (err) {
        if (request === historyRequest.current) toast.error(getErrorMessage(err, 'Couldn’t load order history.'));
      } finally {
        if (request === historyRequest.current) setHistoryLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [section, historyStatus, historySearch, historyFrom, historyTo, historyPage, historyVersion]);

  const liveOrders = orders.filter(o => ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status));
  const needle = menuSearch.trim().toLowerCase();
  const visibleMenu = menu
    .filter(m => (categoryFilter === 'ALL' || m.category === categoryFilter) && (!needle || m.name.toLowerCase().includes(needle)))
    .sort((a, b) =>
      menuSort === 'price'
        ? a.price - b.price
        : menuSort === 'rating'
          ? b.rating - a.rating
          : menuSort === 'stock'
            ? (a.stock ?? Infinity) - (b.stock ?? Infinity)
            : a.name.localeCompare(b.name)
    );
  const unavailableCount = menu.filter(m => !m.isAvailable && !m.isArchived).length;

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
      const saved = await cafeteriaService.updateMenuItem(item.id, { isAvailable });
      // The server is the authority (e.g. a dish with 0 portions can't be switched on).
      setMenu(prev => prev.map(m => (m.id === item.id ? saved : m)));
      if (isAvailable && !saved.isAvailable) toast.error(`${item.name} has no portions left — set its stock first`);
      else toast.success(`${item.name} ${saved.isAvailable ? 'is back on the menu' : 'marked sold out'}`);
    } catch (err) {
      setMenu(prev => prev.map(m => (m.id === item.id ? { ...m, isAvailable: !isAvailable } : m)));
      toast.error(getErrorMessage(err, `Couldn’t update ${item.name}.`));
    }
  };

  const removeItem = async (item: MenuItem) => {
    setBusyId(item.id);
    try {
      await cafeteriaService.deleteMenuItem(item.id);
      setMenu(prev => (showRemoved ? prev.map(m => (m.id === item.id ? { ...m, isArchived: true, isAvailable: false } : m)) : prev.filter(m => m.id !== item.id)));
      toast.success(`${item.name} removed from the menu`);
    } catch (err) {
      toast.error(getErrorMessage(err, `Couldn’t remove ${item.name}.`));
    } finally {
      setBusyId(null);
      setRemoveTarget(null);
    }
  };

  const restoreItem = async (item: MenuItem) => {
    setBusyId(item.id);
    try {
      const restored = await cafeteriaService.restoreMenuItem(item.id);
      setMenu(prev => prev.map(m => (m.id === item.id ? restored : m)));
      toast.success(`${item.name} is back on the menu`);
    } catch (err) {
      toast.error(getErrorMessage(err, `Couldn’t restore ${item.name}.`));
    } finally {
      setBusyId(null);
    }
  };

  const deleteReview = async (review: MenuReview) => {
    if (!reviewsFor) return;
    try {
      await cafeteriaService.deleteReview(reviewsFor.id, review.id);
      setReviews(prev => prev?.filter(r => r.id !== review.id) ?? null);
      toast.success('Review removed');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Couldn’t remove the review.'));
    }
  };

  const addPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !form) return;
    setUploading(true);
    try {
      const url = await cafeteriaService.uploadPhoto(file);
      setForm(prev => (prev ? { ...prev, photos: [...prev.photos, url] } : prev));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Couldn’t upload the photo.'));
    } finally {
      setUploading(false);
    }
  };

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const price = parseFloat(form.price);
    if (!form.name.trim() || form.name.trim().length < 2) return void toast.error('Give the dish a name (at least 2 characters).');
    if (!Number.isFinite(price) || price <= 0) return void toast.error('Enter a price greater than 0.');
    const numbers = [form.stock, form.calories, form.proteinG, form.carbsG, form.fatG, form.fiberG, form.sugarG, form.sodiumMg];
    if (numbers.some(v => v.trim() !== '' && (!Number.isFinite(Number(v)) || Number(v) < 0))) {
      return void toast.error('Stock and nutrition values must be numbers, 0 or more.');
    }
    if (form.stock.trim() !== '' && !Number.isInteger(Number(form.stock))) return void toast.error('Stock must be a whole number.');
    if (form.calories.trim() !== '' && !Number.isInteger(Number(form.calories))) return void toast.error('Calories must be a whole number.');
    setSaving(true);
    // When editing, a blank nutrition field is sent as null so the stored value is cleared.
    const blank = form.id ? null : undefined;
    const payload: MenuItemInput = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      price,
      isVeg: form.isVeg,
      spiceLevel: parseInt(form.spiceLevel, 10),
      imageUrl: form.photos[0],
      galleryUrls: form.photos.slice(1),
      stock: toNumber(form.stock) ?? blank,
      servingSize: form.servingSize.trim() || blank,
      calories: toNumber(form.calories) ?? blank,
      proteinG: toNumber(form.proteinG) ?? blank,
      carbsG: toNumber(form.carbsG) ?? blank,
      fatG: toNumber(form.fatG) ?? blank,
      fiberG: toNumber(form.fiberG) ?? blank,
      sugarG: toNumber(form.sugarG) ?? blank,
      sodiumMg: toNumber(form.sodiumMg) ?? blank,
      ingredients: toList(form.ingredients),
      allergens: toList(form.allergens),
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

      {section === 'live' && settings && settings.cafeteriaOpensAt && settings.cafeteriaClosesAt && (
        <p className="text-[13px] text-ink-3 mb-3">
          Kitchen hours {settings.cafeteriaOpensAt}–{settings.cafeteriaClosesAt}. Orders outside these hours are refused; change them in Settings.
        </p>
      )}

      {section === 'live' && stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          {[
            { label: 'Orders today', value: String(stats.today.orders) },
            { label: 'Revenue today', value: formatCurrency(stats.today.revenue) },
            {
              label: 'Avg. time to collect',
              value: stats.today.avgFulfilmentMinutes != null ? `${stats.today.avgFulfilmentMinutes} min` : '—',
            },
            {
              label: 'Top seller (7 days)',
              value: stats.topItems[0] ? `${stats.topItems[0].name} · ${stats.topItems[0].quantity}` : '—',
            },
          ].map(tile => (
            <Card key={tile.label} className="p-4">
              <p className="text-[13px] text-ink-3">{tile.label}</p>
              <p className="mt-1 font-serif text-[24px] leading-tight text-ink tabular truncate">{tile.value}</p>
            </Card>
          ))}
          {stats.lowStock.length > 0 && (
            <p className="sm:col-span-2 lg:col-span-4 text-[13px] text-ink-3">
              Running low: {stats.lowStock.map(i => `${i.name} (${i.stock})`).join(', ')}
            </p>
          )}
        </div>
      )}

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
                              <Button size="sm" variant="ghost" onClick={() => setCancelTarget(order)}>
                                Cancel
                              </Button>
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
          <div className="grid gap-3 p-4 border-b border-line sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
              <Input
                aria-label="Search orders"
                className="pl-9"
                placeholder="Order # or customer"
                value={historySearch}
                onChange={e => {
                  setHistorySearch(e.target.value);
                  setHistoryPage(1);
                }}
              />
            </div>
            <Select
              aria-label="Status"
              value={historyStatus}
              onChange={e => {
                setHistoryStatus(e.target.value as typeof historyStatus);
                setHistoryPage(1);
              }}
            >
              <option value="ALL">All finished orders</option>
              <option value="COLLECTED">Collected</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
            <Input
              type="date"
              aria-label="From date"
              value={historyFrom}
              max={historyTo || undefined}
              onChange={e => {
                setHistoryFrom(e.target.value);
                setHistoryPage(1);
              }}
            />
            <Input
              type="date"
              aria-label="To date"
              value={historyTo}
              min={historyFrom || undefined}
              onChange={e => {
                setHistoryTo(e.target.value);
                setHistoryPage(1);
              }}
            />
          </div>
          {history === null || (historyLoading && history.orders.length === 0) ? (
            <div className="pt-5">
              <SkeletonRows />
            </div>
          ) : history.orders.length === 0 ? (
            <EmptyState icon={ChefHat} title="No orders found" description="Try a different search, status or date range." />
          ) : (
            <>
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
                  {history.orders.map(order => (
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
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-line text-[13px] text-ink-3">
                <span className="tabular">
                  {history.total} order{history.total === 1 ? '' : 's'} · page {historyPage} of {history.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={historyPage <= 1 || historyLoading} onClick={() => setHistoryPage(p => p - 1)}>
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={historyPage >= history.totalPages || historyLoading}
                    onClick={() => setHistoryPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
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
            <div className="flex items-center gap-2">
              {unavailableCount > 0 && <p className="text-[13px] text-ink-3 whitespace-nowrap">{unavailableCount} sold out</p>}
              <label className="flex items-center gap-2 text-[13px] text-ink-3 whitespace-nowrap">
                <Switch label="Show removed dishes" checked={showRemoved} onChange={setShowRemoved} />
                Removed
              </label>
              <Input aria-label="Search menu" placeholder="Search dishes" value={menuSearch} onChange={e => setMenuSearch(e.target.value)} />
              <Select aria-label="Sort menu" value={menuSort} onChange={e => setMenuSort(e.target.value as typeof menuSort)}>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="rating">Rating</option>
                <option value="stock">Lowest stock</option>
              </Select>
            </div>
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
                  <TH>Rating</TH>
                  <TH>Stock</TH>
                  <TH>Available</TH>
                  <TH className="text-right">
                    <span className="sr-only">Actions</span>
                  </TH>
                </tr>
              </THead>
              <TBody>
                {visibleMenu.map(item => (
                  <TR key={item.id} className={cn((!item.isAvailable || item.isArchived) && 'text-ink-4')}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-md object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-sunken shrink-0" aria-hidden />
                        )}
                        <VegMark isVeg={item.isVeg} />
                        <div className="min-w-0">
                          <p className={cn('font-medium', item.isAvailable ? 'text-ink' : 'text-ink-3')}>{item.name}</p>
                          {item.description && <p className="text-xs text-ink-3 truncate max-w-[360px]">{item.description}</p>}
                          {item.calories != null && <p className="text-xs text-ink-3 tabular">{item.calories} kcal</p>}
                        </div>
                      </div>
                    </TD>
                    <TD>{humanize(item.category)}</TD>
                    <TD className="text-right tabular text-ink">{formatCurrency(item.price)}</TD>
                    <TD className="whitespace-nowrap tabular">
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-ink-3" aria-hidden />
                        {item.rating.toFixed(1)}
                        {!!item.reviewCount && <span className="text-ink-3">({item.reviewCount})</span>}
                      </span>
                    </TD>
                    <TD className={cn('tabular', item.stock != null && item.stock <= 5 && 'text-critical')}>
                      {item.stock != null ? item.stock : '—'}
                    </TD>
                    <TD>
                      {item.isArchived ? (
                        <span className="text-xs text-ink-3">Removed</span>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <Switch
                            label={`${item.name} available`}
                            checked={item.isAvailable}
                            onChange={value => toggleAvailability(item, value)}
                          />
                          <span className="text-xs text-ink-3">{item.isAvailable ? 'On menu' : 'Sold out'}</span>
                        </div>
                      )}
                    </TD>
                    <TD className="text-right whitespace-nowrap">
                      {item.isArchived ? (
                        <Button size="sm" variant="secondary" isLoading={busyId === item.id} onClick={() => restoreItem(item)}>
                          Restore
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => setReviewsFor(item)} disabled={!item.reviewCount}>
                            Reviews
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setForm(formFromItem(item))}>
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRemoveTarget(item)}>
                            Remove
                          </Button>
                        </>
                      )}
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
            <fieldset className="space-y-2">
              <legend className="text-[13px] font-medium text-ink">Photos</legend>
              <p className="text-xs text-ink-3">The first photo is the cover shown on the menu.</p>
              <div className="flex flex-wrap gap-2">
                {form.photos.map((url, i) => (
                  <div key={url} className="relative">
                    <img src={url} alt="" className="w-20 h-20 rounded-md object-cover" />
                    <button
                      type="button"
                      aria-label="Remove photo"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink text-white text-xs leading-5"
                      onClick={() => setForm({ ...form, photos: form.photos.filter((_, idx) => idx !== i) })}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {form.photos.length < 9 && (
                  <label className="w-20 h-20 rounded-md border border-dashed border-line flex items-center justify-center text-xs text-ink-3 cursor-pointer hover:bg-sunken">
                    {uploading ? 'Uploading…' : '+ Add'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={addPhoto} disabled={uploading} />
                  </label>
                )}
              </div>
            </fieldset>

            <Input
              label="Portions available today"
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={e => setForm({ ...form, stock: e.target.value })}
              hint="Leave blank to not track stock. At 0 the dish shows as sold out."
            />

            <fieldset className="space-y-3">
              <legend className="text-[13px] font-medium text-ink">Nutrition (per serving)</legend>
              <Input
                label="Serving size"
                value={form.servingSize}
                onChange={e => setForm({ ...form, servingSize: e.target.value })}
                placeholder="e.g. 1 plate (250 g)"
              />
              <div className="grid grid-cols-2 gap-4">
                {nutritionInputs.map(({ key, label }) => (
                  <Input
                    key={key}
                    label={label}
                    type="number"
                    min="0"
                    step="0.1"
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                  />
                ))}
              </div>
              <Input
                label="Ingredients"
                value={form.ingredients}
                onChange={e => setForm({ ...form, ingredients: e.target.value })}
                placeholder="Comma separated — rice, kidney beans, onion"
              />
              <Input
                label="Allergens"
                value={form.allergens}
                onChange={e => setForm({ ...form, allergens: e.target.value })}
                placeholder="Comma separated — gluten, dairy, nuts"
              />
            </fieldset>

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
        isOpen={!!removeTarget}
        title="Remove from the menu?"
        description={
          removeTarget
            ? `${removeTarget.name} disappears from the app straight away. Past orders keep it, and you can restore it later from “Removed”.`
            : ''
        }
        confirmLabel="Remove dish"
        destructive
        isLoading={busyId === removeTarget?.id}
        onConfirm={() => removeTarget && removeItem(removeTarget)}
        onCancel={() => setRemoveTarget(null)}
      />

      <Modal
        isOpen={!!reviewsFor}
        onClose={() => setReviewsFor(null)}
        title={reviewsFor ? `Reviews · ${reviewsFor.name}` : 'Reviews'}
        description="Remove anything abusive or off-topic. The rating updates straight away."
      >
        {reviews === null ? (
          <SkeletonRows />
        ) : reviews.length === 0 ? (
          <p className="text-[13px] text-ink-3 py-6 text-center">No reviews left.</p>
        ) : (
          <ul className="divide-y divide-line -my-2">
            {reviews.map(review => (
              <li key={review.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] text-ink">
                    {review.user.name} · <span className="tabular">{review.rating}★</span>
                    <span className="text-ink-4"> · {timeAgo(review.createdAt)}</span>
                  </p>
                  {review.comment && <p className="text-[13px] text-ink-2 mt-0.5 break-words">{review.comment}</p>}
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteReview(review)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
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
