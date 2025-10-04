import { auth, db } from "./firebase.js";
import { collection, query, where, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const messagesDiv = document.getElementById("messages");

auth.onAuthStateChanged(user => {
  if (!user) {
    alert("ログインしてください");
    window.location.href = "login.html";
    return;
  }

  const userId = user.uid;

  // 自分宛てのメッセージをリアルタイム取得
  const q = query(
    collection(db, "messages"),
    where("toUid", "==", userId),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, snapshot => {
    messagesDiv.innerHTML = ""; // 初期化
    if (snapshot.empty) {
      messagesDiv.innerHTML = "<p>まだ自分宛てのDMはありません</p>";
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      const msgEl = document.createElement("div");
      msgEl.classList.add("msg");
      msgEl.classList.add(data.fromUid === userId ? "you" : "other");
      const time = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : "";
      msgEl.innerHTML = `
        <p><strong>${data.fromName || data.fromUid}</strong></p>
        <p>${data.text}</p>
        <p class="chat-meta">${time}</p>
      `;
      messagesDiv.appendChild(msgEl);
    });

    // 最新メッセージにスクロール
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
});
