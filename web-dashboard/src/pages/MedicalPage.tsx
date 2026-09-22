import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { medicalService } from '../services/medical.service';
import { Emergency, EmergencyStatus, Medicine, MedicineOrder, Consultation } from '../types';
import { HeartPulse, ShieldAlert, Pill, PhoneCall, Plus, MapPin, CheckCircle, Clock, AlertTriangle, UserCheck, PackageCheck } from 'lucide-react';

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
      setMedStock('50');
      setMedPrescription(false);
    } catch (err) {
      console.error('Failed to add medicine', err);
    }
  };

  const activeEmergencyCount = emergencies.filter(e => e.status !== 'HANDLED').length;

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tabs Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${activeEmergencyCount > 0 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`}></span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Health & Emergency Command</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Medical Operations Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rapid ambulance dispatch, campus pharmacy catalog, and health consultations
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('emergencies')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === 'emergencies'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Dispatches</span>
            {activeEmergencyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {activeEmergencyCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('orders')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === 'orders'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>Pharmacy Orders ({medicineOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('medicines')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === 'medicines'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className="w-3.5 h-3.5 text-emerald-500" />
            <span>Inventory ({medicines.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('consultations')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === 'consultations'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-purple-500" />
            <span>Consultations ({consultations.length})</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Emergency Dispatches */}
      {activeSubTab === 'emergencies' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <div>
                <CardTitle>Active Incident & Ambulance Triage</CardTitle>
                <p className="text-[11px] text-slate-400">Manage real-time responder assignments and patient handoffs</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Live Status:</span>
              <Badge variant={activeEmergencyCount > 0 ? 'danger' : 'success'} dot>
                {activeEmergencyCount > 0 ? `${activeEmergencyCount} Active Alert(s)` : 'Standby'}
              </Badge>
            </div>
          </CardHeader>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Incident Status</TableHeaderCell>
                <TableHeaderCell>Category & Reason</TableHeaderCell>
                <TableHeaderCell>Victim / Student</TableHeaderCell>
                <TableHeaderCell>Location & GPS</TableHeaderCell>
                <TableHeaderCell>Reported At</TableHeaderCell>
                <TableHeaderCell className="text-right">Response Progression</TableHeaderCell>
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
                      dot
                      variant={
                        incident.status === 'REPORTED'
                          ? 'danger'
                          : incident.status === 'ASSIGNED' || incident.status === 'ON_THE_WAY'
                          ? 'warning'
                          : incident.status === 'HANDLED'
                          ? 'success'
                          : 'info'
                      }
                    >
                      {incident.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase mb-1">
                      {incident.tag || 'OTHER'}
                    </span>
                    <p className="text-xs text-slate-800 font-medium max-w-xs">{incident.description || 'Emergency alert'}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-bold text-slate-900">{incident.user?.name || 'Campus Student'}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{incident.user?.phone || 'No phone provided'}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{incident.building?.name || 'Campus Academic Quad'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono tabular-nums">
                    {new Date(incident.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {incident.status === 'REPORTED' && (
                        <Button size="sm" variant="danger" onClick={() => handleEmergencyStatus(incident.id, 'ASSIGNED')}>
                          Assign Ambulance
                        </Button>
                      )}
                      {incident.status === 'ASSIGNED' && (
                        <Button size="sm" variant="executive" onClick={() => handleEmergencyStatus(incident.id, 'ON_THE_WAY')}>
                          Dispatch En Route
                        </Button>
                      )}
                      {incident.status === 'ON_THE_WAY' && (
                        <Button size="sm" variant="primary" onClick={() => handleEmergencyStatus(incident.id, 'ARRIVED')}>
                          Mark On Scene
                        </Button>
                      )}
                      {incident.status === 'ARRIVED' && (
                        <Button size="sm" variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200" onClick={() => handleEmergencyStatus(incident.id, 'HANDLED')}>
                          Mark Resolved
                        </Button>
                      )}
                      {incident.status === 'HANDLED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Resolved
                        </span>
                      )}
                    </div>
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
              <Pill className="w-5 h-5 text-blue-600" />
              <div>
                <CardTitle>Campus Pharmacy Student Orders</CardTitle>
                <p className="text-[11px] text-slate-400">Prescription and OTC medication fulfillment pipeline</p>
              </div>
            </div>
          </CardHeader>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Order Reference</TableHeaderCell>
                <TableHeaderCell>Patient</TableHeaderCell>
                <TableHeaderCell>Prescription Status</TableHeaderCell>
                <TableHeaderCell>Fulfillment Details</TableHeaderCell>
                <TableHeaderCell>Order Total</TableHeaderCell>
                <TableHeaderCell>Fulfillment Status</TableHeaderCell>
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
                  <TableCell className="font-mono text-xs font-bold text-slate-800">#{ord.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <p className="text-xs font-bold text-slate-900">{ord.user?.name || 'Student'}</p>
                    <p className="text-[11px] text-slate-400">{ord.user?.email || 'student@smartcampus.edu'}</p>
                  </TableCell>
                  <TableCell>
                    {ord.prescriptionUrl ? (
                      <Badge variant="purple" dot>Rx Verified</Badge>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">Over-The-Counter</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    <span className="font-bold text-slate-900">{ord.pickupOrDelivery}:</span> {ord.deliveryAddress || 'Health Center Front Desk'}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                    \${ord.totalAmount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ord.status === 'DELIVERED' ? 'success' : 'warning'} dot>
                      {ord.status}
                    </Badge>
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
            <div>
              <CardTitle>Medical Center Pharmacy Inventory</CardTitle>
              <p className="text-[11px] text-slate-400">Track medication inventory counts, price points, and prescription locks</p>
            </div>
            <Button size="sm" variant="executive" onClick={() => setIsAddMedModalOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Medication
            </Button>
          </CardHeader>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Medication</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>Unit Price</TableHeaderCell>
                <TableHeaderCell>Stock Level</TableHeaderCell>
                <TableHeaderCell>Requirement</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(medicines.length > 0
                ? medicines
                : [
                    { id: '1', name: 'Paracetamol 500mg (10 Tabs)', category: 'PAIN_RELIEF' as const, price: 2.5, stock: 120, requiresPrescription: false },
                    { id: '2', name: 'Sterile First Aid Bandage Kit', category: 'FIRST_AID' as const, price: 4.99, stock: 45, requiresPrescription: false },
                    { id: '3', name: 'Amoxicillin Antibiotic 250mg', category: 'PRESCRIPTION_ONLY' as const, price: 9.5, stock: 20, requiresPrescription: true },
                  ]
              ).map(med => (
                <TableRow key={med.id}>
                  <TableCell className="font-bold text-slate-900">{med.name}</TableCell>
                  <TableCell>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {med.category?.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                    \${med.price.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold tabular-nums ${med.stock < 30 ? 'text-amber-700' : 'text-slate-800'}`}>
                        {med.stock} in stock
                      </span>
                      <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${med.stock < 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, (med.stock / 100) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={med.requiresPrescription ? 'danger' : 'success'} dot>
                      {med.requiresPrescription ? 'Doctor Rx Required' : 'OTC Available'}
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
              <div>
                <CardTitle>Doctor Consultations & Health Callback Queue</CardTitle>
                <p className="text-[11px] text-slate-400">Student requested triage advice and doctor callbacks</p>
              </div>
            </div>
          </CardHeader>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Consultation Type</TableHeaderCell>
                <TableHeaderCell>Patient Details</TableHeaderCell>
                <TableHeaderCell>Symptom Summary / Note</TableHeaderCell>
                <TableHeaderCell>Logged Time</TableHeaderCell>
                <TableHeaderCell>Queue Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(consultations.length > 0
                ? consultations
                : [
                    { id: 'c1', type: 'CALLBACK' as const, userId: 'u1', note: 'Experiencing seasonal allergies, request advice on antihistamines.', status: 'REQUESTED' as const, createdAt: new Date().toISOString(), user: { name: 'Alex Johnson', email: 'student@smartcampus.edu', phone: '+1-555-0103' } as any },
                  ]
              ).map(con => (
                <TableRow key={con.id}>
                  <TableCell>
                    <Badge variant="info">{con.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-bold text-slate-900">{con.user?.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{con.user?.phone}</p>
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 max-w-sm">
                    {con.note || 'General health consultation'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono tabular-nums">
                    {new Date(con.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={con.status === 'COMPLETED' ? 'success' : 'warning'} dot>
                      {con.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add Medicine Modal */}
      <Modal isOpen={isAddMedModalOpen} onClose={() => setIsAddMedModalOpen(false)} title="Add New Pharmacy Item">
        <form onSubmit={handleAddMedicine} className="space-y-4">
          <Input
            label="Medicine / Product Name"
            value={medName}
            onChange={e => setMedName(e.target.value)}
            required
            placeholder="e.g., Ibuprofen 400mg (12 Tabs)"
          />
          <Input
            label="Unit Price (\$)"
            type="number"
            step="0.01"
            value={medPrice}
            onChange={e => setMedPrice(e.target.value)}
            required
            placeholder="3.50"
          />
          <Input
            label="Initial Stock Quantity"
            type="number"
            value={medStock}
            onChange={e => setMedStock(e.target.value)}
            required
          />
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="rxCheck"
              checked={medPrescription}
              onChange={e => setMedPrescription(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="rxCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
              Requires Doctor Prescription Verification (Rx)
            </label>
          </div>
          <Button type="submit" variant="executive" className="w-full mt-2">
            Save Item to Pharmacy
          </Button>
        </form>
      </Modal>
    </div>
  );
};
