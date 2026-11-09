/**
 * WhatsApp Business / Web Click-to-Chat & SMS Reminder Engine
 */

export interface ReminderMessageOptions {
  tenantName: string;
  unitCode: string;
  rentAmount: number;
  dueDay: number;
  monthName: string;
  landlordName?: string;
  landlordPhone?: string;
  landlordUpiVpa?: string;
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateReminderText(options: ReminderMessageOptions, daysLeft: number): string {
  const landlord = options.landlordName || 'Landlord & Property Management';
  const upiId = options.landlordUpiVpa || 'landlord@upi';
  const formattedRent = formatInr(options.rentAmount);

  let timingText = '';
  if (daysLeft === 0) {
    timingText = `is *DUE TODAY* (${options.dueDay}th ${options.monthName})`;
  } else if (daysLeft > 0 && daysLeft <= 3) {
    timingText = `is due in *${daysLeft} day${daysLeft > 1 ? 's' : ''}* (on ${options.dueDay}th ${options.monthName})`;
  } else if (daysLeft < 0) {
    timingText = `was due on ${options.dueDay}th ${options.monthName} and is now *${Math.abs(daysLeft)} day${Math.abs(daysLeft) > 1 ? 's' : ''} OVERDUE*`;
  } else {
    timingText = `is due on ${options.dueDay}th ${options.monthName}`;
  }

  return (
    `Namaste ${options.tenantName} ji,\n\n` +
    `This is a friendly reminder that the rent of *${formattedRent}* for your unit *${options.unitCode}* (${options.monthName}) ${timingText}.\n\n` +
    `💳 *Quick UPI Payment:*\n` +
    `UPI ID: ${upiId}\n` +
    `Or pay via the Tenant Portal / QR Code directly.\n\n` +
    `💵 If paying cash in hand, kindly inform us or mark "Paid via Cash" on the portal so we can hand over your receipt.\n\n` +
    `Thank you & warm regards,\n` +
    `${landlord}`
  );
}

export function cleanIndianPhoneNumber(phone: string): string {
  // Normalize to digits, prepend 91 for India if missing
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
}

export function generateWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = cleanIndianPhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  // wa.me URL works seamlessly on Mobile (opens WhatsApp app) and Desktop (opens WhatsApp Web)
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

export function generateSmsUrl(phone: string, text: string): string {
  const cleanPhone = cleanIndianPhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  return `sms:+${cleanPhone}?body=${encodedText}`;
}
