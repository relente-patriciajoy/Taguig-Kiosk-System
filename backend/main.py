# Requirements:
# pip install fastapi uvicorn easyocr pillow "qrcode[pil]" numpy python-multipart opencv-python

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import re
import uuid
import io
import cv2
import numpy as np
from datetime import datetime
from PIL import Image, ImageEnhance, ImageFilter
import qrcode
import easyocr

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

reader = easyocr.Reader(['en'], gpu=False, model_storage_directory='./easyocr_models')

visitors: dict = {}


class CaptureRequest(BaseModel):
    image_base64: str
    id_type: str


class ScanRequest(BaseModel):
    raw_data: str


def preprocess_image(image: Image.Image) -> np.ndarray:
    """
    Enhance image quality before OCR:
    - Upscale for better text resolution
    - Increase contrast and sharpness
    - Convert to grayscale for cleaner OCR
    """
    # Upscale 2x — small/far IDs become readable
    w, h = image.size
    image = image.resize((w * 2, h * 2), Image.LANCZOS)

    # Boost contrast
    image = ImageEnhance.Contrast(image).enhance(2.0)

    # Boost sharpness
    image = ImageEnhance.Sharpness(image).enhance(2.5)

    # Convert to numpy for OpenCV processing
    img_array = np.array(image)

    # Convert to grayscale
    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)

    # Apply adaptive threshold to handle uneven lighting (dark corners etc.)
    processed = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 31, 10
    )

    # Convert back to RGB for EasyOCR
    result = cv2.cvtColor(processed, cv2.COLOR_GRAY2RGB)
    return result


def parse_philsys(ocr_lines: list) -> dict:
    """
    PhilSys ID parser — strictly uses Filipino field labels to find values.
    Layout:
      Apelyido/Last Name       → DELA CRUZ
      Mga Pangalan/Given Names → JUANA
      Gitnang Apelyido/Middle Name → MARTINEZ
      Petsa ng Kapanganakan/Date of Birth → JANUARY 01, 1990
      Tirahan/Address          → 833 SISA ST., BRGY 526...
      ID Number top-left       → 1234-5678-9101-1213
    """
    full_name = ""
    address = ""
    id_number = ""
    birthday = ""

    lines = [l.strip() for l in ocr_lines if l.strip()]

    # Lines to always ignore — header text on the card
    IGNORE = [
        'republika ng pilipinas', 'republic of the philippines',
        'pambansang pagkakakilanlan', 'philippine identification card',
        'philippine', 'identification', 'pilipinas', 'philippines',
        'phl', 'psa', 'specimen', 'www.psa.gov.ph',
        'if found', 'please return'
    ]

    def is_ignored(line):
        ll = line.lower()
        return any(ig in ll for ig in IGNORE)

    def is_label(line):
        ll = line.lower()
        all_labels = [
            'apelyido', 'last name', 'mga pangalan', 'given name',
            'gitnang apelyido', 'middle name', 'petsa ng kapanganakan',
            'date of birth', 'tirahan', 'address', 'kasarian', 'sex',
            'uri ng dugo', 'blood type', 'kalagayang sibil', 'marital',
            'lugar ng kapanganakan', 'place of birth', 'araw ng pagkakaloob',
            'date of issue'
        ]
        return any(lbl in ll for lbl in all_labels)

    def get_next_value(lines, index):
        """Get the next non-label, non-ignored line after index."""
        for j in range(index + 1, min(index + 3, len(lines))):
            candidate = lines[j].strip()
            if candidate and not is_label(candidate) and not is_ignored(candidate):
                return candidate
        return ''

    # ── ID Number ──────────────────────────────────────────────────────────
    for line in lines:
        m = re.search(r'\b\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}\b', line)
        if m:
            id_number = m.group().strip()
            break

    # ── Label-based field extraction ───────────────────────────────────────
    last_name   = ''
    first_name  = ''
    middle_name = ''

    for i, line in enumerate(lines):
        ll = line.lower()

        if not last_name and ('apelyido' in ll or 'last name' in ll):
            last_name = get_next_value(lines, i)

        elif not first_name and ('mga pangalan' in ll or 'given name' in ll):
            first_name = get_next_value(lines, i)

        elif not middle_name and ('gitnang apelyido' in ll or 'middle name' in ll):
            middle_name = get_next_value(lines, i)

        elif not birthday and ('petsa ng kapanganakan' in ll or 'date of birth' in ll):
            birthday = get_next_value(lines, i)

        elif not address and ('tirahan' in ll or ll.strip() == 'address'):
            # Address may span 2 lines — collect both
            val1 = get_next_value(lines, i)
            val2 = ''
            if val1:
                idx = lines.index(val1) if val1 in lines else i + 1
                for j in range(idx + 1, min(idx + 3, len(lines))):
                    c = lines[j].strip()
                    if c and not is_label(c) and not is_ignored(c):
                        val2 = c
                        break
            address = (val1 + ', ' + val2).strip(', ') if val2 else val1

    # ── Assemble full name (First Middle Last) ─────────────────────────────
    parts = [p for p in [first_name, middle_name, last_name] if p]
    if parts:
        full_name = ' '.join(parts).title()

    # ── Fallback birthday from date pattern ───────────────────────────────
    if not birthday:
        for line in lines:
            m = re.search(
                r'\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|'
                r'(?:January|February|March|April|May|June|July|August|'
                r'September|October|November|December)\s+\d{1,2},?\s+\d{4})\b',
                line, re.IGNORECASE
            )
            if m:
                birthday = m.group().strip()
                break

    # ── Fallback address from keywords ────────────────────────────────────
    if not address:
        for line in lines:
            if any(kw in line.lower() for kw in [
                'brgy', 'barangay', 'street', 'st.', 'ave', 'blk',
                'lot', 'zone', 'city', 'manila', 'quezon', 'taguig', 'metro'
            ]):
                address = line.strip()
                break

    return {
        "full_name": full_name  or "Unknown",
        "address":   address    or "Address not detected",
        "id_number": id_number  or "Not detected",
        "birthday":  birthday   or "Not detected",
    }


