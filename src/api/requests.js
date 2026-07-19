// // Mock implementation of the requests API. Same exported function names and
// // call signatures as the full-stack version (see backend/src/controllers/
// // requestController.js for the logic this mirrors) so every page/component
// // works unchanged - only this file (and its siblings in src/api/) will need
// // to be swapped out for real axios calls once the backend is wired up.
// import { getDb, saveDb, delay } from '../mock/db.js';
// import { getSessionUser } from '../mock/session.js';
// import { hydrateRequestSummary, hydrateRequestFull, findUser } from '../mock/hydrate.js';
// import { isTransitionAllowed } from '../mock/workflow.js';
// import { validateDriverRow } from '../mock/validators.js';
// import { generateRequestNumber } from '../mock/requestNumber.js';
// import { buildTemplateBlob, parseDriverExcelFile, buildDriversExportBlob } from '../mock/excel.js';

// function apiError(message, status = 400, extra = {}) {
//   const error = new Error(message);
//   error.response = { status, data: { message, ...extra } };
//   return error;
// }

// function currentUser() {
//   const user = getSessionUser();
//   if (!user) throw apiError('Not authenticated', 401);
//   return user;
// }

// function isProcessorRole(roleName) {
//   return roleName === 'Processor' || roleName === 'Admin';
// }

// // ---------------------------------------------------------------------------
// export async function getStats() {
//   await delay();
//   const user = currentUser();
//   const db = getDb();
//   const isProcessor = isProcessorRole(user.role);

//   const rows = isProcessor ? db.requests : db.requests.filter((r) => r.requesterId === user.id);
//   const counts = {};
//   db.requestStatuses.forEach((s) => {
//     counts[s] = rows.filter((r) => r.statusName === s).length;
//   });

//   if (isProcessor) {
//     return {
//       data: {
//         newRequests: counts['Submitted'] || 0,
//         inProgress: (counts['Processing'] || 0) + (counts['Approved'] || 0),
//         completed: counts['Completed'] || 0,
//         rejected: counts['Rejected'] || 0,
//         waitingApproval: (counts['Submitted'] || 0) + (counts['Under Review'] || 0),
//         byStatus: counts,
//       },
//     };
//   }

//   return {
//     data: {
//       pending: (counts['Submitted'] || 0) + (counts['Under Review'] || 0),
//       approved: (counts['Approved'] || 0) + (counts['Processing'] || 0),
//       rejected: counts['Rejected'] || 0,
//       completed: counts['Completed'] || 0,
//       byStatus: counts,
//     },
//   };
// }

// // ---------------------------------------------------------------------------
// export async function listRequests(params = {}) {
//   await delay();
//   const user = currentUser();
//   const db = getDb();
//   const isProcessor = isProcessorRole(user.role);

//   let rows = isProcessor ? db.requests.slice() : db.requests.filter((r) => r.requesterId === user.id);

//   if (params.status) rows = rows.filter((r) => r.statusName === params.status);
//   if (params.type) rows = rows.filter((r) => r.requestTypeName === params.type);
//   if (params.search) {
//     const q = params.search.toLowerCase();
//     rows = rows.filter(
//       (r) => r.requestNumber.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q)
//     );
//   }

//   rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//   const total = rows.length;
//   const limit = params.recent ? parseInt(params.recent, 10) : parseInt(params.pageSize || 10, 10);
//   const page = params.recent ? 1 : parseInt(params.page || 1, 10);
//   const offset = (page - 1) * limit;
//   const pageRows = rows.slice(offset, offset + limit);

//   return { data: { data: pageRows.map(hydrateRequestSummary), total, page, pageSize: limit } };
// }

// // ---------------------------------------------------------------------------
// export async function getRequest(id) {
//   await delay();
//   const user = currentUser();
//   const db = getDb();
//   const row = db.requests.find((r) => r.id === Number(id));
//   if (!row) throw apiError('Request not found', 404);

//   const isProcessor = isProcessorRole(user.role);
//   if (!isProcessor && row.requesterId !== user.id) {
//     throw apiError('You do not have access to this request', 403);
//   }

//   return { data: hydrateRequestFull(row) };
// }

// // ---------------------------------------------------------------------------
// export async function createRequest(payload) {
//   await delay();
//   const user = currentUser();
//   const db = getDb();
//   const { requestTypeName, description, businessJustification, entryMethod, drivers = [], effectiveDate } = payload;

