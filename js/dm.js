import { auth, db } from "./firebase.js";
import { collection, doc, getDoc, query, where, orderBy, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const messagesDiv = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");

// URLパラメータ ?chat=<投稿ID> または ?user=<相手UID>
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("chat");
const userIdParam = urlParams.get("user");

let currentChatUid = null;
let currentChatName = null;

auth.onAuthStateChanged(async user => {
  if (!user) {
    alert("ログインしてください");
    window.location.href = "login.html";
    return;
  }
  const myUid = user.uid;

  // 投稿DM
  if (postId) {
    const postDoc = await getDoc(doc(db, "scrims", postId));
    if (!postDoc.exists()) {
      alert("投稿が存在しません");
      return;
    }
    const postData = postDoc.data();
    currentChatUid = postData.userUid;
    currentChatName = postData.userName || "不明";
    loadMessages(myUid, currentChatUid, currentChatName);
  } 
  // 新規DM
  else if (userIdParam) {
    currentChatUid = userIdParam;
    // Firestoreから相手の名前を取得
    const userDoc = await getDoc(doc(db, "users", currentChatUid));
    currentChatName = userDoc.exists() ? userDoc.data().name : "名無し";
    loadMessages(myUid, currentChatUid, currentChatName);
  } 
  else {
    messagesDiv.innerHTML = "<p>チャット対象が指定されていません</p>";
    sendBtn.disabled = true;
    return;
  }

  // メッセージ送信
  sendBtn.addEventListener("click", async () => {
    const text = msgInput.value.trim();
    if (!text) return;
    if (!currentChatUid) return alert("相手が設定されていません");

    await addDoc(collection(db, "messages"), {
      fromUid: myUid,
      fromName: auth.currentUser.displayName || "名無し",
      toUid: currentChatUid,
      toName: currentChatName,
      text,
      createdAt: new Date(),
      postId: postId || null
    });
    msgInput.value = "";
  });
});

function loadMessages(myUid, targetUid, targetName) {
  messagesDiv.innerHTML = "<p>読み込み中…</p>";

  const q = query(
    collection(db, "messages"),
    where("fromUid", "in", [myUid, targetUid]),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, snapshot => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      // 自分と相手のやりとりだけ表示
      if ((data.fromUid === myUid && data.toUid === targetUid) ||
          (data.fromUid === targetUid && data.toUid === myUid)) {
        const msgEl = document.createElement("div");
        msgEl.classList.add("msg", data.fromUid === myUid ? "you" : "other");
        const time = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : "";
        msgEl.innerHTML = `<p><strong>${data.fromName || data.fromUid}</strong></p><p>${data.text}</p><p class="chat-meta">${time}</p>`;
        messagesDiv.appendChild(msgEl);
      }
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}
