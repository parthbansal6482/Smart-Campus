import React, { useCallback, useEffect, useState } from 'react';
import { ClipboardList, ExternalLink, MapPin, MessageSquare, Phone, Pill, Plus, ShieldCheck } from 'lucide-react';
import { medicalService } from '../services/medical.service';
import {
  Consultation,
  Emergency,
  EmergencyStatus,
  Medicine,
  MedicineCategory,
  MedicineOrder,
  MedicineOrderStatus,
} from '../types';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select, Switch } from '../components/ui/Field';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { Tabs } from '../components/ui/Tabs';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { EmptyState, PageHeader, SkeletonRows } from '../components/ui/Feedback';
import { toast } from '../components/ui/Toast';
import { EmergencyProgress } from '../components/common/EmergencyProgress';
import {
  consultationTone,
  emergencyLabel,
  emergencyNextAction,
  emergencyTone,
  humanizeTag,
  isEmergencyActive,
  medicineOrderNextAction,
  medicineOrderTone,
} from '../lib/status';
import { formatCurrency, formatDate, formatTime, getErrorMessage, humanize, timeAgo } from '../lib/utils';

type Section = 'emergencies' | 'orders' | 'medicines' | 'consultations';

const categories: MedicineCategory[] = ['GENERAL', 'PAIN_RELIEF', 'FIRST_AID', 'COLD_FEVER', 'PRESCRIPTION_ONLY'];
const LOW_STOCK = 20;

interface MedicineForm {
  id?: string;
  name: string;
  category: MedicineCategory;
  price: string;
  stock: string;
  requiresPrescription: boolean;
}

const emptyForm: MedicineForm = { name: '', category: 'GENERAL', price: '', stock: '50', requiresPrescription: false };

