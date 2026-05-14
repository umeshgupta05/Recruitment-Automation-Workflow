export const roles = {
  recruiter: "recruiter",
  candidate: "candidate",
  admin: "admin",
};

export function normalizeRole(role) {
  if (role === roles.admin) return roles.admin;
  if (role === roles.candidate) return roles.candidate;
  return roles.recruiter;
}

export function isRecruiterRole(role) {
  const normalized = normalizeRole(role);
  return normalized === roles.recruiter || normalized === roles.admin;
}

export function getLandingPath(role) {
  return normalizeRole(role) === roles.candidate ? "/jobs" : "/dashboard";
}
