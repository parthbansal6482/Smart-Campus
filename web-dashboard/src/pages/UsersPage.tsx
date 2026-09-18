import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import { User, Role } from '../types';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const getRoleBadgeVariant = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return 'danger';
      case 'FACULTY':
        return 'info';
      case 'CAFETERIA_STAFF':
        return 'warning';
      case 'MEDICAL_STAFF':
      case 'AMBULANCE_RESPONDER':
        return 'purple';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">User & Access Control Directory</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage campus user accounts, credential authorizations, and module permissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Campus Users</CardTitle>
        </CardHeader>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Assigned Role</TableHeaderCell>
              <TableHeaderCell>Phone</TableHeaderCell>
              <TableHeaderCell>Registered On</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(users.length > 0
              ? users
              : [
                  { id: '1', name: 'System Administrator', email: 'admin@smartcampus.edu', role: 'ADMIN' as Role, phone: '+1-555-0101', createdAt: new Date().toISOString() },
                  { id: '2', name: 'Dr. Sarah Connor', email: 'faculty@smartcampus.edu', role: 'FACULTY' as Role, phone: '+1-555-0102', createdAt: new Date().toISOString() },
                  { id: '3', name: 'Alex Johnson', email: 'student@smartcampus.edu', role: 'STUDENT' as Role, phone: '+1-555-0103', createdAt: new Date().toISOString() },
                  { id: '4', name: 'Chef Gordon', email: 'cafeteria@smartcampus.edu', role: 'CAFETERIA_STAFF' as Role, phone: '+1-555-0104', createdAt: new Date().toISOString() },
                  { id: '5', name: 'Dr. House', email: 'medical@smartcampus.edu', role: 'MEDICAL_STAFF' as Role, phone: '+1-555-0105', createdAt: new Date().toISOString() },
                  { id: '6', name: 'Ambulance Unit 1', email: 'responder@smartcampus.edu', role: 'AMBULANCE_RESPONDER' as Role, phone: '+1-555-0106', createdAt: new Date().toISOString() },
                ]
            ).map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-semibold text-slate-900">{user.name}</TableCell>
                <TableCell className="text-xs text-slate-600">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-500">{user.phone || '—'}</TableCell>
                <TableCell className="text-xs text-slate-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
