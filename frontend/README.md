# Nesty Frontend

The frontend of Nesty is built with React and Vite.

## Tech Stack

- React 19
- Vite
- React Router DOM
- Axios
- Zustand
- Tailwind CSS

## Installation

From the `frontend` directory, install dependencies:

```bash
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

Vite will display the local development URL in the terminal.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the production version |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |

## API Configuration

The API base URL is configured in:

```text
src/api/axiosClient.js
```

Current local backend URL:

```text
https://localhost:7035/api
```

The Axios client automatically attaches the JWT token stored in browser `localStorage` to authenticated requests.