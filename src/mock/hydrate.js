import { getDb } from './db.js';

function userSummary(user) {
  if (!user) return null;
  return { id: user.id, fullName: user.fullName, email: user.email, department: user.department };
}

export function findUser(id) {
  return getDb().users.find((u) => u.id === id) || null;
}

// Lightweight shape used in list views (dashboard "recent requests", queue table, reports)
export function hydrateRequestSummary(reqRow) {
  const db = getDb();
  return {
    ...reqRow,
    requester: userSummary(findUser(reqRow.requesterId)),
    currentProcessor: userSummary(findUser(reqRow.currentProcessorId)),
    requestType: { name: reqRow.requestTypeName },
    status: { name: reqRow.statusName },
    drivers: db.drivers.filter((d) => d.requestId === reqRow.id).map((d) => ({ id: d.id })),
  };
}

// Full shape used on Request Details / Process Request pages
export function hydrateRequestFull(reqRow) {
  const db = getDb();

  const drivers = db.drivers.filter((d) => d.requestId === reqRow.id);

  const attachments = db.attachments
    .filter((a) => a.requestId === reqRow.id)
    .map((a) => ({ ...a, uploader: userSummary(findUser(a.uploadedBy)) }));

  const history = db.history
    .filter((h) => h.requestId === reqRow.id)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((h) => ({ ...h, actor: userSummary(findUser(h.changedBy)) }));

  return {
    ...reqRow,
    requester: userSummary(findUser(reqRow.requesterId)),
    currentProcessor: userSummary(findUser(reqRow.currentProcessorId)),
    requestType: { name: reqRow.requestTypeName },
    status: { name: reqRow.statusName },
    drivers,
    attachments,
    history,
  };
}
