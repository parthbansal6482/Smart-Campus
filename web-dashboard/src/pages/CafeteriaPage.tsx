import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { cafeteriaService } from '../services/cafeteria.service';
import { MenuItem, Order, OrderStatus } from '../types';
import { CheckCircle, ChefHat, Plus, Utensils, Clock, Flame, Star, ShoppingBag, CheckCircle2 } from 'lucide-react';

export const CafeteriaPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');

  const loadData = async () => {
    try {
      const [ordersRes, menuRes] = await Promise.allSettled([
        cafeteriaService.getOrders(true),
        cafeteriaService.getMenu(),
      ]);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value);
      if (menuRes.status === 'fulfilled') setMenu(menuRes.value);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000); // Polling kitchen board every 15s
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (orderId: string, status: OrderStatus) => {
    try {
      const updated = await cafeteriaService.updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
    } catch (err) {
      console.error('Failed to update order status', err);
    }
  };

  const getOrderStatusVariant = (status: OrderStatus) => {
    switch (status) {
      case 'PLACED':
        return 'warning';
      case 'ACCEPTED':
      case 'PREPARING':
        return 'info';
      case 'READY':
        return 'success';
      case 'COLLECTED':
        return 'default';
      default:
        return 'danger';
    }
  };

  const displayOrders = orders.length > 0 ? orders : [
    {
      id: 'ord-101',
      userId: 'u1',
      orderType: 'PICKUP' as const,
      orderToken: '#ORD-104',
      status: 'PREPARING' as OrderStatus,
      totalAmount: 13.45,
      note: 'Extra napkins and oat milk please!',
      createdAt: new Date().toISOString(),
      user: { name: 'Alex Johnson', email: 'student@smartcampus.edu' } as any,
      orderItems: [
        { id: '1', orderId: 'ord-101', menuItemId: 'm1', quantity: 1, unitPrice: 4.5, menuItem: { name: 'Cold Brew Artisan Coffee' } as any },
        { id: '2', orderId: 'ord-101', menuItemId: 'm2', quantity: 1, unitPrice: 8.95, menuItem: { name: 'Avocado & Chicken Panini' } as any },
      ],
    },
    {
      id: 'ord-102',
      userId: 'u2',
      orderType: 'PICKUP' as const,
      orderToken: '#ORD-105',
      status: 'PLACED' as OrderStatus,
      totalAmount: 3.50,
      createdAt: new Date(Date.now() - 300000).toISOString(),
      user: { name: 'Dr. Sarah Connor', email: 'faculty@smartcampus.edu' } as any,
      orderItems: [
        { id: '3', orderId: 'ord-102', menuItemId: 'm3', quantity: 1, unitPrice: 3.5, menuItem: { name: 'Fudge Walnut Brownie' } as any },
      ],
    },
  ];

  const filteredOrders = displayOrders.filter(o => {
    if (orderStatusFilter === 'ALL') return true;
    return o.status === orderStatusFilter;
  });

  const preparingCount = displayOrders.filter(o => o.status === 'PREPARING').length;
  const readyCount = displayOrders.filter(o => o.status === 'READY').length;

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dining Operations</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Smart Cafeteria Kitchen Command</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage live dining tokens, kitchen order queue, and real-time menu availability
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'orders'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5 text-amber-500" />
            <span>Kitchen Queue ({displayOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'menu'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Utensils className="w-3.5 h-3.5 text-blue-500" />
            <span>Menu Catalog ({menu.length || 4})</span>
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        /* Orders Kitchen Board */
        <div className="space-y-4">
          {/* Status Filter Bar & Summary */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['ALL', 'PLACED', 'PREPARING', 'READY', 'COLLECTED'].map(st => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    orderStatusFilter === st
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st === 'ALL' ? 'All Orders' : st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 font-bold text-amber-800">
                {preparingCount} in Prep
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 font-bold text-emerald-800">
                {readyCount} Ready for Pickup
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOrders.map(order => (
              <Card key={order.id} interactive className="flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-3 bg-slate-50/60">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded border border-blue-300">
                        {order.orderToken || `#${order.id.slice(0, 6)}`}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <Badge variant={getOrderStatusVariant(order.status)} dot>{order.status}</Badge>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-3.5">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{order.user?.name || 'Student Customer'}</p>
                      <p className="text-[11px] text-slate-400">{order.user?.email || 'student@smartcampus.edu'}</p>
                    </div>

                    {/* Order Line Items */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      {order.orderItems?.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-xs text-slate-700 bg-slate-50/50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                          <span className="font-semibold text-slate-900">
                            {item.quantity}x {item.menuItem?.name || 'Item'}
                          </span>
                          <span className="font-mono text-slate-600 font-medium tabular-nums">
                            \${(item.unitPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.note && (
                      <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900">
                        <strong>Kitchen Note:</strong> {order.note}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Order Total ({order.orderType})</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums text-sm">\${order.totalAmount.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </div>

                {/* Status Advancement Action Button */}
                <div className="p-3.5 bg-slate-50 border-t border-slate-100">
                  {order.status === 'PLACED' && (
                    <Button
                      size="sm"
                      variant="executive"
                      className="w-full text-xs font-semibold"
                      onClick={() => handleStatusUpdate(order.id, 'PREPARING')}
                    >
                      <ChefHat className="w-3.5 h-3.5 mr-1 text-amber-400" /> Start Preparation
                    </Button>
                  )}
                  {order.status === 'PREPARING' && (
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 border-emerald-600 shadow-emerald-500/20"
                      onClick={() => handleStatusUpdate(order.id, 'READY')}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Ready for Counter Pickup
                    </Button>
                  )}
                  {order.status === 'READY' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50"
                      onClick={() => handleStatusUpdate(order.id, 'COLLECTED')}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-slate-600" /> Confirm Student Handover
                    </Button>
                  )}
                  {order.status === 'COLLECTED' && (
                    <div className="flex items-center justify-center gap-1 text-xs text-slate-400 py-1 font-medium">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      Order Complete & Collected
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        /* Menu Management Table */
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Daily Cafeteria Food & Beverage Catalog</CardTitle>
              <p className="text-[11px] text-slate-400">Manage campus dining offerings, dietary tags, and pricing</p>
            </div>
            <Button size="sm" variant="executive">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Menu Item
            </Button>
          </CardHeader>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Dish / Item Name</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>Dietary Type</TableHeaderCell>
                <TableHeaderCell>Price</TableHeaderCell>
                <TableHeaderCell>Rating & Spice</TableHeaderCell>
                <TableHeaderCell>Counter Availability</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(menu.length > 0
                ? menu
                : [
                    { id: '1', name: 'Cold Brew Artisan Coffee', category: 'BEVERAGES' as const, isVeg: true, price: 4.5, isAvailable: true, spiceLevel: 0, rating: 4.8 },
                    { id: '2', name: 'Avocado & Chicken Panini', category: 'LUNCH' as const, isVeg: false, price: 8.95, isAvailable: true, spiceLevel: 1, rating: 4.7 },
                    { id: '3', name: 'Butter Croissant', category: 'BREAKFAST' as const, isVeg: true, price: 3.25, isAvailable: true, spiceLevel: 0, rating: 4.9 },
                    { id: '4', name: 'Fudge Walnut Brownie', category: 'DESSERTS' as const, isVeg: true, price: 3.5, isAvailable: true, spiceLevel: 0, rating: 4.9 },
                  ]
              ).map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-bold text-slate-900">{item.name}</TableCell>
                  <TableCell>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {item.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        item.isVeg
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {item.isVeg ? 'Vegetarian' : 'Non-Veg'}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                    \${item.price.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-bold text-slate-800">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        {item.rating || 4.8}
                      </span>
                      {item.spiceLevel > 0 && (
                        <span className="flex items-center gap-0.5 text-rose-600">
                          <Flame className="w-3.5 h-3.5" />
                          Lvl {item.spiceLevel}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.isAvailable ? 'success' : 'default'} dot>
                      {item.isAvailable ? 'In Stock (Serving)' : 'Sold Out'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};
