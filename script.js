const SCRIPT_URL = "මෙතැනට_ඔබේ_WEB_APP_URL_එක_දමන්න";

const users = {
    "EMP001": { name: "Commander Wickramasinghe", role: "CSO" },
    "EMP028": { name: "Admin User", role: "S/M" }
};

let selectedDates = [];
let currentUser = null;

function login() {
    let id = document.getElementById("empId").value.trim().toUpperCase();
    if (users[id]) {
        currentUser = { id: id, ...users[id] };
        document.getElementById("login-box").style.display = "none";
        document.getElementById("leave-form").style.display = "block";
        document.getElementById("userName").innerText = "ආයුබෝවන්, " + currentUser.name;
    } else {
        document.getElementById("msg").innerText = "වැරදි සේවා අංකයක්!";
    }
}

function addDate() {
    let date = document.getElementById("dateInput").value;
    if (date && !selectedDates.includes(date)) {
        selectedDates.push(date);
        document.getElementById("date-list").innerText = "තෝරාගත් දින: " + selectedDates.join(", ");
    }
}

async function sendData() {
    let reason = document.getElementById("reason").value;
    let status = document.getElementById("status");

    if (selectedDates.length == 0 || !reason) {
        alert("කරුණාකර දින සහ හේතුව සම්පූර්ණ කරන්න.");
        return;
    }

    status.innerText = "යවමින් පවතී...";
    
    let params = new URLSearchParams({
        employeeId: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        leaveDates: selectedDates.join(", "),
        reason: reason
    });

    try {
        await fetch(SCRIPT_URL + "?" + params.toString(), { method: 'POST' });
        status.innerText = "✅ සාර්ථකව යවන ලදී!";
        setTimeout(() => location.reload(), 2000);
    } catch (e) {
        status.innerText = "❌ දෝෂයක් ඇතිවිය. නැවත උත්සාහ කරන්න.";
    }
}
