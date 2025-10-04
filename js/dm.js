// js/dm.js
import { auth, db } from "./firebase.js";
import { collection, doc, getDoc, query, orderBy, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const messagesDiv = document.getElementById("messages");
const chatHeader = document.getElementById("chatHeader");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");

// URLパラメータ ?chat=<投稿ID>
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("chat");

let currentChatUid = null;
let currentChatName = null;

auth.onAuthStateChanged(async user => {
  if (!user) {
    alert("ログインしてください");
    window.location.href = "login.html";
    return;
  }
  const myUid = user.uid;

  if (!postId) {
    messagesDiv.innerHTML = "<p>投稿IDが指定されていません</p>";
    chatHeader.textContent = "DM";
    sendBtn.disabled = true;
    return;
  }

  try {
    // 投稿情報を取得
    const postRef = doc(db, "scrims", postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      messagesDiv.innerHTML = "<p>投稿が存在しません</p>";
      chatHeader.textContent = "DM";
      sendBtn.disabled = true;
      return;
    }

    const postData = postSnap.data();
    currentChatUid = postData.userUid;
    currentChatName = postData.userName || "不明";

    chatHeader.textContent = `DM — ${currentChatName}`;

    // メッセージ読み込み
    loadMessages(postId, myUid);

  } catch (err) {
    console.error(err);
    messagesDiv.innerHTML = "<p>読み込み失敗しました</p>";
    chatHeader.textContent = "DM";
    sendBtn.disabled = true;
  }

  // メッセージ送信
  sendBtn.addEventListener("click", async () => {
    const text = msgInput.value.trim();
    if (!text) return;

    try {
      await addDoc(collection(db, "chats", postId, "messages"), {
        fromUid: myUid,
        fromName: auth.currentUser.displayName || "名無し",
        toUid: currentChatUid,
        toName: currentChatName,
        text,
        createdAt: new Date()
      });
      msgInput.value = "";
    } catch (err) {
      console.error(err);
      alert("送信に失敗しました");
    }
  });
});

function loadMessages(postId, myUid) {
  const messagesRef = collection(db, "chats", postId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));

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
      const time = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : "";
      msgEl.innerHTML = `<p><strong>${data.fromName || data.fromUid}</strong></p>
                         <p>${data.text}</p>
                         <p class="chat-meta">${time}</p>`;
      messagesDiv.appendChild(msgEl);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }, err => {
    console.error(err);
    messagesDiv.innerHTML = "<p>読み込み失敗しました</p>";
  });
}
