/* eslint-disable max-len */ // Temporarily disable max-len for lines we keep long
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK (only once)
admin.initializeApp();

// Get Firestore instance
const db = admin.firestore();

/**
 * HTTP Cloud Function to update the status and/or comment of a Jolly Rancher request.
 * Requires authentication.
 * Expects a POST request with JSON body:
 * {
 *   "requestId": "documentId", // Line 11 - Might need splitting if very long project ID causes issues
 *   "action": "approve" | "deny" | "comment" | "overturn",
 *   "comment": "Optional teacher comment string" // Required if action is 'comment'
 * }
 */
exports.updateRequestStatus = functions.https.onRequest(async (req, res) => {
  // --- CORS Handling (Allow requests from your deployed frontend) ---
  // IMPORTANT: Replace '*' with your actual Azure Static Web App URL in production
  // e.g., "https://your-app-name.azurestaticapps.net"
  // For local testing, you might need "http://localhost:8080"
  res.set("Access-Control-Allow-Origin", "*"); // Line 17 - Kept short
  "https://parkerw1234.github.io");
  if (req.method === "OPTIONS") {
    // Handle preflight CORS requests
    res.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS"); // Line 22
    res.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
    ); // Line 25 Split
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
    return;
  }

  // --- Check Request Method ---
  if (req.method !== "POST") {
    res.status(405).json({error: "Method Not Allowed. Use POST."});
    return;
  }

  // --- Authentication Check ---
  // Use explicit checks instead of optional chaining for broader compatibility
  let idToken = null;
  if (req.headers.authorization && typeof req.headers.authorization === "string") {
    const parts = req.headers.authorization.split("Bearer ");
    if (parts.length === 2) {
      idToken = parts[1];
    }
  }

  if (!idToken) { // Line 44
    res.status(401).json({error: "Unauthorized. No token provided."});
    return;
  }

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken);
    // ---- TEACHER AUTHORIZATION CHECK ----
    // Compare the UID from the token with the known Teacher UID
    // Replace "YOUR_TEACHER_UID_HERE" with the UID you saved in Segment 1
    const teacherUid = "kIpI37Q4bqbgGt5KUYslHA8xtOu2" or "jAHeiVc2nZSdf44WTDJEUYPhSGp2";
    if (decodedToken.uid !== teacherUid) { // Line 58
      console.error(
          `Auth Error: UID ${decodedToken.uid} does not match Teacher UID ${teacherUid}`,
      ); // Line 59 Split
      const errorMsg = "Forbidden. User is not the authorized teacher.";
      res.status(403).json({error: errorMsg});
      return;
    }
    // ---- END TEACHER CHECK ----

    // Line 64 - Split log message
    console.log(
        "Authenticated user:",
        decodedToken.email,
        "UID:",
        decodedToken.uid,
    );
  } catch (error) {
    console.error("Error verifying auth token:", error);
    res.status(401).json({error: "Unauthorized. Invalid token."}); // Line 67
    return;
  }

  // --- Input Validation ---
  const {requestId, action, comment} = req.body; // Line 72

  if (!requestId || !action) { // Line 75
    res.status(400).json({error: "Missing required fields: requestId and action."});
    return;
  }

  const validActions = ["approve", "deny", "comment", "overturn"];
  if (!validActions.includes(action)) {
    res.status(400).json({error: "Invalid action specified."});
    return;
  }

  // Line 87 - Split condition and message
  const isCommentAction = action === "comment";
  const isCommentInvalid = typeof comment !== "string";
  if (isCommentAction && isCommentInvalid) {
    res.status(400).json({
      error: "Comment field (string) is required for action \"comment\".",
    });
    return;
  }

  // --- Firestore Update Logic ---
  const requestRef = db.collection("requests").doc(requestId);

  try {
    const updateData = {};
    let newStatus = null;

    // Use valid comment string or null
    const safeComment = (typeof comment === "string") ? comment.trim() : null;

    switch (action) {
      case "approve":
        newStatus = "Approved";
        updateData.status = newStatus;
        // Optional: Clear comment on approval
        // updateData.teacherComment = admin.firestore.FieldValue.delete();
        break;
      case "deny": // Line 103 Split
        newStatus = "Denied";
        updateData.status = newStatus;
        if (safeComment !== null) { // Add comment if provided
          updateData.teacherComment = safeComment;
        }
        break;
      case "comment":
        // Only update the comment, don't change status
        if (safeComment !== null) { // Allow saving empty comment if provided
          updateData.teacherComment = safeComment; // Line 108
        } else {
          // Handle case where action is 'comment' but comment is invalid/missing
          // This shouldn't happen due to earlier validation, but belt-and-suspenders
          console.warn(`Attempted 'comment' action for ${requestId} without valid comment.`);
          // Maybe return an error or just do nothing
          res.status(400).json({error: "Valid comment required for comment action."});
          return;
        }
        break;
      case "overturn":
        // Set status back to Pending
        newStatus = "Pending";
        updateData.status = newStatus;
        // Optionally update comment when overturning
        if (safeComment !== null) {
          updateData.teacherComment = safeComment;
        } else {
          // Example: Add default overturn comment
          // updateData.teacherComment = "Status reset to Pending.";
        }
        break;
      default:
        // Should not happen due to validation above
        throw new Error("Invalid action reached update logic.");
    }

    // Add a timestamp for the update? Optional.
    // updateData.lastUpdatedByTeacher = admin.firestore.FieldValue.serverTimestamp();

    // Perform the Firestore update only if there's data to update
    if (Object.keys(updateData).length > 0) { // Line 134
      await requestRef.update(updateData);
    } else {
      console.log(`No update needed for request ${requestId}, action: ${action}`);
    }


    // Line 139 - Split log message
    const statusStr = newStatus || "Unchanged";
    const commentStr = updateData.teacherComment || "Unchanged";
    console.log(
        `Request ${requestId} processed. Action: ${action}. Status: ${statusStr}. Comment: ${commentStr}`,
    );

    res.status(200).json({success: true, message: `Request ${action} processed.`}); // Line 140
  } catch (error) {
    console.error(`Error updating Firestore for request ${requestId}:`, error); // Line 143
    if (error.code === 5) { // Firestore "NOT_FOUND" error code
      res.status(404).json({error: "Request ID not found."}); // Line 146
    } else {
      const errorMsg = "Internal Server Error. Failed to update request.";
      res.status(500).json({error: errorMsg}); // Line 147 Split
    }
  }
}); // End of exports.updateRequestStatus
/* eslint-enable max-len */ // Re-enable max-len check if needed elsewhere
