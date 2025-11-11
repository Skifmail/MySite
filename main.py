from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, EmailStr
from pathlib import Path
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Portfolio Website")

app.mount("/static", StaticFiles(directory="static"), name="static")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = int(os.getenv("TELEGRAM_CHAT_ID", "0"))


class ContactForm(BaseModel):
    name: str
    contact: str
    email: EmailStr
    message: str


@app.get("/", response_class=HTMLResponse)
async def home() -> str:
    """Serve main portfolio page."""
    html_path = Path("templates/index.html")
    return html_path.read_text(encoding="utf-8")


@app.post("/api/contact")
async def contact(form: ContactForm) -> dict[str, str]:
    """Handle contact form submission and send to Telegram."""
    message_text = (
        f"📬 <b>Новое сообщение с сайта-портфолио</b>\n\n"
        f"👤 <b>Имя:</b> {form.name}\n"
        f"� <b>Контакт:</b> {form.contact}\n"
        f"�📧 <b>Email:</b> {form.email}\n"
        f"💬 <b>Сообщение:</b>\n{form.message}"
    )
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message_text,
        "parse_mode": "HTML"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        if not response.is_success:
            error_detail = response.text
            raise Exception(f"Telegram API error: {error_detail}")
        
    return {"status": "success"}


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}
