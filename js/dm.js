import { auth, db } from "./firebase.js";
import { collection, doc, getDoc, query, orderBy, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const messagesDiv = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");

let currentChatUid = null;
let currentChatName = null;

// URLパラメータ ?chat=<投稿ID> または ?user=<相手UID>（新規DM用）
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("chat");
const userParam = urlParams.get("user");

auth.onAuthStateChanged(async user => {
  if (!user) {
    alert("ログインしてください");
    window.location.href = "login.html";
    return;
  }
  const myUid = user.uid;

  // 投稿IDがある場合 → 投稿者のDMを開く
  if (postId) {
    const postDoc = await getDoc(doc(db, "scrims", postId));
    if (!postDoc.exists()) {
      messagesDiv.innerHTML = "<p>投稿が存在しません</p>";
      sendBtn.disabled = true;
      return;
    }
    const postData = postDoc.data();
    currentChatUid = postData.userUid;
    currentChatName = postData.userName || "不明";

  // 新規DM用に ?user=UID で開く場合
  } else if (userParam) {
    currentChatUid = userParam;
    currentChatName = "不明"; // ユーザー名はFirestoreから取得する場合ここで取得可能
  } else {
    messagesDiv.innerHTML = "<p>相手が指定されていません</p>";
    sendBtn.disabled = true;
    return;
  }

  // DM読み込み
  loadMessages(myUid);

  // メッセージ送信
  sendBtn.addEventListener("click", async () => {
    const text = msgInput.value.trim();
    if (!text) return;

    await addDoc(collection(db, "messages"), {
      fromUid: myUid,
      fromName: auth.currentUser.displayName || "名無し",
      toUid: currentChatUid,
      toName: currentChatName,
      text,
      createdAt: new Date(),
      postId: postId || null // 投稿に紐づく場合はID、それ以外はnull
    });

    msgInput.value = "";
  });
});

function loadMessages(myUid) {
  messagesDiv.innerHTML = "<p>読み込み中…</p>";

  const q = query(
    collection(db, "messages"),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, snapshot => {
    messagesDiv.innerHTML = "";
    let hasMessage = false;

    snapshot.forEach(doc => {
      const data = doc.data();

      // 投稿IDがある場合は投稿IDで絞り込み
      if (postId && data.postId !== postId) return;

      // 新規DMの場合は UID の組み合わせで絞り込み
      if (!postId) {
        const isChat = (data.fromUid === myUid && data.toUid === currentChatUid) ||
                       (data.fromUid === currentChatUid && data.toUid === myUid);
        if (!isChat) return;
      }

      hasMessage = true;
      const msgEl = document.createElement("div");
      msgEl.classList.add("msg", data.fromUid === myUid ? "you" : "other");
      const time = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : "";
      msgEl.innerHTML = `
        <p><strong>${data.fromName || data.fromUid}</strong></p>
        <p>${data.text}</p>
        <p class="chat-meta">${time}</p>
      `;
      messagesDiv.appendChild(msgEl);
    });

    if (!hasMessage) messagesDiv.innerHTML = "<p>まだメッセージはありません</p>";
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}
