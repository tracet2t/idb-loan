## IDB Staff Portal: Mail Invitation Setup Guide
This guide explains how to configure the backend email system and obtain the 16-digit Google App Password required for the sendEmail utility to function correctly within the IDB Loan Management System.

1. Prerequisites
A dedicated Gmail account for the IDB Portal (e.g., no-reply@idb.lk or a standard Gmail address).

Two-Step Verification (2FA) must be enabled on that Google account.

2. Generating the 16-Digit App Password

Google does not allow third-party apps to use your primary password. You must generate an App Password.

Go to Google Account Settings: Log in and navigate to the Security tab.

Enable 2-Step Verification: This is a requirement; you cannot see the "App Passwords" menu without it.

Search for "App Passwords": In the search bar at the top of your Google Account page, type "App Passwords".

Select App & Device:

Select App: Choose Other (Custom name) and type IDB Portal.

Click Generate.

Copy the Code: A window will appear with a 16-character code (e.g., abcd efgh ijkl mnop).

Note: Copy this immediately. You will not be able to see it again after closing the window.

3. Environment Configuration (.env)
Update your local .env file with the following credentials. Ensure there are no spaces in the password.


### Email Configuration

EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com

# Use the 16-digit password generated in Step 2
EMAIL_PASSWORD=abcd efgh ijkl mnop 

### Frontend URL for Magic Links

FRONTEND_URL=http://localhost:5173

4. How the Invitation Flow Works
For the IDB Digitalization project, we use a token-based system to ensure security.

Admin Action: Admin creates a user in the dashboard.

Backend Logic:

A unique 32-character hex token is generated.

A hashed version is stored in the database for security.

An email is sent via the sendEmail utility containing a "Magic Link".

User Action: The user clicks the link, which redirects to the frontend /setup-password/:token route.

Activation: Once the user sets their password, their status changes from Pending to Active.

5. Troubleshooting
500 Internal Server Error: Check the VS Code terminal. If it says EAUTH, your 16-digit App Password is either incorrect or 2FA has been disabled.

Link Expired: The invitation links are set to expire in 24 hours.

Undefined Links: Ensure the FRONTEND_URL is correctly set in your .env and that the server has been restarted.