"""
Email to Telegram forwarder
Проверяет почту aleksandr.shataylo@mail.ru и пересылает сообщения от Авито в Telegram
"""
import imaplib
import email
from email.header import decode_header
import os
from dotenv import load_dotenv
import httpx
import asyncio
from datetime import datetime
import html
import re
from bs4 import BeautifulSoup


load_dotenv()


# Настройки
EMAIL_ADDRESS = "aleksandr.shataylo@mail.ru"
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = int(os.getenv("TELEGRAM_CHAT_ID", "0"))


IMAP_SERVER = "imap.mail.ru"
IMAP_PORT = 993

# Лимит Telegram API
TELEGRAM_MESSAGE_LIMIT = 4000
TEXT_PREVIEW_LENGTH = 500


def decode_mime_words(s):
    """Декодирование заголовков писем."""
    if not s:
        return ""
    decoded_fragments = decode_header(s)
    return ''.join(
        str(t[0], t[1] or 'utf-8') if isinstance(t[0], bytes) else str(t[0])
        for t in decoded_fragments
    )


def clean_html_text(html_content: str) -> str:
    """Очищает HTML и извлекает только видимый текст."""
    
    # ВАЖНО: сначала удаляем все теги через regex ДО парсинга BeautifulSoup
    # Это самый надежный способ
    
    # Удаляем <style> блоки
    html_content = re.sub(r'<style[^>]*>.*?</style>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    
    # Удаляем <script> блоки
    html_content = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    
    # Удаляем комментарии HTML
    html_content = re.sub(r'<!--.*?-->', '', html_content, flags=re.DOTALL)
    
    # Удаляем все теги DOCTYPE, meta, link и т.д.
    html_content = re.sub(r'<\?xml[^>]*\?>', '', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'<!DOCTYPE[^>]*>', '', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'<head[^>]*>.*?</head>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    
    # Удаляем все img, svg теги
    html_content = re.sub(r'<img[^>]*/?>', '', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'<svg[^>]*>.*?</svg>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    
    # Парсим с BeautifulSoup
    soup = BeautifulSoup(html_content, "html.parser")
    
    # Удаляем тело с таблицами (в письмах от Авито всё в таблицах)
    for tag in soup.find_all(['table', 'tbody', 'tr', 'td', 'th']):
        # Сначала вытаскиваем текст
        text_content = tag.get_text(separator=" ", strip=True)
        if text_content:
            tag.string = text_content
            # Удаляем дочерние элементы
            for child in tag.find_all():
                if child != tag:
                    child.decompose()
        else:
            tag.decompose()
    
    # Удаляем скрытые элементы
    for tag in soup.find_all(True):
        style = tag.get("style", "").lower()
        if any(x in style for x in ["display:none", "visibility:hidden", "opacity:0", "height:0px", "max-height:0"]):
            tag.decompose()
    
    # Извлекаем весь текст
    text = soup.get_text(separator="\n", strip=True)
    
    # Декодируем HTML-сущности
    text = html.unescape(text)
    
    # Удаляем все URL-ы (трекеры)
    text = re.sub(r'https?://[^\s]+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'www\.[^\s]+', '', text, flags=re.IGNORECASE)
    
    # Разбиваем по строкам и фильтруем мусор
    lines = []
    for line in text.splitlines():
        line = line.strip()
        # Пропускаем пустые строки и мусор
        if not line or len(line) < 2:
            continue
        # Пропускаем служебный текст
        if any(skip in line.lower() for skip in [
            'margin', 'padding', 'width', 'height', 'display', 'border',
            'font-family', 'font-size', 'color:', 'background',
            'href', 'src=', 'mso-', 'vlink', 'alink'
        ]):
            continue
        lines.append(line)
    
    # Объединяем строки
    text = "\n".join(lines)
    
    # Убираем множественные пробелы внутри строк
    text = re.sub(r' {2,}', ' ', text)
    
    # Финальная очистка
    text = text.strip()
    
    return text if text else "Письмо без видимого текста"


def extract_avito_info(subject: str, body: str, sender: str) -> dict:
    """Извлекает информацию из письма Авито."""
    # Сразу же применяем очистку к body
    body = clean_html_text(body)
    
    info = {
        "subject": subject,
        "body": body[:TEXT_PREVIEW_LENGTH],  # Ограничиваем длину
        "sender": sender,
        "time": datetime.now().strftime("%d.%m.%Y %H:%M")
    }
    
    # Поиск телефона в теле письма
    phone_match = re.search(
        r'\+?[78][\s\-]?\(?(\d{3})\)?[\s\-]?(\d{3})[\s\-]?(\d{2})[\s\-]?(\d{2})',
        body
    )
    if phone_match:
        info["phone"] = phone_match.group(0)
    
    return info


async def send_to_telegram(message: str, retries: int = 3):
    """Отправка сообщения в Telegram с повторными попытками."""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "HTML"
    }
    
    for attempt in range(retries):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload)
                if response.is_success:
                    return True
                else:
                    print(f"Ошибка Telegram API: {response.status_code} - {response.text}")
                    return False
        except (httpx.TimeoutException, httpx.ConnectError) as e:
            print(f"Попытка {attempt + 1}/{retries}: Ошибка сети - {type(e).__name__}")
            if attempt < retries - 1:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff: 1s, 2s, 4s
            else:
                print("Не удалось отправить сообщение после всех попыток")
                return False
        except Exception as e:
            print(f"Неожиданная ошибка: {e}")
            return False
    
    return False


async def send_avito_message(info: dict):
    """Отправляет сообщение Авито в Telegram с шапкой и началом текста."""
    # Экранируем текст для HTML
    subject = html.escape(info['subject'][:100])
    sender = html.escape(info['sender'][:50])
    body = html.escape(info['body'])
    
    phone = f"\n📱 <b>Телефон:</b> {html.escape(info['phone'])}" if 'phone' in info else ""
    
    message = (
        f"📮 <b>Новое сообщение с Авито</b>\n\n"
        f"📋 <b>Тема:</b> {subject}\n"
        f"📨 <b>От:</b> {sender}\n"
        f"🕐 <b>Время:</b> {info['time']}{phone}\n\n"
        f"💬 <b>Текст:</b>\n{body}"
    )
    
    success = await send_to_telegram(message, retries=3)
    return success


def extract_email_body(msg) -> str:
    """Извлекает текстовое содержимое из письма."""
    body = ""
    
    if msg.is_multipart():
        # Сначала ищем text/plain
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition", ""))
            
            if "attachment" in content_disposition:
                continue
            
            if content_type == "text/plain":
                try:
                    body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    if body.strip() and not body.strip().startswith("<!DOCTYPE"):
                        return body
                except Exception:
                    pass
        
        # Если text/plain не найдена или пуста, ищем text/html
        for part in msg.walk():
            if part.get_content_type() == "text/html":
                try:
                    html_body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    # Возвращаем сырой HTML, очистка произойдет в extract_avito_info
                    if html_body.strip():
                        return html_body
                except Exception as e:
                    print(f"Ошибка получения HTML: {e}")
    else:
        try:
            body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')
            if body.strip():
                return body
        except Exception:
            body = "Не удалось декодировать текст письма"
    
    return body if body.strip() else "Письмо без видимого текста"


def check_email():
    """Проверяет почту на новые письма от Авито."""
    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
        mail.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        mail.select("INBOX")
        
        # Ищем непрочитанные письма от Авито
        status, messages = mail.search(None, '(UNSEEN FROM "avito")')
        
        if status != "OK":
            print("Ошибка при поиске писем")
            mail.close()
            mail.logout()
            return []
        
        email_ids = messages[0].split()
        print(f"Найдено новых писем от Авито: {len(email_ids)}")
        
        new_messages = []
        
        for email_id in email_ids:
            try:
                status, msg_data = mail.fetch(email_id, "(RFC822)")
                
                if status != "OK":
                    continue
                
                msg = email.message_from_bytes(msg_data[0][1])
                
                subject = decode_mime_words(msg["Subject"])
                sender = decode_mime_words(msg["From"])
                body = extract_email_body(msg)
                
                info = extract_avito_info(subject, body, sender)
                new_messages.append(info)
            except Exception as e:
                print(f"Ошибка обработки письма {email_id}: {e}")
                continue
        
        mail.close()
        mail.logout()
        
        return new_messages
        
    except Exception as e:
        print(f"Ошибка при проверке почты: {e}")
        return []


async def main():
    """Основной цикл проверки почты."""
    print("🚀 Запуск Email → Telegram форвардера")
    print(f"📧 Почта: {EMAIL_ADDRESS}")
    print(f"🔍 Проверка новых писем от Авито каждые 2 минуты...\n")
    
    while True:
        try:
            messages = check_email()
            
            for msg_info in messages:
                success = await send_avito_message(msg_info)
                if success:
                    print(f"✅ Отправлено: {msg_info['subject'][:50]}...")
                else:
                    print(f"⚠️  Не удалось отправить: {msg_info['subject'][:50]}...")
            
            if not messages:
                print(f"⏰ {datetime.now().strftime('%H:%M:%S')} - Новых писем нет")
            
            await asyncio.sleep(120)
            
        except KeyboardInterrupt:
            print("\n⛔ Остановка скрипта...")
            break
        except Exception as e:
            print(f"❌ Ошибка в main: {e}")
            await asyncio.sleep(120)


if __name__ == "__main__":
    if not EMAIL_PASSWORD:
        print("⚠️  Не указан EMAIL_PASSWORD в .env файле!")
        print("Добавьте строку: EMAIL_PASSWORD=ваш_пароль_от_почты")
        exit(1)
    
    asyncio.run(main())