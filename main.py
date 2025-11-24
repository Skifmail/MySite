from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
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


class WebhookData(BaseModel):
    """Universal webhook data model for external sources."""
    source: str  # avito, vk, whatsapp, etc.
    data: dict  # source-specific data


async def send_telegram_message(text: str) -> None:
    """Send message to Telegram."""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "HTML"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        if not response.is_success:
            error_detail = response.text
            raise Exception(f"Telegram API error: {error_detail}")


def format_webhook_message(source: str, data: dict) -> str:
    """Format message based on source."""
    if source == "avito":
        return (
            f"📮 <b>Новое сообщение с Авито</b>\n\n"
            f"👤 <b>Имя:</b> {data.get('name', 'Не указано')}\n"
            f"📱 <b>Телефон:</b> {data.get('phone', 'Не указан')}\n"
            f"📧 <b>Email:</b> {data.get('email', 'Не указан')}\n"
            f"💬 <b>Сообщение:</b>\n{data.get('message', 'Пусто')}\n"
            f"🔗 <b>Ссылка:</b> {data.get('ad_url', 'Нет ссылки')}"
        )
    elif source == "vk":
        return (
            f"🔵 <b>Новое сообщение ВКонтакте</b>\n\n"
            f"👤 <b>От:</b> {data.get('user_name', 'Неизвестно')}\n"
            f"🆔 <b>ID:</b> {data.get('user_id', 'Нет ID')}\n"
            f"💬 <b>Сообщение:</b>\n{data.get('text', 'Пусто')}\n"
            f"🔗 <b>Профиль:</b> https://vk.com/id{data.get('user_id', '')}"
        )
    elif source == "whatsapp":
        return (
            f"💚 <b>Новое сообщение WhatsApp</b>\n\n"
            f"📱 <b>Телефон:</b> {data.get('phone', 'Не указан')}\n"
            f"👤 <b>Имя:</b> {data.get('name', 'Не указано')}\n"
            f"💬 <b>Сообщение:</b>\n{data.get('message', 'Пусто')}"
        )
    elif source == "email":
        return (
            f"📧 <b>Новое письмо на Email</b>\n\n"
            f"📨 <b>От:</b> {data.get('from', 'Неизвестно')}\n"
            f"📋 <b>Тема:</b> {data.get('subject', 'Без темы')}\n"
            f"💬 <b>Текст:</b>\n{data.get('body', 'Пусто')}"
        )
    else:
        return (
            f"📥 <b>Новое сообщение из {source}</b>\n\n"
            f"<pre>{data}</pre>"
        )


@app.get("/", response_class=HTMLResponse)
async def home() -> str:
    """Serve main portfolio page."""
    html_path = Path("templates/index.html")
    return html_path.read_text(encoding="utf-8")


@app.get("/privacy", response_class=HTMLResponse)
async def privacy() -> str:
    """Serve privacy policy page."""
    html_path = Path("templates/privacy.html")
    return html_path.read_text(encoding="utf-8")


@app.get("/offer", response_class=HTMLResponse)
async def offer() -> str:
    """Serve public offer page."""
    html_path = Path("templates/offer.html")
    return html_path.read_text(encoding="utf-8")


@app.post("/api/contact")
async def contact(form: ContactForm) -> dict[str, str]:
    """Handle contact form submission and send to Telegram."""
    message_text = (
        f"📬 <b>Новое сообщение с сайта-портфолио</b>\n\n"
        f"👤 <b>Имя:</b> {form.name}\n"
        f"📞 <b>Контакт:</b> {form.contact}\n"
        f"📧 <b>Email:</b> {form.email}\n"
        f"💬 <b>Сообщение:</b>\n{form.message}"
    )
    
    await send_telegram_message(message_text)
    return {"status": "success"}


@app.post("/api/webhook")
async def webhook(webhook_data: WebhookData) -> dict[str, str]:
    """
    Universal webhook endpoint for external sources.
    
    Examples:
    
    Avito:
    POST /api/webhook
    {
        "source": "avito",
        "data": {
            "name": "Иван Иванов",
            "phone": "+79991234567",
            "email": "ivan@example.com",
            "message": "Интересует разработка бота",
            "ad_url": "https://avito.ru/..."
        }
    }
    
    VK:
    POST /api/webhook
    {
        "source": "vk",
        "data": {
            "user_id": "12345678",
            "user_name": "Иван Иванов",
            "text": "Здравствуйте, интересует..."
        }
    }
    
    WhatsApp:
    POST /api/webhook
    {
        "source": "whatsapp",
        "data": {
            "phone": "+79991234567",
            "name": "Иван",
            "message": "Добрый день..."
        }
    }
    """
    message_text = format_webhook_message(webhook_data.source, webhook_data.data)
    await send_telegram_message(message_text)
    return {"status": "success", "source": webhook_data.source}


@app.get("/robots.txt", response_class=FileResponse)
async def robots() -> FileResponse:
    """Serve robots.txt file."""
    return FileResponse("static/robots.txt")


@app.get("/sitemap.xml", response_class=FileResponse)
async def sitemap() -> FileResponse:
    """Serve sitemap.xml file."""
    return FileResponse("static/sitemap.xml")


@app.get("/yandex_d2c11f07f510ffb1.html", response_class=FileResponse)
async def yandex_verification() -> FileResponse:
    """Yandex Webmaster verification file."""
    return FileResponse("static/yandex_d2c11f07f510ffb1.html")


@app.get("/google33b65dba152aabfb.html", response_class=FileResponse)
async def google_verification() -> FileResponse:
    """Google Search Console verification file."""
    return FileResponse("static/google33b65dba152aabfb.html")


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}
