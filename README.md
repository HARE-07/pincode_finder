# 📍 Pincode Finder

A FastAPI backend + browser UI for looking up Indian pincodes — single or bulk — with results plotted live on an interactive Leaflet map.

![Python](https://img.shields.io/badge/python-3.9%2B-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## ✨ Features

- **Single lookup** — `GET /pincode/{code}` returns city, state, district, and coordinates for one 6-digit pincode.
- **Bulk lookup** — `POST /pincode/bulk` accepts up to 20 pincodes at once and returns matches plus a list of any that weren't found.
- **Interactive map** — every result flies onto a single persistent Leaflet map (no flicker, no duplicate pins) using free OpenStreetMap tiles.
- **Quick-search shortcuts** — one-click buttons for 10 major Indian cities.
- **900+ pincode dataset** spanning every state and union territory, with latitude/longitude for each entry.
- **Auto-generated API docs** via FastAPI's built-in Swagger UI at `/docs`.

---

## 🗂 Project structure

```text
pincode_finder_website/
├── main.py            # FastAPI app, routes, static file mounting
├── model.py            # Pydantic request/response models + validation
├── data.py              # In-memory pincode database (900+ entries)
├── exception.py     # Custom exceptions and JSON error handlers
├── requirements.txt
└── static/
    ├── index.html    # UI markup
    ├── style.css       # Styling
    └── app.js           # Frontend logic + Leaflet map
```

---

## 🚀 Getting started

### 1. Clone and enter the project

```bash
git clone <your-repo-url>
cd pincode_finder_website
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

Activate it:

```bash
# Git Bash / macOS / Linux
source venv/Scripts/activate   # Windows Git Bash
source venv/bin/activate       # macOS / Linux

# Windows PowerShell
venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 4. Run the server

```bash
uvicorn main:app --reload
```

### 5. Open it

| What | URL |
|---|---|
| Web UI | http://127.0.0.1:8000 |
| Swagger docs | http://127.0.0.1:8000/docs |
| API root | http://127.0.0.1:8000/api |

---

## 🔌 API reference

### Single lookup

```
GET /pincode/{code}
```

**Example**

```bash
curl http://127.0.0.1:8000/pincode/110001
```

```json
{
  "pincode": "110001",
  "city": "New Delhi",
  "state": "Delhi",
  "district": "Central Delhi",
  "lat": 28.626806,
  "lon": 77.20663
}
```

Returns `404` with an `invalid_pincode` or `pincode_not_found` error body if the code is malformed or missing.

### Bulk lookup

```
POST /pincode/bulk
Content-Type: application/json
```

**Request body**

```json
{
  "pincode": ["110001", "400001", "560001"]
}
```

**Example**

```bash
curl -X POST http://127.0.0.1:8000/pincode/bulk \
  -H "Content-Type: application/json" \
  -d '{"pincode": ["110001", "400001", "000000"]}'
```

**Response**

```json
{
  "status": "success",
  "found": 2,
  "not_found": 1,
  "result": [ { "pincode": "110001", "city": "New Delhi", "...": "..." } ],
  "missing": ["000000"]
}
```

Rules: 1–20 pincodes per request, each exactly 6 digits.

---

## 🖥 Frontend

The `static/` folder is a plain HTML/CSS/JS UI served directly by FastAPI (no build step). It talks to the two endpoints above and renders results in cards/tables, plus a shared Leaflet map instance that flies to new coordinates on every search instead of re-rendering from scratch.

---

## 🧰 Tech stack

- [FastAPI](https://fastapi.tiangolo.com/) — web framework
- [Pydantic](https://docs.pydantic.dev/) — request/response validation
- [Uvicorn](https://www.uvicorn.org/) — ASGI server
- [Leaflet](https://leafletjs.com/) + [OpenStreetMap](https://www.openstreetmap.org/) — map rendering (no API key required)

---

## 🐛 Notable fixes from the original version

- The bulk validator previously checked `len(value)` inside the per-code loop — that measures the *number* of pincodes, not the length of each one. It now correctly checks `len(code)`.
- `PincodeNotFoundEror` was misspelled; corrected to `PincodeNotFoundError`.
- The invalid-pincode error message now includes the actual `exc.reason` instead of a generic string.

---

## 📄 License

MIT — feel free to use, modify, and share.
