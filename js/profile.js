import { db, auth } from "./firebase.js";
import {
  doc, getDoc, setDoc, collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const profileForm = document.getElementById("profileForm");
const displayNameInput = document.getElementById("displayName");
const twitterInput = document.getElementById("twitter");
const discordInput = document.getElementById("discord");
const myScrimsDiv = document.getElementById("myScrims");

// 認証済みユーザー取得
auth.onAuthStateChanged(async user => {
  if (!user) {
    alert("ログインしてください");
    window.location.href = "login.html";
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    displayNameInput.value = data.displayName || "";
    twitterInput.value = data.twitter || "";
    discordInput.value = data.discord || "";
  }

  // 自分が主催したスクリム一覧を取得
  const scrimsQuery = query(
    collection(db, "scrims"),
    where("hostUid", "==", user.uid)
  );
  const scrimsSnap = await getDocs(scrimsQuery);

  myScrimsDiv.innerHTML = "";
  scrimsSnap.forEach(doc => {
    const data = doc.data();
    myScrimsDiv.innerHTML += `
      <div class="post">
        <h3>${data.title}</h3>
        <p>開始: ${data.time}</p>
        <p>ルール: ${data.rules}</p>
        <p>マップ: ${data.map}</p>
        <p>条件: <a href="https://twitter.com/${data.follow}" target="_blank">@${data.follow}</a></p>
        <a href="dm.html?chat=${doc.id}">💬 DM</a>
      </div>
    `;
  });
});

// プロフィール更新
profileForm.addEventListener("submit", async e => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, {
    displayName: displayNameInput.value,
    twitter: twitterInput.value,
    discord: discordInput.value
  }, { merge: true });

  alert("プロフィールを更新しました");
});
