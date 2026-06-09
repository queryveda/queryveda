/* storage.js — localStorage API for QueryVeda */

const Storage = {
  // --- Theme ---
  getTheme() {
    // Migrate from old key if needed
    const oldKey = localStorage.getItem("sql_dark");
    if (oldKey !== null && !localStorage.getItem("sql_theme")) {
      localStorage.setItem("sql_theme", oldKey === "1" ? "dark" : "light");
    }
    return localStorage.getItem("sql_theme") || "dark";
  },
  setTheme(theme) {
    localStorage.setItem("sql_theme", theme);
    // Keep old key in sync for backward compat
    localStorage.setItem("sql_dark", theme === "dark" ? "1" : "0");
  },

  // --- Question progress ---
  isSolved(id) {
    return localStorage.getItem("sql_solved_" + id) === "1";
  },
  isAttempted(id) {
    return localStorage.getItem("sql_attempted_" + id) === "1";
  },
  getStatus(id) {
    if (this.isSolved(id)) return "solved";
    if (this.isAttempted(id)) return "attempted";
    return "todo";
  },
  markSolved(id) {
    localStorage.setItem("sql_solved_" + id, "1");
    localStorage.removeItem("sql_attempted_" + id);
    this._recordSolveDate();
    // Sync to cloud
    if (typeof Auth !== "undefined" && Auth.isLoggedIn()) {
      Auth.saveProgress(id, "solved");
    }
  },
  markAttempted(id) {
    if (this.isSolved(id)) return;
    localStorage.setItem("sql_attempted_" + id, "1");
    // Sync to cloud
    if (typeof Auth !== "undefined" && Auth.isLoggedIn()) {
      Auth.saveProgress(id, "attempted");
    }
  },

  // Load cloud progress into localStorage
  async syncFromCloud() {
    if (typeof Auth === "undefined" || !Auth.isLoggedIn()) return;
    try {
      const progress = await Auth.loadProgress();
      for (const p of progress) {
        if (p.status === "solved") {
          localStorage.setItem("sql_solved_" + p.question_id, "1");
          localStorage.removeItem("sql_attempted_" + p.question_id);
        } else if (p.status === "attempted" && !this.isSolved(p.question_id)) {
          localStorage.setItem("sql_attempted_" + p.question_id, "1");
        }
      }
    } catch (e) {
      console.warn("Cloud sync failed:", e);
    }
  },

  // --- Editor content ---
  getSavedSQL(id) {
    return localStorage.getItem("sql_q_" + id) || "";
  },
  saveSQL(id, sql) {
    localStorage.setItem("sql_q_" + id, sql);
  },

  // --- Solve dates (for streak tracking) ---
  _recordSolveDate() {
    const today = new Date().toISOString().slice(0, 10);
    const dates = this.getSolveDates();
    if (!dates.includes(today)) {
      dates.push(today);
      localStorage.setItem("sql_solve_dates", JSON.stringify(dates));
    }
  },
  getSolveDates() {
    try {
      return JSON.parse(localStorage.getItem("sql_solve_dates") || "[]");
    } catch { return []; }
  },

  // --- Aggregate stats ---
  countSolved(questions) {
    return questions.filter(q => this.isSolved(q.id)).length;
  },
  countByDifficulty(questions, difficulty) {
    const subset = questions.filter(q => q.difficulty === difficulty);
    return { total: subset.length, solved: this.countSolved(subset) };
  },
  countByTopic(questions, topic) {
    const subset = questions.filter(q => q.topic === topic);
    return { total: subset.length, solved: this.countSolved(subset) };
  },

  // --- Streak calculation ---
  getCurrentStreak() {
    const dates = this.getSolveDates().sort().reverse();
    if (!dates.length) return 0;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    // Streak must include today or yesterday to be "current"
    if (dates[0] !== today && dates[0] !== yesterday) return 0;
    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = (prev - curr) / 86400000;
      if (diffDays === 1) streak++;
      else break;
    }
    return streak;
  },

  // --- Achievements ---
  getAchievements(questions) {
    const totalSolved = this.countSolved(questions);
    const easySolved = this.countByDifficulty(questions, "Easy").solved;
    const medSolved = this.countByDifficulty(questions, "Medium").solved;
    const hardSolved = this.countByDifficulty(questions, "Hard").solved;
    const streak = this.getCurrentStreak();
    const solveDays = this.getSolveDates().length;

    const defs = [
      { id: "first-steps", name: "First Steps", desc: "Solve your first problem", icon: "\u{1F3AF}", unlocked: totalSolved >= 1 },
      { id: "easy-street", name: "Easy Street", desc: "Solve all 25 Easy problems", icon: "\u{1F7E2}", unlocked: easySolved >= 25 },
      { id: "medium-mastery", name: "Medium Mastery", desc: "Solve all 25 Medium problems", icon: "\u{1F7E1}", unlocked: medSolved >= 25 },
      { id: "hard-hitter", name: "Hard Hitter", desc: "Solve 10 Hard problems", icon: "\u{1F4AA}", unlocked: hardSolved >= 10 },
      { id: "unstoppable", name: "Unstoppable", desc: "Solve all 25 Hard problems", icon: "\u{1F534}", unlocked: hardSolved >= 25 },
      { id: "halfway", name: "Halfway There", desc: "Solve 50% of all problems", icon: "\u2B50", unlocked: totalSolved >= 38 },
      { id: "perfectionist", name: "Perfectionist", desc: "Solve all 75 problems", icon: "\u{1F451}", unlocked: totalSolved >= 75 },
      { id: "join-guru", name: "JOIN Guru", desc: "Complete all Aggregations & JOINs", icon: "\u{1F517}", unlocked: this.countByTopic(questions, "Aggregations & JOINs").solved >= 15 },
      { id: "window-master", name: "Window Master", desc: "Complete all Window Functions", icon: "\u{1FA9F}", unlocked: this.countByTopic(questions, "Window Functions").solved >= 15 },
      { id: "cumulative-pro", name: "Cumulative Pro", desc: "Complete all Cumulative & Sliding Windows", icon: "\u{1F4C8}", unlocked: this.countByTopic(questions, "Cumulative & Sliding Windows").solved >= 15 },
      { id: "sequence-detective", name: "Sequence Detective", desc: "Complete all Consecutive Sequences", icon: "\u{1F50D}", unlocked: this.countByTopic(questions, "Consecutive Sequences").solved >= 15 },
      { id: "analytics-ace", name: "Analytics Ace", desc: "Complete all Advanced Analytics", icon: "\u{1F9E0}", unlocked: this.countByTopic(questions, "Advanced Analytics").solved >= 15 },
      { id: "streak-7", name: "Week Warrior", desc: "Solve problems on 7 different days", icon: "\u{1F525}", unlocked: solveDays >= 7 },
    ];
    return defs;
  }
};
