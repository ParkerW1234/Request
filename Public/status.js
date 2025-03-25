// --- START: PASTE YOUR FIREBASE CONFIG OBJECT HERE ---
const firebaseConfig = {
    apiKey: "AIzaSyDbtXyh84oLMSMhAuVc5TRJvIcMi1c2m5I",
    authDomain: "jollyrancher-840e9.firebaseapp.com",
    projectId: "jollyrancher-840e9",
    storageBucket: "jollyrancher-840e9.firebasestorage.app",
    messagingSenderId: "949125457638",
    appId: "1:949125457638:web:d91db3d1ab560d7e627d27",
    measurementId: "G-Z4FK1P28D6"
  };
// --- END: PASTE YOUR FIREBASE CONFIG OBJECT HERE ---

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const statusDisplay = document.getElementById('status-display');

// Basic HTML escaping helper using backticks
const escapeHtml = (unsafe) => { // LINE 1
    if (!unsafe) return '';    // LINE 2
    const safeString = String(unsafe); // LINE 3
    return safeString           // LINE 4
         .replace(/&/g, `&`)  // LINE 5
         .replace(/</g, `<`)   // LINE 6
         .replace(/>/g, `>`)   // LINE 7
         .replace(/"/g, `"`) // LINE 8
         .replace(/'/g, `'`); // LINE 9
}; // LINE 10

async function displayRequestStatus() {
    console.log("Initial window.location.href:", window.location.href); // Keep for debug if needed
    const params = new URLSearchParams(window.location.search);
    const requestId = params.get('id');
    console.log("Extracted Request ID:", requestId);

    if (!requestId) {
        statusDisplay.innerHTML = '<p class="message-error">No request ID provided in the URL.</p>';
        return;
    }

    try {
        const docRef = db.collection('requests').doc(requestId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();

            let requestedDate = 'N/A';
            if (data.requestedAt && data.requestedAt.toDate) {
                requestedDate = data.requestedAt.toDate().toLocaleString();
            }

            const currentStatus = data.status || 'Pending'; // Default to Pending
            const teacherComment = data.teacherComment || '<em>No comment yet.</em>'; // Default comment

            let statusClass = '';
            switch (currentStatus.toLowerCase()) {
                case 'approved': statusClass = 'status-approved'; break;
                case 'denied': statusClass = 'status-denied'; break;
                default: statusClass = 'status-pending';
            }

            statusDisplay.innerHTML = `
                <div class="status-info">
                    <p><strong>Request ID:</strong> ${escapeHtml(docSnap.id)}</p>
                    <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
                    <p><strong>Flavor:</strong> ${escapeHtml(data.flavor)}</p>
                    <p><strong>Reason:</strong> ${escapeHtml(data.reason)}</p>
                    <p><strong>Requested On:</strong> ${escapeHtml(requestedDate)}</p>
                </div>
                <div class="status-info">
                    <p><strong>Status:</strong> <span class="${statusClass}">${escapeHtml(currentStatus)}</span></p>
                    <p><strong>Teacher Comment:</strong> ${teacherComment}</p> <!-- Allow basic emphasis tag -->
                </div>
            `;
        } else {
            statusDisplay.innerHTML = `<p class="message-error">Request with ID '${escapeHtml(requestId)}' not found.</p>`;
        }
    } catch (error) {
        console.error("Error fetching document:", error);
        statusDisplay.innerHTML = '<p class="message-error">Error retrieving request status. Please try again later.</p>';
    }
}

displayRequestStatus();