import type {
  User, GoldStock, StoneItem, Product, Supplier, Purchase, Customer, Sale,
  Payment, SalesReturn, OldGoldExchange, Workflow, WorkOrder, WastageRecord,
  QualityCheck, AuditLog, AppNotification, ShopSettings,
} from './types'

const now = new Date()
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString()
const daysAhead = (n: number) => new Date(now.getTime() + n * 86400000).toISOString()
const hoursAgo = (n: number) => new Date(now.getTime() - n * 3600000).toISOString()

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'S.S JEWELLERY',
  ownerName: 'Suresh Shah',
  phone: '+91 98250 12345',
  email: 'contact@ssjewellery.in',
  address: 'Shop 12, Manek Chowk, Ring Road',
  city: 'Surat',
  pincode: '395003',
  gstin: '24ABCDE1234F1Z5',
  pan: 'ABCDE1234F',
  defaultGstRate: 3,
  defaultGoldRate24K: 7250,
  defaultSilverRate: 94500,
  branch: 'Main Branch',
  currency: '₹',
  invoicePrefix: 'INV-2026',
  invoiceSeq: 126,
  purchasePrefix: 'PUR-2026',
  purchaseSeq: 18,
  workOrderPrefix: 'WF',
  workOrderSeq: 10030,
  invoiceFooter: 'Thank you for your business! Visit again.',
  termsConditions: '1. Goods once sold will not be taken back.\n2. All disputes subject to Surat jurisdiction.\n3. Gold rate applicable as on date of bill.',
}

// ===== Users =====
export const SEED_USERS: User[] = [
  { id: 'usr-admin', username: 'admin', name: 'Suresh Shah (Admin)', phone: '+91 98250 12345', email: 'admin@ssjewellery.in', role: 'ADMIN', password: 'admin123', active: true, createdAt: daysAgo(365), lastLogin: hoursAgo(2) },
  { id: 'usr-rahul', username: 'rahul', name: 'Rahul Kumar', phone: '+91 98240 11223', role: 'STAFF', password: 'rahul123', active: true, specialty: 'Gold Issue & Melting', createdAt: daysAgo(180), lastLogin: hoursAgo(5) },
  { id: 'usr-amit', username: 'amit', name: 'Amit Patel', phone: '+91 99240 22118', role: 'STAFF', password: 'amit123', active: true, specialty: 'Shaping', createdAt: daysAgo(160), lastLogin: hoursAgo(3) },
  { id: 'usr-sumit', username: 'sumit', name: 'Sumit Verma', phone: '+91 98795 33456', role: 'STAFF', password: 'sumit123', active: true, specialty: 'Design & Cutting', createdAt: daysAgo(150), lastLogin: hoursAgo(8) },
  { id: 'usr-rakesh', username: 'rakesh', name: 'Rakesh Singh', phone: '+91 99750 88910', role: 'STAFF', password: 'rakesh123', active: true, specialty: 'Polishing', createdAt: daysAgo(140), lastLogin: hoursAgo(24) },
  { id: 'usr-ankit', username: 'ankit', name: 'Ankit Jain', phone: '+91 98250 66554', role: 'STAFF', password: 'ankit123', active: true, specialty: 'Stone Setting', createdAt: daysAgo(120), lastLogin: hoursAgo(48) },
  { id: 'usr-manager', username: 'manager', name: 'Priya Mehta (Manager)', phone: '+91 98250 77882', email: 'priya@ssjewellery.in', role: 'MANAGER', password: 'manager123', active: true, createdAt: daysAgo(200), lastLogin: hoursAgo(1) },
  { id: 'usr-inactive', username: 'vijay', name: 'Vijay Sharma', phone: '+91 99250 00099', role: 'STAFF', password: 'vijay123', active: false, specialty: 'Finishing', createdAt: daysAgo(90), lastLogin: daysAgo(30) },
]

// ===== Workflows =====
export const SEED_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-ring',
    name: 'Gold Ring Production',
    description: 'Standard workflow for gold ring manufacturing',
    active: true,
    createdAt: daysAgo(90),
    steps: [
      { id: 'ws-r1', name: 'Gold Issue', description: 'Issue gold to karigar', defaultUserId: 'usr-rahul', estimatedHours: 2, order: 0 },
      { id: 'ws-r2', name: 'Melting', description: 'Melt gold bar', defaultUserId: 'usr-rahul', estimatedHours: 4, order: 1 },
      { id: 'ws-r3', name: 'Shaping', description: 'Shape the ring', defaultUserId: 'usr-amit', estimatedHours: 8, order: 2 },
      { id: 'ws-r4', name: 'Design & Cutting', description: 'Add design details', defaultUserId: 'usr-sumit', estimatedHours: 6, order: 3 },
      { id: 'ws-r5', name: 'Polishing', description: 'Polish the ring', defaultUserId: 'usr-rakesh', estimatedHours: 4, order: 4 },
      { id: 'ws-r6', name: 'Stone Setting', description: 'Set stones if needed', defaultUserId: 'usr-ankit', estimatedHours: 6, order: 5 },
      { id: 'ws-r7', name: 'Finishing', description: 'Final finishing touches', defaultUserId: 'usr-rahul', estimatedHours: 3, order: 6 },
      { id: 'ws-r8', name: 'Quality Check', description: 'QC by admin', defaultUserId: 'usr-admin', estimatedHours: 1, order: 7 },
    ],
  },
  {
    id: 'wf-necklace',
    name: 'Necklace Production',
    description: 'Standard workflow for necklace manufacturing',
    active: true,
    createdAt: daysAgo(85),
    steps: [
      { id: 'ws-n1', name: 'Gold Issue', defaultUserId: 'usr-rahul', estimatedHours: 2, order: 0 },
      { id: 'ws-n2', name: 'Melting', defaultUserId: 'usr-rahul', estimatedHours: 4, order: 1 },
      { id: 'ws-n3', name: 'Shaping', defaultUserId: 'usr-amit', estimatedHours: 12, order: 2 },
      { id: 'ws-n4', name: 'Design & Cutting', defaultUserId: 'usr-sumit', estimatedHours: 10, order: 3 },
      { id: 'ws-n5', name: 'Polishing', defaultUserId: 'usr-rakesh', estimatedHours: 6, order: 4 },
      { id: 'ws-n6', name: 'Stone Setting', defaultUserId: 'usr-ankit', estimatedHours: 8, order: 5 },
      { id: 'ws-n7', name: 'Finishing', defaultUserId: 'usr-rahul', estimatedHours: 4, order: 6 },
      { id: 'ws-n8', name: 'Quality Check', defaultUserId: 'usr-admin', estimatedHours: 1, order: 7 },
    ],
  },
  {
    id: 'wf-bangle',
    name: 'Bangle Production',
    description: 'Standard workflow for bangle manufacturing',
    active: true,
    createdAt: daysAgo(80),
    steps: [
      { id: 'ws-b1', name: 'Gold Issue', defaultUserId: 'usr-rahul', estimatedHours: 2, order: 0 },
      { id: 'ws-b2', name: 'Melting', defaultUserId: 'usr-rahul', estimatedHours: 4, order: 1 },
      { id: 'ws-b3', name: 'Shaping', defaultUserId: 'usr-amit', estimatedHours: 10, order: 2 },
      { id: 'ws-b4', name: 'Design & Cutting', defaultUserId: 'usr-sumit', estimatedHours: 8, order: 3 },
      { id: 'ws-b5', name: 'Polishing', defaultUserId: 'usr-rakesh', estimatedHours: 5, order: 4 },
      { id: 'ws-b6', name: 'Finishing', defaultUserId: 'usr-rahul', estimatedHours: 3, order: 5 },
      { id: 'ws-b7', name: 'Quality Check', defaultUserId: 'usr-admin', estimatedHours: 1, order: 6 },
    ],
  },
]

