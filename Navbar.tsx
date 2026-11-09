'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Home, Users, CreditCard, Wrench, Bell, ArrowRightLeft } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  portalMode: 'landlord' | 'tenant';
  setPortalMode: (mode: 'landlord' | 'tenant') => void;
  pendingIssuesCount?: number;
  dueSoonCount?: number;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  portalMode,
  setPortalMode,
  pendingIssuesCount = 0,
  dueSoonCount = 0,
}: NavbarProps) {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Estate Title */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-lg tracking-tight flex items-center gap-2">
                EstateEase
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {portalMode === 'landlord' ? 'Landlord & Father' : 'Tenant Portal'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Shanti Niwas & Commercial Plaza</p>
            </div>
          </div>

          {/* Role Mode Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPortalMode(portalMode === 'landlord' ? 'tenant' : 'landlord')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Toggle between Landlord Management view and Tenant Self-Service view"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Switch to {portalMode === 'landlord' ? 'Tenant Portal' : 'Landlord Dashboard'}</span>
            </button>
          </div>
        </div>

        {/* Landlord Sub Navigation Tabs */}
        {portalMode === 'landlord' && (
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 border-t border-slate-800/80 scrollbar-none text-sm font-medium">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('properties')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition ${
                activeTab === 'properties'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Flats & Shops</span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition ${
                activeTab === 'payments'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Payments Tracker</span>
            </button>

            <button
              onClick={() => setActiveTab('reminders')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition relative ${
                activeTab === 'reminders'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>3-Day Reminders</span>
              {dueSoonCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs bg-amber-500 text-slate-900 font-bold">
                  {dueSoonCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition relative ${
                activeTab === 'tickets'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Maintenance</span>
              {pendingIssuesCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs bg-rose-500 text-white font-bold">
                  {pendingIssuesCount}
                </span>
              )}
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
