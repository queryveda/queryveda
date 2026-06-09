/* auth.js — Client-side auth for QueryVeda */

const Auth = {
  getUser() {
    try {
      return JSON.parse(localStorage.getItem("qv_user"));
    } catch { return null; }
  },

  isLoggedIn() {
    return this.getUser() !== null;
  },

  signup(name, email, password) {
    if (!name || !email || !password) return { ok: false, msg: "All fields are required." };
    if (password.length < 6) return { ok: false, msg: "Password must be at least 6 characters." };
    const users = this._getUsers();
    if (users[email]) return { ok: false, msg: "An account with this email already exists." };
    users[email] = { name, email, password: btoa(password), created: new Date().toISOString() };
    localStorage.setItem("qv_users", JSON.stringify(users));
    localStorage.setItem("qv_user", JSON.stringify({ name, email }));
    return { ok: true };
  },

  login(email, password) {
    if (!email || !password) return { ok: false, msg: "Email and password are required." };
    const users = this._getUsers();
    const user = users[email];
    if (!user || atob(user.password) !== password) return { ok: false, msg: "Invalid email or password." };
    localStorage.setItem("qv_user", JSON.stringify({ name: user.name, email: user.email }));
    return { ok: true };
  },

  logout() {
    localStorage.removeItem("qv_user");
  },

  _getUsers() {
    try {
      return JSON.parse(localStorage.getItem("qv_users") || "{}");
    } catch { return {}; }
  },

  // Show auth modal
  showModal(mode) {
    const existing = document.getElementById("authOverlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "authOverlay";
    overlay.innerHTML = `
      <div class="auth-modal">
        <button class="auth-close" id="authClose">&times;</button>
        <h2 id="authTitle">${mode === "signup" ? "Create Account" : "Welcome Back"}</h2>
        <div class="auth-tabs">
          <button class="auth-tab ${mode === "login" ? "active" : ""}" data-mode="login">Login</button>
          <button class="auth-tab ${mode === "signup" ? "active" : ""}" data-mode="signup">Sign Up</button>
        </div>
        <form id="authForm">
          <div id="nameField" style="display:${mode === "signup" ? "block" : "none"}">
            <input type="text" id="authName" placeholder="Full name" autocomplete="name">
          </div>
          <input type="email" id="authEmail" placeholder="Email" autocomplete="email">
          <input type="password" id="authPassword" placeholder="Password" autocomplete="${mode === "signup" ? "new-password" : "current-password"}">
          <div class="auth-error" id="authError"></div>
          <button type="submit" class="auth-submit" id="authSubmit">${mode === "signup" ? "Sign Up" : "Login"}</button>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    let currentMode = mode;

    // Close
    document.getElementById("authClose").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });

    // Tab switching
    overlay.querySelectorAll(".auth-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        currentMode = tab.dataset.mode;
        overlay.querySelectorAll(".auth-tab").forEach(t => t.classList.toggle("active", t === tab));
        document.getElementById("authTitle").textContent = currentMode === "signup" ? "Create Account" : "Welcome Back";
        document.getElementById("nameField").style.display = currentMode === "signup" ? "block" : "none";
        document.getElementById("authSubmit").textContent = currentMode === "signup" ? "Sign Up" : "Login";
        document.getElementById("authError").textContent = "";
      });
    });

    // Submit
    document.getElementById("authForm").addEventListener("submit", e => {
      e.preventDefault();
      const email = document.getElementById("authEmail").value.trim();
      const password = document.getElementById("authPassword").value;
      const name = document.getElementById("authName").value.trim();
      const errEl = document.getElementById("authError");

      let result;
      if (currentMode === "signup") {
        result = Auth.signup(name, email, password);
      } else {
        result = Auth.login(email, password);
      }

      if (result.ok) {
        overlay.remove();
        Nav._updateAuthUI();
      } else {
        errEl.textContent = result.msg;
      }
    });
  }
};
