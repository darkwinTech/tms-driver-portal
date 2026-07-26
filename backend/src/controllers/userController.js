import { userRepository } from '../data/index.js';
export async function listUsers(req, res) {
  const { role } = req.query;
  const rows = await userRepository.findAll(role ? (u) => u.role === role : undefined);
  const shaped = rows
    .map((u) => ({ id: u.id, fullName: u.fullName, email: u.email, department: u.department, managerId: u.managerId }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
  res.json(shaped);
}