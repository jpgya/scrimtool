import { auth, db } from "./firebase.js";
import { collection, doc, getDoc, setDoc, query, orderBy, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const messagesDiv = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");

const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("chat");

let chatDocRef = null;
let currentChatUid = null;
let currentChatName = null;

auth.onAuthStateChanged(async user => {
  if (!user) {
    alert("ログインしてください");
    window.location.href = "login.html";
    return;
  }
  const myUid = user.uid;

  if (postId) {
    // 投稿者情報取得
    const postDoc = await getDoc(doc(db, "scrims", postId));
    if (!postDoc.exists()) {
      alert("投稿が存在しません");
      return;
    }
    const postData = postDoc.data();
    currentChatUid = postData.userUid;
    currentChatName = postData.userName || "不明";

    // チャットドキュメント参照
    chatDocRef = doc(db, "chats", postId); // 投稿IDをチャットIDにする

    // チャットが存在しなければ作成
    const chatSnap = await getDoc(chatDocRef);
    if (!chatSnap.exists()) {
      await setDoc(chatDocRef, {
        postId,
        users: [myUid, currentChatUid],
        createdAt: new Date()
      });
    }

    // メッセージ読み込み
    loadMessages(chatDocRef, myUid);
  }

  sendBtn.addEventListener("click", async () => {
    if (!chatDocRef) return alert("相手が設定されていません");
    const text = msgInput.value.trim();
    if (!text) return;

    await addDoc(collection(chatDocRef, "messages"), {
      fromUid: myUid,
      fromName: auth.currentUser.displayName || "名無し",
      toUid: currentChatUid,
      toName: currentChatName,
      text,
      createdAt: new Date()
    });

    msgInput.value = "";
  });
});

function loadMessages(chatRef, myUid) {
  messagesDiv.innerHTML = "";
  const q = query(collection(chatRef, "messages"), orderBy("createdAt", "asc"));

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
      msgEl.innerHTML = `<p><strong>${data.fromName || data.fromUid}</strong></p><p>${data.text}</p><p class="chat-meta">${time}</p>`;
      messagesDiv.appendChild(msgEl);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}
