"""
Taguig City Hall — Visitor Kiosk System
FastAPI Backend  |  Python 3.10+
Database: MySQL via XAMPP (pymysql)

Install dependencies:
    pip install fastapi uvicorn pymysql easyocr pillow python-multipart

Run:
    python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
"""

from __future__ import annotations

import base64
import io
import random
import string
from datetime import datetime, date
from typing import Optional

import pymysql
import pymysql.cursors
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ─────────────────────────────────────────────────────────
#  App setup
# ─────────────────────────────────────────────────────────
app = FastAPI(title="Taguig Kiosk API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten this in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────
#  Database config  — change only if you customized XAMPP
# ─────────────────────────────────────────────────────────
DB_CONFIG = {
    "host":     "127.0.0.1",
    "port":     3306,
    "user":     "root",       # default XAMPP user
    "password": "",           # default XAMPP password (blank)
    "db":       "taguig_kiosk",
    "charset":  "utf8mb4",
    "cursorclass": pymysql.cursors.DictCursor,
    "autocommit": True,
}


def get_db():
    """Return a fresh DB connection. Always close after use."""
    return pymysql.connect(**DB_CONFIG)


# ─────────────────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────────────────
def generate_control_no() -> str:
    """Generate a unique control number: TGK-YYYYMMDD-XXXXX"""
    today = datetime.now().strftime("%Y%m%d")
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"TGK-{today}-{suffix}"


def fmt_time(dt: Optional[datetime]) -> Optional[str]:
    if dt is None:
        return None
    return dt.strftime("%I:%M %p")   # e.g. "09:35 AM"


def fmt_datetime(dt: Optional[datetime]) -> Optional[str]:
    if dt is None:
        return None
    return dt.strftime("%b %d, %Y %I:%M %p")


# ─────────────────────────────────────────────────────────
#  Pydantic schemas
# ─────────────────────────────────────────────────────────
class CheckInRequest(BaseModel):
    full_name:  str
    birthday:   Optional[str] = None
    address:    Optional[str] = None
    id_type:    Optional[str] = None
    id_number:  Optional[str] = None
    purpose:    str


class CheckOutRequest(BaseModel):
    control_no: str


class CaptureIdRequest(BaseModel):
    image:   str       # base64 encoded image
    id_type: str


# ─────────────────────────────────────────────────────────
#  Routes
# ─────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "message": "Taguig Kiosk API is running"}


@app.get("/stats")
def get_stats():
    """Dashboard counters used by the landing page."""
    today = date.today()
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) AS total FROM visitors WHERE DATE(time_in) = %s",
                (today,)
            )
            total = cur.fetchone()["total"]

            cur.execute(
                "SELECT COUNT(*) AS inside FROM visitors WHERE status = 'inside'",
            )
            inside = cur.fetchone()["inside"]

        return {"visitors_today": total, "visitors_in": inside}
    finally:
        db.close()


