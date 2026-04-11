import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  imagePreview?: string; // for display only
  timestamp: Timestamp | null;
}

export interface Chat {
  id: string;
  title: string;
  userId: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  messages: Message[];
}

// Create a new chat session
export async function createChat(userId: string, firstMessage: string): Promise<string> {
  const title = firstMessage.length > 40 ? firstMessage.slice(0, 40) + "..." : firstMessage;
  const docRef = await addDoc(collection(db, "chats"), {
    userId,
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    messages: [],
  });
  return docRef.id;
}

// Get all chats for a user
export async function getUserChats(userId: string): Promise<Chat[]> {
  const q = query(
    collection(db, "chats"),
    where("userId", "==", userId),
    orderBy("updatedAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Chat));
}

// Get a single chat by ID
export async function getChatById(chatId: string): Promise<Chat | null> {
  const docRef = doc(db, "chats", chatId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Chat;
}

// Add a message to a chat
export async function addMessageToChat(chatId: string, message: Omit<Message, "id">): Promise<void> {
  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) return;

  const data = chatSnap.data();
  const messages: Message[] = data.messages || [];
  const newMessage: Message = {
    ...message,
    id: crypto.randomUUID(),
    timestamp: message.timestamp ?? null,
  };

  await updateDoc(chatRef, {
    messages: [...messages, newMessage],
    updatedAt: serverTimestamp(),
  });
}

// Delete a chat
export async function deleteChat(chatId: string): Promise<void> {
  await deleteDoc(doc(db, "chats", chatId));
}

// Update chat title
export async function updateChatTitle(chatId: string, title: string): Promise<void> {
  await updateDoc(doc(db, "chats", chatId), { title });
}
