// Status-transition rules. Operations is the first review stage: every
// submitted request lands in their queue. Two distinct negative outcomes at
// review time: "Returned to Requester" is non-terminal (the requester can
// edit and resubmit - resubmission resets the status to Submitted), while
// "Rejected" is a terminal dead end.
//
// "Processing" is where Operations completes the hidden driver-profile
// fields (Group/Customer, Driver Class, Operating Hours). Completing the
// profiles hands the request over to the AD Team ("AD Team Review"). The AD
// Team then either rejects (with a mandatory reason) or approves - approval
// triggers the Power Automate RPA flow ("RPA Triggered", the flow sends the
// handoff email; account creation itself happens outside this app). Once
// the AD Team confirms the external account creation succeeded, they
// manually mark the request "Completed".
export const TRANSITIONS = {
  Submitted: { 'Under Review': 'Operations' },
  'Under Review': { Processing: 'Operations', 'Returned to Requester': 'Operations', Rejected: 'Operations' },
  Processing: { 'AD Team Review': 'Operations' },
  'AD Team Review': { 'RPA Triggered': 'AD Team', Rejected: 'AD Team' },
  'RPA Triggered': { Completed: 'AD Team' },
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
