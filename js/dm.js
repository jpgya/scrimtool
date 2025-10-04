// js/dm.js
// 必要: js/firebase.js (initializeApp, export auth, db)
// Firestore構造:
//  - scrims/{scrimId}        (既存)
//  - chats/{chatId}          (meta)
//  - chats/{chatId}/messages/{msgId} (messages)

import { auth, db } from "./firebase.js";
import {
  doc, getDoc, setDoc, collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, where, getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const $ = id => document.getElementById(id);

const messagesEl = $("messages");
const msgInput = $("msgInput");
const sendBtn = $("sendBtn");
const scrimTitleEl = $("scrimTitle");
const scrimMetaEl = $("scrimMeta");
const openDiscordBtn = $("openDiscord");
const openXBtn = $("openX");

// URL query から chat (scrimId) を取得
const params = new URLSearchParams(location.search);
const chatScrimId = params.get("chat") || params.get("scrim") || null;

if (!chatScrimId) {
  scrimTitleEl.textContent = "チャットIDが指定されていません";
  scrimMetaEl.textContent = "dm.html?chat=<scrimId> の形式でアクセスしてください";
  sendBtn.disabled = true;
}

let chatId = `scrim_${chatScrimId}`; // chatId の命名規則
let unsubscribeMessages = null;
let currentUser = null;

// 初期化: 認証状態を待つ
onAuthStateChanged(auth, async user => {
  currentUser = user;
  if (!user) {
    // 未ログイン時はログインページへ誘導
    scrimTitleEl.textContent = "ログインしてください";
    scrimMetaEl.innerHTML = `<a href="login.html">ログインページへ</a>`;
    sendBtn.disabled = true;
    return;
  }
  sendBtn.disabled = false;
  await initChat();
});

// 初期化: チャット & スクリム情報取得、メッセージ購読
async function initChat() {
  // 1) scrim情報表示
  try {
    const scrimRef = doc(db, "scrims", chatScrimId);
    const scrimSnap = await getDoc(scrimRef);
    if (!scrimSnap.exists()) {
      scrimTitleEl.textContent = "指定されたスクリムが見つかりません";
      scrimMetaEl.textContent = "IDを確認してください";
      return;
    }
    const scrim = scrimSnap.data();
    scrimTitleEl.textContent = scrim.title || "（無題のスクリム）";
    const meta = `開催: ${new Date(scrim.date).toLocaleString()} ・ マップ: ${scrim.map || '-'} ・ 主催: ${scrim.hostName || '-'}`;
    scrimMetaEl.textContent = meta;

    // ボタン表示（Xリンク、Discordが入っていれば）
    if (scrim.twitter) {
      openXBtn.style.display = "inline-block";
      openXBtn.onclick = () => window.open(`https://x.com/${encodeURIComponent(scrim.twitter.replace(/^@/,''))}`, "_blank");
    }
    if (scrim.discordInvite) {
      openDiscordBtn.style.display = "inline-block";
      openDiscordBtn.onclick = () => window.open(scrim.discordInvite, "_blank");
    }

    // 2) chats/{chatId} が無ければ作る（簡易メタ）
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        scrimId: chatScrimId,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp()
      });
    }

    // 3) messages 購読（リアルタイム）
    const msgsCol = collection(db, "chats", chatId, "messages");
    const q = query(msgsCol, orderBy("createdAt", "asc"));
    if (unsubscribeMessages) unsubscribeMessages();
    unsubscribeMessages = onSnapshot(q, snapshot => {
      messagesEl.innerHTML = "";
      snapshot.forEach(doc => {
        const m = doc.data();
        appendMessage(doc.id, m);
      });
      // 最後までスクロール
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });

    // 4) 最新閲覧時刻をチャットメタに保存（簡易既読）
    await setDoc(chatRef, { [`lastViewed_${currentUser.uid}`]: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.error("initChat error:", err);
    scrimMetaEl.textContent = "チャット初期化に失敗しました";
  }
}

// メッセージ表示ヘルパー
function appendMessage(id, m) {
  const div = document.createElement("div");
  const isYou = currentUser && (m.senderUid === currentUser.uid);
  div.className = `msg ${isYou ? 'you' : 'other'}`;
  const name = isYou ? "あなた" : (m.senderName || m.senderUid);
  const time = m.createdAt && m.createdAt.toDate ? m.createdAt.toDate().toLocaleString() : '';
  // メッセージ本文（簡易XSS対策）
  const text = escapeHtml(m.text || '');
  div.innerHTML = `<div style="font-size:0.85rem;opacity:0.9">${escapeHtml(name)} <span style="font-size:0.75rem;opacity:0.6;margin-left:8px">${time}</span></div>
                   <div style="margin-top:6px">${text}</div>`;
  messagesEl.appendChild(div);
}

function escapeHtml(s){
  return (s+'').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
}

// 送信ボタン
sendBtn.onclick = async () => {
  if (!currentUser) return alert("ログインしてください");
  const text = msgInput.value.trim();
  if (!text) return;
  sendBtn.disabled = true;
  try {
    const msgsCol = collection(db, "chats", chatId, "messages");
    await addDoc(msgsCol, {
      senderUid: currentUser.uid,
      senderName: currentUser.displayName || currentUser.email.split('@')[0],
      text,
      createdAt: serverTimestamp()
    });
    // 更新: chats.lastMessageAt
    const chatRef = doc(db, "chats", chatId);
    await setDoc(chatRef, { lastMessageAt: serverTimestamp() }, { merge: true });

    msgInput.value = "";
    messagesEl.scrollTop = messagesEl.scrollHeight;
  } catch (err) {
    console.error("send error", err);
    alert("送信に失敗しました");
  } finally {
    sendBtn.disabled = false;
  }
};

// Enter で送信（Shift+Enterは改行）
msgInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});
