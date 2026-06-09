/* auth.js — Supabase Auth for QueryVeda */

const SUPABASE_URL = "https://rgykwhoizdzxvcuzdhle.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJneWt3aG9pemR6eHZjdXpkaGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5OTg0MzUsImV4cCI6MjA5NjU3NDQzNX0.Gl-dX34Dm6cofTXF-zPMBx6FyJoDVyrfhgxdFIUX-78";

const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const Auth = {
  _user: null,
  _ready: false,
  _readyCallbacks: [],

  async init() {
    try {
      const { data: { session } } = await _sb.auth.getSession();
      this._user = session?.user || null;
    } catch (e) {
      console.warn("Auth init failed:", e);
      this._user = null;
    }
    this._ready = true;
    this._readyCallbacks.forEach(cb => cb());
    this._readyCallbacks = [];

    // Listen for auth changes (OAuth redirect, logout, etc.)
    _sb.auth.onAuthStateChange((event, session) => {
      this._user = session?.user || null;
      if (event === "SIGNED_IN") {
        // Sync localStorage progress to Supabase on first login
        this._syncLocalToCloud();
        Nav._updateAuthUI();
        // Reload page to reflect auth state
        location.reload();
      }
      if (event === "SIGNED_OUT") {
        Nav._updateAuthUI();
        location.reload();
      }
    });
  },

  onReady(cb) {
    if (this._ready) cb();
    else this._readyCallbacks.push(cb);
  },

  getUser() {
    if (!this._user) return null;
    const meta = this._user.user_metadata || {};
    return {
      id: this._user.id,
      name: meta.full_name || meta.name || this._user.email?.split("@")[0] || "User",
      email: this._user.email,
      avatar: meta.avatar_url || meta.picture || null
    };
  },

  isLoggedIn() {
    return this._user !== null;
  },

  // --- Email/Password auth ---
  async signup(name, email, password) {
    if (!name || !email || !password) return { ok: false, msg: "All fields are required." };
    if (password.length < 6) return { ok: false, msg: "Password must be at least 6 characters." };
    const { data, error } = await _sb.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    if (error) return { ok: false, msg: error.message };
    if (data.user && !data.session) {
      return { ok: true, msg: "Check your email to confirm your account." };
    }
    return { ok: true };
  },

  async login(email, password) {
    if (!email || !password) return { ok: false, msg: "Email and password are required." };
    const { error } = await _sb.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, msg: error.message };
    return { ok: true };
  },

  async logout() {
    await _sb.auth.signOut();
  },

  // --- OAuth (Google, LinkedIn) ---
  async loginWithGoogle() {
    await _sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: location.origin + location.pathname }
    });
  },

  async loginWithLinkedIn() {
    await _sb.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: { redirectTo: location.origin + location.pathname }
    });
  },

  // --- Cloud progress sync ---
  async saveProgress(questionId, status) {
    if (!this._user) return;
    const row = {
      user_id: this._user.id,
      question_id: questionId,
      status: status,
      updated_at: new Date().toISOString()
    };
    if (status === "solved") row.solved_at = new Date().toISOString();
    await _sb.from("user_progress").upsert(row, { onConflict: "user_id,question_id" });
  },

  async loadProgress() {
    if (!this._user) return [];
    const { data } = await _sb.from("user_progress")
      .select("question_id, status, solved_at")
      .eq("user_id", this._user.id);
    return data || [];
  },

  // Sync existing localStorage progress to cloud on first login
  async _syncLocalToCloud() {
    if (!this._user) return;
    const { data: existing } = await _sb.from("user_progress")
      .select("question_id")
      .eq("user_id", this._user.id);
    const cloudIds = new Set((existing || []).map(r => r.question_id));

    const rows = [];
    for (let i = 1; i <= 75; i++) {
      if (cloudIds.has(i)) continue; // don't overwrite cloud data
      const solved = localStorage.getItem("sql_solved_" + i) === "1";
      const attempted = localStorage.getItem("sql_attempted_" + i) === "1";
      if (solved) {
        rows.push({ user_id: this._user.id, question_id: i, status: "solved", solved_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      } else if (attempted) {
        rows.push({ user_id: this._user.id, question_id: i, status: "attempted", updated_at: new Date().toISOString() });
      }
    }
    if (rows.length) {
      await _sb.from("user_progress").upsert(rows, { onConflict: "user_id,question_id" });
    }
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

        <div class="auth-social">
          <button class="auth-social-btn google" id="googleBtn">
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>
          <button class="auth-social-btn linkedin" id="linkedinBtn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            Continue with LinkedIn
          </button>
        </div>

        <div class="auth-divider"><span>or</span></div>

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

    // Google
    document.getElementById("googleBtn").addEventListener("click", () => Auth.loginWithGoogle());
    // LinkedIn
    document.getElementById("linkedinBtn").addEventListener("click", () => Auth.loginWithLinkedIn());

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
    document.getElementById("authForm").addEventListener("submit", async e => {
      e.preventDefault();
      const email = document.getElementById("authEmail").value.trim();
      const password = document.getElementById("authPassword").value;
      const name = document.getElementById("authName").value.trim();
      const errEl = document.getElementById("authError");
      const submitBtn = document.getElementById("authSubmit");

      submitBtn.disabled = true;
      submitBtn.textContent = "Please wait...";

      let result;
      if (currentMode === "signup") {
        result = await Auth.signup(name, email, password);
      } else {
        result = await Auth.login(email, password);
      }

      if (result.ok) {
        if (result.msg) {
          errEl.style.color = "var(--success)";
          errEl.textContent = result.msg;
          submitBtn.textContent = currentMode === "signup" ? "Sign Up" : "Login";
          submitBtn.disabled = false;
        } else {
          overlay.remove();
        }
      } else {
        errEl.style.color = "var(--danger)";
        errEl.textContent = result.msg;
        submitBtn.textContent = currentMode === "signup" ? "Sign Up" : "Login";
        submitBtn.disabled = false;
      }
    });
  }
};
