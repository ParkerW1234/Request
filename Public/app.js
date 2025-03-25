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
  const db = firebase.firestore(); // Get Firestore instance
  
  // Get form and message area elements
  const requestForm = document.getElementById('request-form');
  const messageArea = document.getElementById('message-area');
  
  // Add event listener for form submission
  requestForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // Prevent default form submission
  
      // Disable button to prevent multiple submissions
      const submitButton = requestForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
  
      // Clear previous messages
      messageArea.style.display = 'none';
      messageArea.textContent = '';
      messageArea.className = 'message-area'; // Reset classes
  
      // Get form data
      const name = requestForm.name.value.trim();
      const email = requestForm.email.value.trim();
      const flavor = requestForm.flavor.value;
      const reason = requestForm.reason.value.trim();
  
      // Basic client-side validation
      if (!name || !email || !flavor || !reason) {
          displayMessage('Please fill out all fields.', 'error');
          submitButton.disabled = false;
          submitButton.textContent = 'Submit Request';
          return; // Stop submission
      }
  
      try {
          // Add request data to Firestore
          const docRef = await db.collection('requests').add({
              name: name,
              email: email, // Storing email for identification, not notification
              flavor: flavor,
              reason: reason,
              status: 'Pending', // Initial status
              teacherComment: '', // Initialize empty comment field
              requestedAt: firebase.firestore.FieldValue.serverTimestamp() // Use server time
          });
  
          // Success! Construct status link
          const statusUrl = `status.html?id=${docRef.id}`;
  
          // Display success message with the link
          displayMessage(
              `Request submitted successfully! You can check its status here: <a href="${statusUrl}" target="_blank">Check Status</a>`,
              'success'
          );
  
          // Reset the form
          requestForm.reset();
  
      } catch (error) {
          console.error("Error adding document: ", error);
          displayMessage('There was an error submitting your request. Please try again.', 'error');
      } finally {
          // Re-enable button regardless of success or error
          submitButton.disabled = false;
          submitButton.textContent = 'Submit Request';
      }
  });
  
  // Helper function to display messages
  function displayMessage(message, type) {
      messageArea.innerHTML = message; // Use innerHTML to allow the link tag
      messageArea.classList.add(type === 'success' ? 'message-success' : 'message-error');
      messageArea.style.display = 'block';
  }