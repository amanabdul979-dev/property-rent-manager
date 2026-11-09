'use client';

import React, { useState } from 'react';
import { Issue, IssueStatus } from '@/lib/types';
import { Wrench, AlertCircle, CheckCircle, Clock, Filter, Plus, User, Building } from 'lucide-react';

interface MaintenanceManagerProps {
  issues: Issue[];
  onUpdateStatus: (issueId: string, newStatus: IssueStatus) => void;
}

export default function MaintenanceManager({ issues, onUpdateStatus }: MaintenanceManagerProps) {
  const [filterStatus, setFilterStatus] = useState<'All' | IssueStatus>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const filtered = issues.filter((iss) => {
    if (filterStatus !== 'All' && iss.status !== filterStatus) return false;
    if (categoryFilter !== 'All' && iss.category !== categoryFilter) return false;
    return true;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Plumbing': return '🚰';
      case 'Electrical': return '⚡';
      case 'Shutter': return '🏬';
      case 'Leaks': return '💧';
      case 'Structural': return '🧱';
      default: return '🔧';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Maintenance Tickets Manager</h2>
          <p className="text-xs sm:text-sm text-slate-500">Track and dispatch repairs reported by flat and shop tenants.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
            {(['All', 'Pending', 'In Progress', 'Resolved'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-md transition ${
                  filterStatus === s ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200/80 p-8">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">No Tickets In This Category</h3>
            <p className="text-xs text-slate-500">All maintenance requests are either resolved or none match.</p>
          </div>
        ) : (
          filtered.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Header tags */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold">
                    <span>{getCategoryIcon(ticket.category)}</span>
                    <span>{ticket.category}</span>
                  </span>

                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] border ${getPriorityBadge(ticket.priority)}`}>
                    {ticket.priority} Priority
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">{ticket.title}</h3>
                <p className="text-xs text-slate-600 mb-4 line-clamp-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {ticket.description}
                </p>

                <div className="text-xs text-slate-500 space-y-1 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">{ticket.unit_code}</span>
                    <span>Reported: {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'Recent'}</span>
                  </div>
                  <div>Tenant: <strong className="text-slate-800">{ticket.tenant_name}</strong></div>
                </div>
              </div>

              {/* Status Selector */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">
                  Update Ticket Status:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Pending', 'In Progress', 'Resolved'] as IssueStatus[]).map((st) => {
                    const isActive = ticket.status === st;
                    let btnStyle = 'bg-slate-100 text-slate-700 hover:bg-slate-200';
                    if (isActive) {
                      if (st === 'Pending') btnStyle = 'bg-amber-500 text-white font-bold shadow-sm';
                      else if (st === 'In Progress') btnStyle = 'bg-blue-600 text-white font-bold shadow-sm';
                      else if (st === 'Resolved') btnStyle = 'bg-emerald-600 text-white font-bold shadow-sm';
                    }

                    return (
                      <button
                        key={st}
                        onClick={() => onUpdateStatus(ticket.id, st)}
                        className={`py-1.5 px-2 rounded-lg text-xs transition text-center ${btnStyle}`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
