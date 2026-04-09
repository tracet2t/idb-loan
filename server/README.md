# Backend Server Setup and Overview

## Project Structure

```
server/
├── config/          # Configuration files
├── routes/          # API endpoints
├── controllers/     # Business logic
├── models/          # Database schemas
├── middleware/      # Authentication, validation
├── utils/           # Helper functions
├── seed/ seed.js    # Database data File
└── server.js        # Entry point
```

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Database (MongoDB/PostgreSQL)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file:

```
PORT=5000
DB_URL=your_database_url
JWT_SECRET=your_secret_key
```

### Running the Server

```bash
npm start
```

### Running Database

- idb-loan\server>

```bash
npm run seed
```

## Key Features

- RESTful API architecture
- Authentication & authorization
- Database integration
- Error handling middleware
- Request validation

## Documentation

# Backend File & Folder Structure

To maintain a clean MVC (Model-View-Controller) architecture, the backend is organized into specific directories. Each file has a single responsibility.

1. backend/src/models/userModel.js
   Purpose: Defines the "blueprint" (Schema) for how user data is stored in MongoDB.

Key Contents:

Authentication Fields: username, email, and password.

Profile Object: A nested object containing fullName, designation, phone, and studies.

Metadata: isFirstLogin (Boolean) and role (e.g., super-admin, data-entry).

2. backend/src/controllers/userController.js
   Purpose: This is the "brain" of the module. It contains the logic to process requests before they hit the database.

Key Logic Created Today:

createUser: Extracts data from the request, checks if the user already exists, hashes the password using bcrypt, and maps UI fields (like qualification) to database fields (like studies).

updateUser: Uses the MongoDB $set operator to update specific profile fields without overwriting the entire document.

resetUserPassword: Handles security by hashing a new temporary password and setting isFirstLogin back to true.

3. backend/src/routes/userRoutes.js
   Purpose: Acts as the "gatekeeper" or entry point. It maps URLs (endpoints) to the functions inside the controller.

Mapping:

POST / -> createUser

GET / -> getAllUsers

PUT /:id -> updateUser

PATCH /reset/:id -> resetUserPassword

🛠️ Developer Implementation Logic
Why did we use a nested profile object?
Instead of having 15 different fields at the top level of our database entry, we grouped personal info under profile. This makes it easier to scale the application; if the IDB asks for "Date of Birth" later, we just add it to the profile object without breaking our main login logic.

Why did we add email and phone today?
Email: The backend validation requires an email to create a unique identity. Without it, the server triggers a 400 Bad Request because the database cannot save an incomplete record.

Phone: Based on the project prototype, the phone number is a key contact point for data entry staff. We added it to the create logic so it persists from the very first save.

Security Standards Implemented
Password Hashing: We never store plain text. Even if a developer looks at the database, they only see a bcrypt hash.

Data Exclusion: When fetching the user list for the frontend table, we use .select("-password"). This ensures that sensitive hashes are never sent over the network to the browser.