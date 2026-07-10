// Mock implementation of the requests API. Same exported function names and
// call signatures as the full-stack version (see backend/src/controllers/
// requestController.js for the logic this mirrors) so every page/component
// works unchanged - only this file (and its siblings in src/api/) will need
// to be swapped out for real axios calls once the backend is wired up.
import { getDb, saveDb, delay } from '../mock/db.js';
import { getSessionUser } from '../mock/session.js';
import { hydrateRequestSummary, hydrateRequestFull, findUser } from '../mock/hydrate.js';
import { isTransitionAllowed } from '../mock/workflow.js';
import { validateDriverRow } from '../mock/validators.js';
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

function isProcessorRole(roleName) {
  return roleName === 'Processor' || roleName === 'Admin';
}

// ---------------------------------------------------------------------------
export async function getStats() {
  await delay();
  const user = currentUser();
  const db = getDb();
  const isProcessor = isProcessorRole(user.role);

  const rows = isProcessor ? db.requests : db.requests.filter((r) => r.requesterId === user.id);
  const counts = {};
  db.requestStatuses.forEach((s) => {
    counts[s] = rows.filter((r) => r.statusName === s).length;
  });

  if (isProcessor) {
    return {
      data: {
        newRequests: counts['Submitted'] || 0,
        inProgress: (counts['Processing'] || 0) + (counts['Approved'] || 0),
        completed: counts['Completed'] || 0,
        rejected: counts['Rejected'] || 0,
        waitingApproval: (counts['Submitted'] || 0) + (counts['Under Review'] || 0),
        byStatus: counts,
      },
    };
  }

  return {
    data: {
      pending: (counts['Submitted'] || 0) + (counts['Under Review'] || 0),
      approved: (counts['Approved'] || 0) + (counts['Processing'] || 0),
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
  const isProcessor = isProcessorRole(user.role);

  let rows = isProcessor ? db.requests.slice() : db.requests.filter((r) => r.requesterId === user.id);

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

  const isProcessor = isProcessorRole(user.role);
  if (!isProcessor && row.requesterId !== user.id) {
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
  const validationErrors = [];
  const requireUsername = requestTypeName !== 'Create Driver';
  drivers.forEach((d, idx) => {
    const rowErrors = validateDriverRow(d, { requireUsername });
    if (rowErrors.length) validationErrors.push({ row: idx + 1, errors: rowErrors });
  });
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
      customerGroup: d.customerGroup || '',
      driverClass: d.driverClass || '',
      operatingHours: d.operatingHours || '',
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

  const now = new Date().toISOString();
  const isProcessor = isProcessorRole(user.role);

  row.statusName = targetStatus;
  row.currentProcessorId = isProcessor ? user.id : row.currentProcessorId;
  row.completedDate = targetStatus === 'Completed' ? now : row.completedDate;
  row.updatedAt = now;

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
export async function cancelRequest(id) {
  await delay();
  const user = currentUser();
  const db = getDb();
  const row = db.requests.find((r) => r.id === Number(id));
  if (!row) throw apiError('Request not found', 404);
  if (row.requesterId !== user.id) throw apiError('You can only cancel your own requests', 403);
  if (!['Submitted', 'Under Review'].includes(row.statusName)) {
    throw apiError(`Requests in status "${row.statusName}" can no longer be cancelled`);
  }

  const oldStatusName = row.statusName;
  row.statusName = 'Rejected';
  row.updatedAt = new Date().toISOString();

  db.history.push({
    id: db.nextIds.history++,
    requestId: row.id,
    oldStatus: oldStatusName,
    newStatus: 'Rejected',
    changedBy: user.id,
    remarks: 'Cancelled by requester',
    createdAt: new Date().toISOString(),
  });

  saveDb();
  return { data: { message: 'Request cancelled' } };
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

export async function uploadAttachment(id, file) {
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
  };
  db.attachments.push(attachment);
  saveDb();

  return { data: { ...attachment, uploader: { id: user.id, fullName: user.fullName } } };
}

export function attachmentDownloadUrl(requestId, attachmentId) {
  const db = getDb();
  const attachment = db.attachments.find((a) => a.id === Number(attachmentId) && a.requestId === Number(requestId));
  return attachment ? attachment.fileUrl : '#';
}

// ---------------------------------------------------------------------------
export async function downloadExcelTemplate() {
  await delay(100);
  return { data: buildTemplateBlob() };
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
