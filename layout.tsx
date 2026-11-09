import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EstateEase - Property & Rent Management',
  description: 'Production-ready Property & Rent Management System for Landlords and Tenants with UPI, WhatsApp Reminders, and Maintenance Tracking',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
