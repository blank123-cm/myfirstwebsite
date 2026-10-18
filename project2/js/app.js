document.addEventListener("DOMContentLoaded", () => {
  // Read and store demo data in browser session storage.
  const read = (key) => {
    try {
      return JSON.parse(sessionStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  };

  const write = (key, value) => sessionStorage.setItem(key, JSON.stringify(value));

  // Escape user input before injecting it into the page.
  const safe = (value) =>
    String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));

  // Show the current user's display name on the dashboard.
  const name = sessionStorage.getItem("fittrackName");
  const displayName = document.getElementById("displayName");
  if (displayName && name) {
    displayName.textContent = name;
  }

  const today = document.getElementById("todayDate");
  if (today) {
    today.textContent = new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  // Handle login and keep the demo session in browser storage.
  const login = document.getElementById("loginForm");
  if (login) {
    login.addEventListener("submit", (event) => {
      event.preventDefault();
      sessionStorage.setItem(
        "fittrackName",
        document.getElementById("email").value.split("@")[0] || "User"
      );
      location.href = "dashboard.html";
    });
  }

  // Validate registration and redirect to the dashboard.
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (document.getElementById("regPass").value !== document.getElementById("confirmPass").value) {
        return alert("Passwords do not match.");
      }

      sessionStorage.setItem("fittrackName", document.getElementById("name").value.trim());
      alert("Demo registration complete. No account was saved.");
      location.href = "dashboard.html";
    });
  }

  // Open and close the logout confirmation modal.
  const modal = document.getElementById("logoutModal");
  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.onclick = () => {
      if (modal) modal.hidden = false;
    };
  });

  const cancelLogout = document.getElementById("cancelLogout");
  if (cancelLogout) {
    cancelLogout.onclick = () => {
      if (modal) modal.hidden = true;
    };
  }

  const confirmLogout = document.getElementById("confirmLogout");
  if (confirmLogout) {
    confirmLogout.onclick = () => {
      sessionStorage.removeItem("fittrackName");
      location.href = "index.html";
    };
  }

  const toggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  if (toggle && sidebar) {
    toggle.onclick = () => sidebar.classList.toggle("open");
  }

  // Save a new workout entry and refresh the dashboard summary.
  const form = document.getElementById("workoutForm");
  if (form) {
    document.getElementById("date").value = new Date().toISOString().slice(0, 10);

    form.onsubmit = (event) => {
      event.preventDefault();

      const workouts = read("workouts");
      workouts.unshift({
        date: date.value,
        exercise: exercise.value,
        muscle: muscle.value,
        sets: sets.value,
        reps: reps.value,
        weight: weight.value,
        duration: Number(duration.value)
      });

      write("workouts", workouts);
      renderWorkouts();
      form.reset();
      date.value = new Date().toISOString().slice(0, 10);
      alert("Workout added for this browser session only.");
    };
  }

  // Populate each workout table from the saved session data.
  function renderRows(id) {
    const element = document.getElementById(id);
    if (!element) return;

    const workouts = read("workouts");
    element.innerHTML = workouts.length
      ? workouts
          .map(
            (item) => `
              <tr>
                <td>${safe(item.date)}</td>
                <td>${safe(item.exercise)}<br /><small>${safe(item.muscle)}</small></td>
                <td>${item.sets} × ${item.reps}</td>
                <td>${item.weight} kg</td>
                <td>${item.duration} min</td>
              </tr>
            `
          )
          .join("")
      : '<tr><td colspan="5">No workout entries yet.</td></tr>';
  }

  // Refresh the totals and recent activity widgets on the dashboard.
  function renderWorkouts() {
    renderRows("workoutRows");
    renderRows("historyRows");

    const workouts = read("workouts");

    const workoutCount = document.getElementById("workoutCount");
    if (workoutCount) {
      workoutCount.innerHTML = `${workouts.length} <small>sessions</small>`;
    }

    const minuteCount = document.getElementById("minuteCount");
    if (minuteCount) {
      minuteCount.innerHTML = `${workouts.reduce((sum, item) => sum + item.duration, 0)} <small>mins</small>`;
    }

    const progressCount = document.getElementById("progressCount");
    if (progressCount) {
      progressCount.textContent = workouts.length;
    }

    const progressMinutes = document.getElementById("progressMinutes");
    if (progressMinutes) {
      progressMinutes.textContent = `${workouts.reduce((sum, item) => sum + item.duration, 0)} mins`;
    }

    const recent = document.getElementById("recent");
    if (recent) {
      recent.innerHTML = workouts.length
        ? workouts
            .slice(0, 4)
            .map(
              (item) => `<p><b>${safe(item.exercise)}</b> — ${safe(item.date)}, ${item.duration} mins</p>`
            )
            .join("")
        : 'No workouts yet. <a href="workouts.html">Record your first workout</a>.';
    }
  }

  renderWorkouts();

  // Save a new goal and update the goal list immediately.
  const goalForm = document.getElementById("goalForm");
  if (goalForm) {
    goalForm.onsubmit = (event) => {
      event.preventDefault();

      const goals = read("goals");
      goals.unshift({
        title: goalTitle.value,
        type: goalType.value,
        target: goalTarget.value,
        date: goalDate.value
      });

      write("goals", goals);
      renderGoals();
      goalForm.reset();
    };
  }

  // Render saved goals and keep the counters in sync.
  function renderGoals() {
    const list = document.getElementById("goalsList");
    if (list) {
      const goals = read("goals");
      list.innerHTML = goals.length
        ? goals
            .map(
              (goal) => `
                <article>
                  <b>${safe(goal.title)}</b>
                  <p>${safe(goal.type)} · Target: ${safe(goal.target)} · Due: ${safe(goal.date)}</p>
                </article>
              `
            )
            .join("")
        : "No goals yet.";
    }

    const goalCount = document.getElementById("goalCount");
    if (goalCount) {
      goalCount.innerHTML = `${read("goals").length} <small>goals</small>`;
    }

    const progressGoals = document.getElementById("progressGoals");
    if (progressGoals) {
      progressGoals.textContent = read("goals").length;
    }
  }

  renderGoals();

  // Search and filter exercise cards by name and muscle group.
  const search = document.getElementById("tutorialSearch");
  const filter = document.getElementById("categoryFilter");

  function applyFilter() {
    document.querySelectorAll("#tutorialGrid article").forEach((card) => {
      const term = search ? search.value.toLowerCase() : "";
      const category = filter ? filter.value : "all";
      const matches =
        card.dataset.name.includes(term) && (category === "all" || card.dataset.category === category);
      card.style.display = matches ? "" : "none";
    });
  }

  if (search) {
    search.oninput = applyFilter;
  }

  if (filter) {
    filter.onchange = applyFilter;
  }

  // Placeholder tutorial action for the demo UI.
  document.querySelectorAll(".video-demo").forEach((button) => {
    button.onclick = () => {
      alert("Tutorial video for " + button.dataset.exercise + " will be linked in a later version.");
    };
  });
});