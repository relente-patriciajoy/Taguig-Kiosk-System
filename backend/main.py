from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
import datetime

# 1. CREATE the app first
app = FastAPI()

# 2. NOW add the middleware
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)