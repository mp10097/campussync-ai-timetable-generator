# CampusSync AI Timetable Generator

A responsive campus timetable dashboard inspired by the CampusSync live demo. This starter project includes a master-data workspace and a simple timetable draft generator.

## Live demo

https://campussync-ai-timetable-generator.vercel.app/

## Features

- Dashboard overview for teachers, rooms, divisions, and scheduled sessions
- Master data management for teachers, rooms/labs, subjects, and divisions
- Local browser storage for demo records
- Weekly timetable draft generation
- Basic checks to avoid assigning a teacher, room, or division twice in the same time slot
- Responsive desktop and mobile layout

## Run locally

No build tools are required for this starter version.

1. Download or clone this repository.
2. Open `index.html` in a modern browser.

For a local development server, you can use the VS Code Live Server extension.

## Deploy on Vercel

1. Push these files to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Deploy using the default static-site settings.

## Project files

- `index.html` — page structure
- `styles.css` — layout and styling
- `app.js` — interactions, browser storage, and demo timetable generation

## Important limitations

This is a frontend starter implementation. Data is stored in the current browser using `localStorage`; it is not connected to a shared database. The generator uses a simple heuristic and is not a production-grade AI optimizer. Do not use generated schedules for real academic operations without review and further validation.

## License

Choose and add a license if you plan to distribute or reuse this project publicly.
