// Initial dummy dataset for the frontend 
// 9 table schema in plain JS objects/arrays instead of MySQL tables.

export const DEMO_PASSWORD = 'Password123!';

export function buildSeed() {
  const now = new Date();
  // Generates dates relative to today
  const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

  const users = [
    { id: 1, employeeId: 'EMP001', fullName: 'FedX', email: 'fedx@example.com', department: 'Supply Chain & Logistics', role: 'Requester', managerId: null, isActive: true },
    { id: 2, employeeId: 'EMP002', fullName: 'Hani Alturaiki', email: 'hani.alturaiki@asmo.com', department: 'Supply Chain & Logistics', role: 'Requester', managerId: null, isActive: true },
    { id: 3, employeeId: 'EMP003', fullName: 'IT TMS Processor', email: 'it.tms@asmo.com', department: 'IT Solutions', role: 'Processor', managerId: null, isActive: true },
    { id: 4, employeeId: 'EMP004', fullName: 'AD Team Processor', email: 'ad.team@asmo.com', department: 'Active Directory', role: 'Processor', managerId: null, isActive: true },
    { id: 5, employeeId: 'EMP005', fullName: 'System Admin', email: 'admin@asmo.com', department: 'IT Solutions', role: 'Admin', managerId: null, isActive: true },
  ];

  const requestTypes = ['Create Driver', 'Modify Driver', 'Disable Driver'];
  const requestStatuses = ['Submitted', 'Under Review', 'Approved', 'Processing', 'Completed', 'Rejected'];

  const drivers = [
    { id: 1, requestId: 1, username: '', firstName: 'Mohammed', lastName: 'Saeed', email: 'mohammed.saeed@asmo.com', phone: '0551234567', role: 'Privileged User', customerGroup: 'CUEU/ARCO', driverClass: '30Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', poNumber: '4821211244768', poExpiry: '2026-11-30' },
    { id: 2, requestId: 1, username: '', firstName: 'Khalid', lastName: 'Nasser', email: 'khalid.nasser@asmo.com', phone: '0559876543', role: 'Privileged User', customerGroup: 'CUEU/ARCO', driverClass: '20Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', poNumber: '4821211244768', poExpiry: '2026-11-30' },
    { id: 3, requestId: 2, username: 'ali.ahmed@asmo.com', firstName: 'Ali', lastName: 'Ahmed', email: 'ali.ahmed@asmo.com', phone: '0552112332', role: 'Privileged User', customerGroup: 'CUEU/ARCO', driverClass: '30Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', poNumber: '4821211244768', poExpiry: '2027-05-19' },
    { id: 4, requestId: 3, username: '', firstName: 'Yousef', lastName: 'Hamdan', email: 'yousef.hamdan@asmo.com', phone: '0567891234', role: 'Privileged User', customerGroup: 'CUEU/ARCO', driverClass: '10Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', poNumber: '', poExpiry: '' },
    { id: 5, requestId: 4, username: 'saad.omar@asmo.com', firstName: 'Saad', lastName: 'Omar', email: 'saad.omar@asmo.com', phone: '0501122334', role: 'Privileged User', customerGroup: 'CUEU/ARCO', driverClass: '20Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', poNumber: '4821211244999', poExpiry: '2026-08-01' },
  ];

  const requests = [
    {
      id: 1, requestNumber: 'REQ-2026-0001', requesterId: 1, requestTypeName: 'Create Driver', statusName: 'Completed',
      description: 'Onboard two new drivers for the ARCO contract.', businessJustification: 'Fleet expansion for Q3 deliveries.',
      entryMethod: 'Manual', currentProcessorId: 3,
      submittedDate: daysAgo(9), completedDate: daysAgo(2), createdAt: daysAgo(9), updatedAt: daysAgo(2),
    },
    {
      id: 2, requestNumber: 'REQ-2026-0002', requesterId: 1, requestTypeName: 'Modify Driver', statusName: 'Under Review',
      description: 'Update driver class and operating hours for Ahmad Kabbani.', businessJustification: 'Driver reassigned to a heavier vehicle class.',
      entryMethod: 'Manual', currentProcessorId: 3,
      submittedDate: daysAgo(3), completedDate: null, createdAt: daysAgo(3), updatedAt: daysAgo(1),
    },
    {
      id: 3, requestNumber: 'REQ-2026-0003', requesterId: 2, requestTypeName: 'Disable Driver', statusName: 'Submitted',
      description: 'Driver left the company.', businessJustification: 'Offboarding - access must be revoked immediately.',
      entryMethod: 'Manual', currentProcessorId: null, effectiveDate: daysAgo(-1),
      submittedDate: daysAgo(1), completedDate: null, createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
    {
      id: 4, requestNumber: 'REQ-2026-0004', requesterId: 1, requestTypeName: 'Create Driver', statusName: 'Rejected',
      description: 'Onboard a driver for the temporary CUEU route.', businessJustification: 'Short-term contract coverage.',
      entryMethod: 'Manual', currentProcessorId: 4,
      submittedDate: daysAgo(6), completedDate: null, createdAt: daysAgo(6), updatedAt: daysAgo(5),
    },
  ];

  const history = [
    { id: 1, requestId: 1, oldStatus: null, newStatus: 'Submitted', changedBy: 1, remarks: 'Request submitted by requester', createdAt: daysAgo(9) },
    { id: 2, requestId: 1, oldStatus: 'Submitted', newStatus: 'Under Review', changedBy: 3, remarks: null, createdAt: daysAgo(7) },
    { id: 3, requestId: 1, oldStatus: 'Under Review', newStatus: 'Approved', changedBy: 3, remarks: 'Looks good, proceeding.', createdAt: daysAgo(6) },
    { id: 4, requestId: 1, oldStatus: 'Approved', newStatus: 'Processing', changedBy: 3, remarks: null, createdAt: daysAgo(4) },
    { id: 5, requestId: 1, oldStatus: 'Processing', newStatus: 'Completed', changedBy: 3, remarks: 'Accounts created in AD and DCT.', createdAt: daysAgo(2) },

    { id: 6, requestId: 2, oldStatus: null, newStatus: 'Submitted', changedBy: 1, remarks: 'Request submitted by requester', createdAt: daysAgo(3) },
    { id: 7, requestId: 2, oldStatus: 'Submitted', newStatus: 'Under Review', changedBy: 3, remarks: null, createdAt: daysAgo(1) },

    { id: 8, requestId: 3, oldStatus: null, newStatus: 'Submitted', changedBy: 2, remarks: 'Request submitted by requester', createdAt: daysAgo(1) },

    { id: 9, requestId: 4, oldStatus: null, newStatus: 'Submitted', changedBy: 1, remarks: 'Request submitted by requester', createdAt: daysAgo(6) },
    { id: 10, requestId: 4, oldStatus: 'Submitted', newStatus: 'Rejected', changedBy: 4, remarks: 'PO number does not match an active contract. Please resubmit with a valid PO.', createdAt: daysAgo(5) },
  ];


  // Master list of already-existing/active drivers in the system (AD / DCT).
  // Modify Driver and Disable Driver requests search against this instead of

  const driverDirectory = [
    { username: 'ahmed.kabbani', firstName: 'Ahmed', lastName: 'Kabbani', email: 'ahmed.kabbani@asmo.com', phone: '0552112332', role: 'Privileged User', customerGroup: 'ARCO', driverClass: '30Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', poNumber: '481221221', poExpiry: '2026-12-20', status: 'Active' },
    { username: 'mohammed.saeed', firstName: 'Mohammed', lastName: 'Saeed', email: 'mohammed.saeed@asmo.com', phone: '0551234567', role: 'Privileged User', customerGroup: 'CUEU/ARCO', driverClass: '30Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', poNumber: '4821211244768', poExpiry: '2026-11-30', status: 'Active' },
    { username: 'khalid.nasser', firstName: 'Khalid', lastName: 'Nasser', email: 'khalid.nasser@asmo.com', phone: '0559876543', role: 'Privileged User', customerGroup: 'CUEU/ARCO', driverClass: '20Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', poNumber: '4821211244768', poExpiry: '2026-11-30', status: 'Active' },
    { username: 'faisal.otaibi', firstName: 'Faisal', lastName: 'Otaibi', email: 'faisal.otaibi@asmo.com', phone: '0563345678', role: 'Privileged User', customerGroup: 'NADEC', driverClass: '20Ton_Drivers', operatingHours: 'Sat-Wed 7:00-16:00', poNumber: '5821334455', poExpiry: '2027-02-14', status: 'Active' },
    { username: 'omar.rashid', firstName: 'Omar', lastName: 'Rashid', email: 'omar.rashid@asmo.com', phone: '0544456789', role: 'Privileged User', customerGroup: 'SABIC', driverClass: '10Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', poNumber: '5921445566', poExpiry: '2026-09-05', status: 'Active' },
    { username: 'yousef.hamdan', firstName: 'Yousef', lastName: 'Hamdan', email: 'yousef.hamdan@asmo.com', phone: '0567891234', role: 'Privileged User', customerGroup: 'CUEU/ARCO', driverClass: '10Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', poNumber: '', poExpiry: '', status: 'Active' },
    { username: 'nasser.qahtani', firstName: 'Nasser', lastName: 'Qahtani', email: 'nasser.qahtani@asmo.com', phone: '0509988776', role: 'Privileged User', customerGroup: 'ARCO', driverClass: '20Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', poNumber: '4821211244768', poExpiry: '2026-03-01', status: 'Inactive' },
  ];

  // Used later when user attach files
  const attachments = [];

  const notifications = [
    { id: 1, userId: 1, requestId: 1, title: 'Request REQ-2026-0001 - Completed', message: 'Your request status changed to "Completed".', isRead: false, createdAt: daysAgo(2) },
    { id: 2, userId: 1, requestId: 4, title: 'Request REQ-2026-0004 - Rejected', message: 'Your request status changed to "Rejected". Remarks: PO number does not match an active contract. Please resubmit with a valid PO.', isRead: false, createdAt: daysAgo(5) },
    { id: 3, userId: 1, requestId: 2, title: 'Request REQ-2026-0002 - Under Review', message: 'Your request status changed to "Under Review".', isRead: true, createdAt: daysAgo(1) },
  ];

  return {
    nextIds: { user: 6, request: 5, driver: 6, history: 11, attachment: 1, notification: 4 },
    users,
    requestTypes,
    requestStatuses,
    requests,
    drivers,
    driverDirectory,
    history,
    attachments,
    notifications,
  };
}
