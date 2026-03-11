# 🏛️ Taguig City Kiosk System
**Full-Stack Web Application for Visitor Management and Scanning**

This project is a modern, web-based kiosk system designed for the **Information and Technology Office of the City of Taguig - CCTV**. It streamlines visitor registration and attendance tracking using QR/Barcode scanning technology.

## 🔗 Live Preview
You can access the live frontend deployment here:
 **[View Live Kiosk](https://verdant-malasada-943d32.netlify.app/)**

You can access the Admin Dashboard here:
 **[Admin Dashboard](https://verdant-malasada-943d32.netlify.app/admin/login)**
 
> **Note:** For the best experience and to test the scanning features, please open the link on a **mobile device**.

---

## 🚀 Technical Stack

### Frontend
- **Framework:** Angular (v19+)
- **Build Tool:** Vite
- **Deployment:** Netlify
- **Key Features:**
  - Responsive "Office Siren" / Minimalist UI
  - Secure HTTPS Camera access for QR scanning
  - SPA Routing with `_redirects` support

### Backend (In Progress)
- **Framework:** Python / FastAPI
- **Database:** SQL
- **Infrastructure:** Automatic Audit Logging with Spring AOP principles

---

## 🔍 Optical Character Recognition (OCR) Engine
The system features a custom-built OCR module to automate data entry from physical IDs and documents.

### Technical Implementation
- **Library:** `EasyOCR` (Python-based)
- **Models:** Optimized using `easyocr_models` for fast inference on local hardware
- **Workflow:**
1. The Angular frontend captures a high-resolution image via the secure HTTPS stream.
  2. The image is processed by the FastAPI backend.
  3. `EasyOCR` extracts text (Names, ID numbers) and maps them to the Visitor schema.

### Why OCR?
- **Efficiency:** Reduces manual typing errors at the kiosk.
- **Security:** Automatically flags or logs visitor information against the local SQL database.

---

## 🛠️ Local Development

### Prerequisites
- Node.js & Angular CLI
- Python 3.10+

### Installation
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/relente-patriciajoy/Taguig-Kiosk-System.git](https://github.com/relente-patriciajoy/Taguig-Kiosk-System.git)
