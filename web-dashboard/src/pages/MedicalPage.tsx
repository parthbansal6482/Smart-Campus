import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { medicalService } from '../services/medical.service';
import { Emergency, EmergencyStatus, Medicine, MedicineOrder, Consultation } from '../types';
import { HeartPulse, ShieldAlert, Pill, PhoneCall, Plus, MapPin, CheckCircle } from 'lucide-react';

export const MedicalPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'emergencies' | 'medicines' | 'orders' | 'consultations'>('emergencies');

  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medicineOrders, setMedicineOrders] = useState<MedicineOrder[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isAddMedModalOpen, setIsAddMedModalOpen] = useState(false);

  // New Medicine Form State
  const [medName, setMedName] = useState('');
  const [medPrice, setMedPrice] = useState('');
  const [medStock, setMedStock] = useState('50');
  const [medPrescription, setMedPrescription] = useState(false);

  const loadAllData = async () => {
    try {
      const [emRes, medRes, ordRes, conRes] = await Promise.allSettled([
        medicalService.getAllEmergencies(true),
        medicalService.getMedicines(),
        medicalService.getMedicineOrders(true),
        medicalService.getConsultations(true),
      ]);
      if (emRes.status === 'fulfilled') setEmergencies(emRes.value);
      if (medRes.status === 'fulfilled') setMedicines(medRes.value);
      if (ordRes.status === 'fulfilled') setMedicineOrders(ordRes.value);
      if (conRes.status === 'fulfilled') setConsultations(conRes.value);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleEmergencyStatus = async (id: string, status: EmergencyStatus) => {
    try {
      const updated = await medicalService.updateEmergencyStatus(id, status);
      setEmergencies(prev => prev.map(e => (e.id === id ? updated : e)));
    } catch (err) {
      console.error('Failed to update emergency status', err);
    }
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newMed = await medicalService.createMedicine({
        name: medName,
        price: parseFloat(medPrice),
        stock: parseInt(medStock, 10),
        requiresPrescription: medPrescription,
        category: medPrescription ? 'PRESCRIPTION_ONLY' : 'GENERAL',
      });
      setMedicines(prev => [...prev, newMed]);
      setIsAddMedModalOpen(false);
      setMedName('');
      setMedPrice('');
    } catch (err) {
      console.error('Failed to add medicine', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Medical Center & Dispatch Command</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Emergency ambulance dispatch, medicine pharmacy orders, and health consultations
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab('emergencies')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'emergencies' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Emergency Dispatches ({emergencies.filter(e => e.status !== 'HANDLED').length})
          </button>
          <button
            onClick={() => setActiveSubTab('orders')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'orders' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Medicine Orders ({medicineOrders.length})
          </button>
          <button
            onClick={() => setActiveSubTab('medicines')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'medicines' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pharmacy Stock ({medicines.length})
          </button>
          <button
            onClick={() => setActiveSubTab('consultations')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'consultations' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Consultations ({consultations.length})
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Emergency Dispatches */}
      {activeSubTab === 'emergencies' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <CardTitle>Live Emergency Dispatch Board</CardTitle>
            </div>
          </CardHeader>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Incident Status</TableHeaderCell>
                <TableHeaderCell>Tag & Reason</TableHeaderCell>
                <TableHeaderCell>Caller / Victim</TableHeaderCell>
                <TableHeaderCell>Location & Building</TableHeaderCell>
                <TableHeaderCell>Reported Time</TableHeaderCell>
                <TableHeaderCell className="text-right">Dispatch Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(emergencies.length > 0
                ? emergencies
                : [
                    {
                      id: 'e1',
                      userId: 'u1',
                      latitude: 37.7756,
                      longitude: -122.4184,
                      tag: 'INJURY' as const,
                      status: 'ASSIGNED' as EmergencyStatus,
                      description: 'Lab minor chemical splash, first-aid required on Floor 1',
                      reportedAt: new Date().toISOString(),
                      building: { name: 'Marie Curie Science Complex', code: 'SCI' } as any,
                      user: { name: 'Alex Johnson', email: 'student@smartcampus.edu', phone: '+1-555-0103' } as any,
                    },
                  ]
              ).map(incident => (
                <TableRow key={incident.id}>
                  <TableCell>
                    <Badge
                      variant={
                        incident.status === 'REPORTED'
                          ? 'danger'
                          : incident.status === 'ASSIGNED' || incident.status === 'ON_THE_WAY'
                          ? 'warning'
                          : incident.status === 'HANDLED'
                          ? 'success'
                          : 'default'
                      }
                    >
                      {incident.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="purple" className="mb-1">{incident.tag || 'OTHER'}</Badge>
                    <p className="text-xs text-slate-600 max-w-xs truncate">{incident.description || 'Emergency alert'}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-semibold text-slate-900">{incident.user?.name}</p>
                    <p className="text-[11px] text-slate-400">{incident.user?.phone}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-slate-900">{incident.building?.name || 'Campus Grounds'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {new Date(incident.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell className="text-right space-x-1.5">
                    {incident.status === 'REPORTED' && (
                      <Button size="sm" variant="danger" onClick={() => handleEmergencyStatus(incident.id, 'ASSIGNED')}>
                        Assign Responder
                      </Button>
                    )}
                    {incident.status === 'ASSIGNED' && (
                      <Button size="sm" variant="outline" onClick={() => handleEmergencyStatus(incident.id, 'ON_THE_WAY')}>
                        On the Way
                      </Button>
                    )}
                    {incident.status === 'ON_THE_WAY' && (
                      <Button size="sm" variant="outline" onClick={() => handleEmergencyStatus(incident.id, 'ARRIVED')}>
                        Mark Arrived
                      </Button>
                    )}
                    {incident.status === 'ARRIVED' && (
                      <Button size="sm" variant="secondary" className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100" onClick={() => handleEmergencyStatus(incident.id, 'HANDLED')}>
                        Mark Handled
                      </Button>
                    )}
                    {incident.status === 'HANDLED' && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Handled
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Sub-Tab 2: Medicine Orders */}
      {activeSubTab === 'orders' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-teal-600" />
              <CardTitle>Campus Pharmacy Orders</CardTitle>
            </div>
          </CardHeader>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Order ID</TableHeaderCell>
                <TableHeaderCell>Student / Patient</TableHeaderCell>
                <TableHeaderCell>Prescription Flag</TableHeaderCell>
                <TableHeaderCell>Type & Address</TableHeaderCell>
                <TableHeaderCell>Total Price</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(medicineOrders.length > 0
                ? medicineOrders
                : [
                    {
                      id: 'med-ord-1',
                      userId: 'u1',
                      totalAmount: 4.99,
                      status: 'PREPARING' as const,
                      pickupOrDelivery: 'DELIVERY',
                      deliveryAddress: 'Hostel Block B, Room 302',
                      prescriptionUrl: undefined,
                      createdAt: new Date().toISOString(),
                      user: { name: 'Alex Johnson', email: 'student@smartcampus.edu' } as any,
                    },
                  ]
              ).map(ord => (
                <TableRow key={ord.id}>
                  <TableCell className="font-mono text-xs text-slate-500">#{ord.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <p className="text-xs font-semibold text-slate-900">{ord.user?.name}</p>
                    <p className="text-[11px] text-slate-400">{ord.user?.email}</p>
                  </TableCell>
                  <TableCell>
                    {ord.prescriptionUrl ? (
                      <Badge variant="purple">Uploaded Prescription</Badge>
                    ) : (
                      <span className="text-xs text-slate-400">Over-The-Counter</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    <span className="font-semibold">{ord.pickupOrDelivery}:</span> {ord.deliveryAddress || 'Medical Center Counter'}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold">\${ord.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={ord.status === 'DELIVERED' ? 'success' : 'warning'}>{ord.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Sub-Tab 3: Pharmacy Stock */}
      {activeSubTab === 'medicines' && (
        <Card>
          <CardHeader>
            <CardTitle>Medical Center Pharmacy Inventory</CardTitle>
            <Button size="sm" onClick={() => setIsAddMedModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Medicine Item
            </Button>
          </CardHeader>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Item Name</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>Price</TableHeaderCell>
                <TableHeaderCell>In Stock</TableHeaderCell>
                <TableHeaderCell>Prescription Required</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(medicines.length > 0
                ? medicines
                : [
                    { id: '1', name: 'Paracetamol 500mg', category: 'PAIN_RELIEF' as const, price: 2.5, stock: 120, requiresPrescription: false },
                    { id: '2', name: 'Sterile First Aid Kit', category: 'FIRST_AID' as const, price: 4.99, stock: 45, requiresPrescription: false },
                    { id: '3', name: 'Amoxicillin Antibiotic 250mg', category: 'PRESCRIPTION_ONLY' as const, price: 9.5, stock: 20, requiresPrescription: true },
                  ]
              ).map(med => (
                <TableRow key={med.id}>
                  <TableCell className="font-semibold text-slate-900">{med.name}</TableCell>
                  <TableCell><Badge variant="purple">{med.category}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">\${med.price.toFixed(2)}</TableCell>
                  <TableCell className="text-xs font-medium text-slate-700">{med.stock} units</TableCell>
                  <TableCell>
                    <Badge variant={med.requiresPrescription ? 'danger' : 'success'}>
                      {med.requiresPrescription ? 'Rx Required' : 'OTC'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Sub-Tab 4: Consultations */}
      {activeSubTab === 'consultations' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-purple-600" />
              <CardTitle>Doctor Consultations & Callback Requests</CardTitle>
            </div>
          </CardHeader>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Patient</TableHeaderCell>
                <TableHeaderCell>Reason / Note</TableHeaderCell>
                <TableHeaderCell>Requested Time</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(consultations.length > 0
                ? consultations
                : [
                    { id: 'c1', type: 'CALLBACK' as const, userId: 'u1', note: 'Experiencing seasonal allergies, request advice.', status: 'REQUESTED' as const, createdAt: new Date().toISOString(), user: { name: 'Alex Johnson', email: 'student@smartcampus.edu', phone: '+1-555-0103' } as any },
                  ]
              ).map(con => (
                <TableRow key={con.id}>
                  <TableCell><Badge variant="info">{con.type}</Badge></TableCell>
                  <TableCell>
                    <p className="text-xs font-semibold text-slate-900">{con.user?.name}</p>
                    <p className="text-[11px] text-slate-400">{con.user?.phone}</p>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 max-w-xs truncate">{con.note || 'General health guidance'}</TableCell>
                  <TableCell className="text-xs text-slate-500">{new Date(con.createdAt).toLocaleTimeString()}</TableCell>
                  <TableCell><Badge variant={con.status === 'COMPLETED' ? 'success' : 'warning'}>{con.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add Medicine Modal */}
      <Modal isOpen={isAddMedModalOpen} onClose={() => setIsAddMedModalOpen(false)} title="Add New Pharmacy Item">
        <form onSubmit={handleAddMedicine} className="space-y-4">
          <Input label="Medicine Name" value={medName} onChange={e => setMedName(e.target.value)} required placeholder="e.g., Ibuprofen 400mg" />
          <Input label="Price (\$)" type="number" step="0.01" value={medPrice} onChange={e => setMedPrice(e.target.value)} required placeholder="3.50" />
          <Input label="Stock Count" type="number" value={medStock} onChange={e => setMedStock(e.target.value)} required />
          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="rxCheck" checked={medPrescription} onChange={e => setMedPrescription(e.target.checked)} className="rounded text-campus-600" />
            <label htmlFor="rxCheck" className="text-xs text-slate-700 font-medium">Requires Doctor Prescription (Rx)</label>
          </div>
          <Button type="submit" className="w-full mt-2">Save Medicine Item</Button>
        </form>
      </Modal>
    </div>
  );
};