//   if (!requestTypeName || !db.requestTypes.includes(requestTypeName)) {
//     throw apiError(`Unknown request type: ${requestTypeName}`);
//   }

//   if (!description || !businessJustification) {
//     throw apiError('Description and Business Justification are required to submit');
//   }
//   if (!drivers.length) {
//     throw apiError('At least one driver record is required to submit');
//   }
//   const validationErrors = [];
//   const requireUsername = requestTypeName !== 'Create Driver';
//   drivers.forEach((d, idx) => {
//     const rowErrors = validateDriverRow(d, { requireUsername });
//     if (rowErrors.length) validationErrors.push({ row: idx + 1, errors: rowErrors });
//   });
//   if (validationErrors.length) {
//     throw apiError('Driver validation failed', 400, { validationErrors });
//   }

//   const requestId = db.nextIds.request++;
//   const now = new Date().toISOString();

//   const request = {
//     id: requestId,
//     requestNumber: generateRequestNumber(),
//     requesterId: user.id,
//     requestTypeName,
//     statusName: 'Submitted',
//     description: description || '',
//     businessJustification: businessJustification || '',
//     entryMethod: entryMethod || 'Manual',
//     currentProcessorId: null,
//     submittedDate: now,
//     completedDate: null,
//     effectiveDate: effectiveDate || null,
//     createdAt: now,
//     updatedAt: now,
//   };
//   db.requests.push(request);

//   drivers.forEach((d) => {
//     db.drivers.push({
//       id: db.nextIds.driver++,
//       requestId,
//       username: d.username || '',
//       firstName: d.firstName,
//       lastName: d.lastName,
//       email: d.email,
//       phone: d.phone,
//       role: 'Privileged User',
//       customerGroup: d.customerGroup || '',
//       driverClass: d.driverClass || '',
//       operatingHours: d.operatingHours || '',
//       poNumber: d.poNumber || '',
//       poExpiry: d.poExpiry || '',
//       changeSummary: d.changeSummary || null,
//       driverStatus: d.driverStatus || null,
//     });
//   });

//   db.history.push({
//     id: db.nextIds.history++,
//     requestId,
//     oldStatus: null,
//     newStatus: 'Submitted',
//     changedBy: user.id,
//     remarks: 'Request submitted by requester',
//     createdAt: now,
//   });

//   saveDb();
//   return { data: hydrateRequestFull(request) };
// }

// // ---------------------------------------------------------------------------
// export async function updateStatus(id, targetStatus, remarks) {
//   await delay();
//   const user = currentUser();
//   const db = getDb();
//   const row = db.requests.find((r) => r.id === Number(id));
//   if (!row) throw apiError('Request not found', 404);

//   const currentStatusName = row.statusName;
//   if (!isTransitionAllowed(currentStatusName, targetStatus, user.role)) {
//     throw apiError(`Cannot move request from "${currentStatusName}" to "${targetStatus}" as ${user.role}`);
//   }

//   const now = new Date().toISOString();
//   const isProcessor = isProcessorRole(user.role);

//   row.statusName = targetStatus;
//   row.currentProcessorId = isProcessor ? user.id : row.currentProcessorId;
//   row.completedDate = targetStatus === 'Completed' ? now : row.completedDate;
//   row.updatedAt = now;

//   db.history.push({
//     id: db.nextIds.history++,
//     requestId: row.id,
//     oldStatus: currentStatusName,
//     newStatus: targetStatus,
//     changedBy: user.id,
//     remarks: remarks || null,
//     createdAt: now,
//   });

//   db.notifications.push({
//     id: db.nextIds.notification++,
//     userId: row.requesterId,
//     requestId: row.id,
//     title: `Request ${row.requestNumber} - ${targetStatus}`,
//     message: remarks
//       ? `Your request status changed to "${targetStatus}". Remarks: ${remarks}`
//       : `Your request status changed to "${targetStatus}".`,
//     isRead: false,
//     createdAt: now,
//   });

//   saveDb();
//   return { data: hydrateRequestFull(row) };
// }

