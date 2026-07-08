import { adminDb } from "../lib/firebase-admin";

export interface FirestoreUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date | null;
  lastLogin: Date | null;
  subscription: string;
  plan: string;
  role: string;
}

export async function getUserByUid(uid: string): Promise<FirestoreUser | null> {
  const docRef = adminDb.collection("users").doc(uid);
  const snap = await docRef.get();

  if (!snap.exists) return null;

  const data = snap.data()!;
  return {
    uid: data.uid,
    email: data.email ?? null,
    displayName: data.displayName ?? null,
    photoURL: data.photoURL ?? null,
    createdAt: data.createdAt?.toDate() ?? null,
    lastLogin: data.lastLogin?.toDate() ?? null,
    subscription: data.subscription ?? "free",
    plan: data.plan ?? "basic",
    role: data.role ?? "user",
  };
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<FirestoreUser, "displayName" | "photoURL" | "subscription" | "plan">>
): Promise<void> {
  const docRef = adminDb.collection("users").doc(uid);
  await docRef.update(updates);
}
