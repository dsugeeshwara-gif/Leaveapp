let db = JSON.parse(localStorage.getItem('ironshield_db')) || {
    users: [
        {id: "EMP028", name: "ප්‍රධාන පරිපාලක", role: "Super Admin"},
        {id: "EMP001", name: "S/M බංඩාර", role: "Approver"},
        {id: "EMP018", name: "CSO ලියනගේ", role: "Approver"}
    ],
    leaves: []
};

function saveDB() { localStorage.setItem('ironshield_db', JSON.stringify(db)); }

let selectedDates = [];
let me = null;

function login() {
    let inputId = "EMP" + document.getElementById("empIdInput").value.replace(/\D/g, "").padStart(3, '0');
    me = db.users.find(u => u.id === inputId);
    
    if(me) {
        document.getElementById("login-section").style.display = "none";
        document.getElementById("user-section").style.display = "block";
        document.getElementById("display-name").innerText = me.name;
        document.getElementById("display-role-badge").innerHTML = `<span class="badge ${me.id==='EMP028'?'badge-admin':'badge-user'}">${me.role}</span>`;
        document.getElementById("display-photo").src = `https://ui-avatars.com/api/?name=${me.name}&background=1e3a8a&color=fff`;

        renderCalendar();
        showMyLeaves();

        if(me.id === "EMP028") document.getElementById("super-admin-section").style.display = "block";
        if(["EMP028", "EMP001", "EMP018"].includes(me.id)) {
            document.getElementById("approver-panel").style.display = "block";
            renderAdmin();
        }
    } else { alert("වැරදි සේවා අංකයක්!"); }
}

function renderCalendar() {
    const grid = document.getElementById("calendar-grid");
    grid.innerHTML = "";
    let now = new Date();
    let days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    for(let i=1; i<=days; i++) {
        let dStr = `${now.getFullYear()}-${now.getMonth()+1}-${i}`;
        let count = db.leaves.filter(l => l.fullDates.includes(dStr) && l.status !== "Rejected").length;
        let isFull = count >= 4; 
        let isSel = selectedDates.includes(dStr);
        
        grid.innerHTML += `<div class="day ${isFull ? 'full' : ''} ${isSel ? 'selected' : ''}" 
            onclick="${!isFull ? `toggleDate('${dStr}')` : ''}">${i}</div>`;
    }
}

function toggleDate(d) {
    let idx = selectedDates.indexOf(d);
    if(idx > -1) selectedDates.splice(idx, 1);
    else if(selectedDates.length < 5) selectedDates.push(d);
    renderCalendar();
}

function submitLeave() {
    let myActiveLeaves = db.leaves.filter(l => l.empId === me.id && l.status !== "Rejected");
    let currentRequestedCount = 0;
    myActiveLeaves.forEach(l => { currentRequestedCount += l.dayOnly.split(", ").length; });

    if (currentRequestedCount + selectedDates.length > 4) {
        alert(`ඔබට මසකට ගත හැකි උපරිම නිවාඩු ගණන 4 කි.`);
        return;
    }

    if(selectedDates.length === 0) return alert("දින තෝරන්න!");
    
    let sorted = selectedDates.sort((a,b) => new Date(a) - new Date(b));
    let dayOnlyList = sorted.map(d => d.split("-")[2]).join(", ");

    db.leaves.push({
        id: Date.now(),
        empId: me.id,
        name: me.name,
        fullDates: sorted,
        dayOnly: dayOnlyList,
        reason: document.getElementById("reason").value || "හේතුවක් නැත",
        status: "Pending",
        actionBy: ""
    });

    saveDB();
    alert("යවන ලදී!");
    selectedDates = [];
    document.getElementById("reason").value = "";
    renderCalendar();
    showMyLeaves();
    renderAdmin();
}

function showMyLeaves() {
    let my = db.leaves.filter(l => l.empId === me.id);
    document.getElementById("my-leaves").innerHTML = my.length ? my.map(l => `
        <div class="leave-item">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:700;">දින: ${l.dayOnly}</span>
                <span class="status-pill status-${l.status}">${l.status}</span>
            </div>
            ${l.actionBy ? `<div style="font-size:12px; color:#64748b; margin-top:8px;">තීරණය කළේ: ${l.actionBy}</div>` : ''}
        </div>`).join("") : "අයදුම්පත් නැත.";
}

function renderAdmin() {
    let pending = db.leaves.filter(l => l.status === "Pending");
    document.getElementById("admin-leaves").innerHTML = pending.length ? pending.map(l => `
        <div style="background:#f8fafc; padding:15px; border-radius:12px; margin-bottom:12px; border:1px solid #e2e8f0;">
            <div style="font-weight:700; color:#1e3a8a;">${l.name}</div>
            <div style="font-size:14px;">දින: ${l.dayOnly}</div>
            <div class="admin-controls">
                <button class="admin-btn" onclick="updateStatus(${l.id}, 'Approved')" style="background:#10b981; color:white;">Approve</button>
                <button class="admin-btn" onclick="updateStatus(${l.id}, 'Rejected')" style="background:#ef4444; color:white;">Reject</button>
            </div>
        </div>`).join("") : "නව අයදුම්පත් නැත.";
}

function updateStatus(leaveId, status) {
    let leave = db.leaves.find(l => l.id === leaveId);
    if(leave) { leave.status = status; leave.actionBy = me.name; }
    saveDB();
    renderAdmin(); renderCalendar(); showMyLeaves();
}

function addStaff() {
    let id = "EMP" + document.getElementById("newId").value.replace(/\D/g, "").padStart(3, '0');
    let name = document.getElementById("newName").value;
    let role = document.getElementById("newRole").value;
    if(!name || !role) return alert("විස්තර පුරවන්න!");
    db.users.push({id, name, role});
    saveDB();
    alert("එක් කරන ලදී!");
    document.getElementById("newId").value = "";
    document.getElementById("newName").value = "";
    document.getElementById("newRole").value = "";
}
