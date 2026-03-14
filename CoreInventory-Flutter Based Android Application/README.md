# 📦 CoreInventory – Warehouse & Inventory Management App

CoreInventory is a modern **mobile-based inventory management application** built using **Flutter**.  
It helps businesses efficiently manage products, track stock, monitor warehouse operations, and analyze inventory data through a clean and user-friendly mobile interface.

This application connects to a backend **REST API** to perform real-time inventory updates and data synchronization.

---

# 🚀 Features

## 🔐 Authentication
- Secure Login System
- JWT Token Authentication
- Server connection test
- Error handling for API responses

---

## 📦 Product Management
- Add new products
- Edit / delete products
- Product categories
- SKU (Stock Keeping Unit) support
- Product images support

---

## 📊 Inventory Management
- Real-time stock tracking
- Add stock
- Remove stock
- Update stock quantities
- Inventory value calculation

---

## 🏭 Warehouse Management
- Multi-warehouse support
- Rack & shelf product location
- Organized storage tracking

---

## 📈 Dashboard & Analytics
- Total products overview
- Inventory stock status
- Low stock alerts
- Inventory statistics charts

---

# 🖼 Screenshots

Create a folder named **screenshots** inside your repository.

Example structure:

```
screenshots/
├── login.png
├── dashboard.png
├── inventory.png
├── product_details.png
├── warehouse_view.png
```

Then display them in README:

## Login Screen
![Login](screenshots/login.png)

## Dashboard
![Dashboard](screenshots/dashboard.png)

## Inventory Management
![Inventory](screenshots/inventory.png)

---

# 🏗 Architecture

The application follows a **layered architecture**:

```
UI Layer (Screens & Widgets)
        │
        ▼
Business Logic Layer (Services / Providers)
        │
        ▼
Data Layer (API Client, Models, Repository)
```

---

# 📂 Project Structure

```
coreinventory_app/
│
├── android/
├── ios/
│
├── lib/
│   ├── main.dart
│
│   ├── models/
│   │   ├── user_model.dart
│   │   ├── product_model.dart
│   │   └── inventory_model.dart
│
│   ├── services/
│   │   ├── auth_service.dart
│   │   ├── api_service.dart
│   │   └── inventory_service.dart
│
│   ├── screens/
│   │   ├── login_screen.dart
│   │   ├── dashboard_screen.dart
│   │   ├── inventory_screen.dart
│   │   ├── product_screen.dart
│   │   └── warehouse_screen.dart
│
│   ├── widgets/
│   │   ├── custom_button.dart
│   │   ├── product_card.dart
│   │   └── inventory_tile.dart
│
│   └── utils/
│       ├── constants.dart
│       └── api_endpoints.dart
│
├── assets/
│   ├── images/
│   └── icons/
│
├── screenshots/
│
├── pubspec.yaml
└── README.md
```

---

# ⚙️ Tech Stack

### Mobile
- Flutter
- Dart
- Material UI

### Networking
- Dio HTTP Client
- REST API

### Backend
- Node.js / Express.js
- PostgreSQL Database
- JWT Authentication

---

# 🔌 API Configuration

Update the API URL in:

```
lib/utils/api_endpoints.dart
```

Example:

```dart
const String baseUrl =
"https://coreinventory-management.onrender.com/api";
```

---

# 🧪 Test Server Connection

The login screen includes a **Test Server Connection button**.

Example response:

```
Connected! Server responded with HTTP 200
```

This confirms the backend server is reachable.

---

# 📦 Installation

### 1️⃣ Clone the repository

```bash
git clone https://github.com/yourusername/coreinventory-app.git
```

---

### 2️⃣ Open the project

```bash
cd coreinventory-app
```

Open the project in **Android Studio** or **VS Code**.

---

### 3️⃣ Install dependencies

```bash
flutter pub get
```

---

### 4️⃣ Run the application

```bash
flutter run
```

---

# 🛠 Requirements

- Flutter 3.x+
- Android Studio
- Android SDK
- Backend API running

---

# 🌐 Backend Deployment

Example backend API endpoint:

```
https://coreinventory-management.onrender.com
```

---

# 🔮 Future Improvements

- Barcode scanning
- Offline inventory updates
- Push notifications
- Supplier management
- Purchase order system
- Advanced analytics dashboard

---

# 👥 Authors
 
- **Anurag Barkhade **
- **Radhe Piplia**
- **Priyanshu Patel**
- **Avan Bhadoliya**

---

# 📄 License

This project is licensed under the **MIT License**.

---

# ⭐ Support

If you like this project, please consider **starring the repository** to support development.
