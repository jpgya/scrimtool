import { auth, db } from "./firebase.js";
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, getDoc, doc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const timeline = document.getElementById("timeline");
const searchUser = document.getElementById("searchUser");
const dmInput = document.getElementById("dmInput");
const sendBtn = document.getElementById("sendBtn");

let currentUser;

// 認証チェック
auth.onAuthStateChanged(async user => {
  if (!user) {
    alert("ログインしてください");
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  loadMyDMs();
});

// 自分宛てDMを表示
async function loadMyDMs() {
  const q = query(
    collection(db, "messages"),
    where("toUid", "==", currentUser.uid),
    orderBy("createdAt", "asc")
  );

  const snapshot = await getDocs(q);
  timeline.innerHTML = "<h2>自分宛てのDM</h2>";

  if (snapshot.empty) {
    timeline.innerHTML += "<p>まだDMはありません</p>";
  } else {
    snapshot.forEach(doc => {
      const data = doc.data();
      const time = data.createdAt ? new Date(data.createdAt.seconds*1000).toLocaleString() : "";
      timeline.innerHTML += `
        <div class="post">
          <p><strong>送信者:</strong> ${data.fromName || data.fromUid}</p>
          <p>${data.text}</p>
          <p class="small-meta">${time}</p>
        </div>
      `;
    });
  }
}

// メッセージ送信
sendBtn.addEventListener("click", async () => {
  const username = searchUser.value.trim();
  const text = dmInput.value.trim();
  if (!username || !text) {
    alert("ユーザー名とメッセージを入力してください");
    return;
  }

  try {
    // ユーザー名からUIDを取得
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);
    let toUser = null;
    usersSnapshot.forEach(u => {
      if (u.data().name === username) toUser = u;
    });

    if (!toUser) {
      alert("ユーザーが見つかりません");
      return;
    }

    await addDoc(collection(db, "messages"), {
      fromUid: currentUser.uid,
      fromName: currentUser.displayName || currentUser.email,
      toUid: toUser.id,
      toName: username,
      text,
      createdAt: serverTimestamp()
    });

    dmInput.value = "";
    loadMyDMs();
  } catch (err) {
    console.error(err);
    alert("送信エラー：" + err.message);
  }
});
