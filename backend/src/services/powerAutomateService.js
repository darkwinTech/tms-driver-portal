import { config } from '../config/env.js';

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

  if (!config.powerAutomateFlowUrl) {
    console.info('[Power Automate] No flow URL configured - simulating RPA trigger with payload:', payload);
    return { simulated: true, payload };
  }

  const response = await fetch(config.powerAutomateFlowUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Power Automate trigger failed with status ${response.status}`);
  }
  return { simulated: false, payload };
}
