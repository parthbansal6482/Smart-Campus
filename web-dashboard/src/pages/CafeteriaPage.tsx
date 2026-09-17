import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { cafeteriaService } from '../services/cafeteria.service';
import { MenuItem, Order, OrderStatus } from '../types';
import { Utensils, CheckCircle, Clock, ChefHat, Plus } from 'lucide-react';

export const CafeteriaPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');

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
      case 'PENDING':
        return 'warning';
      case 'PREPARING':
        return 'info';
      case 'READY':
        return 'success';
      case 'COMPLETED':
        return 'default';
      default:
        return 'danger';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Smart Cafeteria Operations</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage live kitchen queue, order fulfillment, and daily campus food menu
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'orders'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Orders Queue ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'menu'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Menu Items ({menu.length})
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        /* Orders Kitchen Board */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(orders.length > 0
              ? orders
              : [
                  {
                    id: 'ord-101',
                    userId: 'u1',
                    orderType: 'PICKUP' as const,
                    status: 'PREPARING' as OrderStatus,
                    totalAmount: 13.45,
                    createdAt: new Date().toISOString(),
                    user: { name: 'Alex Johnson', email: 'student@smartcampus.edu' } as any,
                    orderItems: [
                      { id: '1', orderId: 'ord-101', menuItemId: 'm1', quantity: 1, unitPrice: 4.5, menuItem: { name: 'Cold Brew Artisan Coffee' } as any },
                      { id: '2', orderId: 'ord-101', menuItemId: 'm2', quantity: 1, unitPrice: 8.95, menuItem: { name: 'Avocado & Grilled Chicken Panini' } as any },
                    ],
                  },
                ]
            ).map(order => (
              <Card key={order.id} className="flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        #{order.id.slice(0, 8)}
                      </span>
                      <p className="text-sm font-semibold text-slate-900">{order.user?.name || 'Customer'}</p>
                    </div>
                    <Badge variant={getOrderStatusVariant(order.status)}>{order.status}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                      {order.orderItems?.map(item => (
                        <div key={item.id} className="flex justify-between text-xs text-slate-700">
                          <span>
                            {item.quantity}x {item.menuItem?.name || 'Menu Item'}
                          </span>
                          <span className="font-mono text-slate-500">
                            \${(item.unitPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-900">
                      <span>Total</span>
                      <span>\${order.totalAmount.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </div>

                {/* Status Advancement Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                  {order.status === 'PENDING' && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleStatusUpdate(order.id, 'PREPARING')}
                    >
                      <ChefHat className="w-3.5 h-3.5 mr-1" /> Start Prep
                    </Button>
                  )}
                  {order.status === 'PREPARING' && (
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleStatusUpdate(order.id, 'READY')}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Ready
                    </Button>
                  )}
                  {order.status === 'READY' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      onClick={() => handleStatusUpdate(order.id, 'COMPLETED')}
                    >
                      Complete Handover
                    </Button>
                  )}
                  {order.status === 'COMPLETED' && (
                    <span className="text-xs text-slate-400 text-center w-full py-1">Order Completed</span>
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
            <CardTitle>Cafeteria Daily Catalog</CardTitle>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add Menu Item
            </Button>
          </CardHeader>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Item Name</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>Price</TableHeaderCell>
                <TableHeaderCell>Availability</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(menu.length > 0
                ? menu
                : [
                    { id: '1', name: 'Cold Brew Artisan Coffee', category: 'BEVERAGES' as const, price: 4.5, isAvailable: true },
                    { id: '2', name: 'Avocado & Grilled Chicken Panini', category: 'LUNCH' as const, price: 8.95, isAvailable: true },
                    { id: '3', name: 'Butter Croissant', category: 'BREAKFAST' as const, price: 3.25, isAvailable: true },
                  ]
              ).map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold text-slate-900">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="purple">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">\${item.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={item.isAvailable ? 'success' : 'default'}>
                      {item.isAvailable ? 'In Stock' : 'Out of Stock'}
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
