# Documentatie Aplicatie

## Ce este aplicatia

Aplicatia este un scanner de inventar optimizat pentru iPhone.

Scopul ei principal este:
- sa scanezi rapid un cod de bare
- sa vezi produsul
- sa faci o actiune de stoc din cateva atingeri
- sa pastrezi istoric pentru fiecare modificare

Aplicatia este gandita in special pentru:
- iPhone Safari
- PWA instalata pe iPhone
- utilizare rapida in depozit sau magazin

---

## Stack tehnic

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- `html5-qrcode` pentru scanare

### Backend
- Django
- Django REST Framework
- JWT auth

### Baza de date
- PostgreSQL

---

## Arhitectura aplicatiei

Fluxul general este:

```text
iPhone / Browser
   ↓
Frontend Next.js
   ↓
API Django
   ↓
PostgreSQL
```

Frontend-ul se ocupa de:
- interfata
- camera
- scanner
- navigatie
- feedback vizual

Backend-ul se ocupa de:
- autentificare
- produse
- miscari de stoc
- validare
- reguli de business
- istoric

---

## Cum este organizat proiectul

```text
/frontend
/backend
/docs
/.env
/README.md
```

### Frontend

Fisiere importante:
- [frontend/src/app/layout.tsx](/home/vlad/Public/proiect%20scaner%20webapp/frontend/src/app/layout.tsx)
- [frontend/src/app/scan/page.tsx](/home/vlad/Public/proiect%20scaner%20webapp/frontend/src/app/scan/page.tsx)
- [frontend/src/app/products/page.tsx](/home/vlad/Public/proiect%20scaner%20webapp/frontend/src/app/products/page.tsx)
- [frontend/src/app/history/page.tsx](/home/vlad/Public/proiect%20scaner%20webapp/frontend/src/app/history/page.tsx)
- [frontend/src/app/login/page.tsx](/home/vlad/Public/proiect%20scaner%20webapp/frontend/src/app/login/page.tsx)

Componente principale:
- [frontend/src/components/scanner/scanner-shell.tsx](/home/vlad/Public/proiect%20scaner%20webapp/frontend/src/components/scanner/scanner-shell.tsx)
- [frontend/src/components/products/products-shell.tsx](/home/vlad/Public/proiect%20scaner%20webapp/frontend/src/components/products/products-shell.tsx)
- [frontend/src/components/history/history-shell.tsx](/home/vlad/Public/proiect%20scaner%20webapp/frontend/src/components/history/history-shell.tsx)

### Backend

Fisiere importante:
- [backend/config/settings.py](/home/vlad/Public/proiect%20scaner%20webapp/backend/config/settings.py)
- [backend/config/urls.py](/home/vlad/Public/proiect%20scaner%20webapp/backend/config/urls.py)
- [backend/apps/products/models.py](/home/vlad/Public/proiect%20scaner%20webapp/backend/apps/products/models.py)
- [backend/apps/inventory/models.py](/home/vlad/Public/proiect%20scaner%20webapp/backend/apps/inventory/models.py)
- [backend/apps/auth/views.py](/home/vlad/Public/proiect%20scaner%20webapp/backend/apps/auth/views.py)

---

## Cum functioneaza autentificarea

Aplicatia foloseste JWT.

