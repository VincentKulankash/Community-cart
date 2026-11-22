/*
 * DEVELOPER: Vincent
 * RESPONSIBILITY: Frontend authentication access control.
 *
 * TASKS:
 * - Prevent unauthenticated users from accessing protected frontend pages.
 * - Redirect unauthenticated users to the login page.
 * - Allow authenticated users to access permitted pages.
 *
 * INTEGRATION:
 * - Receive authentication state through props.
 * - Coordinate with the existing authentication state managed by App.jsx.
 * - This is frontend navigation protection only.
 * - Backend endpoints must independently enforce authentication and authorization.
 */

function ProtectedRoute({
  currentUser,
  authLoading = false,
  onNavigate,
  children,
}) {
  if (authLoading) {
    return (
      <main className="listing-form-page">
        <p className="listing-form-status" role="status">
          Checking your session...
        </p>
      </main>
    );
  }

  if (!currentUser) {
    onNavigate("/login");
    return null;
  }

  return children;
}

export default ProtectedRoute;