import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

document.getElementById("signup").onclick = async () => {
  const name = nameInput.value;
  const email = emailInput.value;
  const password = passwordInput.value;

  const user = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user.user, { displayName: name });
  await setDoc(doc(db, "users", user.user.uid), { name, email });
  location.href = "index.html";
};

document.getElementById("login").onclick = async () => {
  await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  location.href = "index.html";
};
