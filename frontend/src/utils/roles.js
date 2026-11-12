export const ROLE_ROUTES = {
  citizen: '/dashboard',
  csc: '/csc-dashboard',
  edc: '/edc-dashboard',
  officer: '/officer-dashboard',
};

export const getRoleRoute = (role) => ROLE_ROUTES[role] || ROLE_ROUTES.citizen;