// ===== Work Orders =====
export const SEED_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'wo-10025',
    workId: 'WF-10025',
    productCode: 'SJ-RING-001',
    productName: 'Gold Ring — 22K',
    customerName: 'Priya Patel',
    workflowId: 'wf-ring',
    workflowName: 'Gold Ring Production',
    steps: [
      { stepId: 'ws-r1', stepName: 'Gold Issue', assignedTo: 'usr-rahul', assignedToName: 'Rahul Kumar', status: 'COMPLETED', inputWeight: 25.5, outputWeight: 25.5, startedAt: daysAgo(3), completedAt: daysAgo(3), dueDate: daysAgo(3) },
      { stepId: 'ws-r2', stepName: 'Melting', assignedTo: 'usr-rahul', assignedToName: 'Rahul Kumar', status: 'COMPLETED', inputWeight: 25.5, outputWeight: 25.4, startedAt: daysAgo(3), completedAt: daysAgo(2), dueDate: daysAgo(2) },
      { stepId: 'ws-r3', stepName: 'Shaping', assignedTo: 'usr-amit', assignedToName: 'Amit Patel', status: 'COMPLETED', inputWeight: 25.4, outputWeight: 25.1, startedAt: daysAgo(2), completedAt: daysAgo(1), dueDate: daysAgo(1) },
      { stepId: 'ws-r4', stepName: 'Design & Cutting', assignedTo: 'usr-sumit', assignedToName: 'Sumit Verma', status: 'IN_PROGRESS', inputWeight: 25.1, startedAt: hoursAgo(6), dueDate: daysAhead(0) },
      { stepId: 'ws-r5', stepName: 'Polishing', status: 'PENDING', dueDate: daysAhead(1) },
      { stepId: 'ws-r6', stepName: 'Stone Setting', status: 'PENDING', dueDate: daysAhead(2) },
      { stepId: 'ws-r7', stepName: 'Finishing', status: 'PENDING', dueDate: daysAhead(3) },
      { stepId: 'ws-r8', stepName: 'Quality Check', status: 'PENDING', dueDate: daysAhead(3) },
    ],
    currentStepIndex: 3,
    grossWeight: 25.5,
    netWeight: 25.1,
    purity: '22K',
    metal: 'GOLD',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assignedTo: 'usr-sumit',
    assignedToName: 'Sumit Verma',
    startDate: daysAgo(3),
    expectedCompletion: daysAhead(3),
    history: [
      { id: 'h1', timestamp: daysAgo(3), userName: 'Suresh Shah (Admin)', action: 'Created work order', details: 'WF-10025 assigned to Gold Ring Production workflow' },
      { id: 'h2', timestamp: daysAgo(3), userName: 'Suresh Shah (Admin)', action: 'Assigned step', details: 'Gold Issue → Rahul Kumar' },
      { id: 'h3', timestamp: daysAgo(3), userName: 'Rahul Kumar', action: 'Accepted work', details: 'Gold Issue accepted' },
      { id: 'h4', timestamp: daysAgo(3), userName: 'Rahul Kumar', action: 'Started work', details: 'Gold Issue started' },
      { id: 'h5', timestamp: daysAgo(3), userName: 'Rahul Kumar', action: 'Completed step', details: 'Gold Issue completed (25.5g)' },
      { id: 'h6', timestamp: daysAgo(2), userName: 'Rahul Kumar', action: 'Completed step', details: 'Melting completed (25.4g, 0.1g wastage)' },
      { id: 'h7', timestamp: daysAgo(2), userName: 'Rahul Kumar', action: 'Assigned next step', details: 'Shaping → Amit Patel' },
      { id: 'h8', timestamp: daysAgo(1), userName: 'Amit Patel', action: 'Completed step', details: 'Shaping completed (25.1g, 0.3g wastage)' },
      { id: 'h9', timestamp: hoursAgo(6), userName: 'Amit Patel', action: 'Assigned next step', details: 'Design & Cutting → Sumit Verma' },
      { id: 'h10', timestamp: hoursAgo(6), userName: 'Sumit Verma', action: 'Started work', details: 'Design & Cutting started' },
    ],
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(6),
  },
  {
    id: 'wo-10026',
    workId: 'WF-10026',
    productCode: 'SJ-NEC-002',
    productName: 'Temple Necklace — 22K',
    customerName: 'Anita Desai',
    workflowId: 'wf-necklace',
    workflowName: 'Necklace Production',
    steps: [
      { stepId: 'ws-n1', stepName: 'Gold Issue', assignedTo: 'usr-rahul', assignedToName: 'Rahul Kumar', status: 'COMPLETED', inputWeight: 48.5, outputWeight: 48.5, startedAt: daysAgo(5), completedAt: daysAgo(5), dueDate: daysAgo(5) },
      { stepId: 'ws-n2', stepName: 'Melting', assignedTo: 'usr-rahul', assignedToName: 'Rahul Kumar', status: 'COMPLETED', inputWeight: 48.5, outputWeight: 48.3, startedAt: daysAgo(5), completedAt: daysAgo(4), dueDate: daysAgo(4) },
      { stepId: 'ws-n3', stepName: 'Shaping', assignedTo: 'usr-amit', assignedToName: 'Amit Patel', status: 'IN_PROGRESS', inputWeight: 48.3, startedAt: daysAgo(3), dueDate: daysAhead(1) },
      { stepId: 'ws-n4', stepName: 'Design & Cutting', status: 'PENDING', dueDate: daysAhead(3) },
      { stepId: 'ws-n5', stepName: 'Polishing', status: 'PENDING', dueDate: daysAhead(5) },
      { stepId: 'ws-n6', stepName: 'Stone Setting', status: 'PENDING', dueDate: daysAhead(7) },
      { stepId: 'ws-n7', stepName: 'Finishing', status: 'PENDING', dueDate: daysAhead(8) },
      { stepId: 'ws-n8', stepName: 'Quality Check', status: 'PENDING', dueDate: daysAhead(8) },
    ],
    currentStepIndex: 2,
    grossWeight: 48.5,
    netWeight: 48.3,
    purity: '22K',
    metal: 'GOLD',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    assignedTo: 'usr-amit',
    assignedToName: 'Amit Patel',
    startDate: daysAgo(5),
    expectedCompletion: daysAhead(8),
    history: [
      { id: 'h1', timestamp: daysAgo(5), userName: 'Suresh Shah (Admin)', action: 'Created work order', details: 'WF-10026 for Temple Necklace' },
      { id: 'h2', timestamp: daysAgo(5), userName: 'Rahul Kumar', action: 'Completed step', details: 'Gold Issue (48.5g)' },
      { id: 'h3', timestamp: daysAgo(4), userName: 'Rahul Kumar', action: 'Completed step', details: 'Melting (48.3g)' },
      { id: 'h4', timestamp: daysAgo(3), userName: 'Rahul Kumar', action: 'Assigned next step', details: 'Shaping → Amit Patel' },
      { id: 'h5', timestamp: daysAgo(3), userName: 'Amit Patel', action: 'Started work', details: 'Shaping started' },
    ],
    createdAt: daysAgo(5),
    updatedAt: daysAgo(3),
  },
  {
    id: 'wo-10024',
    workId: 'WF-10024',
    productCode: 'SJ-BAN-001',
    productName: 'Bridal Bangles (Pair) — 22K',
    customerName: 'Priya Patel',
    workflowId: 'wf-bangle',
    workflowName: 'Bangle Production',
    steps: [
      { stepId: 'ws-b1', stepName: 'Gold Issue', assignedTo: 'usr-rahul', assignedToName: 'Rahul Kumar', status: 'COMPLETED', inputWeight: 62.8, outputWeight: 62.8, startedAt: daysAgo(15), completedAt: daysAgo(15), dueDate: daysAgo(15) },
      { stepId: 'ws-b2', stepName: 'Melting', assignedTo: 'usr-rahul', assignedToName: 'Rahul Kumar', status: 'COMPLETED', inputWeight: 62.8, outputWeight: 62.5, startedAt: daysAgo(15), completedAt: daysAgo(14), dueDate: daysAgo(14) },
      { stepId: 'ws-b3', stepName: 'Shaping', assignedTo: 'usr-amit', assignedToName: 'Amit Patel', status: 'COMPLETED', inputWeight: 62.5, outputWeight: 62.0, startedAt: daysAgo(14), completedAt: daysAgo(12), dueDate: daysAgo(12) },
      { stepId: 'ws-b4', stepName: 'Design & Cutting', assignedTo: 'usr-sumit', assignedToName: 'Sumit Verma', status: 'COMPLETED', inputWeight: 62.0, outputWeight: 61.6, startedAt: daysAgo(12), completedAt: daysAgo(10), dueDate: daysAgo(10) },
      { stepId: 'ws-b5', stepName: 'Polishing', assignedTo: 'usr-rakesh', assignedToName: 'Rakesh Singh', status: 'COMPLETED', inputWeight: 61.6, outputWeight: 61.4, startedAt: daysAgo(10), completedAt: daysAgo(8), dueDate: daysAgo(8) },
      { stepId: 'ws-b6', stepName: 'Finishing', assignedTo: 'usr-rahul', assignedToName: 'Rahul Kumar', status: 'COMPLETED', inputWeight: 61.4, outputWeight: 61.2, startedAt: daysAgo(8), completedAt: daysAgo(6), dueDate: daysAgo(6) },
      { stepId: 'ws-b7', stepName: 'Quality Check', assignedTo: 'usr-admin', assignedToName: 'Suresh Shah (Admin)', status: 'APPROVED', startedAt: daysAgo(6), completedAt: daysAgo(6), dueDate: daysAgo(6) },
    ],
    currentStepIndex: 6,
    grossWeight: 62.8,
    netWeight: 61.2,
    purity: '22K',
    metal: 'GOLD',
    priority: 'HIGH',
    status: 'APPROVED',
    assignedTo: 'usr-admin',
    assignedToName: 'Suresh Shah (Admin)',
    startDate: daysAgo(15),
    expectedCompletion: daysAgo(6),
    actualCompletion: daysAgo(6),
    history: [
      { id: 'h1', timestamp: daysAgo(15), userName: 'Suresh Shah (Admin)', action: 'Created work order', details: 'WF-10024 for Bridal Bangles' },
      { id: 'h2', timestamp: daysAgo(6), userName: 'Suresh Shah (Admin)', action: 'Quality Check approved', details: 'QC passed, moved to finished stock' },
    ],
    createdAt: daysAgo(15),
    updatedAt: daysAgo(6),
  },
  {
    id: 'wo-10027',
    workId: 'WF-10027',
    productCode: 'SJ-RING-002',
    productName: 'Diamond Ring — 18K',
    customerName: 'Walk-in Customer',
    workflowId: 'wf-ring',
    workflowName: 'Gold Ring Production',
    steps: [
      { stepId: 'ws-r1', stepName: 'Gold Issue', assignedTo: 'usr-rahul', assignedToName: 'Rahul Kumar', status: 'ASSIGNED', dueDate: daysAhead(1) },
      { stepId: 'ws-r2', stepName: 'Melting', status: 'PENDING', dueDate: daysAhead(2) },
      { stepId: 'ws-r3', stepName: 'Shaping', status: 'PENDING', dueDate: daysAhead(3) },
      { stepId: 'ws-r4', stepName: 'Design & Cutting', status: 'PENDING', dueDate: daysAhead(4) },
      { stepId: 'ws-r5', stepName: 'Polishing', status: 'PENDING', dueDate: daysAhead(5) },
      { stepId: 'ws-r6', stepName: 'Stone Setting', status: 'PENDING', dueDate: daysAhead(6) },
      { stepId: 'ws-r7', stepName: 'Finishing', status: 'PENDING', dueDate: daysAhead(7) },
      { stepId: 'ws-r8', stepName: 'Quality Check', status: 'PENDING', dueDate: daysAhead(7) },
    ],
    currentStepIndex: 0,
    grossWeight: 6.5,
    purity: '18K',
    metal: 'GOLD',
    priority: 'NORMAL',
    status: 'ASSIGNED',
    assignedTo: 'usr-rahul',
    assignedToName: 'Rahul Kumar',
    startDate: daysAgo(1),
    expectedCompletion: daysAhead(7),
    history: [
      { id: 'h1', timestamp: daysAgo(1), userName: 'Suresh Shah (Admin)', action: 'Created work order', details: 'WF-10027 for Diamond Ring' },
      { id: 'h2', timestamp: daysAgo(1), userName: 'Suresh Shah (Admin)', action: 'Assigned step', details: 'Gold Issue → Rahul Kumar' },
    ],
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: 'wo-10023',
    workId: 'WF-10023',
    productCode: 'SJ-CHN-003',
    productName: 'Gold Chain — 22K',
    customerName: 'Rajesh Mehta',
    workflowId: 'wf-ring',
    workflowName: 'Gold Ring Production',
    steps: [
      { stepId: 'ws-r1', stepName: 'Gold Issue', assignedTo: 'usr-rahul', assignedToName: 'Rahul Kumar', status: 'COMPLETED', inputWeight: 18.4, outputWeight: 18.4, startedAt: daysAgo(20), completedAt: daysAgo(20), dueDate: daysAgo(20) },
      { stepId: 'ws-r2', stepName: 'Melting', assignedTo: 'usr-rahul', assignedToName: 'Rahul Kumar', status: 'COMPLETED', inputWeight: 18.4, outputWeight: 18.3, startedAt: daysAgo(20), completedAt: daysAgo(19), dueDate: daysAgo(19) },
      { stepId: 'ws-r3', stepName: 'Shaping', assignedTo: 'usr-amit', assignedToName: 'Amit Patel', status: 'COMPLETED', inputWeight: 18.3, outputWeight: 18.1, startedAt: daysAgo(19), completedAt: daysAgo(17), dueDate: daysAgo(17) },
      { stepId: 'ws-r4', stepName: 'Design & Cutting', assignedTo: 'usr-sumit', assignedToName: 'Sumit Verma', status: 'COMPLETED', inputWeight: 18.1, outputWeight: 18.0, startedAt: daysAgo(17), completedAt: daysAgo(15), dueDate: daysAgo(15) },
      { stepId: 'ws-r5', stepName: 'Polishing', assignedTo: 'usr-rakesh', assignedToName: 'Rakesh Singh', status: 'COMPLETED', inputWeight: 18.0, outputWeight: 17.9, startedAt: daysAgo(15), completedAt: daysAgo(13), dueDate: daysAgo(13) },
      { stepId: 'ws-r6', stepName: 'Stone Setting', status: 'SKIPPED', startedAt: daysAgo(13), completedAt: daysAgo(13) },
      { stepId: 'ws-r7', stepName: 'Finishing', assignedTo: 'usr-rahul', assignedToName: 'Rahul Kumar', status: 'COMPLETED', inputWeight: 17.9, outputWeight: 17.8, startedAt: daysAgo(13), completedAt: daysAgo(11), dueDate: daysAgo(11) },
      { stepId: 'ws-r8', stepName: 'Quality Check', assignedTo: 'usr-admin', assignedToName: 'Suresh Shah (Admin)', status: 'APPROVED', startedAt: daysAgo(11), completedAt: daysAgo(11), dueDate: daysAgo(11) },
    ],
    currentStepIndex: 7,
    grossWeight: 18.4,
    netWeight: 17.8,
    purity: '22K',
    metal: 'GOLD',
    priority: 'NORMAL',
    status: 'APPROVED',
    assignedTo: 'usr-admin',
    assignedToName: 'Suresh Shah (Admin)',
    startDate: daysAgo(20),
    expectedCompletion: daysAgo(11),
    actualCompletion: daysAgo(11),
    history: [
      { id: 'h1', timestamp: daysAgo(20), userName: 'Suresh Shah (Admin)', action: 'Created work order', details: 'WF-10023 for Gold Chain' },
      { id: 'h2', timestamp: daysAgo(11), userName: 'Suresh Shah (Admin)', action: 'Quality Check approved', details: 'QC passed' },
    ],
    createdAt: daysAgo(20),
    updatedAt: daysAgo(11),
  },
  {
    id: 'wo-10028',
    workId: 'WF-10028',
    productCode: 'SJ-RING-003',
    productName: 'Gold Ring — 22K (Rework)',
    customerName: 'Sneha Joshi',
    workflowId: 'wf-ring',
    workflowName: 'Gold Ring Production',
    steps: [
      { stepId: 'ws-r1', stepName: 'Gold Issue', assignedTo: 'usr-rahul', assignedToName: 'Rahul Kumar', status: 'COMPLETED', inputWeight: 12.4, outputWeight: 12.4, startedAt: daysAgo(8), completedAt: daysAgo(8), dueDate: daysAgo(8) },
      { stepId: 'ws-r2', stepName: 'Melting', assignedTo: 'usr-rahul', assignedToName: 'Rahul Kumar', status: 'COMPLETED', inputWeight: 12.4, outputWeight: 12.3, startedAt: daysAgo(8), completedAt: daysAgo(7), dueDate: daysAgo(7) },
      { stepId: 'ws-r3', stepName: 'Shaping', assignedTo: 'usr-amit', assignedToName: 'Amit Patel', status: 'COMPLETED', inputWeight: 12.3, outputWeight: 12.0, startedAt: daysAgo(7), completedAt: daysAgo(5), dueDate: daysAgo(5) },
      { stepId: 'ws-r4', stepName: 'Design & Cutting', assignedTo: 'usr-sumit', assignedToName: 'Sumit Verma', status: 'COMPLETED', inputWeight: 12.0, outputWeight: 11.8, startedAt: daysAgo(5), completedAt: daysAgo(3), dueDate: daysAgo(3) },
      { stepId: 'ws-r5', stepName: 'Polishing', assignedTo: 'usr-rakesh', assignedToName: 'Rakesh Singh', status: 'COMPLETED', inputWeight: 11.8, outputWeight: 11.7, startedAt: daysAgo(3), completedAt: daysAgo(2), dueDate: daysAgo(2) },
      { stepId: 'ws-r6', stepName: 'Stone Setting', status: 'SKIPPED', startedAt: daysAgo(2), completedAt: daysAgo(2) },
      { stepId: 'ws-r7', stepName: 'Finishing', assignedTo: 'usr-rahul', assignedToName: 'Rahul Kumar', status: 'COMPLETED', inputWeight: 11.7, outputWeight: 11.6, startedAt: daysAgo(2), completedAt: daysAgo(1), dueDate: daysAgo(1) },
      { stepId: 'ws-r8', stepName: 'Quality Check', assignedTo: 'usr-admin', assignedToName: 'Suresh Shah (Admin)', status: 'REJECTED', remarks: 'Surface imperfection on left side, needs re-polishing', startedAt: daysAgo(1), completedAt: daysAgo(1), dueDate: daysAgo(1) },
    ],
    currentStepIndex: 7,
    grossWeight: 12.4,
    netWeight: 11.6,
    purity: '22K',
    metal: 'GOLD',
    priority: 'HIGH',
    status: 'REWORK_REQUIRED',
    assignedTo: 'usr-rakesh',
    assignedToName: 'Rakesh Singh',
    startDate: daysAgo(8),
    expectedCompletion: daysAgo(1),
    history: [
      { id: 'h1', timestamp: daysAgo(8), userName: 'Suresh Shah (Admin)', action: 'Created work order', details: 'WF-10028' },
      { id: 'h2', timestamp: daysAgo(1), userName: 'Suresh Shah (Admin)', action: 'QC rejected', details: 'Sent back for rework — polishing' },
      { id: 'h3', timestamp: hoursAgo(12), userName: 'Suresh Shah (Admin)', action: 'Reassigned step', details: 'Polishing → Rakesh Singh (rework)' },
    ],
    notes: 'Rework: needs re-polishing due to surface imperfection',
    createdAt: daysAgo(8),
    updatedAt: hoursAgo(12),
  },
]

