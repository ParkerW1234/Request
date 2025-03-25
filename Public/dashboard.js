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
const auth = firebase.auth();
const db = firebase.firestore(); // Firestore instance

const dashboardContent = document.getElementById('dashboard-content');
const logoutButton = document.getElementById('logout-button');

// Function to fetch and display pending requests
function loadPendingRequests() {
    dashboardContent.innerHTML = `<h2>Pending Requests</h2><p>Loading...</p>`; // Show loading state

    db.collection('requests')
      .where('status', '==', 'Pending') // Filter for Pending status
      .orderBy('requestedAt', 'asc')    // Show oldest first
      .onSnapshot(snapshot => { // Use onSnapshot for real-time updates
            if (snapshot.empty) {
                dashboardContent.innerHTML = `<h2>Pending Requests</h2><p>No pending requests found.</p>`;
                return;
            }

            let html = `<h2>Pending Requests</h2>
                        <table border="1" style="width:100%; border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <th>Requested At</th>
                                    <th>Name</th>
                                    <th>Flavor</th>
                                    <th>Reason</th>
                                </tr>
                            </thead>
                            <tbody>`;

            snapshot.forEach(doc => {
                const request = doc.data();
                const requestedDate = request.requestedAt?.toDate ? request.requestedAt.toDate().toLocaleString() : 'N/A';
                html += `<tr>
                            <td>${requestedDate}</td>
                            <td>${request.name || ''}</td>
                            <td>${request.flavor || ''}</td>
                            <td>${request.reason || ''}</td>
                         </tr>`;
            });

            html += `</tbody></table>`;
            dashboardContent.innerHTML = html;

        }, error => {
            console.error("Error fetching pending requests: ", error);
            dashboardContent.innerHTML = `<h2>Pending Requests</h2><p style="color: red;">Error loading requests.</p>`;
        });
}

// Authentication state listener
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in.
        console.log("User is logged in:", user.email);
        loadPendingRequests(); // Load data now that user is authenticated
    } else {
        // User is signed out. Redirect to login page.
        console.log("User is not logged in. Redirecting to login page.");
        if (window.location.pathname !== '/login.html' && window.location.pathname !== '/login') {
            window.location.replace('login.html');
        }
    }
});

// Logout button event listener
logoutButton.addEventListener('click', () => {
    auth.signOut().then(() => {
        console.log("User signed out successfully.");
        // onAuthStateChanged will handle the redirect
    }).catch((error) => {
        console.error("Sign out error:", error);
        alert("Error signing out. Please try again.");
    });
});