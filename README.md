# GAKUZAI Demo

[English](README.md) | [日本語](README.ja.md) | [中文](README.zh-CN.md)

GAKUZAI Demo is a self-hosted classroom prototype for interactive teaching-material editing and learning-process analysis. It is designed for a teacher's PC to run as a local server in a classroom, while students access the system from browsers on laptops, smartphones, or tablets over the same Wi-Fi/LAN.

The project focuses on a practical classroom problem: when many students edit digital teaching materials at the same time, the system should collect meaningful operation logs without turning every click into a separate database write.

![GAKUZAI system overview](docs/readme-system-overview.svg)

## Screenshots

| iPad / tablet view | Smartphone view | Smartphone view |
|---|---|---|
| ![iPad screenshot](assets/images/smartphone/ipad.png) | ![Smartphone screenshot 1](assets/images/smartphone/微信截图_20260731214700.png) | ![Smartphone screenshot 2](assets/images/smartphone/微信截图_20260731214737.png) |

| Student course page | Student textbook editor |
|---|---|
| ![Student course page](docs/screenshots/student-courses.png) | ![Student textbook editor](docs/screenshots/student-editor.png) |

## Interview Explanation Points

This repository is especially suitable for explaining a small but complete full-stack system:

- The frontend lets students read and edit teaching materials with highlighting, keyword hiding, popup notes, undo/redo, and autosave.
- The backend provides authentication, course management, material management, assignments, analytics, and CSV export through Express APIs.
- The database uses local SQLite, which keeps classroom deployment simple because the teacher does not need a cloud server.
- The operation-log queue reduces high-concurrency pressure by batching many student actions before sending them to the backend.
- The backend stores each batch inside a SQLite transaction and enables WAL mode to reduce read/write contention.
- The stress test script simulates 40 students sending operation events concurrently.

## Core Features

### Student Side

- Register and log in as a student.
- Join a course with an invite code.
- Open published teaching materials.
- Edit materials according to personal understanding.
- Use classroom-friendly editing tools:
  - highlight markers
  - text color
  - bold and underline
  - keyword hiding / replacement
  - popup notes
  - style clearing
  - undo and redo
- Save edited materials.
- Submit assignment answers.
- Use the system from smartphone, tablet, or desktop browsers.

### Teacher Side

- Register and log in as a teacher.
- Create and manage courses.
- Publish or unpublish teaching materials.
- Create assignments based on course materials.
- Check student participation and saved work.
- Analyze student operation logs by course, material, student, block, and action type.
- Export operation logs as CSV for further analysis.

### System Side

- Local classroom deployment with Node.js and Express.
- SQLite database stored inside the project directory.
- JWT-based API authentication.
- Password hashing with bcryptjs.
- API protection with helmet and express-rate-limit.
- Browser-side operation queue with localStorage persistence.
- Batch operation-log API and transaction-based database writes.
- SQLite busy timeout and WAL mode.

## High-Concurrency Queue Design

The important design idea is to avoid sending every student operation as an independent request.

```text
Student operation
  -> browser-side queue
  -> batch request
  -> Express API
  -> SQLite transaction
  -> operation_events table
```

### Why the Queue Exists

In a classroom, students often perform many small actions at nearly the same time: marking words, hiding keywords, adding notes, saving work, switching materials, or editing the same paragraph repeatedly.

If 40 students each perform 20 editing operations and every operation is sent immediately, the backend may receive around 800 small requests. For a local SQLite-based classroom server, that can create unnecessary HTTP overhead and frequent write-lock contention.

This project reduces that pressure by collecting operation events in the browser first, then sending them as batches.

### Frontend Queue

The queue configuration is defined in `assets/scripts/app.js`:

```js
const OPERATION_QUEUE_BATCH_SIZE = 20;
const OPERATION_QUEUE_FLUSH_DELAY_MS = 2500;
const OPERATION_QUEUE_MAX_RETRY_DELAY_MS = 30000;
const OPERATION_QUEUE_MAX_ITEMS = 1000;
```

Implementation points:

- Each operation has a `clientEventId` to avoid duplicate queue entries.
- Events are first stored in `state.operationQueue`.
- The queue is also persisted in `localStorage`, so temporary refreshes or network interruptions do not immediately lose unsent logs.
- The system waits briefly before flushing, which combines continuous operations into fewer requests.
- A browser only sends one batch at a time through `operationQueueInFlight`.
- Failed sends keep the queue intact and use exponential backoff up to 30 seconds.
- When the page becomes hidden or is about to unload, the client attempts a smaller `keepalive` send.

