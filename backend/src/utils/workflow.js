// Status-transition rules, ported verbatim from frontend/src/mock/workflow.js.
// Each request type has its own path since Operations acts on them differently:
//
// - Create Driver: Operations is the first review stage. Two distinct
//   negative outcomes at review time: "Returned to Requester" is
//   non-terminal (the requester can edit and resubmit - resubmission resets
//   the status to Submitted), while "Rejected" is a terminal dead end.
//   "Processing – Operations Team" is where Operations completes the hidden
//   driver-profile fields (Group/Customer, Driver Class, Operating Hours).
//   Completing the profiles ("Complete Driver Profiles") now ALSO triggers
//   the Power Automate RPA flow (an email to ServiceNow) immediately, then
//   hands the request over to the AD Team ("AD Team Review"). The AD
//   Team's only remaining action is to confirm the external AD work is
//   done ("Mark as Complete") - they no longer trigger RPA and no longer
//   have a reject option at this stage.
//
// - Modify Driver: there's no account action to perform, so Operations
//   decides directly from Submitted - Accept completes the request
//   immediately (and writes the change onto the driver's record), Reject is
//   terminal. The AD Team is never involved. Unaffected by the RPA-trigger
//   timing change above.
//
// - Disable Driver: Operations decides directly from Submitted too, but
//   Accept doesn't complete the request - it now triggers RPA AND hands off
//   to the AD Team ("AD Team Review") in the same action, since disabling
//   the account is their job. The AD Team then confirms with "Mark as
//   Complete", same as Create Driver.
const CREATE_TRANSITIONS = {
  Submitted: { 'Under Review – Operations Team': 'Operations' },
  'Under Review – Operations Team': { 'Processing – Operations Team': 'Operations', 'Returned to Requester': 'Operations', Rejected: 'Operations' },
  'Processing – Operations Team': { 'AD Team Review': 'Operations' },
  'AD Team Review': { Completed: 'AD Team' },
};

const MODIFY_TRANSITIONS = {
  Submitted: { Completed: 'Operations', Rejected: 'Operations' },
};

const DISABLE_TRANSITIONS = {
  Submitted: { 'AD Team Review': 'Operations', Rejected: 'Operations' },
  'AD Team Review': { Completed: 'AD Team' },
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

// Transitions that are structurally valid per isTransitionAllowed but carry
// side effects (RPA trigger, or AD-completion finalize logic) that only a
// dedicated endpoint may perform - the generic PATCH /:id/status handler
// must refuse these even though the role/status check above would
// otherwise allow them.
export function isDedicatedEndpointOnly(requestTypeName, currentStatusName, targetStatusName) {
  if (requestTypeName === 'Create Driver' && currentStatusName === 'Processing – Operations Team' && targetStatusName === 'AD Team Review') {
    return true; // must go through completeDriverProfiles
  }
  if (
    (requestTypeName === 'Create Driver' || requestTypeName === 'Disable Driver') &&
    currentStatusName === 'AD Team Review' &&
    targetStatusName === 'Completed'
  ) {
    return true; // must go through markComplete
  }
  return false;
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