def parse_generic_id(ocr_lines: list, id_type: str) -> dict:
    """Fallback parser for non-PhilSys IDs."""
    full_text = " ".join(ocr_lines)
    full_name = ""
    address = ""
    id_number = ""
    birthday = ""

    patterns = {
        "SSS ID":           r'\b\d{2}[-\s]\d{7}[-\s]\d{1}\b',
        "UMID":             r'\b\d{4}[-\s]\d{7}[-\s]\d{1}\b',
        "Voter's ID":       r'\b\d{3}[-\s]\d{4}[-\s]\d{5}\b',
        "TIN ID":           r'\b\d{3}[-\s]\d{3}[-\s]\d{3}[-\s]\d{3}\b',
        "Driver's License": r'\b[A-Z]\d{2}[-\s]\d{2}[-\s]\d{6}\b',
        "Passport":         r'\b[A-Z]{2}\d{7}\b',
        "PhilHealth ID":    r'\b\d{2}[-\s]\d{9}[-\s]\d{1}\b',
        "PRC ID":           r'\b\d{7}\b',
        "Postal ID":        r'\b[A-Z0-9]{10,14}\b',
    }
    pattern = patterns.get(id_type, r'\b\d{6,20}\b')
    m = re.search(pattern, full_text, re.IGNORECASE)
    if m:
        id_number = m.group().strip()

    date_patterns = [
        r'\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b',
        r'\b(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b',
        r'\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})\b',
        r'\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b',
    ]
    for dp in date_patterns:
        dm = re.search(dp, full_text, re.IGNORECASE)
        if dm:
            birthday = dm.group().strip()
            break

    skip_keywords = ['REPUBLIC', 'PHILIPPINES', 'PILIPINAS', 'VALID', 'UNTIL',
                     'SIGNATURE', 'SEX', 'DOB', 'DATE', 'ISSUED', 'ADDRESS',
                     'FRONT', 'BACK', 'COMELEC', 'CIVIL', 'REGISTRY']
    name_candidates = []
    for line in ocr_lines:
        clean = line.strip()
        if re.search(r'\d{4,}', clean):
            continue
        if any(kw in clean.upper() for kw in skip_keywords):
            continue
        words = clean.split()
        if 2 <= len(words) <= 5 and sum(1 for w in words if w.isalpha()) >= 2:
            name_candidates.append(clean)
    if name_candidates:
        full_name = max(name_candidates, key=len).title()

    address_kw = ['barangay', 'brgy', 'street', 'st.', 'ave', 'avenue', 'city',
                  'taguig', 'manila', 'quezon', 'blk', 'block', 'lot', 'zone',
                  'district', 'province', 'metro']
    for line in ocr_lines:
        if any(kw in line.lower() for kw in address_kw):
            address = line.strip()
            break

    return {
        "full_name": full_name  or "Unknown",
        "address":   address    or "Address not detected",
        "id_number": id_number  or "Not detected",
        "birthday":  birthday   or "Not detected",
    }


