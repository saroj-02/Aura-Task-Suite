# Aura: The Premium Task Suite

Aura is a high-performance, secure, and aesthetically superior task management system built for the modern web. This project serves as a comprehensive demonstration of scalable backend architecture and premium frontend design.

## 🚀 Key Features
- **Lumina Auth:** Secure JWT-based authentication with password hashing (Bcrypt).
- **Apex CRUD:** Robust task management with priority, status, and ownership controls.
- **RBAC (Role-Based Access Control):** Granular permissions for Users and Admins.
- **Obsidian UI:** A premium, glassmorphism-inspired dark interface with smooth micro-animations.
- **Auto-Documentation:** Built-in Swagger API documentation.

## 🛠️ Tech Stack
- **Backend:** FastAPI (Python), SQLAlchemy (ORM), Pydantic (Validation).
- **Database:** SQLite (Relational).
- **Frontend:** React.js, Vite, Vanilla CSS (Premium Custom Design).
- **Security:** JWT (JSON Web Tokens), Bcrypt.

## 🏃‍♂️ Getting Started

### Backend Setup
1. Navigate to the `backend` directory.
2. Create a virtual environment: `python -m venv venv`.
3. Activate the environment: `.\venv\Scripts\activate`.
4. Install dependencies: `pip install -r requirements.txt`.
5. Run the server: `python main.py`.
6. Access API docs at `http://localhost:8000/docs`.

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`.
3. Run the development server: `npm run dev`.
4. Open `http://localhost:5173` in your browser.

## 📈 Scalability & Future-Proofing

### 1. Database & Persistence
- **Transition to Postgres:** Currently using SQLite for ease of evaluation. The architecture uses SQLAlchemy ORM, meaning switching to a production-grade Postgres database requires only updating the connection string in `config.py`.
- **Database Pooling:** Implementation of `pgbouncer` or internal SQLAlchemy pooling for handling thousands of concurrent connections.

### 2. Performance Optimization
- **Redis Caching:** Implementation of Redis for caching frequently accessed data (e.g., user profiles, task counts) to reduce DB load.
- **Asynchronous Task Processing:** Use **Celery** with **RabbitMQ/Redis** for background tasks (e.g., sending email notifications, heavy reporting).

### 3. Architecture
- **Microservices Ready:** The modular structure (Auth, Tasks, etc.) allows for easy extraction into independent microservices if the load requires it.
- **Load Balancing:** Deployment behind Nginx or HAProxy with multiple instances of the FastAPI app running in Docker containers.

### 4. Security
- **Refresh Tokens:** Implementation of a rotating refresh token mechanism for enhanced security.
- **Rate Limiting:** Using `slowapi` or Nginx level rate limiting to prevent brute-force attacks.

## 📝 API Documentation
Aura comes with built-in interactive documentation:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

---
*Designed & Developed for the Backend Intern Project Assignment.*
