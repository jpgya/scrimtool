import { auth, db } from "./firebase.js";
import { collection, doc, getDoc, query, where, orderBy, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const messagesDiv = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const chatHeader = document.getElementById("chatHeader");

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
    currentChatUid = postData.userUid;
    currentChatName = postData.userName || "不明";

    // ヘッダーに表示
    chatHeader.textContent = `DM: ${currentChatName}`;

    // メッセージを読み込む
    loadMessages(myUid);

    // 送信ボタンを有効化
    sendBtn.disabled = false;
    sendBtn.onclick = async () => {
      const text = msgInput.value.trim();
      if (!text) return;

      await addDoc(collection(db, "messages"), {
        fromUid: myUid,
        fromName: auth.currentUser.displayName || "名無し",
        toUid: currentChatUid,
        toName: currentChatName,
        text,
        createdAt: new Date(),
        postId
      });

      msgInput.value = "";
    };
  } catch (e) {
    console.error(e);
    messagesDiv.innerHTML = "<p>チャットの読み込みに失敗しました</p>";
    sendBtn.disabled = true;
  }
});

function loadMessages(myUid) {
  // 投稿IDで絞り込む
  const q = query(
    collection(db, "messages"),
    where("postId", "==", postId),
    orderBy("createdAt", "asc")
  );

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

      // createdAt は Firestore Timestamp か Date か両方対応
      let time = "";
      if (data.createdAt) {
        if (data.createdAt.seconds) {
          time = new Date(data.createdAt.seconds * 1000).toLocaleString();
        } else {
          time = new Date(data.createdAt).toLocaleString();
        }
      }

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
