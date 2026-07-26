import { driverRepository, requestRepository } from '../data/index.js';
export async function myCompletedDrivers(req, res) {
  const requests = await requestRepository.findAll(
    (r) => r.requestTypeName === 'Create Driver' && r.requesterId === req.user.id && r.statusName === 'Completed'
  );
  const requestIds = new Set(requests.map((r) => r.id));
  const drivers = (await driverRepository.findAll())
    .filter((d) => requestIds.has(d.requestId) && d.username && d.driverStatus !== 'Disabled')
    .map((d) => ({ ...d, status: 'Active' }));
  res.json(drivers);
}


 