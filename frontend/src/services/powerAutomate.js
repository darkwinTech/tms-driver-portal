// Placeholder integration point for the Power Automate RPA flow.
//
// The application never sends emails itself. When the AD Team clicks
// "Approve & Trigger RPA", this module is called with the fully-hydrated
// request; it POSTs a JSON payload to a Power Automate HTTP-trigger flow,
// and Power Automate owns generating and sending the handoff email (the
// email template and recipients are defined inside the flow, not here).
//
// To connect the real flow later:
//   1. Create a Power Automate flow with the "When an HTTP request is
//      received" trigger.
//   2. Put its HTTP POST URL in a .env file as VITE_POWER_AUTOMATE_FLOW_URL
//      (or paste it directly into POWER_AUTOMATE_FLOW_URL below).
//   3. Map the payload fields (see buildRpaPayload) inside the flow to the
//      email template.
//
// Until a URL is configured, the trigger is simulated: the payload is
// logged to the console and the workflow proceeds as if the flow ran.

const POWER_AUTOMATE_FLOW_URL = import.meta.env.VITE_POWER_AUTOMATE_FLOW_URL || '';

// Shapes the request data Power Automate needs to build the handoff email.
export function buildRpaPayload(request) {
  return {
    requestNumber: request.requestNumber,
    requestType: request.requestType?.name,
    requester: {
      fullName: request.requester?.fullName,
      email: request.requester?.email,
      department: request.requester?.department,
    },
    description: request.description,
    businessJustification: request.businessJustification,
    effectiveDate: request.effectiveDate || null,
    submittedDate: request.submittedDate,
    drivers: (request.drivers || []).map((d) => ({
      username: d.username,
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone,
      role: d.role,
      customerGroup: d.customerGroup,
      driverClass: d.driverClass,
      operatingHours: d.operatingHours,
      licenseNumber: d.licenseNumber || '',
      licenseExpiry: d.licenseExpiry || '',
      hasInsurance: d.hasInsurance || '',
      city: d.city || '',
      poNumber: d.poNumber,
      poExpiry: d.poExpiry,
      changeSummary: d.changeSummary || null,
      driverStatus: d.driverStatus || null,
    })),
    triggeredAt: new Date().toISOString(),
  };
}

export async function triggerRpaFlow(request) {
  const payload = buildRpaPayload(request);

  if (!POWER_AUTOMATE_FLOW_URL) {
    console.info('[Power Automate] No flow URL configured - simulating RPA trigger with payload:', payload);
    return { simulated: true, payload };
  }

  const response = await fetch(POWER_AUTOMATE_FLOW_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Power Automate trigger failed with status ${response.status}`);
  }
  return { simulated: false, payload };
}
