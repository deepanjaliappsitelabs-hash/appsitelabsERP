import { Navigate } from "react-router-dom";
import getStoredUser from "../../utils/authStorage";

function RoleRoute({ children, role }) {
  const user = getStoredUser();

  if (user?.role !== role) {
    return <Navigate to="/" />;
  }

  return children;
}

export default RoleRoute;
