// Obe aluthma Google Apps Script URL eka
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyqRknyEvOKCDJcUS0eTwvI_bBZ8A7SvOUZXjRsj-kREi74jOwL5LfwIRlpsUQZxEP1/exec";

let db = { users: [], leaves: [] };
let me = null;
let selectedDates = [];

// Pashshathiyata pivisima (Login)
async function login() {
    const inputVal = document.getElementById("empIdInput").value;
    if (!inputVal) return alert("Karunakara sewa ankaya athulath karanna!");
    
    showLoading(true);
    const empId = "EMP" + inputVal.padStart(3, '0');

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getInitialData`);
        const data = await response.json();
        
        db.users = data.users.map(u => ({ id: String(u[0]), name: u[1], role: u[2] }));
        db.leaves = data.leaves.map(l => ({
            empId: String(l[1]), name: l[2], dayOnly: l[4], status: l[6]
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
            alert("Sewa ankaya paddhatthiye natha! Karunakara admin amathanna.");
        }
    } catch (e) {
        alert("Sambandathawaya binda watuni. Nawatha uthsaha karanna.");
    }
    showLoading(false);
}

// Balathala parikshawa (Permissions)
function checkPermissions() {
    // EMP028 (OIC) hata pamani samaji-kayin athulath kala hakke
    if (me.id === "EMP028") document.getElementById("super-admin-section").style.display = "block";
    
    // EMP028, EMP001, EMP018 hata niwadu anumatha kala hakka
    if (["EMP028", "EMP001", "EMP018"].includes(me.id)) {
        document.getElementById("approver-panel").style.display = "block";
        renderAdmin();
    }
}

// Calender eka nirmanaya
function renderCalendar() {
    const grid = document.getElementById("calendar-grid");
    grid.innerHTML = "";
    const days = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    for (let i = 1; i <= days; i++) {
        const dStr = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${i}`;
        // Dina 4kata wada niwadu nam eya 'full' lesa penwayi
        const count = db.leaves.filter(l => l.dayOnly.includes(i) && l.status !== "Rejected").length;
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

// Niwadu ayadumpatha submit kirima
async function submitLeave() {
    if (selectedDates.length === 0) return alert("Dina thoranna!");
    showLoading(true);
    const sorted = selectedDates.sort((a, b) => new Date(a) - new Date(b));
    const dayOnly = sorted.map(d => d.split("-")[2]).join(", ");

    const params = new URLSearchParams({
        action: "submitLeave", empId: me.id, name: me.name,
        dayOnly, fullDates: sorted.join(","), reason: document.getElementById("reason").value
    });

    await fetch(`${SCRIPT_URL}?${params.toString()}`, { method: "POST" });
    alert("Ayadumpatha sarthakawa yawana ladi!");
    location.reload();
}

// Mage niwadu wartha penvima
function showMyLeaves() {
    const my = db.leaves.filter(l => l.empId === me.id);
    document.getElementById("my-leaves").innerHTML = my.length ? my.map(l => `
        <div class="leave-item">
            <span>📅 <b>${l.dayOnly}</b></span>
            <span class="badge" style="background:${l.status==='Approved'?'#dcfce7':'#fef3c7'}">${l.status}</span>
        </div>`).join("") : "Wartha natha.";
}

// Admin hata penvena ayadumpath
function renderAdmin() {
    const pending = db.leaves.filter(l => l.status === "Pending");
    document.getElementById("admin-leaves").innerHTML = pending.length ? pending.map(l => `
        <div class="leave-item">
            <div><b>${l.name}</b> (Dina: ${l.dayOnly})</div>
            <button onclick="updateStatus('${l.empId}', '${l.dayOnly}', 'Approved')" style="color:green; font-weight:bold;">Approve</button>
        </div>`).join("") : "Nawa ayadumpath natha.";
}

// Niwadu status yawathkalina kirima
async function updateStatus(empId, dayOnly, status) {
    showLoading(true);
    const params = new URLSearchParams({ action: "updateStatus", empId, dayOnly, status, actionBy: me.name });
    await fetch(`${SCRIPT_URL}?${params.toString()}`, { method: "POST" });
    location.reload();
}

// Nawa samaji-kayin ek kirima
async function addStaff() {
    showLoading(true);
    const params = new URLSearchParams({ 
        action: "addMember", 
        id: "EMP" + document.getElementById("newId").value.padStart(3, '0'),
        name: document.getElementById("newName").value,
        role: document.getElementById("newRole").value
    });
    await fetch(`${SCRIPT_URL}?${params.toString()}`, { method: "POST" });
    alert("Nawa samaji-kaya ek karana ladi!");
    location.reload();
}

function showLoading(show) { document.getElementById("loading-overlay").style.display = show ? "flex" : "none"; }
