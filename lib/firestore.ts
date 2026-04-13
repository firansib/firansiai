import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, getDoc, query, where,
  orderBy, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  imagePreview?: string;
  imageUrl?: string;      // for generated images
  audioUrl?: string;      // for TTS audio
  timestamp: Timestamp | null;
}

export interface Chat {
  id: string;
  title: string;
  userId: string;
  mode: "fast" | "deep";
  projectId?: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  messages: Message[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  userId: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

// ── Chats ──────────────────────────────────────────────
export async function createChat(userId: string, firstMessage: string, mode: "fast" | "deep" = "fast"): Promise<string> {
  const title = firstMessage.length > 40 ? firstMessage.slice(0, 40) + "..." : firstMessage;
  const ref = await addDoc(collection(db, "chats"), {
    userId, title, mode, messages: [],
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserChats(userId: string): Promise<Chat[]> {
  const q = query(collection(db, "chats"), where("userId", "==", userId), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Chat));
}

export async function getChatById(chatId: string): Promise<Chat | null> {
  const snap = await getDoc(doc(db, "chats", chatId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Chat;
}

export async function addMessageToChat(chatId: string, message: Omit<Message, "id">): Promise<void> {
  const chatRef = doc(db, "chats", chatId);
  const snap = await getDoc(chatRef);
  if (!snap.exists()) return;
  const messages: Message[] = snap.data().messages || [];

  // Remove undefined fields to prevent Firestore errors
  const cleanMessage: any = { id: crypto.randomUUID() };
  for (const [key, value] of Object.entries(message)) {
    if (value !== undefined) cleanMessage[key] = value;
  }

  await updateDoc(chatRef, {
    messages: [...messages, cleanMessage],
    updatedAt: serverTimestamp(),
  });
}

export async function deleteChat(chatId: string): Promise<void> {
  await deleteDoc(doc(db, "chats", chatId));
}

export async function updateChatTitle(chatId: string, title: string): Promise<void> {
  await updateDoc(doc(db, "chats", chatId), { title });
}

// ── Projects ───────────────────────────────────────────
export async function createProject(userId: string, name: string, description: string): Promise<string> {
  const ref = await addDoc(collection(db, "projects"), {
    userId, name, description,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  const q = query(collection(db, "projects"), where("userId", "==", userId), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
}

export async function deleteProject(projectId: string): Promise<void> {
  await deleteDoc(doc(db, "projects", projectId));
}

export async function saveChatToProject(chatId: string, projectId: string): Promise<void> {
  await updateDoc(doc(db, "chats", chatId), { projectId });
}
