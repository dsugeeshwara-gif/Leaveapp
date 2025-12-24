const SCRIPT_URL = "මෙතැනට_ඔබේ_WEB_APP_URL_එක_දමන්න";
let currentUser = null;
let selectedDates = [];
let currentMonth = new Date();

async function login() {
    let rawId = document.getElementById("employeeIdInput").value.trim().toUpperCase();
    let numbersOnly = rawId.replace(/\D/g, ""); 
    let formattedId = "EMP" + numbersOnly.padStart(3, '0');

    document.getElementById("authMessage").innerText = "සම්බන්ධ වෙමින්...";

    try {
        const response = await fetch(SCRIPT_URL + "?action=getUsers");
        const users = await response.json();

        if (users[formattedId]) {
            currentUser = { id: formattedId, ...users[formattedId] };
            document.getElementById("login-section").style.display = "none";
            document.getElementById("leave-section").style.display = "block";
            document.getElementById("welcome-text").innerText = "ආයුබෝවන්, " + currentUser.name;
            renderCalendar();

            if (formattedId === "EMP028") {
                document.getElementById("admin-section").style.display = "block";
                loadPendingLeaves();
            }
        } else {
            document.getElementById("authMessage").innerText = "වැරදි සේවා අංකයක්!";
        }
    } catch (e) { document.getElementById("authMessage").innerText = "සම්බන්ධතාවය බිඳ වැටුණි."; }
}

function renderCalendar() {
    const grid = document.getElementById("calendar-grid");
    const monthDisplay = document.getElementById("month-display");
    grid.innerHTML = "";
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    monthDisplay.innerText = new Intl.DateTimeFormat('si-LK', { month: 'long', year: 'numeric' }).format(currentMonth);
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) grid.innerHTML += `<div></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isSelected = selectedDates.includes(dateStr) ? "selected" : "";
        grid.innerHTML += `<div class="calendar-day ${isSelected}" onclick="toggleDate('${dateStr}')">${d}</div>`;
    }
}

function toggleDate(date) {
    const index = selectedDates.indexOf(date);
    if (index > -1) selectedDates.splice(index, 1);
    else {
        if (selectedDates.length >= 5) return alert("උපරිම දින 5ක් පමණි.");
        selectedDates.push(date);
    }
    document.getElementById("date-list").innerText = "තෝරාගත් දින: " + selectedDates.join(", ");
    renderCalendar();
}

function changeMonth(step) {
    currentMonth.setMonth(currentMonth.getMonth() + step);
    renderCalendar();
}

async function submitLeave() {
    if (selectedDates.length === 0 || !document.getElementById("reason").value) return alert("දින සහ හේතුව සම්පූර්ණ කරන්න.");
    document.getElementById("submission-status").innerText = "යවමින් පවතී...";
    let params = new URLSearchParams({ employeeId: currentUser.id, name: currentUser.name, role: currentUser.role, leaveDates: selectedDates.join(", "), reason: document.getElementById("reason").value });
    await fetch(SCRIPT_URL, { method: 'POST', body: params });
    alert("අයදුම්පත සාර්ථකව යවන ලදී!");
    location.reload();
}

async function loadPendingLeaves() {
    const listDiv = document.getElementById("pending-leaves-list");
    const response = await fetch(SCRIPT_URL + "?action=getLeaves");
    const leaves = await response.json();
    listDiv.innerHTML = leaves.length === 0 ? "නිවාඩු නැත." : "";
    leaves.forEach(l => {
        listDiv.innerHTML += `<div class="leave-item"><p><b>${l.name}</b> (${l.id})<br>දින: ${l.dates}<br>හේතුව: ${l.reason}</p>
        <button onclick="updateLeaveStatus(${l.row}, 'Approved')" style="background:green; color:white; border:none; padding:5px; border-radius:5px; width:45%;">අනුමතයි</button>
        <button onclick="updateLeaveStatus(${l.row}, 'Rejected')" style="background:red; color:white; border:none; padding:5px; border-radius:5px; width:45%;">ප්‍රතික්ෂේපයි</button></div>`;
    });
}

async function updateLeaveStatus(r, s) {
    await fetch(SCRIPT_URL, { method: 'POST', body: new URLSearchParams({ action: "updateStatus", row: r, status: s }) });
    alert("නිවාඩුව " + s); loadPendingLeaves();
}

async function addNewMember() {
    let params = new URLSearchParams({ action: "addMember", empId: "EMP" + document.getElementById("newEmpId").value.replace(/\D/g, "").padStart(3, '0'), name: document.getElementById("newName").value, role: document.getElementById("newRole").value });
    await fetch(SCRIPT_URL, { method: 'POST', body: params });
    alert("එක් කරන ලදී!"); location.reload();
}
