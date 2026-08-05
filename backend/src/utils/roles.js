export function isOperationsRole(roleName) {
  return roleName === 'Operations' || roleName === 'Operations Manager' || roleName === 'Admin';
}

export function isOperationsManagerRole(roleName) {
  return roleName === 'Operations Manager' || roleName === 'Admin';
}

export function isAdTeamRole(roleName) {
  return roleName === 'AD Team' || roleName === 'Admin';
}

export function isStaffRole(roleName) {
  return (
    roleName === 'Processor' ||
    roleName === 'Operations' ||
    roleName === 'Operations Manager' ||
    roleName === 'AD Team' ||
    roleName === 'Admin'
  );
}
