// Initial in-memory dataset - stands in for the real database 
export const DEMO_PASSWORD = 'Password123!';

export function buildSeed() {
  const now = new Date();
  const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

  const users = [
    { id: 1, employeeId: 'EMP001', fullName: 'FedX', email: 'fedx@example.com', department: 'Supply Chain & Logistics', role: 'Requester', managerId: null, isActive: true },
    { id: 2, employeeId: 'EMP002', fullName: 'Hani Alturaiki', email: 'hani.alturaiki@asmo.com', department: 'Supply Chain & Logistics', role: 'Requester', managerId: null, isActive: true },
    { id: 3, employeeId: 'EMP003', fullName: 'IT TMS Processor', email: 'it.tms@asmo.com', department: 'IT Solutions', role: 'Processor', managerId: null, isActive: true },
    { id: 4, employeeId: 'EMP004', fullName: 'AD Team', email: 'ad.team@asmo.com', department: 'Active Directory', role: 'AD Team', managerId: null, isActive: true },
    { id: 5, employeeId: 'EMP005', fullName: 'System Admin', email: 'admin@asmo.com', department: 'IT Solutions', role: 'Admin', managerId: null, isActive: true },
    { id: 6, employeeId: 'EMP006', fullName: 'Operations Team', email: 'operations@asmo.com', department: 'Operations', role: 'Operations', managerId: 7, isActive: true },
    { id: 7, employeeId: 'EMP007', fullName: 'Operations Manager', email: 'operations.manager@asmo.com', department: 'Operations', role: 'Operations Manager', managerId: null, isActive: true },
    { id: 8, employeeId: 'EMP008', fullName: 'Operations Team 2', email: 'operations2@asmo.com', department: 'Operations', role: 'Operations', managerId: 7, isActive: true },
  ];

  const requestTypes = ['Create Driver', 'Modify Driver', 'Disable Driver'];
  const requestStatuses = ['Submitted', 'Under Review – Operations Team', 'Returned to Requester', 'Processing – Operations Team', 'AD Team Review', 'Completed', 'Rejected'];

  const drivers = [
    { id: 1, requestId: 1, username: 'mohammed.saeed', firstName: 'Mohammed', lastName: 'Saeed', email: 'mohammed.saeed@asmo.com', phone: '0551234567', role: 'Privileged User', customerGroup: 'CUEU/ARCO', driverClass: '30Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', licenseNumber: '21832743719', licenseExpiry: '2026-11-30', hasInsurance: 'Yes', city: 'Khobar', poNumber: '4821211244768', poExpiry: '2026-11-30' },
    { id: 2, requestId: 1, username: 'khalid.nasser', firstName: 'Khalid', lastName: 'Nasser', email: 'khalid.nasser@asmo.com', phone: '0559876543', role: 'Privileged User', customerGroup: 'CUEU/ARCO', driverClass: '20Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', licenseNumber: '21832743720', licenseExpiry: '2026-11-30', hasInsurance: 'Yes', city: 'Khobar', poNumber: '4821211244768', poExpiry: '2026-11-30' },
    { id: 3, requestId: 2, username: 'ali.ahmed@asmo.com', firstName: 'Ali', lastName: 'Ahmed', email: 'ali.ahmed@asmo.com', phone: '0552112332', role: 'Privileged User', customerGroup: 'CUEU/ARCO', driverClass: '30Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', poNumber: '4821211244768', poExpiry: '2027-05-19' },
    { id: 4, requestId: 3, username: '', firstName: 'Yousef', lastName: 'Hamdan', email: 'yousef.hamdan@asmo.com', phone: '0567891234', role: 'Privileged User', customerGroup: 'CUEU/ARCO', driverClass: '10Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', poNumber: '', poExpiry: '' },
    { id: 5, requestId: 4, username: '', firstName: 'Saad', lastName: 'Omar', email: 'saad.omar@asmo.com', phone: '0501122334', role: 'Privileged User', customerGroup: '', driverClass: '', operatingHours: '', licenseNumber: '19921147753', licenseExpiry: '2026-08-01', hasInsurance: 'No', city: 'Riyadh', poNumber: '4821211244999', poExpiry: '2026-08-01' },
    { id: 6, requestId: 5, username: '', firstName: 'Turki', lastName: 'Salem', email: 'turki.salem@asmo.com', phone: '0567123344', role: 'Privileged User', customerGroup: '', driverClass: '', operatingHours: '', licenseNumber: '10456782233', licenseExpiry: '2026-04-15', hasInsurance: 'Yes', city: 'Dammam', poNumber: '4821211255001', poExpiry: '2026-10-10' },
    { id: 7, requestId: 6, username: '', firstName: 'Rakan', lastName: 'Harbi', email: 'rakan.harbi@asmo.com', phone: '0533221144', role: 'Privileged User', customerGroup: 'NADEC', driverClass: '', operatingHours: '', licenseNumber: '11223344556', licenseExpiry: '2027-01-20', hasInsurance: 'Yes', city: 'Riyadh', poNumber: '4821211266002', poExpiry: '2027-01-20' },
    { id: 8, requestId: 6, username: '', firstName: 'Majed', lastName: 'Shammari', email: 'majed.shammari@asmo.com', phone: '0544332211', role: 'Privileged User', customerGroup: '', driverClass: '', operatingHours: '', licenseNumber: '99887766554', licenseExpiry: '2026-12-05', hasInsurance: 'Yes', city: 'Riyadh', poNumber: '4821211266002', poExpiry: '2027-01-20' },
    { id: 9, requestId: 7, username: '', firstName: 'Bandar', lastName: 'Zahrani', email: 'bandar.zahrani@asmo.com', phone: '0555667788', role: 'Privileged User', customerGroup: 'ARCO', driverClass: '20Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', licenseNumber: '33445566778', licenseExpiry: '2027-03-10', hasInsurance: 'Yes', city: 'Jeddah', poNumber: '4821211277003', poExpiry: '2027-03-10' },
  ];

  const requests = [
    {
      id: 1, requestNumber: 'REQ-2026-0001', requesterId: 1, requestTypeName: 'Create Driver', statusName: 'Completed',
      description: 'Onboard two new drivers for the ARCO contract.', businessJustification: 'Fleet expansion for Q3 deliveries.',
      entryMethod: 'Manual', currentProcessorId: 4, driverProfilesCompletedAt: daysAgo(4), effectiveDate: null,
      rpaTriggeredAt: daysAgo(4), adCompletedAt: daysAgo(2), adCompletedBy: 4,
      submittedDate: daysAgo(9), completedDate: daysAgo(2), createdAt: daysAgo(9), updatedAt: daysAgo(2),
    },
    {
      id: 2, requestNumber: 'REQ-2026-0002', requesterId: 1, requestTypeName: 'Modify Driver', statusName: 'Submitted',
      description: 'Update PO Number and PO Expiry Date for Ahmad Kabbani.', businessJustification: 'Contract renewed under a new purchase order.',
      entryMethod: 'Manual', currentProcessorId: null, driverProfilesCompletedAt: null, effectiveDate: null,
      rpaTriggeredAt: null, adCompletedAt: null, adCompletedBy: null,
      submittedDate: daysAgo(3), completedDate: null, createdAt: daysAgo(3), updatedAt: daysAgo(3),
    },
    {
      id: 3, requestNumber: 'REQ-2026-0003', requesterId: 2, requestTypeName: 'Disable Driver', statusName: 'Submitted',
      description: 'Driver left the company.', businessJustification: 'Offboarding - access must be revoked immediately.',
      entryMethod: 'Manual', currentProcessorId: null, effectiveDate: daysAgo(-1), driverProfilesCompletedAt: null,
      rpaTriggeredAt: null, adCompletedAt: null, adCompletedBy: null,
      submittedDate: daysAgo(1), completedDate: null, createdAt: daysAgo(1), updatedAt: daysAgo(1),
    },
    {
      id: 4, requestNumber: 'REQ-2026-0004', requesterId: 1, requestTypeName: 'Create Driver', statusName: 'Rejected',
      description: 'Onboard a driver for the temporary CUEU route.', businessJustification: 'Short-term contract coverage.',
      entryMethod: 'Manual', currentProcessorId: 6, driverProfilesCompletedAt: null, effectiveDate: null,
      rpaTriggeredAt: null, adCompletedAt: null, adCompletedBy: null,
      submittedDate: daysAgo(6), completedDate: null, createdAt: daysAgo(6), updatedAt: daysAgo(5),
    },
    {
      id: 5, requestNumber: 'REQ-2026-0005', requesterId: 2, requestTypeName: 'Create Driver', statusName: 'Returned to Requester',
      description: 'Onboard a new driver for the SABIC route.', businessJustification: 'Replacing a driver who resigned.',
      entryMethod: 'Manual', currentProcessorId: 6, driverProfilesCompletedAt: null, effectiveDate: null,
      rpaTriggeredAt: null, adCompletedAt: null, adCompletedBy: null,
      submittedDate: daysAgo(2), completedDate: null, createdAt: daysAgo(2), updatedAt: daysAgo(1),
    },
    {
      id: 6, requestNumber: 'REQ-2026-0006', requesterId: 1, requestTypeName: 'Create Driver', statusName: 'Processing – Operations Team',
      description: 'Onboard two drivers for the new NADEC distribution route.', businessJustification: 'New customer contract starting next month.',
      entryMethod: 'Manual', currentProcessorId: 6, driverProfilesCompletedAt: null, effectiveDate: null,
      rpaTriggeredAt: null, adCompletedAt: null, adCompletedBy: null,
      submittedDate: daysAgo(4), completedDate: null, createdAt: daysAgo(4), updatedAt: daysAgo(1),
    },
    {
      id: 7, requestNumber: 'REQ-2026-0007', requesterId: 2, requestTypeName: 'Create Driver', statusName: 'AD Team Review',
      description: 'Onboard a driver for the ARCO night shift.', businessJustification: 'Coverage for extended delivery hours.',
      entryMethod: 'Manual', currentProcessorId: null, driverProfilesCompletedAt: daysAgo(1), effectiveDate: null,
      rpaTriggeredAt: daysAgo(1), adCompletedAt: null, adCompletedBy: null,
      submittedDate: daysAgo(5), completedDate: null, createdAt: daysAgo(5), updatedAt: daysAgo(1),
    },
  ];

  const history = [
    { id: 1, requestId: 1, oldStatus: null, newStatus: 'Submitted', changedBy: 1, remarks: 'Request submitted by requester', createdAt: daysAgo(9) },
    { id: 2, requestId: 1, oldStatus: 'Submitted', newStatus: 'Under Review – Operations Team', changedBy: 6, remarks: null, createdAt: daysAgo(7) },
    { id: 3, requestId: 1, oldStatus: 'Under Review – Operations Team', newStatus: 'Processing – Operations Team', changedBy: 6, remarks: 'Looks good, proceeding.', createdAt: daysAgo(6) },
    { id: 4, requestId: 1, oldStatus: 'Processing – Operations Team', newStatus: 'AD Team Review', changedBy: 6, remarks: 'Driver profiles completed by Operations. RPA triggered. Handed over to the AD Team.', createdAt: daysAgo(4) },
    { id: 6, requestId: 1, oldStatus: 'AD Team Review', newStatus: 'Completed', changedBy: 4, remarks: 'Account creation confirmed by AD Team. Accounts created in AD and DCT.', createdAt: daysAgo(2) },

    { id: 7, requestId: 2, oldStatus: null, newStatus: 'Submitted', changedBy: 1, remarks: 'Request submitted by requester', createdAt: daysAgo(3) },

    { id: 9, requestId: 3, oldStatus: null, newStatus: 'Submitted', changedBy: 2, remarks: 'Request submitted by requester', createdAt: daysAgo(1) },

    { id: 10, requestId: 4, oldStatus: null, newStatus: 'Submitted', changedBy: 1, remarks: 'Request submitted by requester', createdAt: daysAgo(6) },
    { id: 11, requestId: 4, oldStatus: 'Submitted', newStatus: 'Under Review – Operations Team', changedBy: 6, remarks: null, createdAt: daysAgo(5.5) },
    { id: 12, requestId: 4, oldStatus: 'Under Review – Operations Team', newStatus: 'Rejected', changedBy: 6, remarks: 'Route was cancelled by the customer - driver account no longer needed.', createdAt: daysAgo(5) },

    { id: 13, requestId: 5, oldStatus: null, newStatus: 'Submitted', changedBy: 2, remarks: 'Request submitted by requester', createdAt: daysAgo(2) },
    { id: 14, requestId: 5, oldStatus: 'Submitted', newStatus: 'Under Review – Operations Team', changedBy: 6, remarks: null, createdAt: daysAgo(1.5) },
    { id: 15, requestId: 5, oldStatus: 'Under Review – Operations Team', newStatus: 'Returned to Requester', changedBy: 6, remarks: 'The uploaded driver license photo is blurry and the PO number does not match an active contract - please re-upload and correct.', createdAt: daysAgo(1) },

    { id: 16, requestId: 6, oldStatus: null, newStatus: 'Submitted', changedBy: 1, remarks: 'Request submitted by requester', createdAt: daysAgo(4) },
    { id: 17, requestId: 6, oldStatus: 'Submitted', newStatus: 'Under Review – Operations Team', changedBy: 6, remarks: null, createdAt: daysAgo(2) },
    { id: 18, requestId: 6, oldStatus: 'Under Review – Operations Team', newStatus: 'Processing – Operations Team', changedBy: 6, remarks: 'Approved - completing driver profiles.', createdAt: daysAgo(1) },

    { id: 19, requestId: 7, oldStatus: null, newStatus: 'Submitted', changedBy: 2, remarks: 'Request submitted by requester', createdAt: daysAgo(5) },
    { id: 20, requestId: 7, oldStatus: 'Submitted', newStatus: 'Under Review – Operations Team', changedBy: 6, remarks: null, createdAt: daysAgo(3) },
    { id: 21, requestId: 7, oldStatus: 'Under Review – Operations Team', newStatus: 'Processing – Operations Team', changedBy: 6, remarks: 'Approved - completing driver profiles.', createdAt: daysAgo(2) },
    { id: 22, requestId: 7, oldStatus: 'Processing – Operations Team', newStatus: 'AD Team Review', changedBy: 6, remarks: 'Driver profiles completed by Operations. RPA triggered. Handed over to the AD Team.', createdAt: daysAgo(1) },
  ];

  // Master list of already-existing/active drivers in the system (AD / DCT).
  // Not read by any endpoint today - kept for parity with the frontend mock.
  const driverDirectory = [
    { username: 'ahmed.kabbani', firstName: 'Ahmed', lastName: 'Kabbani', email: 'ahmed.kabbani@asmo.com', phone: '0552112332', role: 'Privileged User', customerGroup: 'ARCO', driverClass: '30Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', poNumber: '481221221', poExpiry: '2026-12-20', status: 'Active' },
    { username: 'mohammed.saeed', firstName: 'Mohammed', lastName: 'Saeed', email: 'mohammed.saeed@asmo.com', phone: '0551234567', role: 'Privileged User', customerGroup: 'CUEU/ARCO', driverClass: '30Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', poNumber: '4821211244768', poExpiry: '2026-11-30', status: 'Active' },
    { username: 'khalid.nasser', firstName: 'Khalid', lastName: 'Nasser', email: 'khalid.nasser@asmo.com', phone: '0559876543', role: 'Privileged User', customerGroup: 'CUEU/ARCO', driverClass: '20Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', poNumber: '4821211244768', poExpiry: '2026-11-30', status: 'Active' },
    { username: 'faisal.otaibi', firstName: 'Faisal', lastName: 'Otaibi', email: 'faisal.otaibi@asmo.com', phone: '0563345678', role: 'Privileged User', customerGroup: 'NADEC', driverClass: '20Ton_Drivers', operatingHours: 'Sat-Wed 7:00-16:00', poNumber: '5821334455', poExpiry: '2027-02-14', status: 'Active' },
    { username: 'omar.rashid', firstName: 'Omar', lastName: 'Rashid', email: 'omar.rashid@asmo.com', phone: '0544456789', role: 'Privileged User', customerGroup: 'SABIC', driverClass: '10Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', poNumber: '5921445566', poExpiry: '2026-09-05', status: 'Active' },
    { username: 'yousef.hamdan', firstName: 'Yousef', lastName: 'Hamdan', email: 'yousef.hamdan@asmo.com', phone: '0567891234', role: 'Privileged User', customerGroup: 'CUEU/ARCO', driverClass: '10Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', poNumber: '', poExpiry: '', status: 'Active' },
    { username: 'nasser.qahtani', firstName: 'Nasser', lastName: 'Qahtani', email: 'nasser.qahtani@asmo.com', phone: '0509988776', role: 'Privileged User', customerGroup: 'ARCO', driverClass: '20Ton_Drivers', operatingHours: 'Sun-Thu 8:00-17:00', poNumber: '4821211244768', poExpiry: '2026-03-01', status: 'Inactive' },
  ];

  const attachments = [];

  const notifications = [
    { id: 1, userId: 1, requestId: 1, title: 'Request REQ-2026-0001 - Completed', message: 'Your request status changed to "Completed".', isRead: false, createdAt: daysAgo(2) },
    { id: 2, userId: 1, requestId: 4, title: 'Request REQ-2026-0004 - Rejected', message: 'Your request status changed to "Rejected". Remarks: Route was cancelled by the customer - driver account no longer needed.', isRead: false, createdAt: daysAgo(5) },
    { id: 4, userId: 2, requestId: 5, title: 'Request REQ-2026-0005 - Returned to Requester', message: 'Your request status changed to "Returned to Requester". Remarks: The uploaded driver license photo is blurry and the PO number does not match an active contract - please re-upload and correct.', isRead: false, createdAt: daysAgo(1) },
    { id: 5, userId: 2, requestId: 7, title: 'Request REQ-2026-0007 - AD Team Review', message: 'Your request status changed to "AD Team Review".', isRead: false, createdAt: daysAgo(1) },
  ];

  return {
    nextIds: { user: 9, request: 8, driver: 10, history: 23, attachment: 1, notification: 6 },
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


