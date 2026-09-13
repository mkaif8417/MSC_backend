/**
 * System roles explicitly defined in the PRD
 */
const ROLES = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  DISTRICT_ADMIN: 'DISTRICT_ADMIN',
  MOSQUE_CENTER_ADMIN: 'MOSQUE_CENTER_ADMIN',
  TEACHER: 'TEACHER',
  DATA_ENTRY_OPERATOR: 'DATA_ENTRY_OPERATOR'
});

const ROLE_LIST = Object.values(ROLES);

module.exports = {
  ROLES,
  ROLE_LIST
};