// // ---------------------------------------------------------------------------
// export async function cancelRequest(id) {
//   await delay();
//   const user = currentUser();
//   const db = getDb();
//   const row = db.requests.find((r) => r.id === Number(id));
//   if (!row) throw apiError('Request not found', 404);
//   if (row.requesterId !== user.id) throw apiError('You can only cancel your own requests', 403);
//   if (!['Submitted', 'Under Review'].includes(row.statusName)) {
//     throw apiError(`Requests in status "${row.statusName}" can no longer be cancelled`);
//   }

//   const oldStatusName = row.statusName;
//   row.statusName = 'Rejected';
//   row.updatedAt = new Date().toISOString();

//   db.history.push({
//     id: db.nextIds.history++,
//     requestId: row.id,
//     oldStatus: oldStatusName,
//     newStatus: 'Rejected',
//     changedBy: user.id,
//     remarks: 'Cancelled by requester',
//     createdAt: new Date().toISOString(),
//   });

//   saveDb();
//   return { data: { message: 'Request cancelled' } };
// }

// // ---------------------------------------------------------------------------
// function readFileAsDataUrl(file) {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onerror = () => reject(reader.error);
//     reader.onload = () => resolve(reader.result);
//     reader.readAsDataURL(file);
//   });
// }

// export async function uploadAttachment(id, file) {
//   const user = currentUser();
//   const db = getDb();
//   const row = db.requests.find((r) => r.id === Number(id));
//   if (!row) throw apiError('Request not found', 404);

//   if (file.size > 3 * 1024 * 1024) {
//     throw apiError('This mock build stores files in your browser storage - please keep uploads under 3MB.');
//   }

//   const fileUrl = await readFileAsDataUrl(file);
//   const attachment = {
//     id: db.nextIds.attachment++,
//     requestId: row.id,
//     fileName: file.name,
//     fileUrl,
//     uploadedBy: user.id,
//     uploadedDate: new Date().toISOString(),
//   };
//   db.attachments.push(attachment);
//   saveDb();

//   return { data: { ...attachment, uploader: { id: user.id, fullName: user.fullName } } };
// }

// export function attachmentDownloadUrl(requestId, attachmentId) {
//   const db = getDb();
//   const attachment = db.attachments.find((a) => a.id === Number(attachmentId) && a.requestId === Number(requestId));
//   return attachment ? attachment.fileUrl : '#';
// }

// // ---------------------------------------------------------------------------
// export async function downloadExcelTemplate() {
//   await delay(100);
//   return { data: buildTemplateBlob() };
// }

// export async function parseExcelUpload(file) {
//   await delay(300);
//   const { drivers, errors } = await parseDriverExcelFile(file);
//   return { data: { drivers, errors, valid: errors.length === 0, totalRows: drivers.length } };
// }

// export async function exportRequestDrivers(id) {
//   await delay(100);
//   const db = getDb();
//   const drivers = db.drivers.filter((d) => d.requestId === Number(id));
//   return { data: buildDriversExportBlob(drivers) };
// }
// Mock implementation of the requests API. Same exported function names and
// call signatures as the full-stack version (see backend/src/controllers/
// requestController.js for the logic this mirrors) so every page/component
// works unchanged - only this file (and its siblings in src/api/) will need
// to be swapped out for real axios calls once the backend is wired up.
import { getDb, saveDb, delay } from '../mock/db.js';
import { getSessionUser } from '../mock/session.js';
import { hydrateRequestSummary, hydrateRequestFull, findUser } from '../mock/hydrate.js';
import { isTransitionAllowed, isRemarksRequired, OPERATIONS_PROFILE_FIELDS, driverProfileMissingFields } from '../mock/workflow.js';
import { validateDriverRow } from '../utils/validators.js';
import { generateRequestNumber } from '../mock/requestNumber.js';
import { buildTemplateBlob, parseDriverExcelFile, buildDriversExportBlob } from '../mock/excel.js';

function apiError(message, status = 400, extra = {}) {
  const error = new Error(message);
  error.response = { status, data: { message, ...extra } };
  return error;
}

function currentUser() {
  const user = getSessionUser();
  if (!user) throw apiError('Not authenticated', 401);
  return user;
}

function isOperationsRole(roleName) {
  return roleName === 'Operations' || roleName === 'Admin';
}

// Any internal staff role that can see every request (as opposed to
// requesters, who only see their own).
function isStaffRole(roleName) {
  return roleName === 'Processor' || roleName === 'Operations' || roleName === 'Admin';
}

