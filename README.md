# QuotePulse AI – Autonomous RFP Response & Competitive Quotation Orchestrator

QuotePulse AI is an advanced, agentic B2B quotation system designed to autonomously parse incoming Request for Proposals (RFPs), analyze competitive market pricing, determine optimal pricing strategies, and generate professional, presentation-ready PDF quotations.

Powered by **LangGraph**, **Groq (Llama 3)**, **Gemini 3.6 Flash**, and **FastAPI**, QuotePulse orchestrates multiple AI agents to transform a raw PDF/Text RFP into a finalized quote in seconds.

---

## 🌟 Key Features

* **Autonomous RFP Parsing**: Utilizes OCR (Tesseract) and PyPDF2 to extract unstructured line items, quantities, and requirements from uploaded RFP documents.
* **Agentic Pricing Strategy**: LangGraph agents query historical/market pricing from MongoDB and automatically propose pricing strategies (*Match Market, Undercut Leader, Premium Positioning*).
* **Live Interactive Review**: A stunning React + Tailwind dashboard allows sales officers to review the AI's suggestions, see market share estimates, tweak margins, and manually override prices before approval.
* **Editable PDF Generation**: Generates high-quality PDF quotations (using `xhtml2pdf` and Jinja2) complete with dynamic Indian Rupee (₹) formatting. Includes a live HTML preview editor to make final text tweaks before downloading.
* **Secure Architecture**: JWT-based authentication for all API endpoints, with React Router protected routes on the frontend.

---

## 🛠️ Technology Stack

### **Frontend**
* **Framework**: React (Vite)
* **Routing**: React Router DOM v6
* **Styling**: TailwindCSS (Custom glassmorphism & dark-mode UI)
* **HTTP Client**: Axios

### **Backend**
* **Framework**: FastAPI (Python)
* **AI/Orchestration**: LangGraph, LangChain, Groq API, Google Gemini API
* **Database**: MongoDB (via `motor` async driver)
* **Document Processing**: `PyPDF2`, `pytesseract` (OCR)
* **PDF Generation**: `xhtml2pdf`, `Jinja2`

---

## 🚀 Getting Started

### Prerequisites
1. **Node.js** (v18+ recommended)
2. **Python** (v3.10+ recommended)
3. **MongoDB**: A running MongoDB instance (Local or Atlas)
4. **Tesseract OCR**: Must be installed on your system.

### 1. Backend Setup

Navigate to the backend directory and install the required Python dependencies:

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory with the following variables:
```env
MONGO_URI=mongodb://localhost:27017/  # Or your MongoDB Atlas URI
SECRET_KEY=your_super_secret_jwt_key
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe  # Update based on your OS/install path
```

Start the FastAPI server:
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```

---

## 🧠 AI Agent Architecture (LangGraph)

The backend utilizes a directed graph of AI agents to process the RFP:

1. **Parser Agent (`parser.py`)**: Extracts structured JSON (item names, quantities, context) from raw text/OCR using Groq.
2. **Pricing Agent (`pricing.py`)**: Queries MongoDB for historical competitor pricing, calculates inverse-price-weighted market share, and assigns AI-recommended strategies.
3. **Drafter Agent (`drafter.py`)**: After human approval, this agent uses Gemini to draft a professional, context-aware 2-paragraph executive summary for the final PDF.

---

## 🔒 Authentication

The application uses standard OAuth2 Password Bearer flow. 
- You can create an account on the `/signup` page.
- Logging in provides an `access_token` stored securely in the React `AuthContext`.
- All `/api/v1/rfp/*` endpoints require the `Authorization: Bearer <token>` header.

---

## 📝 License
This project is licensed under the MIT License.