Key code locations:

| Part | File |
|---|---|
| Queue constants | `assets/scripts/app.js` |
| Queue enqueue logic | `assets/scripts/app.js` |
| Batch flush and retry | `assets/scripts/app.js` |
| Page-hide / unload protection | `assets/scripts/app.js` |

### Backend Batch Write

The backend receives multiple events through:

```text
POST /api/analytics/operation-events/batch
```

The route accepts up to 50 events in one request and writes the batch inside a database transaction:

```js
const writeBatch = db.transaction(() => events.map(event => (
  insertOperationEventForUser(req.user, event, materialCache)
)));
```

This means the system reduces database write overhead from many tiny writes to fewer grouped writes.

### SQLite Contention Reduction

SQLite is used because this demo is intended for local classroom deployment, not large public production traffic. To make SQLite more stable under classroom-scale concurrent access, the database initialization includes:

```js
db = new Database(dbPath, { timeout: 15000 });
db.pragma('busy_timeout = 15000');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
```

The important interview explanation:

- `busy_timeout` gives SQLite time to wait instead of failing immediately when the database is temporarily locked.
- WAL mode helps reduce read/write blocking compared with the default rollback journal mode.
- Batch writes reduce the number of times the database needs to enter a write transaction.
- `clientEventId` and duplicate-safe insertion make retry safer when network conditions are unstable.

![Concurrency design](docs/concurrency-explanation-ja.svg)

## Stress Test

The repository includes `stress-test.js`, which creates a temporary teacher, course, material, and 40 test students, then sends 20 operation events per student to the batch API.

```bash
node stress-test.js
```

The script reports:

- number of batch requests
- accepted operation events
- inserted operation events
- stored operation events
- distinct students stored
- execution time

This is useful in interviews because it connects the design claim to a reproducible script:

```text
40 students x 20 events = 800 operation events
800 individual writes -> reduced into around 40 batch requests
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript |
| Backend | Node.js, Express |
| Database | SQLite with better-sqlite3 |
| Authentication | JWT, bcryptjs |
| API protection | helmet, express-rate-limit |
| Data export | CSV export endpoint |
| Deployment model | Self-hosted local classroom server |

## Project Structure

```text
Gakuzai_demo/
├─ index.html
├─ app.html
├─ assets/
│  ├─ images/
│  │  ├─ smartphone/
│  │  └─ digital-logic/
│  ├─ scripts/
│  │  ├─ app.js
│  │  ├─ auth-page.js
│  │  └─ sample-lessons.js
│  └─ styles/
├─ server/
│  ├─ app.js
│  ├─ db.js
│  ├─ schema.sql
│  └─ routes/
├─ scripts/
├─ docs/
└─ stress-test.js
```

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start the server

```bash
npm start
```

Default URL:

```text
http://localhost:3000/
```

For classroom LAN testing, open the teacher PC's local IP address from student devices:

```text
http://<YOUR_LOCAL_IP>:3000/
```

Example:

```text
http://192.168.xx.xx:3000/
```

## Useful Commands

```bash
npm start
node stress-test.js
node scripts/import-digital-logic-material.js
node --check assets/scripts/app.js
node --check server/app.js
```

PowerShell example for changing the port:

```powershell
$env:PORT="3988"
npm start
```

## Environment Variables

See `.env.example`.

| Variable | Default | Description |
|---|---:|---|
| `PORT` | `3000` | Server port |
| `GAKUZAI_DATA_DIR` | `server/data` | Database directory |
| `GAKUZAI_DB_PATH` | `server/data/gakuzai.sqlite` | Explicit database path |
| `JSON_BODY_LIMIT` | `25mb` | JSON request body limit |
| `API_RATE_LIMIT` | `2000` | API rate limit per 15-minute window |

## Database Notes

The main database is generated at runtime:

```text
server/data/gakuzai.sqlite
```

When WAL mode is active, SQLite may also create:

```text
server/data/gakuzai.sqlite-wal
server/data/gakuzai.sqlite-shm
```

These files are normal runtime artifacts and should not be committed.

## Limitations and Future Improvements

This demo is suitable for local classroom experiments. For large-scale public production deployment, the following improvements would be needed:

- move from SQLite to PostgreSQL or MySQL
- add HTTPS and domain configuration
- add process management and monitoring
- add automated backups
- strengthen role and permission management
- centralize logs and operational metrics

## License

No license file is currently included. Add a `LICENSE` file before redistributing or reusing the project outside its current demo context.