function validateDrivers(drivers, { requireUsername, requireCreateFields }) {
  const validationErrors = [];
  drivers.forEach((d, idx) => {
    const rowErrors = validateDriverRow(d, { requireUsername, requireCreateFields });
    if (rowErrors.length) validationErrors.push({ row: idx + 1, errors: rowErrors });
  });
  return validationErrors;
}

// ---------------------------------------------------------------------------
export async function getStats() {
  await delay();
  const user = currentUser();
  const db = getDb();
  const isStaff = isStaffRole(user.role);

  const rows = isStaff ? db.requests : db.requests.filter((r) => r.requesterId === user.id);
  const counts = {};
  db.requestStatuses.forEach((s) => {
    counts[s] = rows.filter((r) => r.statusName === s).length;
  });

  if (isStaff) {
    return {
      data: {
        newRequests: counts['Submitted'] || 0,
        inProgress: counts['Processing'] || 0,
        completed: counts['Completed'] || 0,
        rejected: counts['Rejected'] || 0,
        waitingApproval: (counts['Submitted'] || 0) + (counts['Under Review'] || 0),
        byStatus: counts,
      },
    };
  }

  return {
    data: {
      pending: (counts['Submitted'] || 0) + (counts['Under Review'] || 0) + (counts['Returned to Requester'] || 0),
      approved: counts['Processing'] || 0,
      rejected: counts['Rejected'] || 0,
      completed: counts['Completed'] || 0,
      byStatus: counts,
    },
  };
}

// ---------------------------------------------------------------------------
export async function listRequests(params = {}) {
  await delay();
  const user = currentUser();
  const db = getDb();
  const isStaff = isStaffRole(user.role);

  let rows = isStaff ? db.requests.slice() : db.requests.filter((r) => r.requesterId === user.id);

  if (params.status) rows = rows.filter((r) => r.statusName === params.status);
  if (params.type) rows = rows.filter((r) => r.requestTypeName === params.type);
  if (params.search) {
    const q = params.search.toLowerCase();
    rows = rows.filter(
      (r) => r.requestNumber.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q)
    );
  }

  rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = rows.length;
  const limit = params.recent ? parseInt(params.recent, 10) : parseInt(params.pageSize || 10, 10);
  const page = params.recent ? 1 : parseInt(params.page || 1, 10);
  const offset = (page - 1) * limit;
  const pageRows = rows.slice(offset, offset + limit);

  return { data: { data: pageRows.map(hydrateRequestSummary), total, page, pageSize: limit } };
}

// ---------------------------------------------------------------------------
export async function getRequest(id) {
  await delay();
  const user = currentUser();
  const db = getDb();
  const row = db.requests.find((r) => r.id === Number(id));
  if (!row) throw apiError('Request not found', 404);

  if (!isStaffRole(user.role) && row.requesterId !== user.id) {
    throw apiError('You do not have access to this request', 403);
  }

  return { data: hydrateRequestFull(row) };
}

// ---------------------------------------------------------------------------
export async function createRequest(payload) {
  await delay();
  const user = currentUser();
  const db = getDb();
  const { requestTypeName, description, businessJustification, entryMethod, drivers = [], effectiveDate } = payload;

  if (!requestTypeName || !db.requestTypes.includes(requestTypeName)) {
    throw apiError(`Unknown request type: ${requestTypeName}`);
  }

  if (!description || !businessJustification) {
    throw apiError('Description and Business Justification are required to submit');
  }
  if (!drivers.length) {
    throw apiError('At least one driver record is required to submit');
  }

  const requireUsername = requestTypeName !== 'Create Driver';
  const requireCreateFields = requestTypeName === 'Create Driver';
  const validationErrors = validateDrivers(drivers, { requireUsername, requireCreateFields });
  if (validationErrors.length) {
    throw apiError('Driver validation failed', 400, { validationErrors });
  }

  const requestId = db.nextIds.request++;
  const now = new Date().toISOString();

  const request = {
    id: requestId,
    requestNumber: generateRequestNumber(),
    requesterId: user.id,
    requestTypeName,
    statusName: 'Submitted',
    description: description || '',
    businessJustification: businessJustification || '',
    entryMethod: entryMethod || 'Manual',
    currentProcessorId: null,
    driverProfilesCompletedAt: null,
    submittedDate: now,
    completedDate: null,
    effectiveDate: effectiveDate || null,
    createdAt: now,
    updatedAt: now,
  };
  db.requests.push(request);

  drivers.forEach((d) => {
    db.drivers.push({
      id: db.nextIds.driver++,
      requestId,
      username: d.username || '',
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone,
      role: 'Privileged User',
      //customerGroup: d.customerGroup || '',
      //driverClass: d.driverClass || '',
      //operatingHours: d.operatingHours || '',
      licenseNumber: d.licenseNumber || '',
      licenseExpiry: d.licenseExpiry || '',
      hasInsurance: d.hasInsurance || '',
      city: d.city || '',
      poNumber: d.poNumber || '',
      poExpiry: d.poExpiry || '',
      changeSummary: d.changeSummary || null,
      driverStatus: d.driverStatus || null,
    });
  });

  db.history.push({
    id: db.nextIds.history++,
    requestId,
    oldStatus: null,
    newStatus: 'Submitted',
    changedBy: user.id,
    remarks: 'Request submitted by requester',
    createdAt: now,
  });

  saveDb();
  return { data: hydrateRequestFull(request) };
}

