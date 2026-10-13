import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { initForegroundNotificationListener } from "@/lib/notifications";
import { clearSessionData } from "@/lib/session";

export type UserRole = "student" | "faculty" | "hod" | "admin";

export interface UserData {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  phone: string;
  createdAt?: any;
  updatedAt?: any;
  // Student specific
  rollNumber?: string;
  year?: number;
  semester?: number;
  section?: string;
  // Faculty specific
  employeeId?: string;
  assignedYear?: number;
  assignedSection?: string;
  designation?: string;
  degrees?: string; // Comma-separated e.g. "M.Tech, Ph.D"
  // Admin specific
  adminLevel?: "principal" | "dean" | "academic_cell";
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  refreshUserData: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (firebaseUser: User) => {
    try {
      const docRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserData({ uid: firebaseUser.uid, ...docSnap.data() } as UserData);
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData(null);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  useEffect(() => {
    let unsubsForeground: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchUserData(firebaseUser);
        // Start foreground push notifications listener
        initForegroundNotificationListener().then((cleanup) => {
          unsubsForeground = cleanup;
        });
      } else {
        setUserData(null);
        clearSessionData();
        if (unsubsForeground) {
          unsubsForeground();
          unsubsForeground = undefined;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubsForeground) unsubsForeground();
    };
  }, []);

  // Always render children — loading state handled by router/components
  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};