// ===== Gold Stock =====
export const SEED_GOLD_STOCK: GoldStock[] = [
  { id: 'gs-1', stockId: 'GB-001', materialType: 'GOLD_BAR', metal: 'GOLD', purity: '22K', karat: '22K', grossWeight: 100, fineGoldWeight: 91.6, supplierId: 'sup-1', supplierName: 'Royal Gold Suppliers', purchaseDate: daysAgo(30), purchaseRate: 7100, purchaseValue: 710000, currentLocation: 'Vault A', status: 'AVAILABLE', referenceNumber: 'SUP-INV-001', createdAt: daysAgo(30) },
  { id: 'gs-2', stockId: 'GB-002', materialType: 'GOLD_BAR', metal: 'GOLD', purity: '24K', karat: '24K', grossWeight: 50, fineGoldWeight: 49.95, supplierId: 'sup-1', supplierName: 'Royal Gold Suppliers', purchaseDate: daysAgo(25), purchaseRate: 7200, purchaseValue: 360000, currentLocation: 'Vault A', status: 'AVAILABLE', referenceNumber: 'SUP-INV-002', createdAt: daysAgo(25) },
  { id: 'gs-3', stockId: 'GS-001', materialType: 'GOLD_SCRAP', metal: 'GOLD', purity: '22K', karat: '22K', grossWeight: 35.6, fineGoldWeight: 32.61, supplierId: 'sup-2', supplierName: 'Anand Bullion', purchaseDate: daysAgo(10), purchaseRate: 6800, purchaseValue: 242080, currentLocation: 'Vault B', status: 'AVAILABLE', referenceNumber: 'SUP-INV-003', createdAt: daysAgo(10) },
  { id: 'gs-4', stockId: 'GB-003', materialType: 'GOLD_BAR', metal: 'GOLD', purity: '22K', karat: '22K', grossWeight: 25.5, fineGoldWeight: 23.36, supplierId: 'sup-1', supplierName: 'Royal Gold Suppliers', purchaseDate: daysAgo(5), purchaseRate: 7150, purchaseValue: 182075, currentLocation: 'Production Floor', status: 'IN_PRODUCTION', referenceNumber: 'WF-10025', createdAt: daysAgo(5) },
  { id: 'gs-5', stockId: 'GC-001', materialType: 'GOLD_COIN', metal: 'GOLD', purity: '24K', karat: '24K', grossWeight: 10, fineGoldWeight: 9.99, supplierId: 'sup-2', supplierName: 'Anand Bullion', purchaseDate: daysAgo(3), purchaseRate: 7250, purchaseValue: 72500, currentLocation: 'Display Counter', status: 'AVAILABLE', referenceNumber: 'SUP-INV-004', createdAt: daysAgo(3) },
  { id: 'gs-6', stockId: 'SV-001', materialType: 'SILVER', metal: 'SILVER', purity: '925', karat: '925', grossWeight: 5000, fineGoldWeight: 4625, supplierId: 'sup-3', supplierName: 'Silver Mart', purchaseDate: daysAgo(15), purchaseRate: 88, purchaseValue: 440000, currentLocation: 'Vault B', status: 'AVAILABLE', referenceNumber: 'SUP-INV-005', createdAt: daysAgo(15) },
  { id: 'gs-7', stockId: 'GB-004', materialType: 'GOLD_BAR', metal: 'GOLD', purity: '18K', karat: '18K', grossWeight: 6.5, fineGoldWeight: 4.88, supplierId: 'sup-1', supplierName: 'Royal Gold Suppliers', purchaseDate: daysAgo(2), purchaseRate: 5400, purchaseValue: 35100, currentLocation: 'Production Floor', status: 'IN_PRODUCTION', referenceNumber: 'WF-10027', createdAt: daysAgo(2) },
]

