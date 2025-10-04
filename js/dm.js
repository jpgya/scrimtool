import { auth, db } from "./firebase.js";
import { collection, doc, getDoc, addDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const messagesDiv = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const chatHeader = document.getElementById("chatHeader");

const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("chat"); // 投稿IDをchatIdとして使う

auth.onAuthStateChanged(async user => {
  if (!user) {
    alert("ログインしてください");
    window.location.href = "login.html";
    return;
  }
  const myUid = user.uid;

  if (!postId) {
    messagesDiv.innerHTML = "<p>無効な投稿IDです</p>";
    sendBtn.disabled = true;
    return;
  }

  try {
    // 投稿者情報を取得
    const postDoc = await getDoc(doc(db, "scrims", postId));
    if (!postDoc.exists()) {
      messagesDiv.innerHTML = "<p>投稿が存在しません</p>";
      sendBtn.disabled = true;
      return;
    }

    const postData = postDoc.data();
    const chatId = postId; // 投稿IDをchatIdとして利用
    const targetUid = postData.userUid;
    const targetName = postData.userName || "不明";

    chatHeader.textContent = `DM: ${targetName}`;

    // メッセージ読み込み
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    onSnapshot(q, snapshot => {
      messagesDiv.innerHTML = "";
      if (snapshot.empty) {
        messagesDiv.innerHTML = "<p>まだメッセージはありません。送信してみましょう。</p>";
        return;
      }

      snapshot.forEach(doc => {
        const data = doc.data();
        const msgEl = document.createElement("div");
        msgEl.classList.add("msg", data.fromUid === myUid ? "you" : "other");
        const time = data.createdAt ? new Date(data.createdAt.seconds ? data.createdAt.seconds * 1000 : data.createdAt).toLocaleString() : "";
        msgEl.innerHTML = `
          <p><strong>${data.fromName || data.fromUid}</strong></p>
          <p>${data.text}</p>
          <p class="chat-meta">${time}</p>
        `;
        messagesDiv.appendChild(msgEl);
      });
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });

    // 送信
    sendBtn.disabled = false;
    sendBtn.onclick = async () => {
      const text = msgInput.value.trim();
      if (!text) return;

      await addDoc(messagesRef, {
        fromUid: myUid,
        fromName: auth.currentUser.displayName || "名無し",
        toUid: targetUid,
        toName: targetName,
        text,
        createdAt: new Date()
      });
      msgInput.value = "";
    };

  } catch (err) {
    console.error(err);
    messagesDiv.innerHTML = "<p>チャットの読み込みに失敗しました</p>";
    sendBtn.disabled = true;
  }
});
