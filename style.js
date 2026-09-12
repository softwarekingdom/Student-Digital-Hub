// ===== DATA STORAGE =====
let assignments = JSON.parse(localStorage.getItem('assignments')) || [];
let subjects = ['Math', 'Science', 'Tamil', 'English', 'Computer'];

// ===== ELEMENTS =====
const assignmentsList = document.getElementById('assignmentsList');
const emptyState = document.getElementById('emptyState');
const modal = document.getElementById('assignmentModal');
const form = document.getElementById('assignmentForm');

// Stats
const totalEl = document.getElementById('totalAssignments');
const pendingEl = document.getElementById('pendingAssignments');
const progressEl = document.getElementById('progressAssignments');
const completedEl = document.getElementById('completedAssignments');
const overdueEl = document.getElementById('overdueAssignments');

// Filters
const searchInput = document.getElementById('assignmentSearch');
const subjectFilter = document.getElementById('subjectFilter');
const statusFilter = document.getElementById('statusFilter');
const priorityFilter = document.getElementById('priorityFilter');

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadSubjects();
  renderAssignments();
  updateStats();
  setDefaultDates();
});

// ===== SIDEBAR MOBILE =====
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.querySelector('.sidebar');
const overlay = document.getElementById('sidebarOverlay');

mobileMenuBtn.onclick = () => {
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
}
overlay.onclick = () => {
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
}

// ===== MODAL CONTROL =====
document.getElementById('addAssignmentBtn').onclick = () => openModal();
document.getElementById('closeModalBtn').onclick = () => closeModal();
document.getElementById('cancelAssignmentBtn').onclick = () => closeModal();

function openModal(data = null) {
  modal.setAttribute('aria-hidden', 'false');
  form.reset();
  if(data) {
    document.getElementById('modalTitle').innerText = 'Edit Assignment';
    fillForm(data);
  } else {
    document.getElementById('modalTitle').innerText = 'New Assignment';
  }
}

function closeModal() {
  modal.setAttribute('aria-hidden', 'true');
}

// ===== FORM SUBMIT =====
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const newAssignment = {
    id: Date.now(),
    title: document.getElementById('assignmentTitle').value,
    subject: document.getElementById('assignmentSubject').value,
    priority: document.getElementById('assignmentPriority').value,
    description: document.getElementById('assignmentDescription').value,
    assignedDate: document.getElementById('assignedDate').value,
    dueDate: document.getElementById('dueDate').value,
    estimatedTime: document.getElementById('estimatedTime').value,
    progress: parseInt(document.getElementById('assignmentProgress').value),
    resource: document.getElementById('assignmentResource').value,
    notes: document.getElementById('assignmentNotes').value,
    status: getStatus(parseInt(document.getElementById('assignmentProgress').value), document.getElementById('dueDate').value)
  };

  assignments.push(newAssignment);
  saveData();
  renderAssignments();
  updateStats();
  closeModal();
});

function getStatus(progress, dueDate) {
  if(progress === 100) return 'completed';
  if(new Date(dueDate) < new Date() && progress < 100) return 'overdue';
  if(progress > 0) return 'in-progress';
  return 'pending';
}

// ===== RENDER ASSIGNMENTS =====
function renderAssignments() {
  const filtered = filterAssignments();
  assignmentsList.innerHTML = '';

  if(filtered.length === 0) {
    assignmentsList.appendChild(emptyState);
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  filtered.forEach(a => {
    const card = document.createElement('div');
    card.className = 'assignment-card';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h3>${a.title}</h3>
        <span class="badge ${a.priority}">${a.priority}</span>
      </div>
      <p style="font-size:13px; color:var(--muted);">${a.subject}</p>
      <div class="assignment-meta">
        <span>📅 Due: ${a.dueDate}</span>
        <span>⏱️ ${a.estimatedTime} min</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${a.progress}%"></div>
      </div>
      <small>${a.progress}% Complete</small>
      <div class="card-actions">
        <button onclick="editAssignment(${a.id})">✏️ Edit</button>
        <button onclick="deleteAssignment(${a.id})">🗑️ Delete</button>
      </div>
    `;
    assignmentsList.appendChild(card);
  });
}

// ===== FILTERS =====
[searchInput, subjectFilter, statusFilter, priorityFilter].forEach(el => {
  el.addEventListener('input', renderAssignments);
});

function filterAssignments() {
  return assignments.filter(a => {
    const search = searchInput.value.toLowerCase();
    const matchSearch = a.title.toLowerCase().includes(search) || a.description.toLowerCase().includes(search);
    const matchSubject = subjectFilter.value === 'all' || a.subject === subjectFilter.value;
    const matchStatus = statusFilter.value === 'all' || a.status === statusFilter.value;
    const matchPriority = priorityFilter.value === 'all' || a.priority === priorityFilter.value;
    return matchSearch && matchSubject && matchStatus && matchPriority;
  });
}

// ===== STATS =====
function updateStats() {
  totalEl.innerText = assignments.length;
  pendingEl.innerText = assignments.filter(a => a.status === 'pending').length;
  progressEl.innerText = assignments.filter(a => a.status === 'in-progress').length;
  completedEl.innerText = assignments.filter(a => a.status === 'completed').length;
  overdueEl.innerText = assignments.filter(a => a.status === 'overdue').length;
}

// ===== HELPERS =====
function loadSubjects() {
  const subjectSelect = document.getElementById('assignmentSubject');
  subjectFilter.innerHTML = '<option value="all">All Subjects</option>';
  subjects.forEach(s => {
    subjectSelect.innerHTML += `<option value="${s}">${s}</option>`;
    subjectFilter.innerHTML += `<option value="${s}">${s}</option>`;
  });
}

function setDefaultDates() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('assignedDate').value = today;
}

function saveData() {
  localStorage.setItem('assignments', JSON.stringify(assignments));
}

function deleteAssignment(id) {
  if(confirm('Delete this assignment?')) {
    assignments = assignments.filter(a => a.id!== id);
    saveData();
    renderAssignments();
    updateStats();
  }
}

function editAssignment(id) {
  const data = assignments.find(a => a.id === id);
  openModal(data);
}

// Logout button
document.getElementById('logoutBtn').onclick = () => {
  alert('Logout clicked');
}