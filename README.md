# NoteVault - Multi-Tenant Notes API

## Problem Statement
Teams need a secure, private notes API where each user's data is completely isolated, abuse is prevented via rate limiting, and deleted notes can be recovered.

## Approach Explanation
NoteVault is a secure, fully containerized application.
- **Tech Stack:** React (Vite) for the frontend, Node.js/Express for the backend API, and MongoDB for the database.
- **Security:** Implements a robust JWT authentication flow with both access and refresh tokens. Passwords are securely hashed.
- **Isolation:** All CRUD operations are strictly scoped to the authenticated `userId`, ensuring complete data privacy between tenants.
- **Rate Limiting:** Protects against abuse by enforcing a strict 30 requests/minute limit per user/IP.
- **Soft Delete:** Instead of permanent deletion, notes are moved to a "Trash" state, allowing for easy recovery or permanent purging.
- **Deployment:** The entire application is orchestrated using Docker Compose, spinning up the frontend, backend, and database cleanly.

## Setup Instructions (Docker)
This project is fully Dockerized for a seamless setup experience.
1. Make sure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
2. Clone this repository.
3. Run the following command in the root directory:
   ```bash
   docker-compose up --build
   ```
4. The application will automatically provision the database and start.
5. Visit the web interface at: `http://localhost:5173`

*(Note: Ensure ports 3000, 5173, and 27017 are free on your machine)*

## Screenshots / Demo
> **Home page**
<img width="1917" height="931" alt="image" src="https://github.com/user-attachments/assets/1c0aefbd-1620-4f4d-837a-ef76b34fa3ef" />

---


## Testing
The backend includes a comprehensive test suite (7 tests) covering the core endpoints.
To run the tests manually:
1. `cd backend`
2. `npm install`
3. `npm test`
