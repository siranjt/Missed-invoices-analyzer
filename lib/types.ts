export type InvoiceStatus = "payment_due" | "not_paid";

export type LatestTicket = {
  id: string;        // e.g. "FIN-3899"
  title: string;     // ticket title
  url: string;       // Linear issue URL
};

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
  /** Most-recent open Finance ticket matched to this row's entity_id, if any. */
  latestTicket?: LatestTicket;
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
