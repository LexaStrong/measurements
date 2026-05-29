# Lemaire Atelier — Client Measurement Records

Lemaire is a premium, lightweight, and secure web application designed for high-end ateliers, tailors, and fashion designers. It streamlines the process of recording client measurements, tracking order timelines, managing payments, and generating professional digital receipts.

![Lemaire Logo](logo.png)

## ✨ Features

- **Measurement Tracking**: Comprehensive fields for top and bottom garments with built-in visual diagrams.
- **Financial Dashboard**: Track total revenue, outstanding balances, and monthly client intake at a glance.
- **Collection Management**: Integrated reminders for collection dates with status indicators (Overdue, Urgent, Upcoming).
- **Professional Receipts**: Generate digital, shareable receipts with encoded importable data.
- **Robust Storage**: Powered by **IndexedDB** for high-capacity, offline-first data management.
- **Modern UI**: A "Glassmorphism" design system with native Dark/Light theme support and smooth micro-interactions.
- **Privacy First**: All data is stored locally on your device. No external servers are used.

## 🛠 Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (Custom Design System), JavaScript (ES6+).
- **Data Layer**: IndexedDB (Primary), LocalStorage (Fallback/Backup).
- **Design**: Google Fonts (Playfair Display, Syne Mono), Glassmorphism UI.

## 🚀 Getting Started

Lemaire is a standalone web application. No installation or build steps are required for basic usage.

1.  Clone or download the repository.
2.  Open `index.html` in any modern web browser.
3.  (Optional) For full PWA support, serve the files via a local server or host on platforms like GitHub Pages or Vercel.

## 📥 Data Import/Export

- **CSV Export**: Back up your entire database to a universal spreadsheet format.
- **LMR Import**: Share individual client records or entire databases using the `.lmr` (Lemaire) file format or encoded text strings.

## 🔒 Security & Privacy

- **XSS Protection**: All user input is sanitized before rendering.
- **Local Data**: Your client's sensitive information never leaves your device.

---

*Crafted for the modern atelier.*
# measurements
