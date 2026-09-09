# AppOrbit — API Documentation & Contract Specification

This document details the HTTP REST API conventions, standard envelope patterns, error codes, and endpoint specifications for the **AppOrbit** platform backend.

---

## 1. Global Conventions

- **Base URL**: `http://localhost:5000/api` (configurable via `PORT` and `CLIENT_URL`)
- **Transport**: JSON over HTTP / HTTPS
- **Content-Type**: `application/json`
- **Default Encoding**: `UTF-8`

### Envelope Specifications

#### 1.1 Success Response Envelope
All successful requests return HTTP status codes in the `2xx` range with the following JSON structure:

```json
{
  "success": true,
  "message": "Human readable summary of action",
  "data": {}
}
```

#### 1.2 Error Response Envelope
All client and server errors return HTTP status codes in the `4xx` or `5xx` range with the following JSON structure:

```json
{
  "success": false,
  "message": "Human readable error description"
}
```

#### 1.3 Validation Error Response Envelope
For input validation rejections (HTTP 400 / 422):

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

---

## 2. Implemented Endpoints (Phase 1)

### 2.1 System Health Check

Returns the operational status of the AppOrbit API gateway.

- **URL**: `/api/health`
- **Method**: `GET`
- **Auth Required**: No
- **Rate Limit**: Standard global rate limit (100 requests / 15 minutes)

#### Response: `200 OK`
```json
{
  "success": true,
  "message": "AppOrbit API is running",
  "timestamp": "2026-09-08T09:45:00.000Z"
}
```

---

## 3. Future Endpoint Schemas (Phase 2+)

| Method | Endpoint | Description | Phase |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new User or Developer | Phase 2 |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT pair | Phase 2 |
| `POST` | `/api/auth/refresh` | Refresh access token | Phase 2 |
| `GET` | `/api/auth/me` | Fetch authenticated profile | Phase 2 |
| `GET` | `/api/apps` | List published applications | Phase 3 |
| `GET` | `/api/apps/:slug` | Retrieve application details | Phase 3 |
| `POST` | `/api/developer/apps` | Initialize application publication | Phase 3 |
| `POST` | `/api/developer/apps/:id/apks` | Upload and process APK bundle | Phase 3 |
| `GET` | `/api/admin/reviews` | Retrieve pending application submissions | Phase 4 |
| `POST` | `/api/admin/reviews/:id/decision`| Approve or reject APK submission | Phase 4 |
