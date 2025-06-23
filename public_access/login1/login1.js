// login1.js (updated for backend API)

const container = document.getElementById("container");
const registerBtn = document.getElementById("register");
const loginBtn = document.getElementById("login");
const popup = document.getElementById("popup");

registerBtn.addEventListener("click", () => container.classList.add("active"));
loginBtn.addEventListener("click", () => container.classList.remove("active"));

function showPopup(message) {
  popup.textContent = message;
  popup.classList.remove("hidden");
  popup.classList.add("show");
  setTimeout(() => {
    popup.classList.remove("show");
    popup.classList.add("hidden");
  }, 3000);
}

document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("signup-username").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();

  if (!username || !email || !password) {
    return showPopup("Please fill in all fields.");
  }

  try {
    const response = await fetch("http://localhost:3000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      showPopup(data.message || "Signup failed.");
      return;
    }

    container.classList.remove("active"); // Switch to sign-in form
    showPopup("Account created! You may now sign in.");
  } catch (error) {
    showPopup("Server error. Please try again later.");
  }
});

document.getElementById("signin-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("signin-username").value.trim();
  const password = document.getElementById("signin-password").value.trim();

  if (!username || !password) {
    return showPopup("Please enter username and password.");
  }

  try {
    const response = await fetch("http://localhost:3000/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      showPopup(data.message || "Login failed.");
      return;
    }

    showPopup("Login successful! Redirecting...");
    setTimeout(() => {
      window.location.href = "test.html";
    }, 1500);
  } catch (error) {
    showPopup("Server error. Please try again later.");
  }
});
