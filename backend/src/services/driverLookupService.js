import { driverRepository, requestRepository } from '../data/index.js';

export async function findOriginalDriver(username) {
  if (!username) return null;

  const [drivers, requests] = await Promise.all([driverRepository.findAll(), requestRepository.findAll()]);
  const createDriverRequestIds = new Set(
    requests.filter((r) => r.requestTypeName === 'Create Driver').map((r) => r.id)
  );

  return drivers.find((d) => d.username === username && createDriverRequestIds.has(d.requestId)) || null;
}
