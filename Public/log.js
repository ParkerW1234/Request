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
  

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const logContent = document.getElementById('log-content');
const logoutButton = document.getElementById('logout-button-log');

// --- Firebase Function URL (Replace AFTER deploying the function) ---
// We will get this URL in the next step after deploying the Cloud Function
const updateFunctionUrl = 'https://console.firebase.google.com/project/jollyrancher-840e9/overview'; // Placeholder

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

// Function to render status with appropriate styling
function renderStatus(status) {
    status = status || 'Pending';
    let statusClass = '';
    switch (status.toLowerCase()) {
        case 'approved': statusClass = 'status-approved'; break;
        case 'denied': statusClass = 'status-denied'; break;
        default: statusClass = 'status-pending';
    }
    return `<span class="${statusClass}">${status}</span>`;
}

// Function to handle actions (calling the Cloud Function)
async function handleUpdateRequest(requestId, action, comment = null) {
    console.log(`Attempting action: ${action} for request ${requestId} with comment: ${comment}`);

    if (!updateFunctionUrl || updateFunctionUrl === 'YOUR_FIREBASE_FUNCTION_URL_HERE') {
         alert('Error: Firebase Function URL is not configured in log.js.');
         console.error('Firebase Function URL is not configured.');
         return;
    }

    // Disable buttons for this row temporarily to prevent double clicks
    const row = logContent.querySelector(`tr[data-id="${requestId}"]`);
    if (row) {
        row.querySelectorAll('button, input').forEach(el => el.disabled = true);
        // Optionally add a visual indicator like opacity change
        row.style.opacity = '0.5';
    }


    try {
        // Get the Firebase Auth ID token to authenticate the request
        const idToken = await auth.currentUser.getIdToken(true); // Force refresh token

        const payload = {
            requestId: requestId,
            action: action // 'approve', 'deny', 'comment', 'overturn'
        };
        if (comment !== null) {
            payload.comment = comment;
        }

        const response = await fetch(updateFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}` // Send token for verification
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json(); // Try to get error details from function
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }

        const result = await response.json();
        console.log('Function call successful:', result);
        // No need to manually update UI here, Firestore listener (onSnapshot) will do it.

    } catch (error) {
        console.error(`Error performing action ${action}:`, error);
        alert(`Error: ${error.message}. Please check console for details.`);
         // Re-enable buttons on error
         if (row) {
             row.querySelectorAll('button, input').forEach(el => el.disabled = false);
             row.style.opacity = '1';
         }
    }
     // Note: Buttons will be re-enabled implicitly when onSnapshot refreshes the table
     // Or you could explicitly re-enable them here if not using onSnapshot, but onSnapshot is better.
     // We add explicit re-enabling on error above for immediate feedback.
}


// Function to fetch and display ALL requests
function loadAllRequests() {
    logContent.innerHTML = `<p>Loading all requests...</p>`;

    db.collection('requests')
      .orderBy('requestedAt', 'desc')
      .onSnapshot(snapshot => {
            if (snapshot.empty) {
                logContent.innerHTML = `<p>No requests found in the log.</p>`;
                return;
            }

            // Use DocumentFragment for better performance when building table
            const fragment = document.createDocumentFragment();
            const table = document.createElement('table');
            table.border = "1";
            table.style.width = "100%";
            table.style.borderCollapse = "collapse";

            table.innerHTML = `<thead>
                                <tr>
                                    <th>Requested At</th>
                                    <th>Name</th>
                                    <th>Flavor</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Comment</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>`;
            const tbody = document.createElement('tbody');

            snapshot.forEach(doc => {
                const request = doc.data();
                const requestId = doc.id;
                const requestedDate = request.requestedAt?.toDate ? request.requestedAt.toDate().toLocaleString() : 'N/A';
                const currentStatus = request.status || 'Pending';
                const currentComment = request.teacherComment || '';

                const tr = document.createElement('tr');
                tr.setAttribute('data-id', requestId); // Set data-id on the row

                tr.innerHTML = `
                    <td>${escapeHtml(requestedDate)}</td>
                    <td>${escapeHtml(request.name)}</td>
                    <td>${escapeHtml(request.flavor)}</td>
                    <td>${escapeHtml(request.reason)}</td>
                    <td class="status-cell">${renderStatus(currentStatus)}</td>
                    <td class="comment-cell">${escapeHtml(currentComment)}</td>
                    <td class="actions-cell">
                        <button class="approve-btn" data-id="${requestId}" ${currentStatus === 'Approved' ? 'disabled' : ''}>Approve</button>
                        <button class="deny-btn" data-id="${requestId}" ${currentStatus === 'Denied' ? 'disabled' : ''}>Deny</button>
                        <br>
                        <input type="text" class="comment-input" data-id="${requestId}" placeholder="Comment..." value="${escapeHtml(currentComment)}" style="width: 150px; margin-top: 5px;">
                        <button class="save-comment-btn" data-id="${requestId}">Save Cmt</button>
                        <br>
                        <button class="overturn-btn" data-id="${requestId}" style="margin-top: 5px;" ${currentStatus === 'Pending' ? 'disabled' : ''}>Set Pending</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            table.appendChild(tbody);
            fragment.appendChild(table);

            // Clear previous content and append the new table
            logContent.innerHTML = '';
            logContent.appendChild(fragment);

        }, error => {
            console.error("Error fetching all requests: ", error);
            logContent.innerHTML = `<p style="color: red;">Error loading request log.</p>`;
        });
}

// --- Event Listener for Actions using Event Delegation ---
logContent.addEventListener('click', (event) => {
    const target = event.target;
    const requestId = target.dataset.id; // Get ID from data-id attribute

    if (!requestId) return; // Exit if the click wasn't on an element with data-id

    if (target.classList.contains('approve-btn')) {
        handleUpdateRequest(requestId, 'approve');
    } else if (target.classList.contains('deny-btn')) {
        handleUpdateRequest(requestId, 'deny');
    } else if (target.classList.contains('save-comment-btn')) {
        // Find the comment input specifically for this row
        const commentInput = logContent.querySelector(`.comment-input[data-id="${requestId}"]`);
        if (commentInput) {
            handleUpdateRequest(requestId, 'comment', commentInput.value);
        } else {
            console.error('Could not find comment input for request ID:', requestId);
        }
    } else if (target.classList.contains('overturn-btn')) {
        handleUpdateRequest(requestId, 'overturn'); // 'overturn' action will set status to 'Pending'
    }
});


// --- Authentication state listener ---
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("Log page: User is logged in:", user.email);
        // Make sure the function URL placeholder is updated after deployment!
        if (!updateFunctionUrl || updateFunctionUrl === 'YOUR_FIREBASE_FUNCTION_URL_HERE') {
            console.warn('Firebase Function URL is not set in log.js. Actions will fail.');
            // Optionally display a warning to the user on the page
        }
        loadAllRequests();
    } else {
        console.log("Log page: User is not logged in. Redirecting.");
         if (window.location.pathname !== '/login.html' && window.location.pathname !== '/login') {
             window.location.replace('login.html');
        }
    }
});

// Logout button event listener
logoutButton.addEventListener('click', () => {
    auth.signOut().catch((error) => {
        console.error("Sign out error:", error);
        alert("Error signing out.");
    });
});