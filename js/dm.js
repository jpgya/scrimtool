import { auth, db } from "./firebase.js";
import { collection, doc, getDoc, query, where, orderBy, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const messagesDiv = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");

let currentChatUid = null;
let currentChatName = null;

// URLパラメータ ?chat=<投稿ID>
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("chat");

auth.onAuthStateChanged(async user => {
  if (!user) {
    alert("ログインしてください");
    window.location.href = "login.html";
    return;
  }
  const myUid = user.uid;

  if (postId) {
    // 投稿者のUIDを取得
    const postDoc = await getDoc(doc(db, "scrims", postId));
    if (!postDoc.exists()) {
      alert("投稿が存在しません");
      return;
    }
    const postData = postDoc.data();
    currentChatUid = postData.userUid; // 投稿者のUID
    currentChatName = postData.userName || "不明";

    loadMessages(myUid, currentChatUid, currentChatName);
  }

  // メッセージ送信
  sendBtn.addEventListener("click", async () => {
    if (!currentChatUid) return alert("相手が設定されていません");
    const text = msgInput.value.trim();
    if (!text) return;

    await addDoc(collection(db, "messages"), {
      fromUid: myUid,
      fromName: auth.currentUser.displayName || "名無し",
      toUid: currentChatUid,
      toName: currentChatName,
      text,
      createdAt: new Date(),
      postId // どの投稿に紐づくDMか記録
    });
    msgInput.value = "";
  });
});

function loadMessages(myUid, targetUid, targetName) {
  messagesDiv.innerHTML = "";
  const q = query(
    collection(db, "messages"),
    where("postId", "==", postId), // 投稿IDで絞る
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, snapshot => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const msgEl = document.createElement("div");
      msgEl.classList.add("msg", data.fromUid === myUid ? "you" : "other");
      const time = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : "";
      msgEl.innerHTML = `<p><strong>${data.fromName || data.fromUid}</strong></p><p>${data.text}</p><p class="chat-meta">${time}</p>`;
      messagesDiv.appendChild(msgEl);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}
