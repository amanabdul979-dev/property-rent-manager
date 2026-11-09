'use client';

import React, { useState } from 'react';
import { Property, Tenant, Payment, Issue } from '@/lib/types';
import { formatInr } from '@/lib/whatsapp';
import { buildStandardUpiUrl, generateAllUpiLinks } from '@/lib/upi';
import { 
  Building, 
  QrCode, 
  CreditCard, 
  Banknote, 
  AlertCircle, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Send, 
  ChevronDown, 
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';

interface TenantPortalViewProps {
  tenants: Tenant[];
  activeTenantId: string;
  onSelectTenant: (id: string) => void;
  payments: Payment[];
  issues: Issue[];
  onSubmitPayment: (data: { property_id: string; tenant_id: string; amount: number; payment_method: 'UPI' | 'Cash'; reference_id: string; notes?: string }) => void;
  onSubmitIssue: (data: { property_id: string; tenant_id: string; category: any; priority: any; title: string; description: string }) => void;
  onViewReceipt: (payment: Payment) => void;
}

export default function TenantPortalView({
  tenants,
  activeTenantId,
  onSelectTenant,
  payments,
  issues,
  onSubmitPayment,
  onSubmitIssue,
  onViewReceipt,
}: TenantPortalViewProps) {
  const activeTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0];
  const [activeTab, setActiveTab] = useState<'pay' | 'issues' | 'receipts'>('pay');

  // UPI / Payment State
  const [upiUtrInput, setUpiUtrInput] = useState('');
  const [isCashAlertSent, setIsCashAlertSent] = useState(false);
  const [isUpiSubmitted, setIsUpiSubmitted] = useState(false);

  // Issue Reporting Form State
  const [issueTitle, setIssueTitle] = useState('');
  const [issueCategory, setIssueCategory] = useState<'Plumbing' | 'Electrical' | 'Shutter' | 'Leaks' | 'Structural' | 'Other'>('Plumbing');
  const [issuePriority, setIssuePriority] = useState<'Low' | 'High' | 'Urgent'>('High');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueSubmittedSuccess, setIssueSubmittedSuccess] = useState(false);

  if (!activeTenant) {
    return <div className="p-8 text-center text-slate-500">No active tenants found.</div>;
  }

  const rentAmount = activeTenant.rent_amount || 18000;
  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  // Generate UPI parameters
  const landlordVpa = 'landlord.father@upi';
  const payeeName = 'Landlord & Father Estate';
  const upiParams = {
    payeeVpa: landlordVpa,
    payeeName,
    amount: rentAmount,
    transactionNote: `Rent for ${activeTenant.unit_code} - ${currentMonthName}`,
    transactionRef: `RENT-${activeTenant.unit_code?.replace(/\s+/g, '')}-${Date.now().toString().slice(-6)}`,
  };

  const upiLinks = generateAllUpiLinks(upiParams);

  // Quick QR Code Generator URL (uses standard encoded SVG/chart QR API for instant real scannability)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(upiLinks.standardUpi)}`;

  // Filter payments for this tenant
  const tenantPayments = payments.filter((p) => p.tenant_id === activeTenant.id || p.unit_code === activeTenant.unit_code);
  const verifiedPayments = tenantPayments.filter((p) => p.status === 'Verified');
  const pendingPayments = tenantPayments.filter((p) => p.status === 'Pending');

  // Filter issues for this tenant
  const tenantIssues = issues.filter((i) => i.tenant_id === activeTenant.id || i.unit_code === activeTenant.unit_code);

  const handleUpiSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant.property_id) return;
    onSubmitPayment({
      property_id: activeTenant.property_id,
      tenant_id: activeTenant.id,
      amount: rentAmount,
      payment_method: 'UPI',
      reference_id: upiUtrInput || `UPI-${Date.now().toString().slice(-8)}`,
      notes: 'Submitted via Tenant Portal UPI Engine',
    });
    setIsUpiSubmitted(true);
    setUpiUtrInput('');
  };

  const handleCashAlert = () => {
    if (!activeTenant.property_id) return;
    onSubmitPayment({
      property_id: activeTenant.property_id,
      tenant_id: activeTenant.id,
      amount: rentAmount,
      payment_method: 'Cash',
      reference_id: 'CASH-ALERT-HANDOVER',
      notes: 'Tenant notified: Paying cash in hand at premises',
    });
    setIsCashAlertSent(true);
  };

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant.property_id || !issueTitle || !issueDescription) return;
    onSubmitIssue({
      property_id: activeTenant.property_id,
      tenant_id: activeTenant.id,
      category: issueCategory,
      priority: issuePriority,
      title: issueTitle,
      description: issueDescription,
    });
    setIssueSubmittedSuccess(true);
    setIssueTitle('');
    setIssueDescription('');
    setTimeout(() => setIssueSubmittedSuccess(false), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Tenant Switcher (Simulates individual tenant login) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Logged in Tenant:</span>
          <select
            value={activeTenant.id}
            onChange={(e) => {
              onSelectTenant(e.target.value);
              setIsCashAlertSent(false);
              setIsUpiSubmitted(false);
            }}
            className="text-xs sm:text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.unit_code} - {t.unit_type})
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs text-slate-500">
          Phone: <span className="font-semibold text-slate-700">{activeTenant.phone}</span>
        </div>
      </div>

      {/* Tenant Unit Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/30 mb-2">
              <Building className="w-3.5 h-3.5 text-blue-300" />
              <span>{activeTenant.unit_type === 'Flat' ? 'Residential Flat' : 'Commercial Shop'}</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">{activeTenant.unit_code}</h1>
            <p className="text-sm text-blue-200 mt-1">Tenant: <strong>{activeTenant.name}</strong></p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 sm:text-right">
            <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold block">Monthly Rent</span>
            <div className="text-3xl font-black text-amber-300">{formatInr(rentAmount)}</div>
            <span className="text-xs text-blue-100 block mt-1">
              Due on: <strong>{activeTenant.due_day || 5}th of every month</strong>
            </span>
          </div>
        </div>

        {/* Portal Tabs */}
        <div className="relative z-10 mt-8 flex space-x-2 border-t border-white/10 pt-4">
          <button
            onClick={() => setActiveTab('pay')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
              activeTab === 'pay' ? 'bg-white text-slate-900 shadow-lg' : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span>Pay Rent (UPI / Cash)</span>
          </button>

          <button
            onClick={() => setActiveTab('receipts')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
              activeTab === 'receipts' ? 'bg-white text-slate-900 shadow-lg' : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Digital Receipts ({verifiedPayments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('issues')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
              activeTab === 'issues' ? 'bg-white text-slate-900 shadow-lg' : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>Report Issue</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PAY RENT (UPI ENGINE & CASH ALERT) */}
      {activeTab === 'pay' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Notification Banners */}
          {isCashAlertSent && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs sm:text-sm">
                <strong>Cash Hand-over Alert Sent!</strong> Landlord and Father have been notified to collect cash at your unit. Once received, they will confirm and generate your receipt.
              </div>
            </div>
          )}

          {isUpiSubmitted && (
            <div className="bg-purple-50 border border-purple-200 text-purple-900 p-4 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
              <div className="text-xs sm:text-sm">
                <strong>UPI Payment Recorded!</strong> Your UTR has been logged. Landlord verification will instantly release your digital receipt.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dynamic UPI QR Code Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 mb-3">
                <QrCode className="w-3.5 h-3.5" /> Dynamic UPI QR Code
              </div>

              <h2 className="text-lg font-bold text-slate-900">Scan to Pay with Any UPI App</h2>
              <p className="text-xs text-slate-500 mb-4">
                Exact rent amount of <strong className="text-slate-900">{formatInr(rentAmount)}</strong> is embedded.
              </p>

              {/* QR Code Container */}
              <div className="p-3 bg-white rounded-2xl border-2 border-slate-900 shadow-md inline-block mb-3">
                <img
                  src={qrCodeUrl}
                  alt="UPI QR Code for Rent"
                  className="w-48 h-48 rounded-lg"
                  loading="lazy"
                />
              </div>

              <div className="text-[11px] font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 mb-4">
                VPA: <strong>{landlordVpa}</strong>
              </div>

              {/* Mobile 1-Tap UPI Deep Links */}
              <div className="w-full space-y-2">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Or Open Directly In Your UPI App:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={upiLinks.gpay}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 font-bold text-xs text-slate-800 flex flex-col items-center justify-center gap-1 transition"
                  >
                    <span className="text-blue-600 font-extrabold text-sm">GPay</span>
                    <span className="text-[10px] text-slate-500">Google Pay</span>
                  </a>

                  <a
                    href={upiLinks.phonepe}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 font-bold text-xs text-slate-800 flex flex-col items-center justify-center gap-1 transition"
                  >
                    <span className="text-purple-600 font-extrabold text-sm">PhonePe</span>
                    <span className="text-[10px] text-slate-500">PhonePe App</span>
                  </a>

                  <a
                    href={upiLinks.paytm}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 font-bold text-xs text-slate-800 flex flex-col items-center justify-center gap-1 transition"
                  >
                    <span className="text-sky-600 font-extrabold text-sm">Paytm</span>
                    <span className="text-[10px] text-slate-500">Paytm UPI</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Verification & Cash Notification Side */}
            <div className="space-y-6">
              {/* 1. Enter UPI UTR for verification */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 mb-1">Already Paid via UPI?</h2>
                <p className="text-xs text-slate-500 mb-4">
                  Enter your 12-digit UPI UTR / Bank Reference Number to immediately submit for verification.
                </p>

                <form onSubmit={handleUpiSubmission} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      UPI Ref / UTR Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 481928392104"
                      value={upiUtrInput}
                      onChange={(e) => setUpiUtrInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-purple-500/20 transition flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Submit UPI Verification</span>
                  </button>
                </form>
              </div>

              {/* 2. Paid via Cash Notification Button */}
              <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-3xl p-6">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-base mb-1">
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  <span>Paying in Cash?</span>
                </div>
                <p className="text-xs text-emerald-700 mb-4">
                  Handing over cash to the Landlord or their Father? Click below to send an instant alert to their dashboard so they can confirm collection.
                </p>

                <button
                  type="button"
                  onClick={handleCashAlert}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>"Paid via Cash" Notification Button</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIGITAL RECEIPTS */}
      {activeTab === 'receipts' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4 animate-in fade-in">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Your Digital Rent Receipts</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Official receipts for verified payments with authorized signature and verification stamps.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {verifiedPayments.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-600">No verified receipts yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Once your rent payment is confirmed by the Landlord, official PDF receipts will appear here.
                </p>
              </div>
            ) : (
              verifiedPayments.map((p) => (
                <div key={p.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{p.month}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {p.receipt_number || 'RCP-VERIFIED'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Paid on {p.date} via {p.payment_method} ({p.reference_id})
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900">{formatInr(p.amount)}</span>
                    <button
                      onClick={() => onViewReceipt(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Download Receipt</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: REPORT ISSUE / MAINTENANCE */}
      {activeTab === 'issues' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Report Maintenance Issue</h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              Let the Landlord and Father know about plumbing, electrical, or structural repairs needed in your unit.
            </p>

            {issueSubmittedSuccess && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Ticket submitted successfully! The Landlord has received your maintenance request.</span>
              </div>
            )}

            <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category *</label>
                  <select
                    value={issueCategory}
                    onChange={(e: any) => setIssueCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Plumbing">Plumbing (Tap, Pipe leak, Drain)</option>
                    <option value="Electrical">Electrical (Switchboard, Wiring, Light)</option>
                    <option value="Shutter">Shutter / Doors / Windows</option>
                    <option value="Leaks">Water Seepage / Leaks</option>
                    <option value="Structural">Structural / Civil Repairs</option>
                    <option value="Other">Other Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Priority Level *</label>
                  <select
                    value={issuePriority}
                    onChange={(e: any) => setIssuePriority(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Low">Low - Can be scheduled anytime</option>
                    <option value="High">High - Affects daily routine</option>
                    <option value="Urgent">Urgent - Water overflow / Hazard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Problem Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Washroom tap leaking or Shop rolling shutter tight"
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe where the issue is located and what needs fixing..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 transition"
              >
                Submit Maintenance Ticket
              </button>
            </form>
          </div>

          {/* Past tickets reported by this tenant */}
          {tenantIssues.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Your Reported Issues</h3>
              <div className="divide-y divide-slate-100">
                {tenantIssues.map((iss) => (
                  <div key={iss.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-800 text-xs sm:text-sm">{iss.title}</div>
                      <div className="text-[11px] text-slate-500">{iss.category} • Priority: {iss.priority}</div>
                    </div>
                    <div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        iss.status === 'Resolved' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : iss.status === 'In Progress'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {iss.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
