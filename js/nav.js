/* nav.js — Shared navbar, theme toggle, footer */

const Nav = {
  init() {
    this._injectNav();
    this._injectFooter();
    this._initTheme();
  },

  _injectNav() {
    const currentPage = location.pathname.split("/").pop() || "index.html";
    const nav = document.createElement("nav");
    nav.className = "site-nav";
    nav.innerHTML = `
      <div class="nav-inner">
        <a href="index.html" class="nav-logo">\u{1F418} QueryVeda</a>
        <button class="nav-hamburger" id="navHamburger" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
        <div class="nav-links" id="navLinks">
          <a href="index.html" class="${currentPage === 'index.html' ? 'active' : ''}">Home</a>
          <a href="problems.html" class="${currentPage === 'problems.html' ? 'active' : ''}">Problems</a>
          <a href="practice.html" class="${currentPage === 'practice.html' ? 'active' : ''}">Practice</a>
          <a href="progress.html" class="${currentPage === 'progress.html' ? 'active' : ''}">Progress</a>
        </div>
        <button class="nav-theme-toggle" id="themeToggle" aria-label="Toggle theme"></button>
      </div>
    `;
    document.body.prepend(nav);

    // Hamburger toggle
    const hamburger = document.getElementById("navHamburger");
    const links = document.getElementById("navLinks");
    hamburger.addEventListener("click", () => {
      links.classList.toggle("open");
      hamburger.classList.toggle("open");
    });
  },

  _injectFooter() {
    const footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML = `<p>QueryVeda \u00B7 Built with <a href="https://electric-sql.com/product/pglite" target="_blank">PGlite</a> \u00B7 PostgreSQL in the browser</p>`;
    document.body.appendChild(footer);
  },

  _initTheme() {
    const theme = Storage.getTheme();
    document.body.classList.add(theme);
    this._updateToggleIcon(theme);

    document.getElementById("themeToggle").addEventListener("click", () => {
      const current = document.body.classList.contains("dark") ? "dark" : "light";
      const next = current === "dark" ? "light" : "dark";
      document.body.classList.remove(current);
      document.body.classList.add(next);
      Storage.setTheme(next);
      this._updateToggleIcon(next);
    });
  },

  _updateToggleIcon(theme) {
    const btn = document.getElementById("themeToggle");
    btn.textContent = theme === "dark" ? "\u2600\uFE0F" : "\u{1F319}";
  }
};
