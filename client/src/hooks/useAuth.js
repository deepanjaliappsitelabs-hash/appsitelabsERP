
import { useState, useEffect } from "react";
const EMAIL_TO_FIREBASE_UID = {
  "business@appsitelabs.com": "Vdr2fr3CcUOWIZbFKGlxuLSRaYI3",
 
};

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const erpUser = JSON.parse(stored);
        const email = erpUser.email || "";

       
        const firebaseUid =
          EMAIL_TO_FIREBASE_UID[email] ||
          String(erpUser.id || erpUser.employeeId || "");

        setUser({
          uid:         firebaseUid,  
          email:       email,
          displayName: erpUser.name  || "",
          role:        erpUser.role  || "",
          id:          erpUser.id    || "",
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, loading };
}