// ---------------------------------------------------------------------------
// Operations reviews first: Start Review moves Submitted -> Under Review,
// then Approve moves it into Processing (where they complete the hidden
// driver-profile fields), or they hand back a negative outcome:
//   - Returned to Requester: non-terminal, requester can edit + resubmit.
//   - Rejected: terminal dead-end.
// Both negative outcomes require a remark explaining why.
export async function updateStatus(id, targetStatus, remarks) {
  await delay();
  const user = currentUser();
  const db = getDb();
  const row = db.requests.find((r) => r.id === Number(id));
  if (!row) throw apiError('Request not found', 404);

  const currentStatusName = row.statusName;
  if (!isTransitionAllowed(currentStatusName, targetStatus, user.role)) {
    throw apiError(`Cannot move request from "${currentStatusName}" to "${targetStatus}" as ${user.role}`);
  }

  if (isRemarksRequired(targetStatus) && !(remarks || '').trim()) {
    throw apiError('Please provide a comment explaining this decision');
  }

  const now = new Date().toISOString();
  const isStaff = isStaffRole(user.role);

  row.statusName = targetStatus;
  row.currentProcessorId = isStaff ? user.id : row.currentProcessorId;
  row.completedDate = targetStatus === 'Completed' ? now : row.completedDate;
  row.updatedAt = now;

  // Simulates AD actually creating the account once a Create Driver request
  // is fully completed - this is what makes the driver findable afterward
  // via Modify/Disable Driver's "search my completed drivers" lookup.
  if (targetStatus === 'Completed' && row.requestTypeName === 'Create Driver') {
    db.drivers
      .filter((d) => d.requestId === row.id && !d.username)
      .forEach((d) => {
        d.username = `${d.firstName}.${d.lastName}@asmo.com`.toLowerCase();
      });
  }

  db.history.push({
    id: db.nextIds.history++,
    requestId: row.id,
    oldStatus: currentStatusName,
    newStatus: targetStatus,
    changedBy: user.id,
    remarks: remarks || null,
    createdAt: now,
  });

  db.notifications.push({
    id: db.nextIds.notification++,
    userId: row.requesterId,
    requestId: row.id,
    title: `Request ${row.requestNumber} - ${targetStatus}`,
    message: remarks
      ? `Your request status changed to "${targetStatus}". Remarks: ${remarks}`
      : `Your request status changed to "${targetStatus}".`,
    isRead: false,
    createdAt: now,
  });

  saveDb();
  return { data: hydrateRequestFull(row) };
}

