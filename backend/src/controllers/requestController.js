import path from 'node:path';
import mime from 'mime-types';
import { ApiError } from '../utils/ApiError.js';
import {
  requestRepository,
  driverRepository,
  historyRepository,
  attachmentRepository,
  notificationRepository,
} from '../data/index.js';
import { hydrateRequestSummary, hydrateRequestFull } from '../utils/hydrate.js';
import {
  isTransitionAllowed,
  isDedicatedEndpointOnly,
  isRemarksRequired,
  OPERATIONS_PROFILE_FIELDS,
  driverProfileMissingFields,
} from '../utils/workflow.js';
import { isStaffRole } from '../utils/roles.js';
import { validateDriverRow } from '../utils/validators.js';
import { generateRequestNumber } from '../utils/requestNumber.js';
import { findOriginalDriver } from '../services/driverLookupService.js';
import { triggerRpaFlow } from '../services/powerAutomateService.js';
import {
  buildTemplateBuffer,
  parseDriverExcelBuffer,
  buildDriversExportBuffer,
  EXCEL_MIME_TYPE,
} from '../services/excelService.js';
// Statuses that mean the request currently sits with the AD Team. RPA
// trigger now happens as a side effect of the Operations transition into
// this status, so there's no separate "RPA Triggered" waiting state anymore.
const AD_STAGE_STATUSES = ['AD Team Review'];
// A request is visible to the AD Team once it has reached their stage -
// either it is sitting there now, or it passed through "AD Team Review" on
// its way to Completed/Rejected.
async function isAdStageVisible(row) {
  if (AD_STAGE_STATUSES.includes(row.statusName)) return true;
  if (['Completed', 'Rejected'].includes(row.statusName)) {
    const history = await historyRepository.findByRequestId(row.id);
    return history.some((h) => h.newStatus === 'AD Team Review');
  }
  return false;
}
// Shared visibility guard - owner-or-staff, plus the AD-stage check for the
// AD Team. The reference mock leaves attachment/export endpoints unguarded;
// this closes that gap by reusing the same check everywhere a request (or
// something belonging to it) is read.
async function assertRequestVisible(user, row) {
  if (!isStaffRole(user.role) && row.requesterId !== user.id) {
    throw new ApiError('You do not have access to this request', 403);
  }
  if (user.role === 'AD Team' && !(await isAdStageVisible(row))) {
    throw new ApiError('This request has not reached the AD Team stage yet', 403);
  }
}
function validateDrivers(drivers, { requireUsername, requireCreateFields }) {
  const validationErrors = [];
  drivers.forEach((d, idx) => {
    const rowErrors = validateDriverRow(d, { requireUsername, requireCreateFields });
    if (rowErrors.length) validationErrors.push({ row: idx + 1, errors: rowErrors });
  });
  return validationErrors;
}
function toDriverRecord(requestId, d) {
  return {
    requestId,
    username: d.username || '',
    firstName: d.firstName,
    lastName: d.lastName,
    email: d.email,
    phone: d.phone,
    role: 'Privileged User',
    licenseNumber: d.licenseNumber || '',
    licenseExpiry: d.licenseExpiry || '',
    IDExpiry: d.IDExpiry || '',
    hasInsurance: d.hasInsurance || '',
    city: d.city || '',
    poNumber: d.poNumber || '',
    poExpiry: d.poExpiry || '',
    changeSummary: d.changeSummary || null,
    driverStatus: d.driverStatus || null,
  };
}
async function findRequestOr404(id) {
  const row = await requestRepository.findById(id);
  if (!row) throw new ApiError('Request not found', 404);
  return row;
}
// ---------------------------------------------------------------------------
export async function getStats(req, res) {
  const user = req.user;
  const isStaff = isStaffRole(user.role);
  let rows;
  if (user.role === 'AD Team') {
    const all = await requestRepository.findAll();
    const flags = await Promise.all(all.map(isAdStageVisible));
    rows = all.filter((_, i) => flags[i]);
  } else if (isStaff) {
    rows = await requestRepository.findAll();
  } else {
    rows = await requestRepository.findAll((r) => r.requesterId === user.id);
  }
  const counts = {};
  requestRepository.getRequestStatuses().forEach((s) => {
    counts[s] = rows.filter((r) => r.statusName === s).length;
  });
  if (user.role === 'AD Team') {
    return res.json({
      awaitingAction: counts['AD Team Review'] || 0,
      completed: counts['Completed'] || 0,
      rejected: counts['Rejected'] || 0,
      byStatus: counts,
    });
  }
  if (isStaff) {
    return res.json({
      newRequests: counts['Submitted'] || 0,
      inProgress: (counts['Processing – Operations Team'] || 0) + (counts['AD Team Review'] || 0),
      completed: counts['Completed'] || 0,
      rejected: counts['Rejected'] || 0,
      waitingApproval: (counts['Submitted'] || 0) + (counts['Under Review – Operations Team'] || 0),
      byStatus: counts,
    });
  }
  res.json({
    pending: (counts['Submitted'] || 0) + (counts['Under Review – Operations Team'] || 0) + (counts['Returned to Requester'] || 0),
    approved: (counts['Processing – Operations Team'] || 0) + (counts['AD Team Review'] || 0),
    rejected: counts['Rejected'] || 0,
    completed: counts['Completed'] || 0,
    byStatus: counts,
  });
}
// ---------------------------------------------------------------------------
export async function listRequests(req, res) {
  const user = req.user;
  const { status, type, search, page, pageSize, recent } = req.query;
  const isStaff = isStaffRole(user.role);
  let rows = isStaff ? await requestRepository.findAll() : await requestRepository.findAll((r) => r.requesterId === user.id);
  if (user.role === 'AD Team') {
    const flags = await Promise.all(rows.map(isAdStageVisible));
    rows = rows.filter((_, i) => flags[i]);
  }
  if (status) rows = rows.filter((r) => r.statusName === status);
  if (type) rows = rows.filter((r) => r.requestTypeName === type);
  if (search) {
    const q = String(search).toLowerCase();
    rows = rows.filter(
      (r) => r.requestNumber.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q)
    );
  }
  rows = rows.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = rows.length;
  const limit = recent ? parseInt(recent, 10) : parseInt(pageSize || 10, 10);
  const pageNum = recent ? 1 : parseInt(page || 1, 10);
  const offset = (pageNum - 1) * limit;
  const pageRows = rows.slice(offset, offset + limit);
  res.json({
    data: await Promise.all(pageRows.map(hydrateRequestSummary)),
    total,
    page: pageNum,
    pageSize: limit,
  });
}
// ---------------------------------------------------------------------------
export async function getRequest(req, res) {
  const row = await findRequestOr404(req.params.id);
  await assertRequestVisible(req.user, row);
  res.json(await hydrateRequestFull(row));
}
// ---------------------------------------------------------------------------
export async function createRequest(req, res) {
  const user = req.user;
  const { requestTypeName, description, businessJustification, entryMethod, drivers = [], effectiveDate } = req.body;
  if (!requestTypeName || !requestRepository.getRequestTypes().includes(requestTypeName)) {
    throw new ApiError(`Unknown request type: ${requestTypeName}`);
  }
  if (!description || !businessJustification) {
    throw new ApiError('Description and Business Justification are required to submit');
  }
  if (!drivers.length) {
    throw new ApiError('At least one driver record is required to submit');
  }
  const requireUsername = requestTypeName !== 'Create Driver';
  const requireCreateFields = requestTypeName === 'Create Driver';
  const validationErrors = validateDrivers(drivers, { requireUsername, requireCreateFields });
  if (validationErrors.length) {
    throw new ApiError('Driver validation failed', 400, { validationErrors });
  }
  const now = new Date().toISOString();
  const request = await requestRepository.create({
    requestNumber: await generateRequestNumber(),
    requesterId: user.id,
    requestTypeName,
    statusName: 'Submitted',
    description,
    businessJustification,
    entryMethod: entryMethod || 'Manual',
    currentProcessorId: null,
    driverProfilesCompletedAt: null,
    rpaTriggeredAt: null,
    adCompletedAt: null,
    adCompletedBy: null,
    submittedDate: now,
    completedDate: null,
    effectiveDate: effectiveDate || null,
    createdAt: now,
    updatedAt: now,
  });
  await driverRepository.bulkCreate(drivers.map((d) => toDriverRecord(request.id, d)));
  await historyRepository.create({
    requestId: request.id,
    oldStatus: null,
    newStatus: 'Submitted',
    changedBy: user.id,
    remarks: 'Request submitted by requester',
    createdAt: now,
  });
  res.status(201).json(await hydrateRequestFull(request));
}
// ---------------------------------------------------------------------------
// Operations reviews first: Start Review moves Submitted -> Under Review,
// then Approve moves it into Processing, or they hand back a negative
// outcome (Returned to Requester / Rejected, both requiring remarks).
export async function updateStatus(req, res) {
  const user = req.user;
  const row = await findRequestOr404(req.params.id);
  const { status: targetStatus, remarks } = req.body;
  const currentStatusName = row.statusName;
  if (!isTransitionAllowed(row.requestTypeName, currentStatusName, targetStatus, user.role)) {
    throw new ApiError(`Cannot move request from "${currentStatusName}" to "${targetStatus}" as ${user.role}`);
  }
  if (isDedicatedEndpointOnly(row.requestTypeName, currentStatusName, targetStatus)) {
    throw new ApiError(`Use the dedicated endpoint to move this request from "${currentStatusName}" to "${targetStatus}"`);
  }
  if (isRemarksRequired(targetStatus) && !(remarks || '').trim()) {
    throw new ApiError('Please provide a comment explaining this decision');
  }
  const now = new Date().toISOString();
  const isStaff = isStaffRole(user.role);

  // Operations accepting a Disable Driver request now triggers RPA (an
  // email to ServiceNow, which owns everything from there) in the same
  // action that hands it to the AD Team - the AD Team no longer triggers
  // this themselves.
  let rpaFields = {};
  let historyRemarks = remarks || null;
  if (targetStatus === 'AD Team Review' && row.requestTypeName === 'Disable Driver') {
    if (row.rpaTriggeredAt) {
      throw new ApiError('RPA has already been triggered for this request');
    }
    const hydrated = await hydrateRequestFull(row);
    await triggerRpaFlow(hydrated);
    rpaFields = { rpaTriggeredAt: now };
    historyRemarks = remarks || 'Approved by Operations - forwarded to AD Team for account disablement.';
  }

  await requestRepository.update(row.id, {
    statusName: targetStatus,
    currentProcessorId: isStaff ? user.id : row.currentProcessorId,
    completedDate: targetStatus === 'Completed' ? now : row.completedDate,
    updatedAt: now,
    ...rpaFields,
  });
  // Operations accepting a Modify Driver request completes it immediately -
  // write the requested PO Number/PO Expiry change onto the driver's actual
  // record (found via the Create Driver request that produced it). Create
  // Driver / Disable Driver no longer complete via this generic endpoint -
  // see markComplete for their finalize side effects.
  if (targetStatus === 'Completed' && row.requestTypeName === 'Modify Driver') {
    const drivers = await driverRepository.findByRequestId(row.id);
    for (const d of drivers) {
      const original = await findOriginalDriver(d.username);
      if (original) {
        await driverRepository.update(original.id, { poNumber: d.poNumber, poExpiry: d.poExpiry });
      }
    }
  }
  await historyRepository.create({
    requestId: row.id,
    oldStatus: currentStatusName,
    newStatus: targetStatus,
    changedBy: user.id,
    remarks: historyRemarks,
    createdAt: now,
  });
  await notificationRepository.create({
    userId: row.requesterId,
    requestId: row.id,
    title: `Request ${row.requestNumber} - ${targetStatus}`,
    message: historyRemarks
      ? `Your request status changed to "${targetStatus}". Remarks: ${historyRemarks}`
      : `Your request status changed to "${targetStatus}".`,
    isRead: false,
    createdAt: now,
  });
  const updated = await requestRepository.findById(row.id);
  res.json(await hydrateRequestFull(updated));
}
// ---------------------------------------------------------------------------
// Operations fills in the requester-hidden profile fields for one driver
// while the request is in Processing. Role gate: requireRole('Operations').
export async function updateDriverProfile(req, res) {
  const row = await findRequestOr404(req.params.id);
  if (row.statusName !== 'Processing – Operations Team') {
    throw new ApiError('Driver profiles can only be updated while the request is in Processing');
  }
  if (row.driverProfilesCompletedAt) {
    throw new ApiError('Driver profiles for this request have already been completed');
  }
  const driver = await driverRepository.findById(req.params.driverId);
  if (!driver || driver.requestId !== row.id) {
    throw new ApiError('Driver not found on this request', 404);
  }
  const patch = {};
  OPERATIONS_PROFILE_FIELDS.forEach(({ key }) => {
    if (key in req.body) patch[key] = (req.body[key] || '').trim();
  });
  await driverRepository.update(driver.id, patch);
  await requestRepository.update(row.id, { updatedAt: new Date().toISOString() });
  const updated = await requestRepository.findById(row.id);
  res.json(await hydrateRequestFull(updated));
}
// ---------------------------------------------------------------------------
// "Complete Driver Profiles": validates every driver has all three
// Operations fields filled, then immediately triggers the RPA flow, captures
// the ServiceNow ticket, and hands the request to the AD Team with the
// ticket already created. Role gate: requireRole('Operations').
export async function completeDriverProfiles(req, res) {
  const row = await findRequestOr404(req.params.id);
  if (row.statusName !== 'Processing – Operations Team') {
    throw new ApiError('Driver profiles can only be completed while the request is in Processing');
  }
  if (row.driverProfilesCompletedAt || row.rpaTriggeredAt) {
    throw new ApiError('Driver profiles for this request have already been completed');
  }
  const drivers = await driverRepository.findByRequestId(row.id);
  const validationErrors = drivers
    .map((d) => ({ driver: d, missing: driverProfileMissingFields(d) }))
    .filter((entry) => entry.missing.length)
    .map(({ driver, missing }) => ({
      driverId: driver.id,
      driverName: `${driver.firstName} ${driver.lastName}`,
      missing,
    }));
  if (validationErrors.length) {
    throw new ApiError(
      'Group / Customer, Driver Class and Operating Hours must be filled in for every driver before completing',
      400,
      { validationErrors }
    );
  }

  const hydrated = await hydrateRequestFull(row);
  await triggerRpaFlow(hydrated);

  const now = new Date().toISOString();
  await requestRepository.update(row.id, {
    driverProfilesCompletedAt: now,
    rpaTriggeredAt: now,
    statusName: 'AD Team Review',
    currentProcessorId: null,
    updatedAt: now,
  });
  await historyRepository.create({
    requestId: row.id,
    oldStatus: 'Processing – Operations Team',
    newStatus: 'AD Team Review',
    changedBy: req.user.id,
    remarks: 'Driver profiles completed by Operations. RPA triggered. Handed over to the AD Team.',
    createdAt: now,
  });
  await notificationRepository.create({
    userId: row.requesterId,
    requestId: row.id,
    title: `Request ${row.requestNumber} - AD Team Review`,
    message: 'Your request status changed to "AD Team Review".',
    isRead: false,
    createdAt: now,
  });
  const updated = await requestRepository.findById(row.id);
  res.json(await hydrateRequestFull(updated));
}
// ---------------------------------------------------------------------------
// "Mark as Complete": the AD Team's only action once a request reaches
// "AD Team Review" - RPA + the ServiceNow ticket already happened as a side
// effect of the Operations transition that got it here. Records
// adCompletedAt/adCompletedBy and runs the finalize side effects that used
// to fire on generic Completion for these two types. No reject option at
// this stage (retired by design). Role gate: requireRole('AD Team').
export async function markComplete(req, res) {
  const row = await findRequestOr404(req.params.id);
  if (row.statusName !== 'AD Team Review') {
    throw new ApiError(`Cannot mark this request complete while it is "${row.statusName}"`);
  }
  if (!['Create Driver', 'Disable Driver'].includes(row.requestTypeName)) {
    throw new ApiError(`${row.requestTypeName} requests do not go through the AD Team`);
  }

  const now = new Date().toISOString();
  await requestRepository.update(row.id, {
    statusName: 'Completed',
    completedDate: now,
    adCompletedAt: now,
    adCompletedBy: req.user.id,
    currentProcessorId: req.user.id,
    updatedAt: now,
  });

  // Simulates AD actually creating the account once a Create Driver request
  // is fully completed - only assigns a username to drivers that don't
  // already have one.
  if (row.requestTypeName === 'Create Driver') {
    const drivers = await driverRepository.findByRequestId(row.id);
    await Promise.all(
      drivers
        .filter((d) => !d.username)
        .map((d) => driverRepository.update(d.id, { username: `${d.firstName}.${d.lastName}@asmo.com`.toLowerCase() }))
    );
  }
  // The AD Team confirming a Disable Driver request is what actually
  // disables the account.
  if (row.requestTypeName === 'Disable Driver') {
    const drivers = await driverRepository.findByRequestId(row.id);
    for (const d of drivers) {
      const original = await findOriginalDriver(d.username);
      if (original) {
        await driverRepository.update(original.id, { driverStatus: 'Disabled' });
      }
    }
  }

  const remarks = row.requestTypeName === 'Disable Driver'
    ? 'Driver account disabled by AD Team.'
    : 'Account creation confirmed by AD Team.';
  await historyRepository.create({
    requestId: row.id,
    oldStatus: 'AD Team Review',
    newStatus: 'Completed',
    changedBy: req.user.id,
    remarks,
    createdAt: now,
  });
  await notificationRepository.create({
    userId: row.requesterId,
    requestId: row.id,
    title: `Request ${row.requestNumber} - Completed`,
    message: `Your request status changed to "Completed". ${remarks}`,
    isRead: false,
    createdAt: now,
  });
  const updated = await requestRepository.findById(row.id);
  res.json(await hydrateRequestFull(updated));
}
// ---------------------------------------------------------------------------
// Requester edits and resubmits a request Operations sent back for
// correction - only while "Returned to Requester", only the original requester.
export async function resubmitRequest(req, res) {
  const user = req.user;
  const row = await findRequestOr404(req.params.id);
  if (row.requesterId !== user.id) {
    throw new ApiError('You can only resubmit your own requests', 403);
  }
  if (row.statusName !== 'Returned to Requester') {
    throw new ApiError(`Cannot resubmit a request in status "${row.statusName}"`);
  }
  const { description, businessJustification, drivers = [], effectiveDate } = req.body;
  if (!description || !businessJustification) {
    throw new ApiError('Description and Business Justification are required to submit');
  }
  if (!drivers.length) {
    throw new ApiError('At least one driver record is required to submit');
  }
  const requireUsername = row.requestTypeName !== 'Create Driver';
  const requireCreateFields = row.requestTypeName === 'Create Driver';
  const validationErrors = validateDrivers(drivers, { requireUsername, requireCreateFields });
  if (validationErrors.length) {
    throw new ApiError('Driver validation failed', 400, { validationErrors });
  }
  const now = new Date().toISOString();
  const oldStatusName = row.statusName;
  await requestRepository.update(row.id, {
    description,
    businessJustification,
    effectiveDate: effectiveDate || null,
    statusName: 'Submitted',
    currentProcessorId: null,
    driverProfilesCompletedAt: null,
    updatedAt: now,
  });
  await driverRepository.removeByRequestId(row.id);
  await driverRepository.bulkCreate(drivers.map((d) => toDriverRecord(row.id, d)));
  await historyRepository.create({
    requestId: row.id,
    oldStatus: oldStatusName,
    newStatus: 'Submitted',
    changedBy: user.id,
    remarks: 'Resubmitted by requester',
    createdAt: now,
  });
  const updated = await requestRepository.findById(row.id);
  res.json(await hydrateRequestFull(updated));
}
// ---------------------------------------------------------------------------
export async function uploadAttachment(req, res) {
  const row = await findRequestOr404(req.params.id);
  await assertRequestVisible(req.user, row);
  if (!req.file) throw new ApiError('A file is required');
  const attachment = await attachmentRepository.create({
    requestId: row.id,
    fileName: req.file.originalname,
    filePath: req.file.path,
    uploadedBy: req.user.id,
    uploadedDate: new Date().toISOString(),
    driverIndex: req.body.driverIndex !== undefined && req.body.driverIndex !== '' ? Number(req.body.driverIndex) : null,
    docType: req.body.docType || null,
  });
  res.status(201).json({ ...attachment, uploader: { id: req.user.id, fullName: req.user.fullName } });
}
async function findAttachmentOr404(requestId, attachmentId) {
  const row = await findRequestOr404(requestId);
  const attachment = await attachmentRepository.findById(attachmentId);
  if (!attachment || attachment.requestId !== row.id) {
    throw new ApiError('Attachment not found', 404);
  }
  return { row, attachment };
}
export async function previewAttachment(req, res) {
  const { row, attachment } = await findAttachmentOr404(req.params.id, req.params.attachmentId);
  await assertRequestVisible(req.user, row);
  res.setHeader('Content-Type', mime.lookup(attachment.filePath) || 'application/octet-stream');
  res.setHeader('Content-Disposition', 'inline');
  res.sendFile(path.resolve(attachment.filePath));
}
export async function downloadAttachment(req, res) {
  const { row, attachment } = await findAttachmentOr404(req.params.id, req.params.attachmentId);
  await assertRequestVisible(req.user, row);
  res.download(path.resolve(attachment.filePath), attachment.fileName);
}
// ---------------------------------------------------------------------------
export async function downloadExcelTemplate(req, res) {
  const buffer = await buildTemplateBuffer();
  res.setHeader('Content-Type', EXCEL_MIME_TYPE);
  res.setHeader('Content-Disposition', 'attachment; filename="driver_upload_template.xlsx"');
  res.send(Buffer.from(buffer));
}
export async function uploadExcel(req, res) {
  if (!req.file) throw new ApiError('A file is required');
  const { drivers, errors } = parseDriverExcelBuffer(req.file.buffer);
  res.json({ drivers, errors, valid: errors.length === 0, totalRows: drivers.length });
}
export async function exportDrivers(req, res) {
  const row = await findRequestOr404(req.params.id);
  await assertRequestVisible(req.user, row);
  const drivers = await driverRepository.findByRequestId(row.id);
  const buffer = buildDriversExportBuffer(drivers);
  res.setHeader('Content-Type', EXCEL_MIME_TYPE);
  res.setHeader('Content-Disposition', `attachment; filename="request-${row.requestNumber}-drivers.xlsx"`);
  res.send(buffer);
}