Endpointuri:
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`

Flux:
1. utilizatorul face login
2. backend-ul returneaza `access` si `refresh token`
3. frontend-ul le salveaza in cookie-uri
4. requesturile catre API folosesc automat tokenul de acces
5. daca tokenul expira, frontend-ul incearca refresh automat

Frontend auth:
- [frontend/src/lib/api.ts](/home/vlad/Public/proiect%20scaner%20webapp/frontend/src/lib/api.ts)
- [frontend/src/lib/auth.ts](/home/vlad/Public/proiect%20scaner%20webapp/frontend/src/lib/auth.ts)
- [frontend/src/services/auth.ts](/home/vlad/Public/proiect%20scaner%20webapp/frontend/src/services/auth.ts)

Backend auth:
- [backend/apps/auth/views.py](/home/vlad/Public/proiect%20scaner%20webapp/backend/apps/auth/views.py)
- [backend/apps/auth/urls.py](/home/vlad/Public/proiect%20scaner%20webapp/backend/apps/auth/urls.py)

---

## Cum functioneaza scannerul

Pagina principala de scanare este:
- [frontend/src/app/scan/page.tsx](/home/vlad/Public/proiect%20scaner%20webapp/frontend/src/app/scan/page.tsx)

Logica scannerului este in:
- [frontend/src/components/scanner/scanner-shell.tsx](/home/vlad/Public/proiect%20scaner%20webapp/frontend/src/components/scanner/scanner-shell.tsx)

### Flux scanner

```text
Deschizi pagina /scan
→ se cere acces la camera
→ se porneste camera din spate
→ se detecteaza codul de bare
→ se cauta produsul dupa barcode
→ apare produsul
→ apesi o actiune rapida
→ se actualizeaza stocul
→ scannerul revine automat in modul ready
```

### Ce face scannerul

- porneste camera din spate
- incearca sa evite scanarile duplicate
- opreste curat camera la `pagehide` sau cand pagina iese din focus
- reia scannerul cand pagina revine
- curata instanta `html5-qrcode` cand scannerul se opreste

### Protectii importante

- duplicate scan prevention
- blocare temporara dupa scan
- anulare requesturi vechi
- revenire automata la scanner
- cache local pentru produse deja scanate

---

## Cum functioneaza produsele

Modelul principal este:
- [backend/apps/products/models.py](/home/vlad/Public/proiect%20scaner%20webapp/backend/apps/products/models.py)

Campuri:
- `name`
- `barcode`
- `sku`
- `quantity`
- `min_quantity`
- `image`
- `created_at`
- `updated_at`

Reguli importante:
- `barcode` este unic si indexat
- `sku` este unic
- numele si barcode-ul sunt validate
- imaginea este optionala

API produse:
- `GET /api/products/`
- `POST /api/products/`
- `GET /api/products/<barcode>/`
- `GET /api/products/id/<id>/`
- `PUT /api/products/id/<id>/`
- `PATCH /api/products/id/<id>/`
- `DELETE /api/products/id/<id>/`

Frontend produse:
- [frontend/src/components/products/products-shell.tsx](/home/vlad/Public/proiect%20scaner%20webapp/frontend/src/components/products/products-shell.tsx)

Ce poti face:
- creezi produs
- editezi produs
- stergi produs
- cauti dupa nume
- cauti dupa barcode
- cauti dupa SKU
- incarci imagine

---

## Cum functioneaza stocul

Modelul istoric este:
- [backend/apps/inventory/models.py](/home/vlad/Public/proiect%20scaner%20webapp/backend/apps/inventory/models.py)

Modelul `StockMovement` retine:
- produsul
- tipul miscarii
- cantitatea
- timestamp

Tipuri de miscari:
- `IN`
- `OUT`
- `DAMAGED`
- `RETURN`
- `ADJUSTMENT`

### Regula importanta

Stocul nu trebuie modificat direct din UI fara istoric.

Toate schimbarile de stoc trec prin:
- `Product.apply_stock_movement(...)`

Aceasta metoda:
- ruleaza intr-o tranzactie
- face lock pe randul produsului
- calculeaza noua cantitate
- blocheaza stocul negativ
- salveaza produsul
- creeaza istoric in `StockMovement`

Practic:

```text
orice schimbare de stoc
→ update produs
→ creare istoric
→ totul atomic
```

---

## Actiuni rapide de inventar

In scanner exista aceste actiuni:
- `+1`
- `-1`
- `+5`
- `-5`
- `damaged`
- `return`

Acestea folosesc endpointul:
- `POST /api/inventory/move/`

Body-ul trimis contine:
- `barcode`
- `movement_type`
- `quantity`

Raspunsul contine:
- produsul actualizat
- miscarea creata in istoric

Frontend service:
- [frontend/src/services/inventory.ts](/home/vlad/Public/proiect%20scaner%20webapp/frontend/src/services/inventory.ts)

Backend service:
- [backend/apps/inventory/services.py](/home/vlad/Public/proiect%20scaner%20webapp/backend/apps/inventory/services.py)

---

## Cum functioneaza istoricul

Istoricul este afisat in:
- [frontend/src/app/history/page.tsx](/home/vlad/Public/proiect%20scaner%20webapp/frontend/src/app/history/page.tsx)
- [frontend/src/components/history/history-shell.tsx](/home/vlad/Public/proiect%20scaner%20webapp/frontend/src/components/history/history-shell.tsx)

Endpoint:
- `GET /api/inventory/history/`

Filtre disponibile:
- `product`
- `movement_type`
- `date`

Ce afiseaza:
- nume produs
- barcode
- SKU
- tip miscare
- cantitate modificata
- timestamp

---

## Cum functioneaza low stock

Endpoint:
- `GET /api/reports/low-stock`

Regula:

```text
quantity <= min_quantity
```

Backend:
- [backend/apps/products/reports.py](/home/vlad/Public/proiect%20scaner%20webapp/backend/apps/products/reports.py)

Frontend:
- [frontend/src/components/reports/low-stock-panel.tsx](/home/vlad/Public/proiect%20scaner%20webapp/frontend/src/components/reports/low-stock-panel.tsx)

---

## Cum functioneaza imaginile produselor

Imaginea este stocata in Django Media.

Frontend:
- face compresie in browser in [frontend/src/lib/image.ts](/home/vlad/Public/proiect%20scaner%20webapp/frontend/src/lib/image.ts)
- afiseaza preview
- foloseste `next/image`

Backend:
- valideaza formatul si marimea imaginii
- returneaza `image_path` si `image_url`

---

## Cum functioneaza modul offline pregatit

Offline-ul complet nu este implementat inca, dar exista fundatia.

Fisiere:
- [frontend/worker/index.ts](/home/vlad/Public/proiect%20scaner%20webapp/frontend/worker/index.ts)
- [frontend/src/lib/offline/cache.ts](/home/vlad/Public/proiect%20scaner%20webapp/frontend/src/lib/offline/cache.ts)
- [frontend/src/lib/offline/queue.ts](/home/vlad/Public/proiect%20scaner%20webapp/frontend/src/lib/offline/queue.ts)

Ce exista acum:
- structura service worker
- cache local pentru produse
- coada locala pentru actiuni pending

Ce NU exista inca:
- sync automat cu backend
- replay automat cand revine internetul
- conflict resolution

---

## Paginile aplicatiei

### `/login`
- login utilizator

### `/scan`
- scanner principal
- workflow rapid de inventar

### `/products`
- administrare produse

### `/history`
- istoric miscari de stoc

---

## Cum pornesti aplicatia local

### Backend

```bash
cd backend
. venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