// ---------------------------------------------------------------------------
// Operations fills in the requester-hidden profile fields (Group/Customer,
// Driver Class, Operating Hours) for one driver while the request is in
// Processing.
export async function updateDriverProfile(requestId, driverId, fields = {}) {
  await delay();
  const user = currentUser();
  const db = getDb();
  const row = db.requests.find((r) => r.id === Number(requestId));
  if (!row) throw apiError('Request not found', 404);

  if (!isOperationsRole(user.role)) {
    throw apiError('Only Operations can update driver profiles', 403);
  }
  if (row.statusName !== 'Processing') {
    throw apiError('Driver profiles can only be updated while the request is in Processing');
  }
  if (row.driverProfilesCompletedAt) {
    throw apiError('Driver profiles for this request have already been completed');
  }

  const driver = db.drivers.find((d) => d.id === Number(driverId) && d.requestId === row.id);
  if (!driver) throw apiError('Driver not found on this request', 404);

  OPERATIONS_PROFILE_FIELDS.forEach(({ key }) => {
    if (key in fields) driver[key] = (fields[key] || '').trim();
  });
  row.updatedAt = new Date().toISOString();

  saveDb();
  return { data: hydrateRequestFull(row) };
}

// ---------------------------------------------------------------------------
// "Complete Driver Profiles": validates that every driver on the request has
// all three Operations fields filled in, then marks the Operations phase as
// finished. The workflow deliberately stops here - the request stays in
// Processing. A future sprint will hook routing to the AD Team / secondary
// processors onto this point, which is why it only stamps
// driverProfilesCompletedAt instead of moving the status.
export async function completeDriverProfiles(requestId) {
  await delay();
  const user = currentUser();
  const db = getDb();
  const row = db.requests.find((r) => r.id === Number(requestId));
  if (!row) throw apiError('Request not found', 404);

  if (!isOperationsRole(user.role)) {
    throw apiError('Only Operations can complete driver profiles', 403);
  }
  if (row.statusName !== 'Processing') {
    throw apiError('Driver profiles can only be completed while the request is in Processing');
  }
  if (row.driverProfilesCompletedAt) {
    throw apiError('Driver profiles for this request have already been completed');
  }

  const drivers = db.drivers.filter((d) => d.requestId === row.id);
  const validationErrors = drivers
    .map((d) => ({ driver: d, missing: driverProfileMissingFields(d) }))
    .filter((entry) => entry.missing.length)
    .map(({ driver, missing }) => ({
      driverId: driver.id,
      driverName: `${driver.firstName} ${driver.lastName}`,
      missing,
    }));

  if (validationErrors.length) {
    throw apiError(
      'Group / Customer, Driver Class and Operating Hours must be filled in for every driver before completing',
      400,
      { validationErrors }
    );
  }

  const now = new Date().toISOString();
  row.driverProfilesCompletedAt = now;
  row.updatedAt = now;

  // oldStatus null renders this as a plain "Processing" milestone in the
  // timeline (the status doesn't actually change).
  db.history.push({
    id: db.nextIds.history++,
    requestId: row.id,
    oldStatus: null,
    newStatus: 'Processing',
    changedBy: user.id,
    remarks: 'Driver profiles completed by Operations.',
    createdAt: now,
  });

  saveDb();
  return { data: hydrateRequestFull(row) };
}

// ---------------------------------------------------------------------------
// Requester edits and resubmits a request Operations sent back for
// correction. Only the original requester can call this, and only while the
// request is in "Returned to Requester" - it re-runs the same validation as
// createRequest and moves the request back into the Submitted queue.
export async function resubmitRequest(id, payload) {
  await delay();
  const user = currentUser();
  const db = getDb();
  const row = db.requests.find((r) => r.id === Number(id));
  if (!row) throw apiError('Request not found', 404);

  if (row.requesterId !== user.id) {
    throw apiError('You can only resubmit your own requests', 403);
  }
  if (row.statusName !== 'Returned to Requester') {
    throw apiError(`Cannot resubmit a request in status "${row.statusName}"`);
  }

  const { description, businessJustification, drivers = [], effectiveDate } = payload;
  if (!description || !businessJustification) {
    throw apiError('Description and Business Justification are required to submit');
  }
  if (!drivers.length) {
    throw apiError('At least one driver record is required to submit');
  }

  const requireUsername = row.requestTypeName !== 'Create Driver';
  const requireCreateFields = row.requestTypeName === 'Create Driver';
  const validationErrors = validateDrivers(drivers, { requireUsername, requireCreateFields });
  if (validationErrors.length) {
    throw apiError('Driver validation failed', 400, { validationErrors });
  }

  const now = new Date().toISOString();
  const oldStatusName = row.statusName;

  row.description = description;
  row.businessJustification = businessJustification;
  row.effectiveDate = effectiveDate || null;
  row.statusName = 'Submitted';
  row.currentProcessorId = null;
  row.driverProfilesCompletedAt = null;
  row.updatedAt = now;

  db.drivers = db.drivers.filter((d) => d.requestId !== row.id);
  drivers.forEach((d) => {
    db.drivers.push({
      id: db.nextIds.driver++,
      requestId: row.id,
      username: d.username || '',
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone,
      role: 'Privileged User',
      //customerGroup: d.customerGroup || '',
      //driverClass: d.driverClass || '',
      //operatingHours: d.operatingHours || '',
      licenseNumber: d.licenseNumber || '',
      licenseExpiry: d.licenseExpiry || '',
      hasInsurance: d.hasInsurance || '',
      city: d.city || '',
      poNumber: d.poNumber || '',
      poExpiry: d.poExpiry || '',
      changeSummary: d.changeSummary || null,
      driverStatus: d.driverStatus || null,
    });
  });

  db.history.push({
    id: db.nextIds.history++,
    requestId: row.id,
    oldStatus: oldStatusName,
    newStatus: 'Submitted',
    changedBy: user.id,
    remarks: 'Resubmitted by requester',
    createdAt: now,
  });

  saveDb();
  return { data: hydrateRequestFull(row) };
}

