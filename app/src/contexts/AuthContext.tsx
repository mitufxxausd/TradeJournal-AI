import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  auth,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type FirebaseUser,
} from "@/lib/firebase";
import { doc, getDoc, setDoc, db } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  settings?: {
    defaultBroker: string;
    defaultAccount: string;
    defaultCurrency: string;
    riskPerTrade: number;
    theme: "light" | "dark" | "system";
  };
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          settings: {
            defaultBroker: "",
            defaultAccount: "",
            defaultCurrency: "USD",
            riskPerTrade: 1,
            theme: "system",
          },
        };
        await setDoc(doc(db, "users", firebaseUser.uid), newProfile);
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [fetchUserProfile]);

  const logout = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserProfile(null);
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  }, [user, fetchUserProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAuthenticated: !!user,
        logout,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