export const MedicalPage: React.FC = () => {
  const [section, setSection] = useState<Section>('emergencies');
  const [loading, setLoading] = useState(true);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [orders, setOrders] = useState<MedicineOrder[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Emergency | null>(null);
  const [form, setForm] = useState<MedicineForm | null>(null);
  const [saving, setSaving] = useState(false);

  const loadEmergencies = useCallback(async () => {
    try {
      setEmergencies(await medicalService.getAllEmergencies(true));
    } catch {
      /* keep last known list */
    }
  }, []);

  useEffect(() => {
    (async () => {
      const [em, med, ord, con] = await Promise.allSettled([
        medicalService.getAllEmergencies(true),
        medicalService.getMedicines(),
        medicalService.getMedicineOrders(true),
        medicalService.getConsultations(true),
      ]);
      if (em.status === 'fulfilled') setEmergencies(em.value);
      if (med.status === 'fulfilled') setMedicines(med.value);
      if (ord.status === 'fulfilled') setOrders(ord.value);
      if (con.status === 'fulfilled') setConsultations(con.value);
      setLoading(false);
    })();
    const interval = setInterval(loadEmergencies, 20000);
    return () => clearInterval(interval);
  }, [loadEmergencies]);

  const active = emergencies.filter(e => isEmergencyActive(e.status));
  const resolved = emergencies.filter(e => !isEmergencyActive(e.status));
  const openOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const openConsultations = consultations.filter(c => c.status === 'REQUESTED' || c.status === 'SCHEDULED');

  const updateEmergency = async (emergency: Emergency, status: EmergencyStatus) => {
    setBusyId(emergency.id);
    try {
      const updated = await medicalService.updateEmergencyStatus(emergency.id, status);
      setEmergencies(prev => prev.map(e => (e.id === emergency.id ? updated : e)));
      toast.success(`${emergency.building?.name || 'Incident'}: ${emergencyLabel[status].toLowerCase()}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Couldn’t update the emergency.'));
    } finally {
      setBusyId(null);
      setCancelTarget(null);
    }
  };

  const updateOrder = async (order: MedicineOrder, status: MedicineOrderStatus) => {
    setBusyId(order.id);
    try {
      const updated = await medicalService.updateMedicineOrderStatus(order.id, status);
      setOrders(prev => prev.map(o => (o.id === order.id ? { ...o, status: updated.status } : o)));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Couldn’t update the order.'));
    } finally {
      setBusyId(null);
    }
  };

  const updateConsultation = async (consultation: Consultation, status: Consultation['status']) => {
    setBusyId(consultation.id);
    try {
      const updated = await medicalService.updateConsultationStatus(consultation.id, status);
      setConsultations(prev => prev.map(c => (c.id === consultation.id ? { ...c, status: updated.status } : c)));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Couldn’t update the request.'));
    } finally {
      setBusyId(null);
    }
  };

  const saveMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      category: form.category,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
      requiresPrescription: form.requiresPrescription,
    };
    try {
      if (form.id) {
        const updated = await medicalService.updateMedicine(form.id, payload);
        setMedicines(prev => prev.map(m => (m.id === form.id ? updated : m)));
        toast.success(`${payload.name} updated`);
      } else {
        const created = await medicalService.createMedicine(payload);
        setMedicines(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success(`${payload.name} added`);
      }
      setForm(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Couldn’t save the medicine.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Medical help"
        description="Emergency dispatch, the campus pharmacy and requests to talk to medical staff."
        actions={
          section === 'medicines' && (
            <Button size="sm" onClick={() => setForm(emptyForm)}>
              <Plus className="w-4 h-4" /> Add medicine
            </Button>
          )
        }
      />

      <Tabs
        className="mb-6"
        value={section}
        onChange={setSection}
        items={[
          { value: 'emergencies', label: 'Emergencies', count: active.length },
          { value: 'orders', label: 'Pharmacy orders', count: openOrders.length },
          { value: 'medicines', label: 'Medicines', count: medicines.length },
          { value: 'consultations', label: 'Consultations', count: openConsultations.length },
        ]}
      />

      {section === 'emergencies' && (
        <div className="space-y-6">
          {loading ? (
            <Card className="pt-5">
              <SkeletonRows rows={3} />
            </Card>
          ) : active.length === 0 ? (
            <Card>
              <EmptyState
                icon={ShieldCheck}
                title="No active emergencies"
                description="When someone presses SOS in the mobile app, the alert appears here with their location. This page refreshes automatically."
              />
            </Card>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {active.map(e => {
                const next = emergencyNextAction[e.status];
                const reported = e.status === 'REPORTED';
                return (
                  <Card key={e.id} className={reported ? 'border-critical-line' : undefined}>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] text-ink-3">
                            {humanizeTag(e.tag)} · {timeAgo(e.reportedAt)}
                          </p>
                          <h3 className="font-serif text-[28px] leading-tight text-ink mt-1">
                            {e.building?.name || 'Unidentified location'}
                          </h3>
                        </div>
                        <Badge tone={emergencyTone(e.status)}>{emergencyLabel[e.status]}</Badge>
                      </div>

                      <dl className="grid sm:grid-cols-2 gap-4 mt-5 text-[13px]">
                        <div>
                          <dt className="text-ink-3">Location</dt>
                          <dd className="text-ink mt-0.5 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-ink-3" />
                            {e.building?.code ? `${e.building.code} · ` : ''}
                            <a
                              href={`https://www.google.com/maps?q=${e.latitude},${e.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="underline decoration-line-strong underline-offset-2 hover:decoration-ink inline-flex items-center gap-1"
                            >
                              Open map <ExternalLink className="w-3 h-3" />
                            </a>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-ink-3">Reported by</dt>
                          <dd className="text-ink mt-0.5">
                            {e.user?.name || 'Unknown'}
                            {e.user?.phone && (
                              <a
                                href={`tel:${e.user.phone}`}
                                className="ml-2 inline-flex items-center gap-1 text-ink-2 hover:text-ink"
                              >
                                <Phone className="w-3 h-3" /> {e.user.phone}
                              </a>
                            )}
                          </dd>
                        </div>
                      </dl>

                      {e.description && (
                        <p className="mt-4 text-[13px] text-ink-2 leading-relaxed border-l-2 border-line pl-3">{e.description}</p>
                      )}

                      <div className="mt-5">
                        <EmergencyProgress status={e.status} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-line bg-canvas/50 rounded-b-xl">
                      <Button variant="ghost" size="sm" onClick={() => setCancelTarget(e)} disabled={busyId === e.id}>
                        Cancel incident
                      </Button>
                      {next && (
                        <Button
                          size="sm"
                          variant={reported ? 'danger' : 'primary'}
                          isLoading={busyId === e.id}
                          onClick={() => updateEmergency(e, next.status)}
                        >
                          {next.label}
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {resolved.length > 0 && (
            <Card>
              <CardHeader title="History" description="Handled and cancelled incidents" />
              <Table>
                <THead>
                  <tr>
                    <TH>Location</TH>
                    <TH>Type</TH>
                    <TH>Reported by</TH>
                    <TH>Reported</TH>
                    <TH>Response time</TH>
                    <TH>Outcome</TH>
                  </tr>
                </THead>
                <TBody>
                  {resolved.map(e => (
                    <TR key={e.id}>
                      <TD className="text-ink">{e.building?.name || '—'}</TD>
                      <TD>{humanizeTag(e.tag)}</TD>
                      <TD>{e.user?.name}</TD>
                      <TD className="whitespace-nowrap">
                        {formatDate(e.reportedAt)}, {formatTime(e.reportedAt)}
                      </TD>
                      <TD className="tabular">
                        {e.resolvedAt
                          ? `${Math.max(1, Math.round((new Date(e.resolvedAt).getTime() - new Date(e.reportedAt).getTime()) / 60000))} min`
                          : '—'}
                      </TD>
                      <TD>
                        <Badge tone={emergencyTone(e.status)}>{emergencyLabel[e.status]}</Badge>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </Card>
          )}
        </div>
      )}

      {section === 'orders' && (
        <Card>
          {loading ? (
            <div className="pt-5">
              <SkeletonRows />
            </div>
          ) : orders.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No pharmacy orders" description="Orders placed from the campus pharmacy in the app appear here." />
          ) : (
            <Table>
              <THead className="border-t-0">
                <tr>
                  <TH>Patient</TH>
                  <TH>Items</TH>
                  <TH>Fulfilment</TH>
                  <TH className="text-right">Total</TH>
                  <TH>Status</TH>
                  <TH className="text-right">
                    <span className="sr-only">Actions</span>
                  </TH>
                </tr>
              </THead>
              <TBody>
                {orders.map(order => {
                  const next = medicineOrderNextAction[order.status];
                  const needsRx = order.items?.some(i => i.medicine.requiresPrescription);
                  return (
                    <TR key={order.id}>
                      <TD>
                        <p className="text-ink">{order.user?.name}</p>
                        <p className="text-xs text-ink-3">{timeAgo(order.createdAt)}</p>
                      </TD>
                      <TD className="max-w-[280px]">
                        <p className="truncate">{order.items?.map(i => `${i.quantity}× ${i.medicine.name}`).join(', ')}</p>
                        {needsRx && (
                          <p className="text-xs mt-0.5 text-warn">
                            {order.prescriptionUrl ? 'Prescription attached' : 'Prescription required'}
                          </p>
                        )}
                      </TD>
                      <TD>
                        <p>{humanize(order.pickupOrDelivery)}</p>
                        {order.deliveryAddress && <p className="text-xs text-ink-3 truncate max-w-[180px]">{order.deliveryAddress}</p>}
                      </TD>
                      <TD className="text-right text-ink tabular">{formatCurrency(order.totalAmount)}</TD>
                      <TD>
                        <Badge tone={medicineOrderTone(order.status)}>{humanize(order.status)}</Badge>
                      </TD>
                      <TD className="text-right whitespace-nowrap">
                        {next && (
                          <Button size="sm" variant="secondary" disabled={busyId === order.id} onClick={() => updateOrder(order, next.status)}>
                            {next.label}
                          </Button>
                        )}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </Card>
      )}

      {section === 'medicines' && (
        <Card>
          {loading ? (
            <div className="pt-5">
              <SkeletonRows />
            </div>
          ) : medicines.length === 0 ? (
            <EmptyState
              icon={Pill}
              title="No medicines yet"
              description="Add the medicines the campus pharmacy stocks so students can order them."
              action={
                <Button size="sm" onClick={() => setForm(emptyForm)}>
                  <Plus className="w-4 h-4" /> Add medicine
                </Button>
              }
            />
          ) : (
            <Table>
              <THead className="border-t-0">
                <tr>
                  <TH>Medicine</TH>
                  <TH>Category</TH>
                  <TH className="text-right">Price</TH>
                  <TH className="text-right">In stock</TH>
                  <TH>Dispensing</TH>
                  <TH className="text-right">
                    <span className="sr-only">Actions</span>
                  </TH>
                </tr>
              </THead>
              <TBody>
                {medicines.map(med => (
                  <TR key={med.id}>
                    <TD className="text-ink font-medium">{med.name}</TD>
                    <TD>{humanize(med.category)}</TD>
                    <TD className="text-right tabular">{formatCurrency(med.price)}</TD>
                    <TD className="text-right tabular">
                      <span className={med.stock < LOW_STOCK ? 'text-warn font-medium' : 'text-ink'}>{med.stock}</span>
                      {med.stock < LOW_STOCK && <span className="block text-xs text-warn">Low</span>}
                    </TD>
                    <TD>
                      <Badge tone={med.requiresPrescription ? 'warn' : 'neutral'} dot={false}>
                        {med.requiresPrescription ? 'Prescription' : 'Over the counter'}
                      </Badge>
                    </TD>
                    <TD className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setForm({
                            id: med.id,
                            name: med.name,
                            category: med.category,
                            price: String(med.price),
                            stock: String(med.stock),
                            requiresPrescription: med.requiresPrescription,
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

      {section === 'consultations' && (
        <Card>
          {loading ? (
            <div className="pt-5">
              <SkeletonRows />
            </div>
          ) : consultations.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No consultation requests"
              description="Requests to chat, call back or book an appointment appear here."
            />
          ) : (
            <Table>
              <THead className="border-t-0">
                <tr>
                  <TH>Patient</TH>
                  <TH>Request</TH>
                  <TH>Concern</TH>
                  <TH>Received</TH>
                  <TH>Status</TH>
                  <TH className="text-right">
                    <span className="sr-only">Actions</span>
                  </TH>
                </tr>
              </THead>
              <TBody>
                {consultations.map(c => (
                  <TR key={c.id}>
                    <TD>
                      <p className="text-ink">{c.user?.name}</p>
                      {c.user?.phone && (
                        <a href={`tel:${c.user.phone}`} className="text-xs text-ink-3 hover:text-ink">
                          {c.user.phone}
                        </a>
                      )}
                    </TD>
                    <TD>
                      {c.type === 'CALLBACK' ? 'Call back' : humanize(c.type)}
                      {c.slotTime && <p className="text-xs text-ink-3">{formatDate(c.slotTime)}, {formatTime(c.slotTime)}</p>}
                    </TD>
                    <TD className="max-w-[300px]">
                      <p className="line-clamp-2">{c.note || '—'}</p>
                    </TD>
                    <TD className="whitespace-nowrap">{timeAgo(c.createdAt)}</TD>
                    <TD>
                      <Badge tone={consultationTone(c.status)}>{humanize(c.status)}</Badge>
                    </TD>
                    <TD className="text-right whitespace-nowrap">
                      {c.status === 'REQUESTED' && (
                        <Button size="sm" variant="secondary" disabled={busyId === c.id} onClick={() => updateConsultation(c, 'SCHEDULED')}>
                          Schedule
                        </Button>
                      )}
                      {c.status === 'SCHEDULED' && (
                        <Button size="sm" variant="secondary" disabled={busyId === c.id} onClick={() => updateConsultation(c, 'COMPLETED')}>
                          Mark done
                        </Button>
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
        title={form?.id ? 'Edit medicine' : 'Add medicine'}
        description={form?.id ? 'Update price, stock or dispensing rules.' : 'It will be available to order in the campus pharmacy.'}
      >
        {form && (
          <form onSubmit={saveMedicine} className="space-y-4">
            <Input
              label="Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Paracetamol 500mg, strip of 10"
              required
              autoFocus
            />
            <Select
              label="Category"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value as MedicineCategory })}
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {humanize(c)}
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Price (₹)"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                required
              />
              <Input
                label="Units in stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={e => setForm({ ...form, stock: e.target.value })}
                required
              />
            </div>
            <label className="flex items-center justify-between gap-4 rounded-lg border border-line px-3.5 py-3 cursor-pointer">
              <span>
                <span className="block text-[13px] font-medium text-ink">Requires a prescription</span>
                <span className="block text-xs text-ink-3">Students must attach one when ordering.</span>
              </span>
              <Switch
                label="Requires a prescription"
                checked={form.requiresPrescription}
                onChange={value => setForm({ ...form, requiresPrescription: value })}
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setForm(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={saving}>
                {form.id ? 'Save changes' : 'Add medicine'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!cancelTarget}
        title="Cancel this incident?"
        description="Only cancel if the alert was a mistake or help is no longer needed. The reporter will see the incident as cancelled."
        confirmLabel="Cancel incident"
        destructive
        isLoading={busyId === cancelTarget?.id}
        onConfirm={() => cancelTarget && updateEmergency(cancelTarget, 'CANCELLED')}
        onCancel={() => setCancelTarget(null)}
      />
    </>
  );
};
