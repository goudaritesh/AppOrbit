import { ROLE_PERMISSIONS_MAP, ADMIN_PERMISSIONS, getUserEffectivePermissions } from './src/config/adminPermissions.js';

const user = { role: 'ADMIN' };
const effective = getUserEffectivePermissions(user);

const checkPerm = (perm) => {
  if (!effective.includes(perm)) {
    console.log(`Missing permission: ${perm}`);
  } else {
    console.log(`Has permission: ${perm}`);
  }
}

checkPerm(ADMIN_PERMISSIONS.PAYMENT_READ);
checkPerm(ADMIN_PERMISSIONS.SETTINGS_READ);
checkPerm(ADMIN_PERMISSIONS.SUBSCRIPTION_MANAGE);
checkPerm(ADMIN_PERMISSIONS.REPORT_READ);
checkPerm(ADMIN_PERMISSIONS.SUPPORT_READ);
checkPerm(ADMIN_PERMISSIONS.AUDIT_READ);

