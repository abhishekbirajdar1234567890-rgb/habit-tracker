const STORAGE_KEY = "habit-tracker-habits";

const state = loadState();
const today = dateKey(new Date());

const elements = {
  todayLabel: document.querySelector("#todayLabel"),
  progressRing: document.querySelector("#progressRing"),
  progressPercent: document.querySelector("#progressPercent"),
  completedCount: document.querySelector("#completedCount"),
  totalCount: document.querySelector("#totalCount"),
  habitList: document.querySelector("#habitList"),
  habitTemplate: document.querySelector("#habitTemplate"),
  addForm: document.querySelector("#addForm"),
  habitInput: document.querySelector("#habitInput"),
  showAddButton: document.querySelector("#showAddButton"),
  clearAllButton: document.querySelector("#clearAllButton"),
};

elements.todayLabel.textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
}).format(new Date());

elements.showAddButton.addEventListener("click", () => {
  elements.addForm.hidden = !elements.addForm.hidden;
  if (!elements.addForm.hidden) elements.habitInput.focus();
});

elements.addForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = elements.habitInput.value.trim();
  if (!name) return;

  state.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name,
    completedDates: [],
  });
  elements.habitInput.value = "";
  elements.addForm.hidden = true;
  saveAndRender();
});

elements.clearAllButton.addEventListener("click", () => {
  if (!state.length || !window.confirm("Reset and remove all habits?")) return;
  state.splice(0);
  saveAndRender();
});

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored : [
      { id: "drink-water", name: "Drink 8 glasses of water", completedDates: [] },
      { id: "exercise", name: "Exercise for 30 minutes", completedDates: [] },
      { id: "read", name: "Read for 20 minutes", completedDates: [] },
    ];
  } catch {
    return [];
  }
}

function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function render() {
  elements.habitList.replaceChildren();
  const completed = state.filter((habit) => habit.completedDates.includes(today)).length;
  const total = state.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  elements.completedCount.textContent = completed;
  elements.totalCount.textContent = total;
  elements.progressPercent.textContent = `${percent}%`;
  elements.progressRing.style.setProperty("--progress", `${percent * 3.6}deg`);

  if (!total) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No habits yet. Add one to get started.";
    elements.habitList.append(empty);
    return;
  }

  state.forEach((habit) => {
    const item = elements.habitTemplate.content.firstElementChild.cloneNode(true);
    const isComplete = habit.completedDates.includes(today);
    item.classList.toggle("completed", isComplete);

    item.querySelector("h3").textContent = habit.name;
    item.querySelector("p").textContent = `${getStreak(habit)} day streak`;

    const checkButton = item.querySelector(".habit-check");
    checkButton.setAttribute("aria-label", isComplete ? `Mark ${habit.name} incomplete` : `Mark ${habit.name} complete`);
    checkButton.addEventListener("click", () => toggleHabit(habit.id));

    item.querySelector(".delete-button").addEventListener("click", () => {
      const index = state.findIndex((entry) => entry.id === habit.id);
      if (index >= 0) {
        state.splice(index, 1);
        saveAndRender();
      }
    });

    elements.habitList.append(item);
  });
}

function toggleHabit(id) {
  const habit = state.find((entry) => entry.id === id);
  if (!habit) return;

  const index = habit.completedDates.indexOf(today);
  if (index >= 0) habit.completedDates.splice(index, 1);
  else habit.completedDates.push(today);

  saveAndRender();
}

function getStreak(habit) {
  const completed = new Set(habit.completedDates);
  let cursor = new Date();
  if (!completed.has(today)) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (completed.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

render();
