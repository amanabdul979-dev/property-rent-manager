'use client';

import React from 'react';
import { IndianRupee, Clock, Building, Wrench, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { OverviewStats } from '@/lib/types';
import { formatInr } from '@/lib/whatsapp';

interface OverviewCardsProps {
  stats: OverviewStats;
  onNavigateTab: (tab: string) => void;
}

export default function OverviewCards({ stats, onNavigateTab }: OverviewCardsProps) {
  const totalBilled = stats.monthlyRevenue + stats.pendingDues;
  const collectionPercentage = totalBilled > 0 ? Math.round((stats.monthlyRevenue / totalBilled) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {/* 1. Monthly Revenue Collected */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Collected ({stats.currentMonthName})
          </span>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatInr(stats.monthlyRevenue)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {collectionPercentage}% Collected
            </span>
            <span className="text-slate-400">Target: {formatInr(totalBilled)}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${collectionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Total Pending Dues */}
      <div 
        onClick={() => onNavigateTab('payments')}
        className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Pending Dues
          </span>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
            {formatInr(stats.pendingDues)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-amber-800 font-medium">Action Needed</span>
            <span className="text-blue-600 group-hover:underline flex items-center gap-0.5">
              Verify / Track <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pending UPI verifications or cash handovers</p>
        </div>
      </div>

      {/* 3. Active Units (Flats & Shops) */}
      <div 
        onClick={() => onNavigateTab('properties')}
        className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Rented Units
          </span>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition">
            <Building className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {stats.totalActiveUnits} <span className="text-sm font-normal text-slate-500">units</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium">
              🏡 {stats.flatsCount} Flats
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium">
              🏪 {stats.shopsCount} Shops
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Managed jointly with Father</p>
        </div>
      </div>

      {/* 4. Unresolved Maintenance Tickets */}
      <div 
        onClick={() => onNavigateTab('tickets')}
        className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Maintenance Tickets
          </span>
          <div className={`p-2.5 rounded-xl transition ${
            stats.unresolvedTickets > 0 
              ? 'bg-rose-50 text-rose-600 group-hover:bg-rose-100' 
              : 'bg-emerald-50 text-emerald-600'
          }`}>
            <Wrench className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            stats.unresolvedTickets > 0 ? 'text-rose-600' : 'text-slate-900'
          }`}>
            {stats.unresolvedTickets} <span className="text-sm font-normal text-slate-500">open</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={stats.unresolvedTickets > 0 ? 'text-rose-700 font-medium' : 'text-emerald-700 font-medium'}>
              {stats.unresolvedTickets > 0 ? 'Plumbing / Electrical / Shutters' : 'All systems normal'}
            </span>
            <span className="text-blue-600 group-hover:underline flex items-center gap-0.5">
              Review <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tenant complaints & repairs</p>
        </div>
      </div>
    </div>
  );
}
