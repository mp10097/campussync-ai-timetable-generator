const STORE_KEY = "campussync-demo-v1";
const types = {
  teachers: { singular: "teacher", title: "Teachers", description: "Manage teachers and their availability.", name: "Teacher name", detail: "Department", placeholder: "e.g. Aisha Sharma", detailPlaceholder: "e.g. Computer Science" },
  rooms: { singular: "room / lab", title: "Rooms & labs", description: "Manage classrooms, labs, and their capacity.", name: "Room name", detail: "Capacity / type", placeholder: "e.g. Lab 204", detailPlaceholder: "e.g. 40 seats · Computer lab" },
  subjects: { singular: "subject", title: "Subjects", description: "Manage subjects taught across your campus.", name: "Subject name", detail: "Code / weekly sessions", placeholder: "e.g. Data Structures", detailPlaceholder: "e.g. CS201 · 3 sessions" },
  divisions: { singular: "division", title: "Divisions", description: "Manage student groups that need a timetable.", name: "Division name", detail: "Course / semester", placeholder: "e.g. CSE-A", detailPlaceholder: "e.g. B.Tech · Semester 3" }
};
let data = loadData();
let activeTab = "teachers";
let latestSchedule = [];

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    return saved || { teachers: [], rooms: [], subjects: [], divisions: [] };
  } catch { return { teachers: [], rooms: [], subjects: [], divisions: [] }; }
}
function saveData() { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.remove("hidden");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.add("hidden"), 2600);
}
function showView(view) {
  document.querySelectorAll(".view").forEach(el => el.classList.add("hidden"));
  document.getElementById(`${view}View`).classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.view === view));
  document.getElementById("pageTitle").textContent = ({ overview: "Overview", timetable: "Timetable", master: "Master data", conflicts: "Conflicts" })[view];
  if (view === "master") renderRecords();
  if (view === "overview") renderOverview();
  if (view === "timetable") renderTimetable();
  if (view === "conflicts") renderConflicts();
}
function totalRecords() { return Object.values(data).reduce((sum, rows) => sum + rows.length, 0); }
function renderOverview() {
  document.getElementById("teacherCount").textContent = data.teachers.length;
  document.getElementById("roomCount").textContent = data.rooms.length;
  document.getElementById("divisionCount").textContent = data.divisions.length;
  document.getElementById("sessionCount").textContent = latestSchedule.length;
  document.getElementById("dataReadiness").textContent = `${totalRecords()} master records available to the generator.`;
  document.getElementById("readinessStatus").textContent = `${totalRecords()} records`;
  document.getElementById("constraintStatus").textContent = latestSchedule.length ? "Passed" : "Pending";
  document.getElementById("nextAction").textContent = latestSchedule.length ? "Review your timetable" : "Add your campus data";
  const target = document.getElementById("overviewTimetable");
  target.innerHTML = latestSchedule.length ? buildGrid(latestSchedule, true) : `<div class="empty-icon">▤</div><strong>No draft yet</strong><p>Add master data, then generate your first timetable.</p><button class="btn btn-primary" data-go="master">Add your first data</button>`;
  document.getElementById("conflictNav").textContent = "0";
}
function renderRecords() {
  const meta = types[activeTab];
  document.getElementById("tableTitle").textContent = meta.title;
  document.getElementById("tableDescription").textContent = meta.description;
  document.querySelectorAll(".tab").forEach(tab => tab.classList.toggle("active", tab.dataset.tab === activeTab));
  document.getElementById("recordsTable").innerHTML = data[activeTab].length ? `<div class="table-wrap"><table><thead><tr><th>${meta.name}</th><th>${meta.detail}</th><th>Added</th><th></th></tr></thead><tbody>${data[activeTab].map(item => `<tr><td><strong>${escapeHtml(item.name)}</strong></td><td>${escapeHtml(item.detail || "—")}</td><td>Workspace</td><td><button class="delete-btn" data-delete="${item.id}">Delete</button></td></tr>`).join("")}</tbody></table></div>` : `<div class="table-empty">No ${meta.title.toLowerCase()} yet. Add your first record to get started.</div>`;
  document.getElementById("teacherTabCount").textContent = data.teachers.length;
  document.getElementById("roomTabCount").textContent = data.rooms.length;
  document.getElementById("subjectTabCount").textContent = data.subjects.length;
  document.getElementById("divisionTabCount").textContent = data.divisions.length;
}
function buildGrid(schedule, compact = false) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const times = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00"];
  let html = `<div class="table-wrap"><div class="timetable-grid"><div></div>${days.map(d => `<div class="day-head">${d}</div>`).join("")}`;
  times.forEach((time, ti) => {
    html += `<div class="time-label">${time}</div>`;
    days.forEach((day, di) => {
      const item = schedule.find(s => s.day === day && s.time === time);
      html += item ? `<div class="slot filled"><strong>${escapeHtml(item.subject)}</strong><small>${escapeHtml(item.division)}<br>${escapeHtml(item.teacher)} · ${escapeHtml(item.room)}</small></div>` : `<div class="slot"></div>`;
    });
  });
  html += `</div></div>`;
  return html;
}
function generateSchedule() {
  const notice = document.getElementById("timetableNotice");
  if (!data.teachers.length || !data.rooms.length || !data.subjects.length || !data.divisions.length) {
    notice.textContent = "Add at least one teacher, room, subject, and division before generating a timetable.";
    notice.classList.remove("hidden");
    toast("More master data is needed.");
    showView("timetable");
    return;
  }
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const times = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00"];
  const slots = [];
  days.forEach(day => times.forEach(time => slots.push({ day, time })));
  latestSchedule = [];
  const usedTeacher = new Set(), usedRoom = new Set(), usedDivision = new Set();
  let index = 0;
  for (const division of data.divisions) {
    for (const subject of data.subjects) {
      let placed = false;
      for (let tries = 0; tries < slots.length; tries++) {
        const slot = slots[(index + tries) % slots.length];
        const teacher = data.teachers[(index + tries) % data.teachers.length];
        const room = data.rooms[(index + tries) % data.rooms.length];
        const key = `${slot.day}-${slot.time}`;
        if (!usedTeacher.has(`${teacher.id}-${key}`) && !usedRoom.has(`${room.id}-${key}`) && !usedDivision.has(`${division.id}-${key}`)) {
          latestSchedule.push({ ...slot, teacher: teacher.name, room: room.name, subject: subject.name, division: division.name });
          usedTeacher.add(`${teacher.id}-${key}`); usedRoom.add(`${room.id}-${key}`); usedDivision.add(`${division.id}-${key}`);
          index = (index + tries + 1) % slots.length; placed = true; break;
        }
      }
      if (!placed) break;
    }
  }
  notice.textContent = `Draft generated with ${latestSchedule.length} scheduled session(s). This demo uses a simple local scheduling heuristic; review the result before real-world use.`;
  notice.classList.remove("hidden");
  document.getElementById("timetableStatus").textContent = "Draft generated";
  renderOverview(); renderTimetable(); renderConflicts();
  toast("Timetable draft generated.");
}
function renderTimetable() {
  const target = document.getElementById("fullTimetable");
  target.innerHTML = latestSchedule.length ? buildGrid(latestSchedule) : `<div class="empty-icon">▤</div><strong>Your timetable is waiting</strong><p>Add teachers, rooms, subjects and divisions, then generate a draft.</p><button class="btn btn-primary" data-go="master">Set up master data</button>`;
}
function renderConflicts() {
  const el = document.getElementById("conflictContent");
  el.innerHTML = latestSchedule.length ? `<div class="check-row"><span class="check-icon">✓</span><div><strong>Teacher and room slot checks</strong><small>No duplicate teacher or room slot found by the demo generator.</small></div><b>Passed</b></div><div class="check-row"><span class="check-icon">✓</span><div><strong>Division slot checks</strong><small>No division is assigned twice in the same slot.</small></div><b>Passed</b></div><p style="color:#87938d;font-size:11px;margin-top:15px">This is a starter demo, not a production-grade optimizer.</p>` : `<div class="empty-icon">✓</div><strong>No conflicts to review</strong><p>Generate a timetable to run the checks.</p>`;
}
function openModal(type = activeTab) {
  const meta = types[type];
  document.getElementById("recordType").value = type;
  document.getElementById("modalTitle").textContent = `Add ${meta.singular}`;
  document.getElementById("nameLabel").firstChild.textContent = meta.name;
  document.getElementById("recordName").placeholder = meta.placeholder;
  document.getElementById("detailLabel").firstChild.textContent = meta.detail;
  document.getElementById("recordDetail").placeholder = meta.detailPlaceholder;
  document.getElementById("recordName").value = "";
  document.getElementById("recordDetail").value = "";
  document.getElementById("modalBackdrop").classList.remove("hidden");
  document.getElementById("recordName").focus();
}
function closeModal() { document.getElementById("modalBackdrop").classList.add("hidden"); }

