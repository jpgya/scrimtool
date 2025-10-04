import { auth, db } from "./firebase.js";
import { collection, query, where, orderBy, onSnapshot, addDoc, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const messagesDiv = document.getElementById("messages");
const searchInput = document.getElementById("searchUser"); // 任意の検索ボックス
const startBtn = document.getElementById("startDM");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");

let currentChatUid = null;
let currentChatName = null;

// URLパラメータ ?chat=<uid>
const urlParams = new URLSearchParams(window.location.search);
const chatParamUid = urlParams.get("chat");

auth.onAuthStateChanged(async user => {
  if (!user) {
    alert("ログインしてください");
    window.location.href = "login.html";
    return;
  }
  const myUid = user.uid;

  // URLパラメータがあれば自動で相手をセット
  if (chatParamUid) {
    const targetDoc = await getDoc(doc(db, "users", chatParamUid));
    if (targetDoc.exists()) {
      currentChatUid = chatParamUid;
      currentChatName = targetDoc.data().name;
      loadMessages(myUid, currentChatUid, currentChatName);
    } else {
      alert("指定されたユーザーが存在しません");
    }
  }

  // 手動検索からDM開始
  startBtn?.addEventListener("click", async () => {
    const targetName = searchInput.value.trim();
    if (!targetName) return alert("ユーザー名を入力");

    const usersSnap = await getDocs(query(collection(db, "users"), where("name", "==", targetName)));
    if (usersSnap.empty) return alert("ユーザーが見つかりません");

    const targetDoc = usersSnap.docs[0];
    currentChatUid = targetDoc.id;
    currentChatName = targetDoc.data().name;
    loadMessages(myUid, currentChatUid, currentChatName);
  });

  // メッセージ送信
  sendBtn.addEventListener("click", async () => {
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
  });
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