// ===== Stone Inventory =====
export const SEED_STONES: StoneItem[] = [
  { id: 'st-1', stoneId: 'DM-001', type: 'Diamond', shape: 'Round', size: '0.3ct', quantity: 50, weight: 15, unit: 'carat', purchaseCost: 750000, supplierId: 'sup-4', supplierName: 'Brilliant Stones Co', usedQuantity: 12, remainingQuantity: 38, createdAt: daysAgo(60) },
  { id: 'st-2', stoneId: 'DM-002', type: 'Diamond', shape: 'Princess', size: '0.5ct', quantity: 30, weight: 15, unit: 'carat', purchaseCost: 900000, supplierId: 'sup-4', supplierName: 'Brilliant Stones Co', usedQuantity: 5, remainingQuantity: 25, createdAt: daysAgo(45) },
  { id: 'st-3', stoneId: 'RB-001', type: 'Ruby', shape: 'Oval', size: '4x6mm', quantity: 40, weight: 20, unit: 'carat', purchaseCost: 200000, supplierId: 'sup-5', supplierName: 'Gem House', usedQuantity: 8, remainingQuantity: 32, createdAt: daysAgo(40) },
  { id: 'st-4', stoneId: 'EM-001', type: 'Emerald', shape: 'Oval', size: '5x7mm', quantity: 25, weight: 18, unit: 'carat', purchaseCost: 280000, supplierId: 'sup-5', supplierName: 'Gem House', usedQuantity: 3, remainingQuantity: 22, createdAt: daysAgo(35) },
  { id: 'st-5', stoneId: 'SP-001', type: 'Sapphire', shape: 'Round', size: '3mm', quantity: 60, weight: 12, unit: 'carat', purchaseCost: 150000, supplierId: 'sup-5', supplierName: 'Gem House', usedQuantity: 10, remainingQuantity: 50, createdAt: daysAgo(25) },
]