document.addEventListener("click", event => {
  const nav = event.target.closest("[data-view]");
  if (nav) showView(nav.dataset.view);
  const go = event.target.closest("[data-go]");
  if (go) showView(go.dataset.go);
  const tab = event.target.closest("[data-tab]");
  if (tab) { activeTab = tab.dataset.tab; renderRecords(); }
  const del = event.target.closest("[data-delete]");
  if (del) {
    data[activeTab] = data[activeTab].filter(item => item.id !== del.dataset.delete);
    saveData(); renderRecords(); renderOverview(); toast("Record deleted.");
  }
});
document.getElementById("openAddModal").addEventListener("click", () => openModal(activeTab));
document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelModal").addEventListener("click", closeModal);
document.getElementById("modalBackdrop").addEventListener("click", e => { if (e.target.id === "modalBackdrop") closeModal(); });
document.getElementById("recordType").addEventListener("change", e => {
  const meta = types[e.target.value];
  document.getElementById("modalTitle").textContent = `Add ${meta.singular}`;
  document.getElementById("nameLabel").firstChild.textContent = meta.name;
  document.getElementById("recordName").placeholder = meta.placeholder;
  document.getElementById("detailLabel").firstChild.textContent = meta.detail;
  document.getElementById("recordDetail").placeholder = meta.detailPlaceholder;
});
document.getElementById("recordForm").addEventListener("submit", e => {
  e.preventDefault();
  const type = document.getElementById("recordType").value;
  const name = document.getElementById("recordName").value.trim();
  const detail = document.getElementById("recordDetail").value.trim();
  if (!name) return;
  data[type].push({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, name, detail });
  activeTab = type; saveData(); closeModal(); renderRecords(); renderOverview(); toast(`${types[type].singular} added.`);
});
document.getElementById("generateBtn").addEventListener("click", generateSchedule);
document.getElementById("heroGenerate").addEventListener("click", generateSchedule);
document.querySelectorAll("[data-go]").forEach(el => el.addEventListener("click", () => {}));
renderOverview();