// ---------------------------------------------------------------------------
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

export async function uploadAttachment(id, file, meta = {}) {
  const user = currentUser();
  const db = getDb();
  const row = db.requests.find((r) => r.id === Number(id));
  if (!row) throw apiError('Request not found', 404);

  if (file.size > 3 * 1024 * 1024) {
    throw apiError('This mock build stores files in your browser storage - please keep uploads under 3MB.');
  }

  const fileUrl = await readFileAsDataUrl(file);
  const attachment = {
    id: db.nextIds.attachment++,
    requestId: row.id,
    fileName: file.name,
    fileUrl,
    uploadedBy: user.id,
    uploadedDate: new Date().toISOString(),
    driverIndex: meta.driverIndex ?? null,
    docType: meta.docType || null,
  };
  db.attachments.push(attachment);
  saveDb();

  return { data: { ...attachment, uploader: { id: user.id, fullName: user.fullName } } };
}

// Opens the attachment inline in a new browser tab (PDFs and images render
// in the built-in viewer). Browsers refuse to open data: URLs as top-level
// pages, so the stored data URL is converted to a Blob object URL first.
export async function previewAttachment(requestId, attachmentId) {
  const db = getDb();
  const attachment = db.attachments.find((a) => a.id === Number(attachmentId) && a.requestId === Number(requestId));
  if (!attachment) throw apiError('Attachment not found', 404);

  // Open the tab synchronously while the click's user activation is still
  // valid (popup blockers reject window.open after an await), then point it
  // at the blob once it's ready.
  const win = window.open('', '_blank');
  const blob = await (await fetch(attachment.fileUrl)).blob();
  const objectUrl = URL.createObjectURL(blob);
  if (win) {
    win.location = objectUrl;
  } else {
    window.open(objectUrl, '_blank');
  }
  // Give the new tab time to load the blob before releasing it.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

// Attachments are stored as base64 data URLs in this mock build, so
// "downloading" just means triggering a save from that data URL directly -
// no network fetch needed (unlike a real backend, which streams the file).
export async function downloadAttachment(requestId, attachmentId, fileName) {
  const db = getDb();
  const attachment = db.attachments.find((a) => a.id === Number(attachmentId) && a.requestId === Number(requestId));
  if (!attachment) throw apiError('Attachment not found', 404);

  const link = document.createElement('a');
  link.href = attachment.fileUrl;
  link.download = fileName || attachment.fileName || 'download';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// ---------------------------------------------------------------------------
export async function downloadExcelTemplate() {
  await delay(100);
  return { data: await buildTemplateBlob() };
}

export async function parseExcelUpload(file) {
  await delay(300);
  const { drivers, errors } = await parseDriverExcelFile(file);
  return { data: { drivers, errors, valid: errors.length === 0, totalRows: drivers.length } };
}

export async function exportRequestDrivers(id) {
  await delay(100);
  const db = getDb();
  const drivers = db.drivers.filter((d) => d.requestId === Number(id));
  return { data: buildDriversExportBlob(drivers) };
}