// ===== Products (Finished Jewellery) =====
export const SEED_PRODUCTS: Product[] = [
  { id: 'prd-1', productCode: 'SJ-RING-001', barcode: '8901234500011', name: 'Antique Temple Ring', category: 'Ring', metal: 'GOLD', purity: '22K', grossWeight: 8.5, netWeight: 8.2, stoneWeight: 0.3, wastage: 0.3, makingCharge: 12000, otherCharges: 0, gstRate: 3, sellingPrice: 68500, costPrice: 58000, stock: 3, hsnCode: '7113', imageColor: 'from-amber-400 to-yellow-600', createdAt: daysAgo(20), updatedAt: daysAgo(5) },
  { id: 'prd-2', productCode: 'SJ-NEC-001', barcode: '8901234500028', name: 'Antique Temple Necklace', category: 'Necklace', metal: 'GOLD', purity: '22K', grossWeight: 48.5, netWeight: 46.2, stoneWeight: 2.3, wastage: 2.3, makingCharge: 65000, otherCharges: 5000, gstRate: 3, sellingPrice: 405000, costPrice: 345000, stock: 1, hsnCode: '7113', imageColor: 'from-yellow-500 to-amber-700', createdAt: daysAgo(18), updatedAt: daysAgo(8) },
  { id: 'prd-3', productCode: 'SJ-BAN-001', barcode: '8901234500035', name: 'Kundan Bridal Bangles (Pair)', category: 'Bangle', metal: 'GOLD', purity: '22K', grossWeight: 62.8, netWeight: 58.4, stoneWeight: 4.4, wastage: 4.4, makingCharge: 85000, otherCharges: 8000, gstRate: 3, sellingPrice: 525000, costPrice: 445000, stock: 1, hsnCode: '7113', imageColor: 'from-yellow-500 to-amber-700', createdAt: daysAgo(15), updatedAt: daysAgo(6) },
  { id: 'prd-4', productCode: 'SJ-CHN-001', barcode: '8901234500042', name: 'Daily Wear Gold Chain (24 inch)', category: 'Chain', metal: 'GOLD', purity: '22K', grossWeight: 18.4, netWeight: 18.4, stoneWeight: 0, wastage: 0.6, makingCharge: 7000, otherCharges: 0, gstRate: 3, sellingPrice: 145000, costPrice: 128000, stock: 5, hsnCode: '7113', imageColor: 'from-amber-300 to-yellow-500', createdAt: daysAgo(12), updatedAt: daysAgo(3) },
  { id: 'prd-5', productCode: 'SJ-ER-001', barcode: '8901234500059', name: 'Pearl Drop Earrings', category: 'Earrings', metal: 'GOLD', purity: '18K', grossWeight: 6.2, netWeight: 5.8, stoneWeight: 0.4, wastage: 0.4, makingCharge: 6500, otherCharges: 0, gstRate: 3, sellingPrice: 42500, costPrice: 34500, stock: 4, hsnCode: '7113', imageColor: 'from-rose-300 to-pink-500', createdAt: daysAgo(10), updatedAt: daysAgo(2) },
  { id: 'prd-6', productCode: 'SJ-AK-001', barcode: '8901234500066', name: 'Silver Anklet Pair', category: 'Anklet', metal: 'SILVER', purity: '925', grossWeight: 84, netWeight: 84, stoneWeight: 0, wastage: 2, makingCharge: 2100, otherCharges: 0, gstRate: 3, sellingPrice: 9600, costPrice: 7900, stock: 12, hsnCode: '7113', imageColor: 'from-slate-300 to-slate-500', createdAt: daysAgo(8), updatedAt: daysAgo(1) },
  { id: 'prd-7', productCode: 'SJ-PD-001', barcode: '8901234500073', name: 'Rose Gold Pendant', category: 'Pendant', metal: 'GOLD', purity: '18K', grossWeight: 3.8, netWeight: 3.5, stoneWeight: 0.3, wastage: 0.3, makingCharge: 5000, otherCharges: 0, gstRate: 3, sellingPrice: 27800, costPrice: 21500, stock: 6, hsnCode: '7113', imageColor: 'from-rose-300 to-amber-500', createdAt: daysAgo(6), updatedAt: daysAgo(1) },
  { id: 'prd-8', productCode: 'SJ-CN-001', barcode: '8901234500080', name: 'Lakshmi Coin 10g', category: 'Pendant', metal: 'GOLD', purity: '24K', grossWeight: 10, netWeight: 10, stoneWeight: 0, wastage: 0, makingCharge: 800, otherCharges: 0, gstRate: 3, sellingPrice: 74500, costPrice: 73300, stock: 20, hsnCode: '7108', imageColor: 'from-yellow-400 to-amber-600', createdAt: daysAgo(5), updatedAt: daysAgo(1) },
]

