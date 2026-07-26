// SQL Server queries once the database is wired up. Every repository in
// data/repositories/*.js reads/writes through this module only.
import bcrypt from 'bcryptjs';
import { buildSeed, DEMO_PASSWORD } from './seed.js';

export const store = buildSeed();

// All seeded demo accounts share the same password in this placeholder
// dataset - hashed once at boot so auth still goes through a real bcrypt
store.users.forEach((user) => {
  user.passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);
});

export function nextId(entity) {
  return store.nextIds[entity]++;
}


