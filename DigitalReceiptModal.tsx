'use client';

import React from 'react';
import { Payment } from '@/lib/types';
import { formatInr } from '@/lib/whatsapp';
import { numberToIndianWords } from '@/lib/receipt';
import { X, Printer, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface DigitalReceiptModalProps {
  payment: Payment | null;
  onClose: () => void;
}

export default function DigitalReceiptModal({ payment, onClose }: DigitalReceiptModalProps) {
  if (!payment) return null;

  const receiptNo = payment.receipt_number || `RCP-202611-${payment.id.slice(0, 6).toUpperCase()}`;
  const amountWords = numberToIndianWords(payment.amount);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
        {/* Actions bar (hidden in print) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span className="font-bold text-slate-800 text-sm">Official Rent Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Document */}
        <div className="border-2 border-slate-900 rounded-2xl p-6 sm:p-8 bg-white relative">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-dashed border-slate-200 pb-5 mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Shanti Niwas & Plaza Estate
              </h2>
              <p className="text-xs text-slate-500">Property Owner & Landlord Management</p>
            </div>
            <div className="sm:text-right">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600">RENT RECEIPT</div>
              <div className="text-sm font-black text-slate-900">{receiptNo}</div>
              <div className="text-xs text-slate-500">Date: {payment.date}</div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs mb-5">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Received From</span>
              <strong className="text-sm text-slate-900 block">{payment.tenant_name || 'Tenant'}</strong>
              <span className="text-slate-500">{payment.tenant_phone || 'N/A'}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Unit / Premises</span>
              <strong className="text-sm text-slate-900 block">{payment.unit_code} ({payment.unit_type})</strong>
              <span className="text-slate-500">Rent for: <strong>{payment.month}</strong></span>
            </div>
          </div>

          {/* Line Item Table */}
          <table className="w-full text-xs mb-5">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase">
                <th className="text-left py-2">Description</th>
                <th className="text-left py-2">Payment Method</th>
                <th className="text-left py-2">Ref / UTR</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 font-medium">
                <td className="py-3 text-slate-800">Monthly Rent ({payment.month})</td>
                <td className="py-3 text-slate-800 font-semibold">{payment.payment_method}</td>
                <td className="py-3 font-mono text-slate-600 text-[11px]">{payment.reference_id || 'CASH-REC'}</td>
                <td className="py-3 text-right text-base font-black text-emerald-700">{formatInr(payment.amount)}</td>
              </tr>
            </tbody>
          </table>

          {/* Amount in words */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 mb-6 font-medium">
            <strong>Amount in words:</strong> {amountWords}
          </div>

          {/* Signatures & Seal */}
          <div className="flex items-end justify-between pt-4 border-t border-slate-100">
            <div>
              <div className="inline-block px-3 py-1 rounded-lg border-2 border-emerald-600 text-emerald-700 font-black text-xs uppercase tracking-wider rotate-[-2deg]">
                ✓ PAYMENT VERIFIED
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Confirmed by: {payment.confirmed_by || 'Landlord'}</p>
            </div>

            <div className="text-right">
              <div className="w-32 border-b border-slate-900 mb-1 ml-auto"></div>
              <span className="text-[11px] text-slate-500 font-medium block">Authorized Signatory</span>
              <span className="text-[10px] text-slate-400">Landlord / Father</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
