// Status-transition rules, ported verbatim from frontend/src/mock/workflow.js.
// Each request type has its own path since Operations acts on them differently:
//
// - Create Driver: Operations is the first review stage. Two distinct
//   negative outcomes at review time: "Returned to Requester" is
//   non-terminal (the requester can edit and resubmit - resubmission resets
//   the status to Submitted), while "Rejected" is a terminal dead end.
//   "Processing" is where Operations completes the hidden driver-profile
//   fields (Group/Customer, Driver Class, Operating Hours). Completing the
//   profiles hands the request over to the AD Team ("AD Team Review"). The
//   AD Team then either rejects (with a mandatory reason) or approves -
//   approval triggers the Power Automate RPA flow ("RPA Triggered", the flow
//   sends the handoff email; account creation itself happens outside this
//   app). Once the AD Team confirms the external account creation
//   succeeded, they manually mark the request "Completed".
//
// - Modify Driver: there's no account action to perform, so Operations
//   decides directly from Submitted - Accept completes the request
//   immediately (and writes the change onto the driver's record), Reject is
//   terminal. The AD Team is never involved.
//
// - Disable Driver: Operations decides directly from Submitted too, but
//   Accept doesn't complete the request - it hands off to the AD Team
//   ("AD Team Review"), since disabling the account is their job, same
//   handoff pattern as Create Driver (RPA Triggered -> Completed).
const CREATE_TRANSITIONS = {
  Submitted: { 'Under Review': 'Operations' },
  'Under Review': { Processing: 'Operations', 'Returned to Requester': 'Operations', Rejected: 'Operations' },
  Processing: { 'AD Team Review': 'Operations' },
  'AD Team Review': { 'RPA Triggered': 'AD Team', Rejected: 'AD Team' },
  'RPA Triggered': { Completed: 'AD Team' },
};

const MODIFY_TRANSITIONS = {
  Submitted: { Completed: 'Operations', Rejected: 'Operations' },
};

const DISABLE_TRANSITIONS = {
  Submitted: { 'AD Team Review': 'Operations', Rejected: 'Operations' },
  'AD Team Review': { 'RPA Triggered': 'AD Team', Rejected: 'AD Team' },
  'RPA Triggered': { Completed: 'AD Team' },
};

function getTransitions(requestTypeName) {
  if (requestTypeName === 'Modify Driver') return MODIFY_TRANSITIONS;
  if (requestTypeName === 'Disable Driver') return DISABLE_TRANSITIONS;
  return CREATE_TRANSITIONS;
}

export function isTransitionAllowed(requestTypeName, currentStatusName, targetStatusName, roleName) {
  const allowed = getTransitions(requestTypeName)[currentStatusName];
  if (!allowed || !allowed[targetStatusName]) return false;
  return allowed[targetStatusName] === roleName || roleName === 'Admin';
}

const REMARKS_REQUIRED_STATUSES = ['Returned to Requester', 'Rejected'];

export function isRemarksRequired(targetStatusName) {
  return REMARKS_REQUIRED_STATUSES.includes(targetStatusName);
}

// Fields Operations must fill in for every driver during the Processing
// stage before the request can leave their hands. Hidden from requesters.
export const OPERATIONS_PROFILE_FIELDS = [
  { key: 'customerGroup', label: 'Group / Customer' },
  { key: 'driverClass', label: 'Driver Class' },
  { key: 'operatingHours', label: 'Operating Hours' },
];

export function driverProfileMissingFields(driver) {
  return OPERATIONS_PROFILE_FIELDS.filter((f) => !(driver[f.key] || '').trim()).map((f) => f.label);
}
