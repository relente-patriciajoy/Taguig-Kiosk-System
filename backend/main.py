from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
import datetime
import qrcode
import io
import base64

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/scan-id")
async def scan_id():
    return {
        "full_name": "JUAN DELA CRUZ",
        "address": "BGC, Taguig City",
        "id_type": "PhilSys (National ID)",
        "control_no": f"TAG-2026-{random.randint(1000, 9999)}",
        "time_in": datetime.datetime.now().strftime("%I:%M %p")
    }

@app.get("/generate-qr")
async def generate_qr(control_no: str, purpose: str):
    # Data to be encoded in the exit QR
    qr_data = f"EXIT_PASS|{control_no}|{purpose}|{datetime.date.today()}"

    # Create the QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    # Convert image to Base64 string so Angular can read it
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    img_str = base64.b64encode(buf.getvalue()).decode()

    return {"qr_code": f"data:image/png;base64,{img_str}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)