# CoreInventory

A professional Inventory Management System.

## Quick Start

```bash
docker compose up --build
```

## Access

| Service   | URL                        | Credentials                          |
|-----------|----------------------------|--------------------------------------|
| App       | http://localhost:3000      | Register a new account               |
| API       | http://localhost:5000      | —                                    |
| pgAdmin   | http://localhost:5050      | admin@coreinventory.com / admin123   |

## pgAdmin Setup

1. Open http://localhost:5050
2. Login: admin@coreinventory.com / admin123
3. Right-click Servers → Register → Server
4. Name: CoreInventory
5. Connection tab → Host: postgres, Port: 5432, DB: coreinventory, User: postgres, Password: postgres123
6. Save → Browse all tables

## Default Demo Login

Email: demo@coreinventory.com
Password: Demo@1234
