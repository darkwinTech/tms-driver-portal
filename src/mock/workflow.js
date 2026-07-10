// Mirrors backend/src/utils/workflow.js TRANSITIONS so the same business
// rules apply here, without a server.
export const TRANSITIONS = {
  Submitted: { 'Under Review': 'Processor', Rejected: 'Processor' },
  'Under Review': { Approved: 'Processor', Rejected: 'Processor' },
  Approved: { Processing: 'Processor' },
  Processing: { Completed: 'Processor' },
};

export function isTransitionAllowed(currentStatusName, targetStatusName, roleName) {
  const allowed = TRANSITIONS[currentStatusName];
  if (!allowed || !allowed[targetStatusName]) return false;
  return allowed[targetStatusName] === roleName || roleName === 'Admin';
}
