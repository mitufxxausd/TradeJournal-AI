import { adminDb } from "../lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export interface JournalEntry {
  id: string;
  uid: string;
  title: string;
  content: string;
  mood: "bullish" | "bearish" | "neutral" | "uncertain";
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateJournalInput {
  title: string;
  content: string;
  mood: "bullish" | "bearish" | "neutral" | "uncertain";
  tags?: string[];
}

export interface UpdateJournalInput {
  title?: string;
  content?: string;
  mood?: "bullish" | "bearish" | "neutral" | "uncertain";
  tags?: string[];
}

function docToEntry(doc: FirebaseFirestore.DocumentSnapshot): JournalEntry {
  const data = doc.data()!;
  return {
    id: doc.id,
    uid: data.uid,
    title: data.title,
    content: data.content,
    mood: data.mood,
    tags: data.tags ?? [],
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  };
}

export async function createJournalEntry(
  uid: string,
  input: CreateJournalInput
): Promise<JournalEntry> {
  const docRef = adminDb.collection("journalEntries").doc();
  const now = FieldValue.serverTimestamp();

  await docRef.set({
    uid,
    title: input.title,
    content: input.content,
    mood: input.mood,
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
  });

  const snap = await docRef.get();
  return docToEntry(snap);
}

export async function getJournalEntriesByUser(
  uid: string,
  limit = 50
): Promise<JournalEntry[]> {
  const snaps = await adminDb
    .collection("journalEntries")
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snaps.docs.map(docToEntry);
}

export async function getJournalEntryById(entryId: string): Promise<JournalEntry | null> {
  const snap = await adminDb.collection("journalEntries").doc(entryId).get();
  if (!snap.exists) return null;
  return docToEntry(snap);
}

export async function updateJournalEntry(
  entryId: string,
  uid: string,
  input: UpdateJournalInput
): Promise<JournalEntry | null> {
  const docRef = adminDb.collection("journalEntries").doc(entryId);
  const snap = await docRef.get();

  if (!snap.exists) return null;
  if (snap.data()!.uid !== uid) return null;

  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (input.title !== undefined) updates.title = input.title;
  if (input.content !== undefined) updates.content = input.content;
  if (input.mood !== undefined) updates.mood = input.mood;
  if (input.tags !== undefined) updates.tags = input.tags;

  await docRef.update(updates);
  const updated = await docRef.get();
  return docToEntry(updated);
}

export async function deleteJournalEntry(entryId: string, uid: string): Promise<boolean> {
  const docRef = adminDb.collection("journalEntries").doc(entryId);
  const snap = await docRef.get();

  if (!snap.exists) return false;
  if (snap.data()!.uid !== uid) return false;

  await docRef.delete();
  return true;
}
