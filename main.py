from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel, EmailStr
from pathlib import Path
import asyncio
import httpx
import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Portfolio Website")

app.mount("/static", StaticFiles(directory="static"), name="static")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = int(os.getenv("TELEGRAM_CHAT_ID", "0"))
TELEGRAM_PROXY_URL = os.getenv("TELEGRAM_PROXY_URL")
TELEGRAM_REQUEST_TIMEOUT = float(os.getenv("TELEGRAM_REQUEST_TIMEOUT", "15"))
MAX_BOT_TOKEN = os.getenv("MAX_BOT_TOKEN")
MAX_CHAT_ID = os.getenv("MAX_CHAT_ID")
MAX_API_BASE_URL = os.getenv("MAX_API_BASE_URL", "https://platform-api.max.ru")
EMAIL_SMTP_HOST = os.getenv("EMAIL_SMTP_HOST", "smtp.mail.ru")
EMAIL_SMTP_PORT = int(os.getenv("EMAIL_SMTP_PORT", "465"))
EMAIL_SMTP_USE_SSL = os.getenv("EMAIL_SMTP_USE_SSL", "true").lower() == "true"
EMAIL_SMTP_USERNAME = os.getenv("EMAIL_SMTP_USERNAME")
EMAIL_SMTP_PASSWORD = os.getenv("EMAIL_SMTP_PASSWORD") or os.getenv("EMAIL_PASSWORD")
EMAIL_FROM = os.getenv("EMAIL_FROM") or EMAIL_SMTP_USERNAME
EMAIL_TO = os.getenv("EMAIL_TO")


class ContactForm(BaseModel):
    name: str
    contact: str
    email: EmailStr
    message: str
    consent: bool


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
    
    async with httpx.AsyncClient(
        timeout=TELEGRAM_REQUEST_TIMEOUT,
        proxies=TELEGRAM_PROXY_URL,
    ) as client:
        response = await client.post(url, json=payload)
        if not response.is_success:
            error_detail = response.text
            raise Exception(f"Telegram API error: {error_detail}")


async def send_max_message(text: str) -> None:
    """Send message to MAX bot API."""
    if not MAX_BOT_TOKEN or not MAX_CHAT_ID:
        raise ValueError("MAX_BOT_TOKEN or MAX_CHAT_ID is not configured")

    url = f"{MAX_API_BASE_URL.rstrip('/')}/messages"
    payload = {
        "chat_id": MAX_CHAT_ID,
        "text": text,
        "format": "html",
    }
    headers = {
        "Authorization": MAX_BOT_TOKEN,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=TELEGRAM_REQUEST_TIMEOUT) as client:
        response = await client.post(url, json=payload, headers=headers)
        if not response.is_success:
            error_detail = response.text
            raise Exception(f"MAX API error: {error_detail}")


def _send_email_message_sync(subject: str, text: str) -> None:
    """Send email using SMTP in a blocking worker thread."""
    if not EMAIL_SMTP_USERNAME or not EMAIL_SMTP_PASSWORD or not EMAIL_FROM or not EMAIL_TO:
        raise ValueError("Email SMTP settings are incomplete")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = EMAIL_FROM
    message["To"] = EMAIL_TO
    message.set_content(text)

    smtp_cls = smtplib.SMTP_SSL if EMAIL_SMTP_USE_SSL else smtplib.SMTP
    with smtp_cls(EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, timeout=15) as server:
        if not EMAIL_SMTP_USE_SSL:
            server.starttls()
        server.login(EMAIL_SMTP_USERNAME, EMAIL_SMTP_PASSWORD)
        server.send_message(message)


async def send_email_message(subject: str, text: str) -> None:
    """Send message copy to email inbox."""
    await asyncio.to_thread(_send_email_message_sync, subject, text)


def build_plaintext_message(html_text: str) -> str:
    """Convert HTML-formatted notification text into plain text for email."""
    replacements = {
        "<b>": "",
        "</b>": "",
        "<pre>": "",
        "</pre>": "",
        "<br>": "\n",
        "<br/>": "\n",
        "<br />": "\n",
    }
    plain_text = html_text
    for old, new in replacements.items():
        plain_text = plain_text.replace(old, new)
    return plain_text


async def send_notification_message(text: str) -> None:
    """Send notification to all configured delivery channels in parallel."""
    tasks: list[tuple[str, asyncio.Task[None]]] = []
    plain_text = build_plaintext_message(text)

    if MAX_BOT_TOKEN and MAX_CHAT_ID:
        tasks.append(("max", asyncio.create_task(send_max_message(text))))
    if TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID:
        tasks.append(("telegram", asyncio.create_task(send_telegram_message(text))))
    if EMAIL_TO and EMAIL_FROM and EMAIL_SMTP_USERNAME and EMAIL_SMTP_PASSWORD:
        tasks.append((
            "email",
            asyncio.create_task(send_email_message("Новая заявка с сайта-портфолио", plain_text)),
        ))

    if not tasks:
        raise ValueError("No notification channels configured for delivery")

    results = await asyncio.gather(*(task for _, task in tasks), return_exceptions=True)
    errors: list[str] = []
    for idx, result in enumerate(results):
        if isinstance(result, Exception):
            provider_name = tasks[idx][0]
            errors.append(f"{provider_name}: {result}")

    if len(errors) == len(tasks):
        raise RuntimeError(f"All notification channels failed: {'; '.join(errors)}")


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
    """Handle contact form submission and send to all configured channels."""
    if not form.consent:
        raise HTTPException(
            status_code=422,
            detail="Необходимо подтвердить согласие на обработку персональных данных.",
        )

    message_text = (
        f"📬 <b>Новое сообщение с сайта-портфолио</b>\n\n"
        f"👤 <b>Имя:</b> {form.name}\n"
        f"📞 <b>Контакт:</b> {form.contact}\n"
        f"📧 <b>Email:</b> {form.email}\n"
        f"💬 <b>Сообщение:</b>\n{form.message}"
    )
    
    try:
        await send_notification_message(message_text)
    except (httpx.HTTPError, RuntimeError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail="Не удалось отправить сообщение в мессенджер. Повторите попытку позже.",
        ) from exc
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
    await send_notification_message(message_text)
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


@app.get(
    "/zen_v3WJ79cuC4QxlLvNBlwLN6X1fEYJL9XIpKwjA5l75Fkps2IcQUSiR6xUnODOs5wo.html",
    response_class=FileResponse,
)
async def zen_verification() -> FileResponse:
    """Yandex Zen verification file."""
    return FileResponse(
        "static/zen_v3WJ79cuC4QxlLvNBlwLN6X1fEYJL9XIpKwjA5l75Fkps2IcQUSiR6xUnODOs5wo.html"
    )


@app.get("/6b1dfffd6859a54366e0586ae29260b8.txt", response_class=FileResponse)
async def spaceweb_verification() -> FileResponse:
    """SpaceWeb partner verification file."""
    return FileResponse("static/6b1dfffd6859a54366e0586ae29260b8.txt")


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}
