'use client';

import React, { useState } from 'react';
import { Payment } from '@/lib/types';
import { formatInr } from '@/lib/whatsapp';
import { Check, Clock, FileText, QrCode, Banknote, Filter, Search, CheckCircle2 } from 'lucide-react';

interface PaymentTrackerProps {
  payments: Payment[];
  onConfirmCash: (paymentId: string, confirmedBy: 'Landlord' | 'Father') => void;
  onViewReceipt: (payment: Payment) => void;
}

export default function PaymentTracker({ payments, onConfirmCash, onViewReceipt }: PaymentTrackerProps) {
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Verified'>('All');
  const [methodFilter, setMethodFilter] = useState<'All' | 'UPI' | 'Cash'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = payments.filter((p) => {
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    if (methodFilter !== 'All' && p.payment_method !== methodFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchUnit = p.unit_code?.toLowerCase().includes(q);
      const matchTenant = p.tenant_name?.toLowerCase().includes(q);
      const matchRef = p.reference_id?.toLowerCase().includes(q);
      return matchUnit || matchTenant || matchRef;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Payment Tracker & Audit Log</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Verify tenant UPI UTR numbers and confirm physical cash hand-overs with Father.
            </p>
          </div>

          {/* Quick Filter Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
              {(['All', 'Pending', 'Verified'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-md transition ${
                    statusFilter === s ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
              {(['All', 'UPI', 'Cash'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethodFilter(m)}
                  className={`px-3 py-1.5 rounded-md transition ${
                    methodFilter === m ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {m === 'All' ? 'All Modes' : m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Unit (e.g. Flat 101), Tenant Name, or UTR / Reference ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Payments Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Date & Month</th>
                <th className="py-3.5 px-4">Unit & Tenant</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Mode & Reference</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No transactions match the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{item.date}</div>
                      <div className="text-[11px] text-slate-400">{item.month}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{item.unit_code}</span>
                        <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.unit_type}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">{item.tenant_name}</div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-black text-slate-900 text-base">{formatInr(item.amount)}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        {item.payment_method === 'UPI' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold text-xs border border-purple-200">
                            <QrCode className="w-3 h-3" /> UPI
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200">
                            <Banknote className="w-3 h-3" /> Cash
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate max-w-[150px]">
                        {item.reference_id || 'N/A'}
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {item.status === 'Verified' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                          <Clock className="w-3.5 h-3.5" /> Pending Verification
                        </span>
                      )}
                      {item.confirmed_by && (
                        <div className="text-[10px] text-slate-400 mt-0.5">by {item.confirmed_by}</div>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === 'Pending' ? (
                          <div className="flex items-center gap-1.5">
                            {/* Manual Confirm Cash Received button */}
                            <button
                              onClick={() => onConfirmCash(item.id, 'Landlord')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-sm transition"
                              title="Mark this payment as verified and confirmed"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{item.payment_method === 'Cash' ? 'Confirm Cash Received' : 'Verify UPI UTR'}</span>
                            </button>
                            <button
                              onClick={() => onConfirmCash(item.id, 'Father')}
                              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium border border-slate-200 transition"
                              title="Father confirmed receipt"
                            >
                              Father Verified
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onViewReceipt(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs border border-slate-200 transition"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>Receipt (PDF)</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