// ===== Suppliers =====
export const SEED_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'Royal Gold Suppliers', companyName: 'Royal Gold Pvt Ltd', phone: '+91 98250 11111', email: 'sales@royalgold.in', address: 'Manek Chowk, Surat', gstin: '24RGLD1234F1Z5', pan: 'RGLD1234F', openingBalance: 0, totalPurchase: 1252000, totalPaid: 1252000, createdAt: daysAgo(300) },
  { id: 'sup-2', name: 'Anand Bullion', companyName: 'Anand Bullion Traders', phone: '+91 99240 22222', email: 'anand@bullion.in', address: 'Bhagal, Surat', gstin: '24ANBD5678G1Z2', pan: 'ANBD5678G', openingBalance: 0, totalPurchase: 314580, totalPaid: 250000, createdAt: daysAgo(250) },
  { id: 'sup-3', name: 'Silver Mart', companyName: 'Silver Mart Co', phone: '+91 98795 33333', email: 'info@silvermart.in', address: 'Rander, Surat', gstin: '24SLVM9012H1Z9', pan: 'SLVM9012H', openingBalance: 0, totalPurchase: 440000, totalPaid: 440000, createdAt: daysAgo(200) },
  { id: 'sup-4', name: 'Brilliant Stones Co', companyName: 'Brilliant Stones International', phone: '+91 99750 44444', email: 'gems@brilliant.co', address: 'Mumbai', gstin: '27BRST3456I1Z6', pan: 'BRST3456I', openingBalance: 0, totalPurchase: 1650000, totalPaid: 1200000, createdAt: daysAgo(180) },
  { id: 'sup-5', name: 'Gem House', companyName: 'Gem House Ltd', phone: '+91 98250 55555', email: 'sales@gemhouse.in', address: 'Jaipur', gstin: '08GEMH7890J1Z3', pan: 'GEMH7890J', openingBalance: 0, totalPurchase: 630000, totalPaid: 500000, createdAt: daysAgo(150) },
]

// ===== Purchases =====
export const SEED_PURCHASES: Purchase[] = [
  { id: 'pur-1', purchaseId: 'PUR-2026-0001', supplierId: 'sup-1', supplierName: 'Royal Gold Suppliers', invoiceNumber: 'SUP-INV-001', purchaseDate: daysAgo(30), items: [{ materialType: 'GOLD_BAR', description: 'Gold Bar 100g 22K', purity: '22K', grossWeight: 100, netWeight: 100, rate: 7100, makingCharges: 0, tax: 0, total: 710000 }], subtotal: 710000, totalTax: 0, grandTotal: 710000, paidAmount: 710000, paymentStatus: 'PAID', performedBy: 'Suresh Shah (Admin)', createdAt: daysAgo(30) },
  { id: 'pur-2', purchaseId: 'PUR-2026-0002', supplierId: 'sup-1', supplierName: 'Royal Gold Suppliers', invoiceNumber: 'SUP-INV-002', purchaseDate: daysAgo(25), items: [{ materialType: 'GOLD_BAR', description: 'Gold Bar 50g 24K', purity: '24K', grossWeight: 50, netWeight: 50, rate: 7200, makingCharges: 0, tax: 0, total: 360000 }], subtotal: 360000, totalTax: 0, grandTotal: 360000, paidAmount: 360000, paymentStatus: 'PAID', performedBy: 'Suresh Shah (Admin)', createdAt: daysAgo(25) },
  { id: 'pur-3', purchaseId: 'PUR-2026-0003', supplierId: 'sup-2', supplierName: 'Anand Bullion', invoiceNumber: 'SUP-INV-003', purchaseDate: daysAgo(10), items: [{ materialType: 'GOLD_SCRAP', description: 'Gold Scrap 22K', purity: '22K', grossWeight: 35.6, netWeight: 32.6, rate: 6800, makingCharges: 0, tax: 0, total: 242080 }], subtotal: 242080, totalTax: 0, grandTotal: 242080, paidAmount: 150000, paymentStatus: 'PARTIAL', performedBy: 'Suresh Shah (Admin)', createdAt: daysAgo(10) },
  { id: 'pur-4', purchaseId: 'PUR-2026-0004', supplierId: 'sup-4', supplierName: 'Brilliant Stones Co', invoiceNumber: 'SUP-INV-006', purchaseDate: daysAgo(7), items: [{ materialType: 'DIAMOND', description: 'Round Diamonds 0.3ct x50', purity: 'NA', grossWeight: 15, netWeight: 15, rate: 50000, makingCharges: 0, tax: 0, total: 750000 }], subtotal: 750000, totalTax: 0, grandTotal: 750000, paidAmount: 500000, paymentStatus: 'PARTIAL', performedBy: 'Suresh Shah (Admin)', createdAt: daysAgo(7) },
  { id: 'pur-5', purchaseId: 'PUR-2026-0005', supplierId: 'sup-1', supplierName: 'Royal Gold Suppliers', invoiceNumber: 'SUP-INV-007', purchaseDate: daysAgo(2), items: [{ materialType: 'GOLD_BAR', description: 'Gold Bar 6.5g 18K', purity: '18K', grossWeight: 6.5, netWeight: 6.5, rate: 5400, makingCharges: 0, tax: 0, total: 35100 }], subtotal: 35100, totalTax: 0, grandTotal: 35100, paidAmount: 35100, paymentStatus: 'PAID', performedBy: 'Suresh Shah (Admin)', createdAt: daysAgo(2) },
]

// ===== Customers =====
export const SEED_CUSTOMERS: Customer[] = [
  { id: 'cus-1', customerId: 'CUST-001', name: 'Priya Patel', phone: '+91 98240 11223', email: 'priya.patel@example.com', address: 'B-204, Pinnacle Apartments, Adajan', city: 'Surat', pincode: '395009', pan: 'ABCPP1234K', dateOfBirth: '1991-04-18', anniversary: '2016-12-02', totalPurchase: 482000, totalPaid: 482000, totalDue: 0, totalBills: 4, createdAt: daysAgo(120) },
  { id: 'cus-2', customerId: 'CUST-002', name: 'Rajesh Mehta', phone: '+91 99250 44556', email: 'rajesh.mehta@example.com', address: '12, Sai Krupa Society, Varachha', city: 'Surat', pincode: '395006', pan: 'ABCRM1234M', totalPurchase: 215000, totalPaid: 215000, totalDue: 0, totalBills: 2, createdAt: daysAgo(95) },
  { id: 'cus-3', customerId: 'CUST-003', name: 'Anita Desai', phone: '+91 98795 78901', email: 'anita.desai@example.com', address: 'A-501, Rajhans Tower, Vesu', city: 'Surat', pincode: '395007', gstin: '24ANITD1234D1Z9', pan: 'ANITD1234D', totalPurchase: 678000, totalPaid: 678000, totalDue: 0, totalBills: 6, createdAt: daysAgo(80) },
  { id: 'cus-4', customerId: 'CUST-004', name: 'Mahesh Shah', phone: '+91 98250 77882', address: 'Shop 4, Ring Road, Near Railway Station', city: 'Surat', pincode: '395003', totalPurchase: 152000, totalPaid: 152000, totalDue: 0, totalBills: 1, createdAt: daysAgo(40) },
  { id: 'cus-5', customerId: 'CUST-005', name: 'Sneha Joshi', phone: '+91 99750 33110', email: 'sneha.joshi@example.com', address: '5, Tulsi Bungalows, Bhatha', city: 'Surat', pincode: '394510', dateOfBirth: '1994-06-12', totalPurchase: 89000, totalPaid: 40000, totalDue: 49000, totalBills: 1, createdAt: daysAgo(15) },
]

