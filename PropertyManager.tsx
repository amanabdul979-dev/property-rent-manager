'use client';

import React, { useState } from 'react';
import { Property, Tenant } from '@/lib/types';
import { formatInr } from '@/lib/whatsapp';
import { Building, Plus, Phone, Calendar, ShieldCheck, UserCheck, X } from 'lucide-react';

interface PropertyManagerProps {
  properties: Property[];
  onAddProperty: (propertyData: Partial<Property>) => void;
}

export default function PropertyManager({ properties, onAddProperty }: PropertyManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'All' | 'Flat' | 'Shop'>('All');

  // Form State
  const [unitCode, setUnitCode] = useState('');
  const [unitType, setUnitType] = useState<'Flat' | 'Shop'>('Flat');
  const [rentAmount, setRentAmount] = useState('');
  const [dueDay, setDueDay] = useState('5');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [buildingName, setBuildingName] = useState('Shanti Niwas Complex');

  const filtered = properties.filter((p) => {
    if (filterType === 'All') return true;
    return p.unit_type === filterType;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitCode || !rentAmount || !dueDay) return;

    onAddProperty({
      unit_code: unitCode,
      unit_type: unitType,
      rent_amount: Number(rentAmount),
      due_day: Number(dueDay),
      security_deposit: Number(securityDeposit || 0),
      building_name: buildingName,
      tenant_name: tenantName || undefined,
      tenant_phone: tenantPhone || undefined,
      is_occupied: Boolean(tenantName),
    });

    // Reset Form
    setUnitCode('');
    setRentAmount('');
    setSecurityDeposit('');
    setTenantName('');
    setTenantPhone('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Properties & Tenant Roster</h2>
          <p className="text-xs sm:text-sm text-slate-500">Manage flats and commercial shops owned by you and your father.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Unit Type Filter */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
            {(['All', 'Flat', 'Shop'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-md transition ${
                  filterType === type ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type === 'All' ? 'All Units' : type === 'Flat' ? 'Flats' : 'Shops'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Unit</span>
          </button>
        </div>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((prop) => (
          <div
            key={prop.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              {/* Unit Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${
                      prop.unit_type === 'Flat'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {prop.unit_type === 'Flat' ? '🏡 Residential Flat' : '🏪 Commercial Shop'}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{prop.unit_code}</h3>
                  <p className="text-xs text-slate-500">{prop.building_name || 'Shanti Niwas'}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-slate-900">{formatInr(prop.rent_amount)}</span>
                  <span className="block text-[11px] text-slate-400">/ month</span>
                </div>
              </div>

              {/* Due Date & Security Deposit */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Due: <strong>{prop.due_day}th</strong> of month</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Deposit: <strong>{formatInr(prop.security_deposit || 0)}</strong></span>
                </div>
              </div>

              {/* Tenant Section */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                {prop.tenant_name ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5 text-emerald-600">
                        <UserCheck className="w-3.5 h-3.5" /> Occupied
                      </span>
                      <span className="text-slate-900">{prop.tenant_name}</span>
                    </div>
                    {prop.tenant_phone && (
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {prop.tenant_phone}
                        </span>
                        <a
                          href={`https://wa.me/${prop.tenant_phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          Chat on WA
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg font-medium text-center">
                    Vacant Unit (Ready for lease)
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Unit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Add New Rental Property</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Unit Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 301 or Shop 04"
                    value={unitCode}
                    onChange={(e) => setUnitCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Unit Type *</label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value as 'Flat' | 'Shop')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Flat">Residential Flat</option>
                    <option value="Shop">Commercial Shop</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">Monthly Rent (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="18000"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Due Day *</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Security Deposit (₹)</label>
                  <input
                    type="number"
                    placeholder="36000"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Building / Complex</label>
                  <input
                    type="text"
                    value={buildingName}
                    onChange={(e) => setBuildingName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-semibold text-slate-800 mb-2">Tenant Details (Optional)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Tenant Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Patel"
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Tenant Phone</label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={tenantPhone}
                      onChange={(e) => setTenantPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
