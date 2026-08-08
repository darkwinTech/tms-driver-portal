
import { userRepository, driverRepository, attachmentRepository, historyRepository } from '../data/index.js';

function userSummary(user) {
  if (!user) return null;
  return { id: user.id, fullName: user.fullName, email: user.email, department: user.department };
}

export async function hydrateRequestSummary(reqRow) {
  const [requester, currentProcessor, drivers] = await Promise.all([
    userRepository.findById(reqRow.requesterId),
    userRepository.findById(reqRow.currentProcessorId),
    driverRepository.findByRequestId(reqRow.id),
  ]);

  return {
    ...reqRow,
    requester: userSummary(requester),
    currentProcessor: userSummary(currentProcessor),
    requestType: { name: reqRow.requestTypeName },
    status: { name: reqRow.statusName },
    drivers: drivers.map((d) => ({ id: d.id })),
  };
}

export async function hydrateRequestFull(reqRow) {
  const [requester, currentProcessor, adCompletedByUser, drivers, attachmentRows, historyRows] = await Promise.all([
    userRepository.findById(reqRow.requesterId),
    userRepository.findById(reqRow.currentProcessorId),
    userRepository.findById(reqRow.adCompletedBy),
    driverRepository.findByRequestId(reqRow.id),
    attachmentRepository.findByRequestId(reqRow.id),
    historyRepository.findByRequestId(reqRow.id),
  ]);

  const attachments = await Promise.all(
    attachmentRows.map(async ({ fileData, ...a }) => ({
      ...a,
      uploader: userSummary(await userRepository.findById(a.uploadedBy)),
    }))
  );

  const history = await Promise.all(
    historyRows
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(async (h) => ({ ...h, actor: userSummary(await userRepository.findById(h.changedBy)) }))
  );

  return {
    ...reqRow,
    requester: userSummary(requester),
    currentProcessor: userSummary(currentProcessor),
    adCompletedByUser: userSummary(adCompletedByUser),
    requestType: { name: reqRow.requestTypeName },
    status: { name: reqRow.statusName },
    drivers,
    attachments,
    history,
  };
}

