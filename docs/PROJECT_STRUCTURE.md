# GAKUZAI Project Structure

## Overview

This project is a self-hosted teaching-material editor.
The login page is separated from the editor page, and user data is stored in a local SQLite database through an Express API.

## database in window
C:\Users\hallo\AppData\Local\GakuzaiDemo\gakuzai.sqlite

## Directory Layout


```text
Gakuzai_demo/
|-- index.html
|-- app.html
|-- package.json
|-- assets/
|   |-- images/
|   |   |-- FA methods.png
|   |   |-- word methods.png
|   |   |-- textbook.png
|   |   |-- kcl.png
|   |   `-- kvl.png
|   |-- scripts/
|   |   |-- auth-page.js
|   |   |-- sample-lessons.js
|   |   `-- app.js
|   `-- styles/
|       |-- auth.css
|       `-- main.css
|-- server/
|   |-- app.js
|   |-- auth.js
|   |-- db.js
|   |-- schema.sql
|   |-- routes/
|   |   |-- auth.routes.js
|   |   |-- events.routes.js
|   |   |-- materials.routes.js
|   |   `-- settings.routes.js
|   `-- data/
|       `-- gakuzai.sqlite
`-- docs/
    `-- PROJECT_STRUCTURE.md
```

## File Responsibilities

- `index.html`
  - Login/register page with tabbed auth mode switching
  - First page users see

- `app.html`
  - Main editor application shell
  - Static DOM structure for the functional workspace
  - Redirects unauthenticated users back to `index.html`

- `assets/styles/main.css`
  - All page styles
  - Desktop/mobile responsive layout
  - Component visuals and state styles

- `assets/styles/auth.css`
  - Login/register page visuals
  - Responsive first-screen layout

- `assets/scripts/sample-lessons.js`
  - Built-in lesson seed data
  - Exposes `window.GAKUZAI_SAMPLE_LESSONS`

- `assets/scripts/auth-page.js`
  - Login and register form behavior
  - Debounced/disabled duplicate submissions
  - Stores the auth token and enters `app.html`

- `assets/scripts/app.js`
  - Main application behavior
  - Toolbar logic
  - Editing interactions
  - API-backed material persistence
  - User behavior event recording
  - Database-backed toolbar layout settings
  - Import/export and preview handling

- `server/app.js`
  - Express application entry
  - Serves the static frontend
  - Mounts `/api/auth`, `/api/materials`, `/api/events`, and `/api/settings`

- `server/data/gakuzai.sqlite`
  - Local SQLite database generated at runtime
  - Ignored by Git

## Database Tables

- `users`
  - Registered user accounts

- `materials`
  - Saved lesson edits owned by each user

- `user_events`
  - User behavior records such as login, material changes, view changes, editor actions, and settings updates

- `user_settings`
  - Per-user settings such as custom editing tool order

## Suggested Maintenance Rules

- Put login page structural changes in `index.html`
- Put editor page structural changes in `app.html`
- Put visual changes in `assets/styles/main.css`
- Put login page visual changes in `assets/styles/auth.css`
- Put default lesson content updates in `assets/scripts/sample-lessons.js`
- Put interaction or storage logic updates in `assets/scripts/app.js`
- Put backend API logic in `server/routes/`
- Put database schema changes in `server/schema.sql`
- If `app.js` grows further, the next split should be:
  - `storage.js`
  - `toolbar.js`
  - `editor.js`
  - `saved-view.js`