@app.post("/capture-id")
async def capture_id(req: CaptureRequest):
    try:
        img_data = base64.b64decode(req.image_base64)
        image = Image.open(io.BytesIO(img_data)).convert("RGB")

        # Preprocess for better OCR accuracy
        processed = preprocess_image(image)

        results = reader.readtext(processed)
        ocr_lines = [text for (_, text, conf) in results if conf > 0.2]

        print("OCR Lines detected:", ocr_lines)  # Debug — visible in backend terminal

        # Use PhilSys-specific parser for National ID
        if req.id_type == "PhilSys (National ID)":
            parsed = parse_philsys(ocr_lines)
        else:
            parsed = parse_generic_id(ocr_lines, req.id_type)

        now = datetime.now()
        control_no = f"TGK-{now.strftime('%Y%m%d')}-{str(uuid.uuid4())[:5].upper()}"

        visitor = {
            "control_no": control_no,
            "full_name":  parsed["full_name"],
            "address":    parsed["address"],
            "id_number":  parsed["id_number"],
            "birthday":   parsed["birthday"],
            "id_type":    req.id_type,
            "time_in":    now.strftime("%B %d, %Y %I:%M %p"),
            "time_out":   None,
        }

        visitors[control_no] = visitor
        return visitor

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}


@app.post("/scan-id")
async def scan_id(req: ScanRequest):
    now = datetime.now()
    control_no = f"TGK-{now.strftime('%Y%m%d')}-{str(uuid.uuid4())[:5].upper()}"
    visitor = {
        "control_no": control_no,
        "full_name":  "Demo Visitor",
        "address":    "Demo Address, Taguig City",
        "id_number":  req.raw_data,
        "birthday":   "N/A",
        "time_in":    now.strftime("%B %d, %Y %I:%M %p"),
        "time_out":   None,
    }
    visitors[control_no] = visitor
    return visitor


@app.get("/generate-qr")
async def generate_qr(control_no: str, purpose: str):
    if control_no not in visitors:
        return {"error": "Visitor not found"}

    visitors[control_no]["purpose"] = purpose
    qr_data = f"TAGUIG-VISITOR|{control_no}|{visitors[control_no]['full_name']}|{purpose}"
    qr = qrcode.make(qr_data)

    buffer = io.BytesIO()
    qr.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode()
    return {"qr_code": f"data:image/png;base64,{encoded}"}


@app.get("/exit")
async def process_exit(control_no: str):
    if control_no not in visitors:
        return {"error": "Visitor not found"}
    visitors[control_no]["time_out"] = datetime.now().strftime("%B %d, %Y %I:%M %p")
    return visitors[control_no]


@app.get("/visitors")
async def get_visitors():
    return list(visitors.values())