// ===== Sales =====
export const SEED_SALES: Sale[] = [
  { id: 'sale-1', invoiceNo: 'INV-2026-00121', customerId: 'cus-1', customerName: 'Priya Patel', customerPhone: '+91 98240 11223', customerAddress: 'B-204, Pinnacle Apartments, Adajan, Surat - 395009', items: [{ productId: 'prd-5', productCode: 'SJ-ER-001', name: 'Pearl Drop Earrings', hsn: '7113', metal: 'GOLD', purity: '18K', grossWeight: 6.2, netWeight: 5.8, stoneWeight: 0.4, rate: 36000, makingAmount: 6500, stoneAmount: 8500, otherCharges: 0, subtotal: 42500, discount: 500, gstRate: 3, gstAmount: 1260, total: 43260, quantity: 1 }], subtotal: 42500, totalMaking: 6500, totalStone: 8500, totalOther: 0, totalDiscount: 500, totalGst: 1260, grandTotal: 43260, paidAmount: 43260, dueAmount: 0, paymentMode: 'UPI', paymentRef: 'UPI/9824011223/00121', status: 'PAID', oldGoldAdjustment: 0, branch: 'Main Branch', billedBy: 'Suresh Shah (Admin)', createdAt: daysAgo(15) },
  { id: 'sale-2', invoiceNo: 'INV-2026-00122', customerId: 'cus-2', customerName: 'Rajesh Mehta', customerPhone: '+91 99250 44556', items: [{ productId: 'prd-4', productCode: 'SJ-CHN-001', name: 'Daily Wear Gold Chain (24 inch)', hsn: '7113', metal: 'GOLD', purity: '22K', grossWeight: 18.4, netWeight: 18.4, stoneWeight: 0, rate: 138000, makingAmount: 7000, stoneAmount: 0, otherCharges: 0, subtotal: 145000, discount: 0, gstRate: 3, gstAmount: 4350, total: 149350, quantity: 1 }], subtotal: 145000, totalMaking: 7000, totalStone: 0, totalOther: 0, totalDiscount: 0, totalGst: 4350, grandTotal: 149350, paidAmount: 149350, dueAmount: 0, paymentMode: 'CARD', paymentRef: 'CARD/HDFC/****4421', status: 'PAID', oldGoldAdjustment: 35000, branch: 'Main Branch', billedBy: 'Suresh Shah (Admin)', createdAt: daysAgo(11) },
  { id: 'sale-3', invoiceNo: 'INV-2026-00123', customerId: 'cus-3', customerName: 'Anita Desai', customerPhone: '+91 98795 78901', customerGstin: '24ANITD1234D1Z9', items: [{ productId: 'prd-2', productCode: 'SJ-NEC-001', name: 'Antique Temple Necklace', hsn: '7113', metal: 'GOLD', purity: '22K', grossWeight: 48.5, netWeight: 46.2, stoneWeight: 2.3, rate: 335000, makingAmount: 65000, stoneAmount: 18000, otherCharges: 5000, subtotal: 405000, discount: 5000, gstRate: 3, gstAmount: 12000, total: 412000, quantity: 1 }], subtotal: 405000, totalMaking: 65000, totalStone: 18000, totalOther: 5000, totalDiscount: 5000, totalGst: 12000, grandTotal: 412000, paidAmount: 412000, dueAmount: 0, paymentMode: 'BANK', paymentRef: 'NEFT/HDFC0001234', status: 'PAID', oldGoldAdjustment: 0, branch: 'Main Branch', billedBy: 'Suresh Shah (Admin)', createdAt: daysAgo(7) },
  { id: 'sale-4', invoiceNo: 'INV-2026-00124', customerId: 'cus-4', customerName: 'Mahesh Shah', customerPhone: '+91 98250 77882', items: [{ productId: 'prd-6', productCode: 'SJ-AK-001', name: 'Silver Anklet Pair', hsn: '7113', metal: 'SILVER', purity: '925', grossWeight: 84, netWeight: 84, stoneWeight: 0, rate: 7500, makingAmount: 2100, stoneAmount: 0, otherCharges: 0, subtotal: 9600, discount: 100, gstRate: 3, gstAmount: 285, total: 9785, quantity: 1 }], subtotal: 9600, totalMaking: 2100, totalStone: 0, totalOther: 0, totalDiscount: 100, totalGst: 285, grandTotal: 9785, paidAmount: 9785, dueAmount: 0, paymentMode: 'CASH', status: 'PAID', oldGoldAdjustment: 0, branch: 'Main Branch', billedBy: 'Suresh Shah (Admin)', createdAt: daysAgo(4) },
  { id: 'sale-5', invoiceNo: 'INV-2026-00125', customerId: 'cus-5', customerName: 'Sneha Joshi', customerPhone: '+91 99750 33110', items: [{ productId: 'prd-8', productCode: 'SJ-CN-001', name: 'Lakshmi Coin 10g', hsn: '7108', metal: 'GOLD', purity: '24K', grossWeight: 10, netWeight: 10, stoneWeight: 0, rate: 73700, makingAmount: 800, stoneAmount: 0, otherCharges: 0, subtotal: 74500, discount: 0, gstRate: 3, gstAmount: 2235, total: 76735, quantity: 1 }], subtotal: 74500, totalMaking: 800, totalStone: 0, totalOther: 0, totalDiscount: 0, totalGst: 2235, grandTotal: 76735, paidAmount: 40000, dueAmount: 36735, paymentMode: 'UPI', paymentRef: 'UPI/9975033110/00125', status: 'PARTIAL', oldGoldAdjustment: 0, branch: 'Main Branch', billedBy: 'Suresh Shah (Admin)', createdAt: daysAgo(2) },
]

// ===== Payments =====
export const SEED_PAYMENTS: Payment[] = [
  { id: 'pay-1', paymentId: 'PAY-2026-0001', saleId: 'sale-1', invoiceNo: 'INV-2026-00121', customerId: 'cus-1', customerName: 'Priya Patel', amount: 43260, paymentMode: 'UPI', transactionId: 'UPI/9824011223/00121', receivedBy: 'Suresh Shah (Admin)', date: daysAgo(15), createdAt: daysAgo(15) },
  { id: 'pay-2', paymentId: 'PAY-2026-0002', saleId: 'sale-2', invoiceNo: 'INV-2026-00122', customerId: 'cus-2', customerName: 'Rajesh Mehta', amount: 149350, paymentMode: 'CARD', transactionId: 'CARD/HDFC/****4421', receivedBy: 'Suresh Shah (Admin)', date: daysAgo(11), createdAt: daysAgo(11) },
  { id: 'pay-3', paymentId: 'PAY-2026-0003', saleId: 'sale-3', invoiceNo: 'INV-2026-00123', customerId: 'cus-3', customerName: 'Anita Desai', amount: 412000, paymentMode: 'BANK', transactionId: 'NEFT/HDFC0001234', receivedBy: 'Suresh Shah (Admin)', date: daysAgo(7), createdAt: daysAgo(7) },
  { id: 'pay-4', paymentId: 'PAY-2026-0004', saleId: 'sale-4', invoiceNo: 'INV-2026-00124', customerId: 'cus-4', customerName: 'Mahesh Shah', amount: 9785, paymentMode: 'CASH', receivedBy: 'Suresh Shah (Admin)', date: daysAgo(4), createdAt: daysAgo(4) },
  { id: 'pay-5', paymentId: 'PAY-2026-0005', saleId: 'sale-5', invoiceNo: 'INV-2026-00125', customerId: 'cus-5', customerName: 'Sneha Joshi', amount: 40000, paymentMode: 'UPI', transactionId: 'UPI/9975033110/00125', receivedBy: 'Suresh Shah (Admin)', date: daysAgo(2), createdAt: daysAgo(2) },
]

