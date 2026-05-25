# iPhone HTTPS Testing

Use this flow when testing the scanner on a real iPhone.

Camera access in iPhone Safari and installed PWA mode must be tested over HTTPS. For local development here, that means:

- frontend runs locally on `0.0.0.0:3000`
- backend runs locally on `0.0.0.0:8000`
- `ngrok` exposes both over HTTPS
- Django allows the ngrok host and origin

## Quick startup

Terminal 1:

```bash
cd frontend
npm run dev
```

Terminal 2:

```bash
cd backend
. venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

Terminal 3:

```bash
ngrok http 3000
```

Terminal 4:

```bash
ngrok http 8000
```

Use the HTTPS URL from the `3000` tunnel on the iPhone.

## Local IP usage

Find your LAN IP:

```bash
hostname -I
```

Example result:

```text
192.168.1.25 172.17.0.1
```

Use the Wi-Fi LAN address, for example:

```text
192.168.1.25
```

That local IP is useful for:

- checking that the frontend is reachable on the same network
- testing basic layout and connectivity before HTTPS
- verifying that both laptop and iPhone are on the same Wi-Fi

Example local URL:

```text
http://192.168.1.25:3000
```

Important:
- local IP access is not enough for reliable iPhone camera testing
- use the HTTPS ngrok URL for scanner camera tests

## ngrok setup

Start both tunnels:

```bash
ngrok http 3000
ngrok http 8000
```

Example output:

```text
Forwarding https://frontend-example.ngrok-free.app -> http://localhost:3000
Forwarding https://backend-example.ngrok-free.app -> http://localhost:8000
```

## Required `.env` changes

Update the root `.env` with the real HTTPS ngrok domains:

```text
NEXT_PUBLIC_API_BASE_URL=https://backend-example.ngrok-free.app/api
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost,0.0.0.0,backend-example.ngrok-free.app
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://frontend-example.ngrok-free.app
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://frontend-example.ngrok-free.app,https://backend-example.ngrok-free.app
```

Then restart:

```bash
cd frontend && npm run dev
cd backend && . venv/bin/activate && python manage.py runserver 0.0.0.0:8000
```

Why this matters:

- `NEXT_PUBLIC_API_BASE_URL` points the iPhone frontend at the HTTPS backend
- `DJANGO_ALLOWED_HOSTS` lets Django serve requests for the ngrok backend host
- `CORS_ALLOWED_ORIGINS` allows the HTTPS frontend origin to call the backend
- `CSRF_TRUSTED_ORIGINS` avoids origin trust problems for future authenticated/browser writes

## iPhone test flow

1. Connect the iPhone and the dev machine to the same Wi-Fi.
2. Start frontend, backend, and both ngrok tunnels.
3. Update `.env` with the ngrok HTTPS domains.
4. Restart frontend and backend after `.env` changes.
5. Open the frontend HTTPS ngrok URL in iPhone Safari.
6. Confirm the page loads and the scan screen opens.
7. When Safari asks for camera permission, tap `Allow`.
8. Scan a barcode and verify product lookup and stock actions.
9. Use Safari share sheet > `Add to Home Screen`.
10. Launch the installed PWA and repeat the scan test.

## What to open on iPhone

For layout-only quick checks:

```text
http://YOUR_LOCAL_IP:3000
```

For real scanner testing:

```text
https://frontend-example.ngrok-free.app
```

## Camera and PWA notes

- iPhone Safari camera access should be tested through HTTPS
- installed PWA camera behavior should also be tested through the same HTTPS-backed app
- if camera permission was denied earlier, fix it in `Settings > Safari > Camera`
- if the scanner opens but API calls fail, re-check `NEXT_PUBLIC_API_BASE_URL`, `CORS_ALLOWED_ORIGINS`, and `DJANGO_ALLOWED_HOSTS`

## Troubleshooting

If the frontend loads but product requests fail:
- confirm `NEXT_PUBLIC_API_BASE_URL` points to the backend ngrok HTTPS URL
- confirm the backend ngrok tunnel is still running
- confirm Django includes the backend ngrok hostname in `DJANGO_ALLOWED_HOSTS`

If the backend returns CORS errors:
- add the frontend ngrok HTTPS origin to `CORS_ALLOWED_ORIGINS`
- restart Django after changing `.env`

If camera permission does not appear:
- make sure you are using the HTTPS frontend ngrok URL
- do not test camera from plain `http://YOUR_LOCAL_IP:3000`

If the installed PWA behaves differently from Safari:
- remove the Home Screen app
- reopen the Safari HTTPS URL
- add it to Home Screen again
- retest permissions
