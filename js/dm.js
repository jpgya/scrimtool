// js/dm.js
import { auth, db } from "./firebase.js";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const messagesDiv = document.getElementById("messages");
const chatHeader = document.getElementById("chatHeader");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");

sendBtn.disabled = true; // 読み込み中は一旦無効

// URLパラメータ ?chat=<投稿ID>
const urlParams = new URLSearchParams(window.location.search);
let postId = urlParams.get("chat");

let currentChatId = null;
let currentChatUid = null;
let currentChatName = null;

auth.onAuthStateChanged(async user => {
  if (!user) {
    alert("ログインしてください");
    window.location.href = "login.html";
    return;
  }

  const myUid = user.uid;
  const myName = user.displayName || "名無し";

  try {
    if (postId) {
      // 投稿IDから投稿者情報を取得
      const postDoc = await getDoc(doc(db, "scrims", postId));
      if (!postDoc.exists()) {
        chatHeader.textContent = "投稿が存在しません";
        messagesDiv.innerHTML = "<p>読み込み失敗しました</p>";
        return;
      }

      const postData = postDoc.data();
      currentChatUid = postData.userUid || null;
      currentChatName = postData.userName || "不明";

      // チャットIDは投稿IDと投稿者UIDの組み合わせにする
      currentChatId = postId + "_" + currentChatUid;

      chatHeader.textContent = currentChatName;

      // チャットが存在しなければ作成
      const chatDocRef = doc(db, "chats", currentChatId);
      const chatSnap = await getDoc(chatDocRef);
      if (!chatSnap.exists()) {
        await setDoc(chatDocRef, {
          postId,
          participants: [myUid, currentChatUid],
          createdAt: new Date()
        });
      }

      loadMessages(currentChatId, myUid);
      sendBtn.disabled = false;

    } else {
      // 新規チャット（投稿IDなし）
      currentChatId = "chat_" + Date.now() + "_" + myUid;
      currentChatUid = null;
      currentChatName = "未指定";
      chatHeader.textContent = currentChatName;

      await setDoc(doc(db, "chats", currentChatId), {
        postId: null,
        participants: [myUid],
        createdAt: new Date()
      });

      messagesDiv.innerHTML = "<p>まだメッセージはありません</p>";
      sendBtn.disabled = false;
    }
  } catch (err) {
    console.error(err);
    messagesDiv.innerHTML = "<p>読み込み失敗しました</p>";
  }
});

// メッセージ送信
sendBtn.addEventListener("click", async () => {
  const text = msgInput.value.trim();
  if (!text) return;

  try {
    await addDoc(collection(db, "chats", currentChatId, "messages"), {
      fromUid: auth.currentUser.uid,
      fromName: auth.currentUser.displayName || "名無し",
      toUid: currentChatUid || null,
      toName: currentChatName || null,
      text,
      createdAt: new Date()
    });
    msgInput.value = "";
  } catch (err) {
    console.error(err);
    alert("送信に失敗しました");
  }
});

// メッセージを読み込む関数
function loadMessages(chatId, myUid) {
  messagesDiv.innerHTML = "<p>読み込み中…</p>";

  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, snapshot => {
    messagesDiv.innerHTML = "";
    if (snapshot.empty) {
      messagesDiv.innerHTML = "<p>まだメッセージはありません</p>";
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      const msgEl = document.createElement("div");
      msgEl.classList.add("msg", data.fromUid === myUid ? "you" : "other");

      const time = data.createdAt ? new Date(data.createdAt.seconds ? data.createdAt.seconds * 1000 : data.createdAt.getTime()).toLocaleString() : "";

      msgEl.innerHTML = `
        <p><strong>${data.fromName || data.fromUid}</strong></p>
        <p>${data.text}</p>
        <p class="chat-meta">${time}</p>
      `;
      messagesDiv.appendChild(msgEl);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}