### Frontend

```bash
cd frontend
npm run dev
```

### Adrese utile

```text
Frontend: http://localhost:3000
Scanner:  http://localhost:3000/scan
Backend:  http://localhost:8000
Health:   http://localhost:8000/api/health/
```

---

## Ce trebuie sa stii pentru development

### 1. Login-ul cere migratii

Daca login-ul da eroare `500`, verifica migratiile:

```bash
cd backend
. venv/bin/activate
python manage.py migrate
```

### 2. Scannerul merge bine pe iPhone doar pe HTTPS

Pentru camera pe iPhone Safari:
- ideal folosesti `ngrok`
- sau PWA instalata prin HTTPS

Vezi:
- [docs/iphone-testing.md](/home/vlad/Public/proiect%20scaner%20webapp/docs/iphone-testing.md)

### 3. Toate modificarile de stoc trebuie sa treaca prin API

Nu modifica manual `quantity` in baza de date daca vrei consistenta.

Corect este:
- `POST /api/inventory/move/`

---

## Rezumat simplu

Aplicatia functioneaza asa:

```text
1. Utilizatorul face login
2. Deschide scannerul
3. Scaneaza codul de bare
4. Frontend-ul cere produsul din backend
5. Backend-ul cauta produsul in PostgreSQL
6. Utilizatorul apasa o actiune de stoc
7. Backend-ul actualizeaza atomic stocul
8. Backend-ul creeaza istoric
9. Frontend-ul afiseaza feedback si revine la scanner
```

Acesta este fluxul central al aplicatiei.
