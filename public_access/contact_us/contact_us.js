const container = document.getElementById("container");
const registerBtn = document.getElementById("register"); // Button for Contact Info panel
const loginBtn = document.getElementById("login");       // Button for Contact Form panel

registerBtn.addEventListener("click", () => {
  // Show Contact Info panel (sign-up) by adding 'active' class
  container.classList.add("active");
});

loginBtn.addEventListener("click", () => {
  // Show Contact Form panel (sign-in) by removing 'active' class
  container.classList.remove("active");
});