// ===== Returns =====
export const SEED_RETURNS: SalesReturn[] = [
  { id: 'ret-1', returnId: 'RET-2026-0001', originalInvoiceNo: 'INV-2026-00118', saleId: 'sale-old', customerName: 'Kamlesh Shah', productName: 'Gold Ring (old design)', returnQuantity: 1, returnWeight: 8.2, reason: 'Design not as expected', refundAmount: 45000, exchangeAmount: 0, restockingStatus: 'DONE', date: daysAgo(20), createdAt: daysAgo(20) },
]

// ===== Exchanges =====
export const SEED_EXCHANGES: OldGoldExchange[] = [
  { id: 'ex-1', voucherNo: 'EX-2026-0008', customerName: 'Rajesh Mehta', customerPhone: '+91 99250 44556', type: 'EXCHANGE', itemDescription: 'Old gold chain, broken, 22K', grossWeight: 12.4, netWeight: 11.8, karat: '22K', touch: 91.6, ratePerGram: 6680, totalValue: 35000, adjustedAgainstInvoice: 'INV-2026-00122', paidAmount: 0, date: daysAgo(11), createdAt: daysAgo(11) },
  { id: 'ex-2', voucherNo: 'EX-2026-0009', customerName: 'Walk-in Seller', customerPhone: '+91 98250 00099', type: 'BUY', itemDescription: 'Scrap gold, assorted old bangles', grossWeight: 35.6, netWeight: 33.2, karat: '22K', touch: 88, ratePerGram: 6380, totalValue: 92416, paidAmount: 92416, date: daysAgo(3), createdAt: daysAgo(3) },
]

// ===== Wastage Records =====
export const SEED_WASTAGE: WastageRecord[] = [
  { id: 'wst-1', workOrderId: 'wo-10025', workId: 'WF-10025', stepName: 'Melting', userId: 'usr-rahul', userName: 'Rahul Kumar', inputWeight: 25.5, outputWeight: 25.4, wastageWeight: 0.1, wastagePercent: 0.39, date: daysAgo(2) },
  { id: 'wst-2', workOrderId: 'wo-10025', workId: 'WF-10025', stepName: 'Shaping', userId: 'usr-amit', userName: 'Amit Patel', inputWeight: 25.4, outputWeight: 25.1, wastageWeight: 0.3, wastagePercent: 1.18, date: daysAgo(1) },
  { id: 'wst-3', workOrderId: 'wo-10026', workId: 'WF-10026', stepName: 'Melting', userId: 'usr-rahul', userName: 'Rahul Kumar', inputWeight: 48.5, outputWeight: 48.3, wastageWeight: 0.2, wastagePercent: 0.41, date: daysAgo(4) },
  { id: 'wst-4', workOrderId: 'wo-10024', workId: 'WF-10024', stepName: 'Shaping', userId: 'usr-amit', userName: 'Amit Patel', inputWeight: 62.5, outputWeight: 62.0, wastageWeight: 0.5, wastagePercent: 0.80, date: daysAgo(12) },
  { id: 'wst-5', workOrderId: 'wo-10024', workId: 'WF-10024', stepName: 'Polishing', userId: 'usr-rakesh', userName: 'Rakesh Singh', inputWeight: 61.6, outputWeight: 61.4, wastageWeight: 0.2, wastagePercent: 0.32, date: daysAgo(8) },
]

// ===== Quality Checks =====
export const SEED_QCS: QualityCheck[] = [
  { id: 'qc-1', workOrderId: 'wo-10024', workId: 'WF-10024', productName: 'Bridal Bangles (Pair) — 22K', weightChecked: true, purityChecked: true, designChecked: true, stoneChecked: true, finishingChecked: true, result: 'APPROVED', remarks: 'All checks passed, excellent finishing', checkedBy: 'Suresh Shah (Admin)', date: daysAgo(6) },
  { id: 'qc-2', workOrderId: 'wo-10028', workId: 'WF-10028', productName: 'Gold Ring — 22K (Rework)', weightChecked: true, purityChecked: true, designChecked: true, stoneChecked: true, finishingChecked: false, result: 'REJECTED', remarks: 'Surface imperfection on left side, needs re-polishing', checkedBy: 'Suresh Shah (Admin)', date: daysAgo(1) },
  { id: 'qc-3', workOrderId: 'wo-10023', workId: 'WF-10023', productName: 'Gold Chain — 22K', weightChecked: true, purityChecked: true, designChecked: true, stoneChecked: true, finishingChecked: true, result: 'APPROVED', remarks: 'Passed all checks', checkedBy: 'Suresh Shah (Admin)', date: daysAgo(11) },
]

// ===== Audit Logs =====
export const SEED_AUDIT_LOGS: AuditLog[] = [
  { id: 'al-1', timestamp: daysAgo(30), userName: 'Suresh Shah (Admin)', action: 'CREATE_PURCHASE', entity: 'Purchase', entityId: 'PUR-2026-0001', details: 'Created purchase from Royal Gold Suppliers (₹710,000)' },
  { id: 'al-2', timestamp: daysAgo(15), userName: 'Suresh Shah (Admin)', action: 'CREATE_SALE', entity: 'Sale', entityId: 'INV-2026-00121', details: 'Created invoice for Priya Patel (₹43,260)' },
  { id: 'al-3', timestamp: daysAgo(3), userName: 'Suresh Shah (Admin)', action: 'CREATE_WORK_ORDER', entity: 'WorkOrder', entityId: 'WF-10025', details: 'Created work order for Gold Ring' },
  { id: 'al-4', timestamp: daysAgo(1), userName: 'Suresh Shah (Admin)', action: 'QC_REJECTED', entity: 'WorkOrder', entityId: 'WF-10028', details: 'QC rejected, sent back for rework' },
  { id: 'al-5', timestamp: hoursAgo(12), userName: 'Suresh Shah (Admin)', action: 'REASSIGN_WORK', entity: 'WorkOrder', entityId: 'WF-10028', details: 'Reassigned polishing step to Rakesh Singh (rework)' },
  { id: 'al-6', timestamp: hoursAgo(2), userName: 'Suresh Shah (Admin)', action: 'LOGIN', entity: 'User', entityId: 'usr-admin', details: 'Admin logged in' },
  { id: 'al-7', timestamp: daysAgo(7), userName: 'Suresh Shah (Admin)', action: 'STOCK_ADJUSTMENT', entity: 'GoldStock', entityId: 'GB-002', details: 'Stock adjusted: 50g → 49.8g (wastage correction)' },
]

// ===== Notifications =====
export const SEED_NOTIFICATIONS: AppNotification[] = [
  { id: 'ntf-1', type: 'WORK_OVERDUE', title: 'Work Overdue', message: 'WF-10028 (Gold Ring Rework) is overdue', forUserId: 'usr-admin', read: false, timestamp: hoursAgo(12) },
  { id: 'ntf-2', type: 'WORK_ASSIGNED', title: 'New Work Assigned', message: 'Design & Cutting step assigned to you (WF-10025)', forUserId: 'usr-sumit', read: false, timestamp: hoursAgo(6) },
  { id: 'ntf-3', type: 'PAYMENT_DUE', title: 'Payment Due', message: 'Sneha Joshi has ₹36,735 due on INV-2026-00125', forUserId: 'usr-admin', read: false, timestamp: daysAgo(1) },
  { id: 'ntf-4', type: 'REWORK_REQUIRED', title: 'Rework Required', message: 'WF-10028 sent back for re-polishing', forUserId: 'usr-rakesh', read: false, timestamp: hoursAgo(12) },
  { id: 'ntf-5', type: 'NEW_PURCHASE', title: 'New Purchase', message: 'Purchase PUR-2026-0005 recorded (₹35,100)', forUserId: 'usr-admin', read: true, timestamp: daysAgo(2) },
]
