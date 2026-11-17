// Demo guard: keeps the public live demo usable for everyone.
//
// The README publishes demo logins (admin/doctor/patient) so recruiters can
// try the app. Without this guard, any visitor could delete every record or
// change the demo passwords and lock everyone else out.
//
// When DEMO_MODE=true:
//   - DELETE requests are refused
//   - password changes are refused
//   - user management (/api/users) is read-only
// Everything else (creating/editing patients, appointments, records) still
// works, and a nightly job resets the data (.github/workflows/reset-demo.yml).

const isDemoMode = () => process.env.DEMO_MODE === 'true';

const demoGuard = (req, res, next) => {
  if (!isDemoMode()) return next();

  const path = req.path;
  const method = req.method;

  const blocked =
    method === 'DELETE' ||
    path === '/api/auth/change-password' ||
    /^\/api\/users\/[^/]+\/password$/.test(path) ||
    (path.startsWith('/api/users') && method !== 'GET');

  if (blocked) {
    return res.status(403).json({
      message: 'This action is disabled in the public demo. Run the project locally to try it.',
      demo: true,
    });
  }

  next();
};

module.exports = { demoGuard, isDemoMode };
