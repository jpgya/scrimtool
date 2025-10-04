import { auth, db } from "./firebase.js";
import { collection, doc, getDoc, setDoc, query, orderBy, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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
    chatHeader.textContent = "投稿が指定されていません";
    messagesDiv.innerHTML = "<p>無効なDMです</p>";
    sendBtn.disabled = true;
    return;
  }

  // 投稿者の情報を取得
  const postDoc = await getDoc(doc(db, "scrims", postId));
  if (!postDoc.exists()) {
    chatHeader.textContent = "投稿が存在しません";
    messagesDiv.innerHTML = "<p>無効なDMです</p>";
    sendBtn.disabled = true;
    return;
  }

  const postData = postDoc.data();
  currentChatUid = postData.userUid;
  currentChatName = postData.userName || "不明";
  chatHeader.textContent = `DM — ${currentChatName}`;

  // chats/{postId} が存在するか確認し、無ければ作成
  const chatDocRef = doc(db, "chats", postId);
  const chatDocSnap = await getDoc(chatDocRef);
  if (!chatDocSnap.exists()) {
    await setDoc(chatDocRef, {
      postId,
      participants: [myUid, currentChatUid],
      createdAt: new Date()
    });
  }

  // メッセージのリアルタイム監視
  const messagesRef = collection(db, "chats", postId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  onSnapshot(q, snapshot => {
    messagesDiv.innerHTML = "";
    if (snapshot.empty) {
      const p = document.createElement("p");
      p.textContent = "まだメッセージはありません";
      messagesDiv.appendChild(p);
    } else {
      snapshot.forEach(doc => {
        const data = doc.data();
        const msgEl = document.createElement("div");
        msgEl.classList.add("msg", data.fromUid === myUid ? "you" : "other");
        const time = data.createdAt ? new Date(data.createdAt.seconds ? data.createdAt.seconds * 1000 : data.createdAt.getTime()).toLocaleString() : "";
        msgEl.innerHTML = `<p><strong>${data.fromName || data.fromUid}</strong></p><p>${data.text}</p><p class="chat-meta">${time}</p>`;
        messagesDiv.appendChild(msgEl);
      });
    }
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });

  // 送信ボタン
  sendBtn.disabled = false;
  sendBtn.addEventListener("click", async () => {
    const text = msgInput.value.trim();
    if (!text) return;

    await addDoc(messagesRef, {
      fromUid: myUid,
      fromName: auth.currentUser.displayName || "名無し",
      toUid: currentChatUid,
      toName: currentChatName,
      text,
      createdAt: new Date()
    });

    msgInput.value = "";
  });
});
// Enterキーで送信
msgInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

// 戻るボタン
document.getElementById("backBtn").addEventListener("click", () => {
  window.history.back();
});   
// ホームボタン
document.getElementById("homeBtn").addEventListener("click", () => {
  window.location.href = "index.html";
});
// ログアウトボタン
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await auth.signOut();
  window.location.href = "login.html";
});
// プロフィールボタン
document.getElementById("profileBtn").addEventListener("click", () => {
  window.location.href = "profile.html";
}
);  
// 投稿ボタン
document.getElementById("postBtn").addEventListener("click", () => {
  window.location.href = "post.html";
});
// DMボタン
document.getElementById("dmBtn").addEventListener("click", () => {
  window.location.href = "dm_list.html";
}); 
// 設定ボタン
document.getElementById("settingsBtn").addEventListener("click", () => {
  window.location.href = "settings.html";
}); 
// ヘルプボタン
document.getElementById("helpBtn").addEventListener("click", () => {
  window.location.href = "help.html";
});
// チャット一覧ボタン               
document.getElementById("chatListBtn").addEventListener("click", () => {
  window.location.href = "dm_list.html";
});
// 投稿一覧ボタン
document.getElementById("postListBtn").addEventListener("click", () => {
  window.location.href = "index.html";
});
// ユーザー一覧ボタン
document.getElementById("userListBtn").addEventListener("click", () => {
  window.location.href = "user_list.html";
});
// 検索ボタン
document.getElementById("searchBtn").addEventListener("click", () => {
  window.location.href = "search.html";
});
// 通知ボタン
document.getElementById("notificationsBtn").addEventListener("click", () => {
  window.location.href = "notifications.html";
}); 
// 投稿作成ボタン
document.getElementById("createPostBtn").addEventListener("click", () => {
  window.location.href = "post.html";
});
// フレンド一覧ボタン
document.getElementById("friendsBtn").addEventListener("click", () => {
  window.location.href = "friends.html";
}); 
// グループ一覧ボタン
document.getElementById("groupsBtn").addEventListener("click", () => {
  window.location.href = "groups.html";
}); 
// イベント一覧ボタン
document.getElementById("eventsBtn").addEventListener("click", () => {
  window.location.href = "events.html";
}); 
// メッセージ一覧ボタン
document.getElementById("messagesBtn").addEventListener("click", () => {
  window.location.href = "dm_list.html";
}); 
// アクティビティログボタン
document.getElementById("activityLogBtn").addEventListener("click", () => {
  window.location.href = "activity_log.html";
}); 
// ブロックリストボタン 
document.getElementById("blockListBtn").addEventListener("click", () => {
  window.location.href = "block_list.html";
}); 
// プライバシーポリシーボタン
document.getElementById("privacyPolicyBtn").addEventListener("click", () => {
  window.location.href = "privacy_policy.html";
}); 
// 利用規約ボタン
document.getElementById("termsOfServiceBtn").addEventListener("click", () => {
  window.location.href = "terms_of_service.html";
}); 
// フィードバックボタン
document.getElementById("feedbackBtn").addEventListener("click", () => {
  window.location.href = "feedback.html";
}); 
// サポートボタン
document.getElementById("supportBtn").addEventListener("click", () => {
  window.location.href = "support.html";
}); 
// アプリ情報ボタン
document.getElementById("appInfoBtn").addEventListener("click", () => {
  window.location.href = "app_info.html";
});                     
// ダークモード切替ボタン
document.getElementById("darkModeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
}); 
// フォントサイズ切替ボタン
document.getElementById("fontSizeBtn").addEventListener("click", () => {
  const currentSize = window.getComputedStyle(document.body).fontSize;
  const newSize = currentSize === "16px" ? "20px" : "16px";
  document.body.style.fontSize = newSize;
}); 
// 言語切替ボタン
document.getElementById("languageBtn").addEventListener("click", () => {
  const currentLang = document.documentElement.lang;
  const newLang = currentLang === "ja" ? "en" : "ja";
  document.documentElement.lang = newLang;
  alert("言語切替はページの再読み込みが必要です");
}); 
// リセットボタン
document.getElementById("resetBtn").addEventListener("click", () => {
  if (confirm("設定をリセットしますか？")) {
    localStorage.clear();
    location.reload();
    }
});
// ヘルプセンターボタン
document.getElementById("helpCenterBtn").addEventListener("click", () => {
  window.location.href = "help_center.html";
});
// コンタクトサポートボタン
document.getElementById("contactSupportBtn").addEventListener("click", () => {
  window.location.href = "contact_support.html";
});
// FAQボタン
document.getElementById("faqBtn").addEventListener("click", () => {
  window.location.href = "faq.html";
}); 
// チュートリアルボタン
document.getElementById("tutorialBtn").addEventListener("click", () => {
  window.location.href = "tutorial.html";
});