export type InvoiceStatus = "payment_due" | "not_paid";

export type InvoiceRow = {
  customerId: string;
  entityId: string;
  bizName: string;
  amName: string;
  subscriptionStatus: string;
  cancellingAt: string;
  invoiceNumber: string;
  achStatus: string;
  autoDebit: string;
  invoiceDate: string;
  invoiceMonth: string;
  customerFirstName: string;
  customerEmail: string;
  phoneNumber: string;
  customerCompany: string;
  amountDue: number;
  status: InvoiceStatus;
};

export type InvoiceAnnotation = {
  amComment?: string;
  caller?: "" | "Shakthi" | "Joshi";
  connectionStatus?: "" | "Connected" | "VM" | "Not connected";
  comments?: string;
  oldComments?: string;
  tickets?: string;
};

export type AnnotationsMap = Record<string, InvoiceAnnotation>;

export type InvoicesResponse = {
  rows: InvoiceRow[];
  fetchedAt: string;
  cached: boolean;
};
