'use client';

import React, { useState } from 'react';
import { DueReminder } from '@/lib/types';
import { formatInr } from '@/lib/whatsapp';
import { Bell, MessageSquare, Send, Calendar, Clock, AlertTriangle, ExternalLink } from 'lucide-react';

interface ReminderEngineProps {
  reminders: DueReminder[];
}

export default function ReminderEngine({ reminders }: ReminderEngineProps) {
  const [selectedPreview, setSelectedPreview] = useState<DueReminder | null>(null);

  // Group by status
  const dueIn3Days = reminders.filter((r) => r.urgency === 'due_in_3_days');
  const dueToday = reminders.filter((r) => r.urgency === 'due_today');
  const overdue = reminders.filter((r) => r.urgency === 'overdue');
  const upcoming = reminders.filter((r) => r.urgency === 'upcoming');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/30 mb-2">
              <Bell className="w-3.5 h-3.5 text-blue-300" />
              <span>Smart Rent Automation Engine</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Automated 3-Day Rent Reminders</h2>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl">
              Calculates which flat and shop tenants have rent due within the next 3 days. Send friendly, polite Hindi/English WhatsApp messages with a single click.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/10 text-center">
              <span className="text-2xl font-black text-amber-300">{dueIn3Days.length + dueToday.length}</span>
              <span className="block text-[11px] text-blue-200">Due Soon</span>
            </div>
            {overdue.length > 0 && (
              <div className="bg-rose-500/20 backdrop-blur-sm px-4 py-3 rounded-xl border border-rose-400/30 text-center">
                <span className="text-2xl font-black text-rose-300">{overdue.length}</span>
                <span className="block text-[11px] text-rose-200">Overdue</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reminders List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {reminders.map((rem) => {
          let badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
          let statusLabel = `Due in ${rem.daysRemaining} days`;

          if (rem.urgency === 'due_today') {
            badgeStyle = 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse';
            statusLabel = 'DUE TODAY';
          } else if (rem.urgency === 'overdue') {
            badgeStyle = 'bg-rose-100 text-rose-800 border-rose-300';
            statusLabel = `OVERDUE by ${Math.abs(rem.daysRemaining)} days`;
          } else if (rem.urgency === 'due_in_3_days') {
            badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
            statusLabel = `Due in ${rem.daysRemaining} days (3-Day Alert)`;
          }

          return (
            <div
              key={rem.tenant_id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border mb-2 ${badgeStyle}`}>
                      {statusLabel}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{rem.tenant_name}</h3>
                    <p className="text-xs text-slate-500">
                      {rem.unit_code} ({rem.unit_type}) • Phone: {rem.tenant_phone}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900">{formatInr(rem.rent_amount)}</span>
                    <span className="block text-[11px] text-slate-400">Due {rem.due_day}th</span>
                  </div>
                </div>

                {/* Message preview snippet */}
                <div className="mt-3 bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-xs text-slate-600 line-clamp-2 italic">
                  "{rem.messageText.replace(/\n+/g, ' ')}"
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedPreview(rem)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                  <span>Preview Text</span>
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href={rem.smsUrl}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition"
                  >
                    SMS
                  </a>
                  {/* 1-Click WhatsApp Button */}
                  <a
                    href={rem.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-500/20 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Message Preview Modal */}
      {selectedPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <h3 className="text-lg font-bold text-slate-900 mb-2">WhatsApp Message Preview</h3>
            <p className="text-xs text-slate-500 mb-4">
              Recipient: <strong>{selectedPreview.tenant_name}</strong> ({selectedPreview.tenant_phone})
            </p>

            <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-4 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
              {selectedPreview.messageText}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedPreview(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-50"
              >
                Close
              </button>
              <a
                href={selectedPreview.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Launch WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
