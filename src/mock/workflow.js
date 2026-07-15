// Status-transition rules. Two distinct negative outcomes at review time:
// "Returned to Requester" is non-terminal (the requester can edit and
// resubmit), "Rejected" is a dead end used when the driver/request isn't
// wanted at all.
export const TRANSITIONS = {
  Submitted: { 'Under Review': 'Processor', 'Returned to Requester': 'Processor', Rejected: 'Processor' },
  'Under Review': { Approved: 'Processor', 'Returned to Requester': 'Processor', Rejected: 'Processor' },
  Approved: { Processing: 'Processor' },
  Processing: { Completed: 'Processor' },
};

export function isTransitionAllowed(currentStatusName, targetStatusName, roleName) {
  const allowed = TRANSITIONS[currentStatusName];
  if (!allowed || !allowed[targetStatusName]) return false;
  return allowed[targetStatusName] === roleName || roleName === 'Admin';
}

const REMARKS_REQUIRED_STATUSES = ['Returned to Requester', 'Rejected'];

export function isRemarksRequired(targetStatusName) {
  return REMARKS_REQUIRED_STATUSES.includes(targetStatusName);
}
