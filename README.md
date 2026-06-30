# POS System 🛒 (ប្រព័ន្ធគ្រប់គ្រងការលក់)

This is a modern Point of Sale (POS) system built using **Next.js**, **Prisma ORM**, and **PostgreSQL**. It is designed to be plug-and-play, allowing developers to clone and run the application with minimal configuration.

---

## 🚀 How to Install & Run (របៀបដំឡើង និងដំណើរការគម្រោង)

You can install and run the project using either the automated wizard (for Windows) or manual commands (for macOS/Linux/Windows).

### Method 1: Automated Setup on Windows (វិធីសាស្ត្រដំឡើងស្វ័យប្រវត្តសម្រាប់ Windows)

If you are using Windows, we have provided batch scripts to automate the database creation, dependency installation, and server startup:

1. **Start PostgreSQL Database Service**:
   Ensure PostgreSQL is installed on your computer.
   * Right-click on [start-postgres.bat](file:///d:/BBU/Project/POS_clone/POS-system/start-postgres.bat) and choose **"Run as administrator"** to start the PostgreSQL service.
2. **Run Setup Wizard**:
   * Double-click on [setup.bat](file:///d:/BBU/Project/POS_clone/POS-system/setup.bat).
   * This script will automatically copy `.env.example` to `.env`, install node dependencies (`npm install`), connect to PostgreSQL, prompt for password if needed, create the `pos_db` database, initialize schemas, and seed default sample data.
3. **Run Development Server**:
   * Double-click on [start.bat](file:///d:/BBU/Project/POS_clone/POS-system/start.bat).
   * The app will start, and you can open [http://localhost:3000](http://localhost:3000) in your web browser.

---

### Method 2: Manual Installation (របៀបដំឡើងដោយផ្ទាល់ - macOS / Linux / Windows)

If you prefer to configure the system manually step-by-step:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/pisethkhtk-star/POS-system.git
   cd POS-system
   ```
2. **Install node dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Copy the example configuration to your local env file:
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and configure your PostgreSQL connection URL:
   ```text
   DATABASE_URL="postgresql://<username>:<password>@localhost:5432/pos_db?schema=public"
   ```
4. **Push Schema & Seed Database**:
   Synchronize the database tables and populate the default seed data (such as default admin user, categories, initial products with 14-digit codes, role permissions):
   ```bash
   npx prisma generate
   npx prisma db push --force-reset
   npx prisma db seed
   ```
5. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

---

## 🐙 How to Commit & Push to Git (របៀបរុញកូដទៅកាន់ Git)

Follow these steps to safely save and push your changes to the remote Git repository:

### 1. Check current status (ពិនិត្យមើលឯកសារដែលបានកែប្រែ)
Before staging files, check which files have been modified or added:
```bash
git status
```

### 2. View details of changes (ពិនិត្យមើលការកែប្រែកូដជាក់ស្តែង)
Optional but recommended to verify the exact code lines you modified:
```bash
git diff
```

### 3. Stage changes (រៀបចំឯកសារសម្រាប់ Commit)
You can choose to stage all modified files, or specify files/directories:
* To stage **all** changes (excluding files listed in `.gitignore` like `.env` and `store-settings.json`):
  ```bash
  git add .
  ```
* To stage only specific folders or files (e.g., just the `src` and `prisma` changes):
  ```bash
  git add src/ prisma/
  ```

### 4. Commit changes with a clear message (កត់ត្រាការផ្លាស់ប្តូរទុក)
Use descriptive commit messages (e.g. `feat:` for new features, `fix:` for bug fixes, `chore:` for settings):
```bash
git commit -m "feat: rename SKU to Code and set tax default to false"
```

### 5. Fetch remote updates first (ទាញយកកូដថ្មីៗពី Server ជាមុនសិន)
To avoid merge conflicts, it is always a best practice to pull the latest changes from the remote branch:
```bash
git pull --rebase origin main
```

### 6. Push code to the remote repository (រុញកូដទៅកាន់ Git Server)
Push your commits to the main remote branch:
```bash
git push origin main
```

---

## 📦 Tech Stack
* **Framework:** Next.js (App Router)
* **Database & ORM:** PostgreSQL & Prisma
* **Styling:** Vanilla CSS & Tailwind CSS
* **State Management:** Zustand
* **Authentication:** JSON Web Tokens (JWT)

---

## 📂 Project Structure
* `/prisma/`: Database schema (`schema.prisma`) and seed configurations (`seed.ts`).
* `/scripts/`: Setup scripts for automated deployment helpers.
* `/src/app/api/`: REST APIs for products, inventory, orders, discounts, customers, etc.
* `/src/components/`: Reusable react UI elements (POS components, Shared components).
* `setup.bat`: Automatic configuration script for Windows.
* `start.bat`: Startup script for Windows.
* `.gitignore`: Configured to exclude local env variables, temporary folders, and runtime settings.
