# 🖥️ Alygen CRM — Frontend Application

High-performance, localized React 18 single-page application (SPA) built with Vite 5, Tailwind CSS, Lucide icons, and @xyflow/react for visual automation workflows.

---

## 🚀 Getting Started

The recommended and standard way to run the Alygen CRM frontend is via **Docker**:

```bash
# Run the complete multi-container stack (Frontend, Backend, Python Microservices)
docker compose up -d --build
```

Access the frontend dashboard at:
👉 **`http://localhost:4000`**

---

## 🛠️ Local Development (Standalone)

If you wish to run the Vite dev server directly on your host machine:

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

The application will start on `http://localhost:4000` with hot-module replacement (HMR) enabled.

---

## 🏛️ Component Architecture

```
frontend/src/
├── App.jsx                     # Core application layout, global state & paginated client table
├── main.jsx                    # Vite React entry point
├── index.css                   # Global Tailwind CSS directives & custom utility classes
├── components/
│   ├── Layout.jsx              # Navigation sidebar layout & top bar metrics
│   ├── LeadDrawer/             # Decomposed lead detail drawer:
│   │   ├── DrawerHeader.jsx    # Company header & status badges
│   │   ├── DrawerTelemetry.jsx # Technical metrics (SEO, Mobile, Security, WCAG, Pixels)
│   │   ├── DrawerEmailPitch.jsx# Interactive elite outreach email preview iframe
│   │   └── DrawerSidebar.jsx   # CRM actions, notes & contact controls
│   └── Automations/            # Visual automation canvas (@xyflow/react)
├── hooks/
│   └── useLeads.js             # React Query lead fetching & sync hook
├── pages/
│   ├── Dashboard.jsx           # Sales funnel Kanban & high-level analytics
│   ├── ClientMap.jsx           # Interactive territory map with GPS geolocation
│   └── ReportPage.jsx          # Shareable public technical audit report view
└── services/
    └── api.js                  # Axios REST API client
```

---

## 🐳 Docker Production Build

The production build uses a multi-stage Docker build with Nginx for static asset serving:

```dockerfile
# Build Stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Nginx Production Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 📄 License

Proprietary — All Rights Reserved. Part of the Alygen Ecosystem.
