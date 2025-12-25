// ඔයාගේ URL එක මෙන්න මම ඇතුළත් කළා
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwgM-_vzIcRU1oJaX2fqRCgDDV-IAcBm1ntrCz8nE4ZAVR17bxhwnhuvNXoiy8UrldZ/exec";

let db = { users: [], leaves: [] };
let me = null;
let selectedDates = [];

// පිවිසීමේ ශ්‍රිතය (Login Function)
async function login() {
    const inputVal = document.getElementById("empIdInput").value;
    if (!inputVal) return alert("කරුණාකර සේවා අංකය ඇතුළත් කරන්න!");
    
    showLoading(true);
    const empId = "EMP" + inputVal.padStart(3, '0');

    try {
        // Google Sheet එකෙන් දත්ත ලබා ගැනීම
        const response = await fetch(`${SCRIPT_URL}?action=getInitialData`);
        const data = await response.json();
        
        db.users = data.users.map(u => ({ id: String(u[0]), name: u[1], role: u[2] }));
        db.leaves = data.leaves.map(l => ({
            id: l[0], empId: String(l[1]), name: l[2], dayOnly: l[3], 
            fullDates: String(l[4]).split(","), status: l[6], actionBy: l[7], reason: l[5]
        }));

        // පරිශීලකයා පරීක්ෂා කිරීම
        me = db.users.find(u => u.id.toUpperCase() === empId.toUpperCase());

        if (me) {
            document.getElementById("login-section").style.display = "none";
            document.getElementById("user-section").style.display = "block";
            document.getElementById("display-name").innerText = me.name;
            document.getElementById("display-role-badge").innerHTML = `<span class="badge">${me.role}</span>`;
            document.getElementById("display-photo").src = `https://ui-avatars.com/api/?name=${me.name}&background=1e3a8a&color=fff`;

            renderCalendar();
            showMyLeaves();
            checkPermissions();
        } else {
            alert("මෙම සේවා අංකය පද්ධතියේ නැත. කරුණාකර පරිපාලක අමතන්න!");
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("දත්ත පූරණය කිරීමේ දෝෂයකි. ඔබගේ අන්තර්ජාල සම්බන්ධතාවය පරීක්ෂා කරන්න.");
    }
    showLoading(false);
}

// බලතල පරීක්ෂා කිරීම (Permissions)
function checkPermissions() {
    if (me.id === "EMP028") document.getElementById("super-admin-section").style.display = "block";
    if (["EMP028", "EMP001", "EMP018"].includes(me.id)) {
        document.getElementById("approver-panel").style.display = "block";
        renderAdmin();
    }
}

// දින දර්ශනය පෙන්වීම
function renderCalendar() {
    const grid = document.getElementById("calendar-grid");
    grid.innerHTML = "";
    const now = new Date();
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    for (let i = 1; i <= days; i++) {
        const dStr = `${now.getFullYear()}-${now.getMonth() + 1}-${i}`;
        // දැනටමත් නිවාඩු 4ක් ලබාගෙන ඇති දින පරීක්ෂා කිරීම
        const count = db.leaves.filter(l => l.fullDates.includes(dStr) && l.status !== "Rejected").length;
        const isFull = count >= 4;
        const isSel = selectedDates.includes(dStr);

        grid.innerHTML += `<div class="day ${isFull ? 'full' : ''} ${isSel ? 'selected' : ''}" 
            onclick="${!isFull ? `toggleDate('${dStr}')` : ''}">${i}</div>`;
    }
}

function toggleDate(d) {
    const idx = selectedDates.indexOf(d);
    if (idx > -1) selectedDates.splice(idx, 1);
    else if (selectedDates.length < 4) selectedDates.push(d);
    renderCalendar();
}

// නිවාඩු අයදුම්පත යැවීම
async function submitLeave() {
    if (selectedDates.length === 0) return alert("කරුණාකර අවම වශයෙන් එක් දිනයක්වත් තෝරන්න!");
    
    showLoading(true);
    const sorted = selectedDates.sort((a, b) => new Date(a) - new Date(b));
    const dayOnly = sorted.map(d => d.split("-")[2]).join(", ");

    const body = new URLSearchParams({
        action: "submitLeave",
        empId: me.id,
        name: me.name,
        dayOnly: dayOnly,
        fullDates: sorted.join(","),
        reason: document.getElementById("reason").value || "හේතුවක් සඳහන් කර නැත"
    });

    try {
        await fetch(SCRIPT_URL, { method: "POST", body });
        alert("නිවාඩු අයදුම්පත සාර්ථකව යවන ලදී!");
        location.reload();
    } catch (e) {
        alert("අයදුම්පත යැවීමට නොහැකි විය. නැවත උත්සාහ කරන්න.");
        showLoading(false);
    }
}

// මගේ නිවාඩු පෙන්වීම
function showMyLeaves() {
    const my = db.leaves.filter(l => l.empId === me.id);
    document.getElementById("my-leaves").innerHTML = my.length ? my.map(l => `
        <div class="leave-item">
            <span>📅 <b>${l.dayOnly}</b></span>
            <span class="status-label status-${l.status}">${l.status}</span>
        </div>`).join("") : "<p style='font-size:13px; color:#94a3b8;'>වාර්තා කිසිවක් නැත.</p>";
}

// Admin පැනලය පෙන්වීම
function renderAdmin() {
    const pending = db.leaves.filter(l => l.status === "Pending");
    document.getElementById("admin-leaves").innerHTML = pending.length ? pending.map(l => `
        <div class="leave-item" style="flex-direction:column; align-items:flex-start;">
            <div style="margin-bottom:8px;"><b>${l.name}</b> (දින: ${l.dayOnly})<br><small>${l.reason}</small></div>
            <div style="display:flex; gap:10px; width:100%;">
                <button onclick="updateStatus('${l.id}', 'Approved')" style="flex:1; background: #10b981; color:white; border:none; padding:8px; border-radius:8px; cursor:pointer;">Approve</button>
                <button onclick="updateStatus('${l.id}', 'Rejected')" style="flex:1; background: #ef4444; color:white; border:none; padding:8px; border-radius:8px; cursor:pointer;">Reject</button>
            </div>
        </div>`).join("") : "<p style='font-size:13px; color:#94a3b8;'>නව අයදුම්පත් නැත.</p>";
}

// තත්ත්වය යාවත්කාලීන කිරීම (Approve/Reject)
async function updateStatus(id, status) {
    showLoading(true);
    const body = new URLSearchParams({ action: "updateStatus", id, status, actionBy: me.name });
    try {
        await fetch(SCRIPT_URL, { method: "POST", body });
        location.reload();
    } catch (e) {
        alert("දෝෂයකි!");
        showLoading(false);
    }
}

// නව සාමාජිකයෙක් එක් කිරීම
async function addStaff() {
    const idVal = document.getElementById("newId").value;
    const nameVal = document.getElementById("newName").value;
    const roleVal = document.getElementById("newRole").value;

    if (!idVal || !nameVal || !roleVal) return alert("කරුණාකර සියලු විස්තර පුරවන්න!");

    showLoading(true);
    const id = "EMP" + idVal.padStart(3, '0');
    const body = new URLSearchParams({ action: "addMember", id, name: nameVal, role: roleVal });

    try {
        await fetch(SCRIPT_URL, { method: "POST", body });
        alert("නව සාමාජිකයා සාර්ථකව එක් කරන ලදී!");
        location.reload();
    } catch (e) {
        alert("එක් කිරීමට නොහැකි විය.");
        showLoading(false);
    }
}

function showLoading(show) {
    document.getElementById("loading-overlay").style.display = show ? "flex" : "none";
}
