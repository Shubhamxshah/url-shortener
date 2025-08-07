# Todo App

A modern, no-build single-page Todo app. Works fully offline with localStorage. Includes filters, search, bulk actions, and import/export.

## Run

Just open `index.html` in a browser. If you need a static server:

```bash
# Python 3
python3 -m http.server --directory /workspace/todo-app 5173
# or Node
npx serve /workspace/todo-app -l 5173 --single
```

Then open `http://localhost:5173`.

## Features
- Add, edit (double-click title), delete, toggle complete
- Filters: All, Active, Completed
- Search by text
- Toggle all, Clear completed
- Import/Export JSON
- LocalStorage persistence

## Data shape
Each todo:
```json
{
  "id": "string",
  "title": "string",
  "completed": false,
  "createdAt": 0,
  "updatedAt": 0
}
```