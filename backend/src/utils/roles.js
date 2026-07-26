export function isOperationsRole(roleName) {
  return roleName === 'Operations' || roleName === 'Admin';
}

export function isAdTeamRole(roleName) {
  return roleName === 'AD Team' || roleName === 'Admin';
}

export function isStaffRole(roleName) {
  return roleName === 'Processor' || roleName === 'Operations' || roleName === 'AD Team' || roleName === 'Admin';
}
