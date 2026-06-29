# POS System 🛒 (ប្រព័ន្ធគ្រប់គ្រងការលក់)

This is a modern Point of Sale (POS) system built using **Next.js**, **Prisma ORM**, and **PostgreSQL**. It is designed to be plug-and-play, allowing developers to clone and run the application with minimal configuration.

---

## 🚀 Quick Start for Windows (វិធីសាស្ត្រដំឡើងរហ័សសម្រាប់ Windows)

If you are using Windows, we have provided automated setup scripts to make your life easy:

### 1. Start PostgreSQL Database Service
Ensure that PostgreSQL is installed on your computer. To start the database service:
* Right-click on [start-postgres.bat](file:///d:/BBU/Project/POS_clone/POS-system/start-postgres.bat) and choose **"Run as administrator"**.

### 2. Run Setup Wizard
To install dependencies, copy environment configurations, create the database, run migrations, and seed sample data:
* Double-click on [setup.bat](file:///d:/BBU/Project/POS_clone/POS-system/setup.bat).
* *Note: The script will automatically copy `.env.example` to `.env` and prompt you for your PostgreSQL password if needed.*

### 3. Run Development Server
Once setup is complete, you can start the application:
* Double-click on [start.bat](file:///d:/BBU/Project/POS_clone/POS-system/start.bat).
* Open your browser and go to [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Manual Installation (សម្រាប់ macOS / Linux ឬ ដំឡើងដោយខ្លួនឯង)

If you prefer to configure the system manually, follow these steps:

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the template environment file:
```bash
cp .env.example .env
```
Open the `.env` file and update your PostgreSQL connection URL:
```text
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<database_name>?schema=public"
```

### 3. Setup Database Schema & Seed Data
Push the schema to your database and seed it with initial setup data (like default admin users, categories, products, etc.):
```bash
npx prisma db push --force-reset
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📦 Tech Stack
* **Framework:** Next.js (App Router)
* **Database & ORM:** PostgreSQL & Prisma
* **Styling:** Vanilla CSS & Tailwind CSS
* **State Management:** Zustand
* **Authentication:** JSON Web Tokens (JWT) / NextAuth

---

## 📂 Project Structure
* `/prisma/`: Contains database schemas (`schema.prisma`) and seed script (`seed.ts`).
* `/scripts/`: Setup scripts for automated deployment helper.
* `/src/app/api/`: REST APIs for discounts, customers, categories, etc.
* `setup.bat`: Automatic setup batch script for Windows.
* `start.bat`: Dev server startup script for Windows.
