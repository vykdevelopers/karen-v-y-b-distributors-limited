# Karen-V-Y-B Distributors Limited

A hardware equipment and industrial supply website with:
- customer signup and login
- strong password validation
- forgot password with OTP reset
- customer order placement and order history
- admin dashboard for managing products and viewing customer logs
- dark premium dashboard look

## Admin login
- Username: karen6765
- Password: karen6765

## Contact information
- Phone: 0118078137
- Email: karenvyb6765@gmail.com

## Local setup
1. Install dependencies:
   npm install

2. Create the environment file:
   cp .env.example .env

3. Update SMTP and JWT values in .env

4. Start the app:
   npm start

5. Open:
   http://localhost:3000

## Project structure
- db.js — SQLite database setup
- server.js — Express API and authentication
- public/ — frontend files

## Notes
- This version uses SQLite for local development.
- For real production, use PostgreSQL + Prisma.
- OTP is sent through SMTP if configured.