@app.post("/checkin")
def check_in(body: CheckInRequest):
    """Register a new visitor and return their visitor pass data."""
    control_no = generate_control_no()
    time_in    = datetime.now()

    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                """
                INSERT INTO visitors
                  (control_no, full_name, birthday, address, id_type, id_number, purpose, time_in, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'inside')
                """,
                (
                    control_no,
                    body.full_name,
                    body.birthday,
                    body.address,
                    body.id_type,
                    body.id_number,
                    body.purpose,
                    time_in,
                ),
            )
        return {
            "success":    True,
            "control_no": control_no,
            "full_name":  body.full_name,
            "id_type":    body.id_type,
            "purpose":    body.purpose,
            "time_in":    fmt_time(time_in),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.post("/checkout")
def check_out(body: CheckOutRequest):
    """Mark a visitor as checked-out by control number."""
    db = get_db()
    try:
        with db.cursor() as cur:
            # Verify visitor exists and is still inside
            cur.execute(
                "SELECT * FROM visitors WHERE control_no = %s",
                (body.control_no,),
            )
            row = cur.fetchone()

            if not row:
                raise HTTPException(status_code=404, detail="Control number not found.")
            if row["status"] == "checked-out":
                raise HTTPException(status_code=400, detail="Visitor already checked out.")

            time_out = datetime.now()
            cur.execute(
                "UPDATE visitors SET status = 'checked-out', time_out = %s WHERE control_no = %s",
                (time_out, body.control_no),
            )

        return {
            "success":    True,
            "control_no": row["control_no"],
            "full_name":  row["full_name"],
            "purpose":    row["purpose"],
            "time_in":    fmt_time(row["time_in"]),
            "time_out":   fmt_time(time_out),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.get("/admin/visitors")
def get_visitors(date: Optional[str] = Query(default=None)):
    """
    Return all visitors for a given date (YYYY-MM-DD).
    Defaults to today if no date is provided.
    Used by the Admin Dashboard.
    """
    filter_date = date or str(datetime.now().date())

    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                """
                SELECT
                  id, control_no, full_name, id_type, purpose,
                  time_in, time_out, status
                FROM visitors
                WHERE DATE(time_in) = %s
                ORDER BY time_in DESC
                """,
                (filter_date,),
            )
            rows = cur.fetchall()

        visitors = [
            {
                "id":         r["id"],
                "control_no": r["control_no"],
                "full_name":  r["full_name"],
                "id_type":    r["id_type"] or "—",
                "purpose":    r["purpose"],
                "time_in":    fmt_time(r["time_in"]),
                "time_out":   fmt_time(r["time_out"]),
                "status":     r["status"],
            }
            for r in rows
        ]
        return {"visitors": visitors, "date": filter_date, "total": len(visitors)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()




@app.get("/admin/visitors/range")
def get_visitors_range(month: str = Query(default=None), year: str = Query(default=None)):
    """
    Return visitors filtered by month (YYYY-MM) or year (YYYY).
    Used by the Reports page.
    """
    db = get_db()
    try:
        with db.cursor() as cur:
            if month:
                # month is YYYY-MM — split and use YEAR()/MONTH() for compatibility
                year_part, month_part = month.split('-')
                cur.execute(
                    """
                    SELECT id, control_no, full_name, id_type, purpose,
                           time_in, time_out, status
                    FROM visitors
                    WHERE YEAR(time_in) = %s AND MONTH(time_in) = %s
                    ORDER BY time_in DESC
                    """,
                    (year_part, int(month_part)),
                )
            elif year:
                cur.execute(
                    """
                    SELECT id, control_no, full_name, id_type, purpose,
                           time_in, time_out, status
                    FROM visitors
                    WHERE YEAR(time_in) = %s
                    ORDER BY time_in DESC
                    """,
                    (year,),
                )
            else:
                raise HTTPException(status_code=400, detail="Provide month=YYYY-MM or year=YYYY")

            rows = cur.fetchall()

        visitors = [
            {
                "id":         r["id"],
                "control_no": r["control_no"],
                "full_name":  r["full_name"],
                "id_type":    r["id_type"] or "—",
                "purpose":    r["purpose"],
                "time_in":    fmt_datetime(r["time_in"]),
                "time_out":   fmt_datetime(r["time_out"]),
                "status":     r["status"],
            }
            for r in rows
        ]
        label = month or year
        return {"visitors": visitors, "period": label, "total": len(visitors)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.post("/capture-id")
def capture_id(body: CaptureIdRequest):
    """
    Receive a base64 image, run EasyOCR, return extracted text.
    Falls back gracefully if EasyOCR is not installed.
    """
    try:
        import easyocr
        import numpy as np
        from PIL import Image

        img_bytes  = base64.b64decode(body.image)
        pil_image  = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        img_array  = np.array(pil_image)

        reader  = easyocr.Reader(["en"], gpu=False, verbose=False)
        results = reader.readtext(img_array, detail=0)
        text    = " ".join(results)

        return {"success": True, "text": text, "lines": results}

    except ImportError:
        return {
            "success": False,
            "text":    "",
            "error":   "EasyOCR not installed. Run: pip install easyocr"
        }
    except Exception as e:
        return {"success": False, "text": "", "error": str(e)}


@app.get("/visitor/{control_no}")
def get_visitor(control_no: str):
    """Look up a single visitor by control number."""
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                "SELECT * FROM visitors WHERE control_no = %s",
                (control_no,),
            )
            row = cur.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Visitor not found.")

        return {
            "success":    True,
            "control_no": row["control_no"],
            "full_name":  row["full_name"],
            "id_type":    row["id_type"],
            "purpose":    row["purpose"],
            "time_in":    fmt_time(row["time_in"]),
            "time_out":   fmt_time(row["time_out"]),
            "status":     row["status"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()