# iOS-First Inventory Scanner App — Codex Brief

## Project Goal

Build a robust iPhone-first inventory scanner web application.

Main focus:
- barcode scanning
- fast stock updates
- mobile workflow
- iPhone Safari support
- installable PWA experience
- smooth camera usage
- minimal taps

The app is NOT desktop-first.

The app is primarily designed for:
- iPhone Safari
- installed iOS PWA mode
- one-hand usage
- warehouse/store workflows

---

# Product Vision

This is NOT a full inventory ERP.

This is:

> a mobile barcode workflow app

Main workflow:

```text
Open app
→ Tap scan
→ Camera opens instantly
→ Scan barcode
→ Product appears
→ Tap quick action
→ Done
```

Target:
- under 3 taps
- under 3 seconds per operation

---

# iOS-First Rules

## Optimize specifically for:
- iPhone Safari
- iOS PWA mode
- touch-first UX
- thumb-friendly navigation
- fast camera access

## Avoid:
- desktop-style tables
- complicated dashboards
- enterprise layouts
- excessive typing
- heavy animations

---

# Main Features

## Barcode Scanner
- scan using iPhone camera
- fast barcode recognition
- continuous scanning
- instant feedback
- camera permission handling
- scanner stability

## Product Lookup
- barcode search
- quick product view
- quantity display
- low stock warnings

## Stock Actions
Quick actions:
- +1
- -1
- +5
- -5
- damaged
- return

## Inventory History
Every stock change must create history.

Never directly edit stock without movement history.

## PWA Installation
User must be able to:
- open Safari
- Add to Home Screen
- use app full-screen like native app

---

# Technical Stack

## Frontend
- Next.js
- React
- TypeScript
- TailwindCSS
- shadcn/ui
- next-pwa
- html5-qrcode

## Backend
- Django
- Django REST Framework

## Database
- PostgreSQL

---

# Architecture

```text
iPhone Safari
      ↓
Next.js PWA
      ↓
Django REST API
      ↓
PostgreSQL
```

---

# Root Folder Rules

Keep root folder CLEAN.

ONLY ALLOW:

```text
/frontend
/backend
/docs
.env
.gitignore
README.md
```

No random files.
No junk.
No temporary folders.

---

# Backend Structure

```text
/backend
 ├── venv/
 ├── config/
 ├── apps/
 │    ├── products/
 │    ├── inventory/
 │    ├── scanner/
 │    └── auth/
 ├── media/
 ├── static/
 ├── manage.py
 └── requirements.txt
```

---

# Frontend Structure

```text
/frontend
 ├── src/
 │    ├── app/
 │    ├── components/
 │    ├── features/
 │    ├── hooks/
 │    ├── services/
 │    ├── lib/
 │    └── types/
 ├── public/
 ├── styles/
 └── package.json
```

---

# Python Environment

Create isolated virtual environment.

Command:

```bash
python -m venv venv
```

Location:

```text
/backend/venv
```

Install ALL backend dependencies inside venv.

---

# Backend Dependencies

Install:

```bash
pip install django
pip install djangorestframework
pip install psycopg2-binary
pip install django-cors-headers
pip install pillow
pip install python-dotenv
pip install djangorestframework-simplejwt
```

Optional later:

```bash
pip install celery
pip install redis
```

Generate requirements:

```bash
pip freeze > requirements.txt
```

---

# Frontend Setup

Inside frontend:

```bash
npx create-next-app@latest .
```

Enable:
- TypeScript
- TailwindCSS
- App Router

---

# Frontend Dependencies

```bash
npm install axios
npm install html5-qrcode
npm install react-hook-form
npm install zod
npm install lucide-react
npm install next-pwa
npm install recharts
```

Install shadcn/ui:

```bash
npx shadcn@latest init
```

---

# Database Models

## Product

Fields:

```text
id
name
barcode
sku
quantity
min_quantity
cost_price
image
created_at
updated_at
```

Barcode must be:
- indexed
- unique
- fast lookup

---

## StockMovement

Fields:

```text
id
product
movement_type
quantity
notes
created_at
```

Movement types:
- IN
- OUT
- DAMAGED
- RETURN
- ADJUSTMENT

---

# Inventory Rules

- every stock change creates movement history
- inventory updates must be atomic
- prevent race conditions
- prevent negative stock unless admin
- use database transactions
- barcode lookup must be fast

---

# iOS Mobile UX Rules

## IMPORTANT

### Large touch targets
Minimum:

```text
48px touch targets
```

Prefer:

```text
56px+
```

---

## Bottom Navigation Only

Navigation:

```text
[ Scan ]
[ Products ]
[ History ]
[ Settings ]
```

---

## Scanner Is Main Screen

Scanner should be primary workflow.

Dashboard is secondary.

---

## Minimal Typing

Prefer:
- barcode scanning
- quick actions
- buttons
- toggles

Avoid forms whenever possible.

---

# Barcode Scanner Workflow

```text
Open scanner
→ Camera opens instantly
→ Scan barcode
→ Product appears
→ Quick stock action
→ Success feedback
→ Ready for next scan
```

Requirements:
- continuous scanning
- smooth camera startup
- scanner cleanup
- prevent duplicate scans
- support iPhone Safari
- support installed PWA mode

---

# Camera Rules

Use:
- html5-qrcode
- browser camera API

Must support:
- iPhone Safari
- iOS PWA mode
- Android Chrome

HTTPS required.

---

# API Endpoints

```text
GET /products
GET /products/:barcode
POST /products
PUT /products/:id

POST /inventory/move
GET /inventory/history
```

---

# Authentication

Use JWT authentication.

Keep auth simple.

---

# UI Pages

```text
/login
/scan
/products
/history
/settings
```

---

# PWA Requirements

The app MUST:
- be installable on iPhone
- work full-screen
- hide browser chrome
- include splash screen
- include app icons
- support Add to Home Screen

Required iOS meta tags:

```html
apple-mobile-web-app-capable
apple-mobile-web-app-status-bar-style
apple-touch-icon
```

---

# Local Network Testing

IMPORTANT:
I want to test the app on my real iPhone during development.

Requirements:
- frontend binds to 0.0.0.0
- backend binds to 0.0.0.0
- local network access enabled
- proper CORS setup
- app accessible from iPhone browser

Need:
- instructions for finding local IP
- instructions for testing from iPhone
- instructions for camera permissions

---

# MVP Priority

## Build First
1. authentication
2. barcode scanner
3. product lookup
4. stock actions
5. inventory history
6. PWA installability

---

## Build Later
- analytics
- reports
- AI
- multi-store
- notifications
- offline sync

---

# Deployment

## Frontend
- Vercel

## Backend
- Railway

## Database
- Neon PostgreSQL

---

# Final Goal

Build a robust iPhone-first inventory scanner app focused on:
- fast barcode scanning
- smooth camera workflow
- mobile-first UX
- reliable inventory tracking
- clean architecture
- installable PWA experience

Keep product:
- fast
- minimal
- reliable
- touch-friendly
- scalable

