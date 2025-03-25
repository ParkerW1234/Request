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
  const auth = firebase.auth(); // Get Auth instance
  
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const messageArea = document.getElementById('login-message-area');
  const submitButton = loginForm.querySelector('button[type="submit"]');
  
  // If user is already logged in, redirect them away from login page
  auth.onAuthStateChanged(user => {
      if (user) {
          console.log("User already logged in, redirecting to teacher dashboard...");
          // Prevent login page access if already authenticated
          window.location.replace('teacher.html');
      }
  });
  
  
  loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      messageArea.style.display = 'none';
      messageArea.textContent = '';
      messageArea.className = 'message-area'; // Reset class
      submitButton.disabled = true;
      submitButton.textContent = 'Logging in...';
  
      const email = emailInput.value;
      const password = passwordInput.value;
  
      auth.signInWithEmailAndPassword(email, password)
          .then((userCredential) => {
              // Signed in successfully
              console.log("Login successful:", userCredential.user);
              // Redirect to the teacher dashboard
              window.location.href = 'teacher.html';
          })
          .catch((error) => {
              // Handle Errors here.
              console.error("Login failed:", error);
              let errorMessage = 'Login failed. Please check your email and password.';
              // Provide more specific errors if needed (e.g., wrong password)
              if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                  errorMessage = 'Invalid email or password.';
              } else if (error.code === 'auth/invalid-email') {
                  errorMessage = 'Please enter a valid email address.';
              }
              // Display error message
              messageArea.textContent = errorMessage;
              messageArea.classList.add('message-error');
              messageArea.style.display = 'block';
              submitButton.disabled = false;
              submitButton.textContent = 'Login';
          });
  });