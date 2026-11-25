import { useEffect } from "react";

/*
 * DEVELOPER: Vincent
 * RESPONSIBILITY: Frontend authentication access control.
 *
 * - Shows a short "checking session" state until App has finished its
 *   first /api/auth/me check (authChecked), so a refresh never bounces a
 *   signed-in user to the login page.
 * - Redirects unauthenticated users to the login page with a message.
 * - Renders its children for authenticated users.
 *
 * This is frontend navigation protection only. Backend endpoints must
 * independently enforce authentication and authorization.
 *
 * Props: currentUser, authChecked, onNavigate, onNotify,
 *        redirectTo (default "/login"), message, children
 */
function ProtectedRoute({
  currentUser,
  authChecked = true,
  onNavigate,
  onNotify,
  redirectTo = "/login",
  message = "Please sign in to continue.",
  children = null,
}) {
  const blocked = authChecked && !currentUser;

  useEffect(() => {
    if (!blocked) return;
    onNotify?.(message);
    onNavigate?.(redirectTo);
    // Runs once when access is first denied.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocked]);

  if (!authChecked) {
    return (
      <main className="marketplace-page">
        <p className="finds-message" role="status">
          Checking your session...
        </p>
      </main>
    );
  }

  if (!currentUser) return null;

  return <>{children}</>;
}

export default ProtectedRoute;
