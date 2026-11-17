# Nesty – E-commerce Platform

Nesty is an e-commerce web application developed as a team project. It consists of an ASP.NET Core Web API backend and a React frontend.

## Tech Stack

### Backend
- C#
- ASP.NET Core 8 Web API
- Entity Framework Core 8
- SQL Server
- JWT Authentication
- Swagger / OpenAPI

### Frontend
- React 19
- Vite
- React Router
- Axios
- Zustand
- Tailwind CSS

## Project Structure

```text
Nesty-Project/
├── Nesty/
│   ├── Nesty.sln
│   ├── Nesty.csproj
│   ├── Controllers/
│   └── Properties/
├── Nesty.Domain/
├── Nesty.Application/
├── Nesty.Infrastructure/
└── frontend/
    ├── src/
    ├── public/
    └── package.json
```

## Main Features

- User registration and login
- JWT-based authentication
- Product catalog and product variants
- Shopping cart and checkout
- Order management
- Inventory management
- Customer management
- Admin dashboard

## Prerequisites

Make sure the following tools are installed:

- .NET 8 SDK
- Node.js and npm
- SQL Server

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/NamTruongJr/Nesty_Web.git
cd Nesty_Web
```

### 2. Configure the backend

Configure the database connection string and JWT settings in the backend configuration.

Use `Nesty/appsettings.Example.json` as a reference and create your own local `Nesty/appsettings.json`.

Do not commit real database credentials or JWT secrets.

### 3. Run the backend

From the repository root:

```bash
dotnet restore Nesty/Nesty.sln
dotnet run --project Nesty/Nesty.csproj --launch-profile https
```

Backend API:

```text
https://localhost:7035/api
```

Swagger UI:

```text
https://localhost:7035/swagger
```

These URLs are for local development.

### 4. Run the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will display the local frontend URL in the terminal.

## Notes

- The frontend API base URL is currently configured in `frontend/src/api/axiosClient.js`.
- The backend uses SQL Server and requires a valid local database configuration.
- Local settings and secrets should not be committed to the repository.

## Project Status

Developed as a team project for learning and practicing full-stack web application development.