/**
 * UPI Deep Linking & QR Generation Utilities
 * Conforms to NPCI (National Payments Corporation of India) UPI Specifications
 */

export interface UpiPaymentParams {
  payeeVpa: string;        // e.g. "landlord.father@okaxis" or "9876543210@paytm"
  payeeName: string;       // e.g. "R. K. Sharma & Sons"
  amount: number;          // Exact numeric amount in INR
  transactionNote: string; // e.g. "Rent for Flat 101 - Nov 2026"
  transactionRef?: string; // Optional unique reference
}

export function buildStandardUpiUrl(params: UpiPaymentParams): string {
  const query = new URLSearchParams({
    pa: params.payeeVpa,
    pn: params.payeeName,
    am: params.amount.toFixed(2),
    cu: 'INR',
    tn: params.transactionNote,
  });

  if (params.transactionRef) {
    query.set('tr', params.transactionRef);
  }

  return `upi://pay?${query.toString()}`;
}

export function buildGPayDeepLink(params: UpiPaymentParams): string {
  const standard = buildStandardUpiUrl(params);
  // Android intent & custom scheme for Google Pay
  return `gpay://upi/pay?${standard.replace('upi://pay?', '')}`;
}

export function buildPhonePeDeepLink(params: UpiPaymentParams): string {
  const standard = buildStandardUpiUrl(params);
  return `phonepe://pay?${standard.replace('upi://pay?', '')}`;
}

export function buildPaytmDeepLink(params: UpiPaymentParams): string {
  const standard = buildStandardUpiUrl(params);
  return `paytmmp://pay?${standard.replace('upi://pay?', '')}`;
}

export interface UpiDeepLinks {
  standardUpi: string;
  gpay: string;
  phonepe: string;
  paytm: string;
}

export function generateAllUpiLinks(params: UpiPaymentParams): UpiDeepLinks {
  return {
    standardUpi: buildStandardUpiUrl(params),
    gpay: buildGPayDeepLink(params),
    phonepe: buildPhonePeDeepLink(params),
    paytm: buildPaytmDeepLink(params),
  };
}
