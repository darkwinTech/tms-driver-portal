import { driverRepository, requestRepository } from '../data/index.js';

export async function findOriginalDriver(username) {
  if (!username) return null;

  const [drivers, requests] = await Promise.all([driverRepository.findAll(), requestRepository.findAll()]);
  const createDriverRequestIds = new Set(
    requests.filter((r) => r.requestTypeName === 'Create Driver').map((r) => r.id)
  );

  return drivers.find((d) => d.username === username && createDriverRequestIds.has(d.requestId)) || null;
}

// System-wide License/ID/IQAMA uniqueness check. Excludes drivers whose
// request was Rejected - a rejected request never produced a real account,
// so the same real-world ID must be resubmittable. excludeRequestId lets a
// resubmit compare against everyone else without colliding with its own
// (about-to-be-replaced) driver rows.
export async function findActiveDriversByLicenseNumber(licenseNumber, { excludeRequestId } = {}) {
  const matches = await driverRepository.findAll((d) => d.licenseNumber === licenseNumber);
  const active = [];
  for (const driver of matches) {
    if (excludeRequestId && driver.requestId === excludeRequestId) continue;
    const request = await requestRepository.findById(driver.requestId);
    if (request?.statusName === 'Rejected') continue;
    active.push(driver);
  }
  return active;
}
