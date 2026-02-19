import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase/config";
import { db } from "../firebase/config";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";

// 1️⃣ Create the context
const AuthContext = createContext();

// 2️⃣ Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // optional, for showing spinner while checking auth

  // 3️⃣ Listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe; // cleanup listener
  }, []);

  // 4️⃣ Register function
  const register = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    const user = userCredential.user;

    await updateProfile(user, {
    displayName: name,
  });

    // Create Firestore document for user
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: user.email,
      createdAt: serverTimestamp(),
    });

    return user;
  };

  // 5️⃣ Login function
  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  // 6️⃣ Logout function
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 7️⃣ Hook for easier access
export const useAuth = () => useContext(AuthContext);
