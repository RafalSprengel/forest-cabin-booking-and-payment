<img width="1898" height="1665" alt="Zrzut ekranu 2026-01-31 233105" src="https://github.com/user-attachments/assets/f382cc75-d156-43e1-8208-890d539aa009" />

 ## Wilcze Chatki – Accommodation Website

A web application for **Wilcze Chatki**, a rental facility located in Szumleś Królewski, Kaszuby.

🌐 **Live Website:** [wilczehatki.vercel.app](https://wilczehatki.vercel.app)

---

## 🏗️ Project Status: In Progress

This project is currently in the development phase. While the informational sections are active, the application is being expanded to include full commercial functionality.

**Planned features:**
- **Booking System:** Implementation of an availability calendar and reservation management.
- **Payment Gateway:** Integration of online payment processing for bookings.
- **Notification System:** Automated email confirmations for reservation status.

---

## 📋 Overview

The application serves as an information hub for two rental cabins. It provides details regarding technical specifications, pricing structures, and regional points of interest.

### Current Functionalities:
- **Landing Page:** A modular layout containing information about the facility.
- **Hero Slider:** An image-based introduction to the property and its surroundings.
- **Pricing Module:** A breakdown of rates for weekdays and weekends.
- **Attractions Guide:** A list of local sites with external links to official resources.
- **Contact Form:** A validated form for user inquiries (handled via Formspree).
- **Responsive Design:** Optimized for mobile, tablet, and desktop viewports.

---

## 🛠️ Technical Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** CSS Modules (Global and Component-level)
- **Icons:** FontAwesome
- **Deployment:** Vercel

---

## 📂 Structure

- `src/app/components/`: Modular React components (Navbar, Contact, Services, etc.).
- `src/app/gallery/`: Placeholder for the upcoming image gallery.
- `src/app/globals.css`: Definition of CSS variables and global typography.

---

## 🚀 Local Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/username/repository-name.git

## Initial Database Seed

After setting MONGODB_URI in your environment, run a non-destructive initial seed:

```bash
npm run seed:initial
```

What this seed does:
- Creates missing system and booking configuration documents.
- Creates default seasons if they do not exist.
- Creates default cabins if they do not exist.
- Creates missing base and seasonal PropertyPrices records for each cabin.

This command does not clear existing collections.

If you need a full destructive reset (development only):

```bash
npm run seed:reset
```

This command clears core collections and seeds sample data from scratch.
