import { auth, db } from "./firebase.js";
import { collection, query, where, orderBy, onSnapshot, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const messagesDiv = document.getElementById("messages");
const searchInput = document.getElementById("searchUser");
const startBtn = document.getElementById("startDM");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");

let currentChatUid = null; // 現在の相手UID
let currentChatName = null;

auth.onAuthStateChanged(user => {
  if (!user) {
    alert("ログインしてください");
    window.location.href = "login.html";
    return;
  }
  const myUid = user.uid;

  startBtn.onclick = async () => {
    const targetName = searchInput.value.trim();
    if (!targetName) return alert("ユーザー名を入力");

    // ユーザー検索
    const usersSnap = await getDocs(query(collection(db, "users"), where("name", "==", targetName)));
    if (usersSnap.empty) return alert("ユーザーが見つかりません");

    const targetDoc = usersSnap.docs[0];
    currentChatUid = targetDoc.id;
    currentChatName = targetDoc.data().name;

    // DMを読み込む
    loadMessages(myUid, currentChatUid, currentChatName);
  };

  sendBtn.onclick = async () => {
    if (!currentChatUid) return alert("相手を選択してください");
    const text = msgInput.value.trim();
    if (!text) return;

    await addDoc(collection(db, "messages"), {
      fromUid: myUid,
      fromName: auth.currentUser.displayName,
      toUid: currentChatUid,
      toName: currentChatName,
      text,
      createdAt: new Date()
    });
    msgInput.value = "";
  };
});

function loadMessages(myUid, targetUid, targetName) {
  messagesDiv.innerHTML = "";
  const q = query(
    collection(db, "messages"),
    where("fromUid", "in", [myUid, targetUid]),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, snapshot => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      if ((data.fromUid === myUid && data.toUid === targetUid) || (data.fromUid === targetUid && data.toUid === myUid)) {
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
