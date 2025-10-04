import { auth, db } from "./firebase.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const postBtn = document.getElementById("postBtn");

// 認証チェック
auth.onAuthStateChanged(user => {
  if (!user) {
    alert("ログインしてください");
    window.location.href = "login.html";
  }
});

postBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("ログインしてください");
    return;
  }

  // フォーム値取得
  const title = document.getElementById("title").value.trim();
  const key = document.getElementById("key").value.trim();
  const time = document.getElementById("time").value;
  const map = document.getElementById("map").value.trim();
  const rules = document.getElementById("rules").value.trim();
  const follow = document.getElementById("follow").value.trim();
  const method = document.getElementById("method").value;

  if (!title || !key || !time || !map || !rules) {
    alert("必須項目を全て入力してください");
    return;
  }

  try {
    await addDoc(collection(db, "scrims"), {
      title,
      key,
      time,
      map,
      rules,
      follow,
      method,
      hostUid: user.uid,
      createdAt: serverTimestamp()
    });
    alert("投稿完了！");
    window.location.href = "index.html";
  } catch (err) {
    alert("投稿エラー: " + err.message);
    console.error(err);
  }
});
