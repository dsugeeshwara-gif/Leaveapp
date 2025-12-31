// ඔයාගේ අලුත්ම URL එක මෙන්න
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwkfCmdklz6VH--pET_MkYEP_dNOY9zkl8hTIt2NXzwooo-_IOUN182M2_QdLE7crVz/exec";

let db = { users: [], leaves: [] };
let me = null;
let selectedDates = [];

// පද්ධතියට පිවිසීම (Login)
async function login() {
    const inputVal = document.getElementById("empIdInput").value;
    if (!inputVal) return alert("කරුණාකර සේවා අංකය ඇතුළත් කරන්න!");
    
    showLoading(true);
    const empId = "EMP" + inputVal.padStart(3, '0');

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getInitialData`);
        const data = await response.json();
        
        db.users = data.users.map(u => ({ id: String(u[0]), name: u[1], role: u[2] }));
        db.leaves = data.leaves.map(l => ({
            id: l[0], empId: String(l[1]), name: l[2], dayOnly: l[3], 
            fullDates: String(l[4]).split(","), status: l[6], actionBy: l[7]
        }));

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
            alert("සේවා අංකය වැරදියි හෝ පද්ධතියේ නැත!");
        }
    } catch (e) {
        alert("දත්ත ලබා ගැනීමට නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.");
    }
    showLoading(false);
}

function checkPermissions() {
    if (me.id === "EMP028") document.getElementById("super-admin-section").style.display = "block";
    if (["EMP028", "EMP001", "EMP018"].includes(me.id)) {
        document.getElementById("approver-panel").style.display = "block";
        renderAdmin();
    }
}

function renderCalendar() {
    const grid = document.getElementById("calendar-grid");
    grid.innerHTML = "";
    const days = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    for (let i = 1; i <= days; i++) {
        const dStr = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${i}`;
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

async function submitLeave() {
    if (selectedDates.length === 0) return alert("දින තෝරන්න!");
    showLoading(true);
    const sorted = selectedDates.sort((a, b) => new Date(a) - new Date(b));
    const dayOnly = sorted.map(d => d.split("-")[2]).join(", ");

    const body = new URLSearchParams({
        action: "submitLeave", empId: me.id, name: me.name,
        dayOnly, fullDates: sorted.join(","), reason: document.getElementById("reason").value
    });

    await fetch(SCRIPT_URL, { method: "POST", body });
    alert("අයදුම්පත සාර්ථකව යවන ලදී!");
    location.reload();
}

function showMyLeaves() {
    const my = db.leaves.filter(l => l.empId === me.id);
    document.getElementById("my-leaves").innerHTML = my.length ? my.map(l => `
        <div class="leave-item">
            <span>📅 <b>${l.dayOnly}</b></span>
            <span class="badge" style="background:${l.status==='Approved'?'#dcfce7':'#fef3c7'}">${l.status}</span>
        </div>`).join("") : "වාර්තා නැත.";
}

function renderAdmin() {
    const pending = db.leaves.filter(l => l.status === "Pending");
    document.getElementById("admin-leaves").innerHTML = pending.length ? pending.map(l => `
        <div class="leave-item">
            <div><b>${l.name}</b> (දින: ${l.dayOnly})</div>
            <button onclick="updateStatus('${l.id}', 'Approved')" style="color:green; font-weight:bold;">Approve</button>
        </div>`).join("") : "නව අයදුම්පත් නැත.";
}

async function updateStatus(id, status) {
    showLoading(true);
    const body = new URLSearchParams({ action: "updateStatus", id, status, actionBy: me.name });
    await fetch(SCRIPT_URL, { method: "POST", body });
    location.reload();
}

async function addStaff() {
    showLoading(true);
    const body = new URLSearchParams({ 
        action: "addMember", 
        id: "EMP" + document.getElementById("newId").value.padStart(3, '0'),
        name: document.getElementById("newName").value,
        role: document.getElementById("newRole").value
    });
    await fetch(SCRIPT_URL, { method: "POST", body });
    alert("එක් කරන ලදී!");
    location.reload();
}

function showLoading(show) { document.getElementById("loading-overlay").style.display = show ? "flex" : "none"; }
