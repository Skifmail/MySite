# Примеры использования webhook для приема заявок

## Базовый адрес
```
POST https://ваш-сайт.ru/api/webhook
```

## Формат запроса
```json
{
    "source": "название_источника",
    "data": {
        // специфичные данные источника
    }
}
```

---

## 1. Авито

### Пример запроса:
```bash
curl -X POST https://ваш-сайт.ru/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "source": "avito",
    "data": {
      "name": "Иван Петров",
      "phone": "+79991234567",
      "email": "ivan@example.com",
      "message": "Интересует разработка Telegram-бота для автоматизации заказов",
      "ad_url": "https://www.avito.ru/moskva/predlozhenie_uslug/razrabotka_telegram-botov_123456789"
    }
  }'
```

### Результат в Telegram:
```
📮 Новое сообщение с Авито

👤 Имя: Иван Петров
📱 Телефон: +79991234567
📧 Email: ivan@example.com
💬 Сообщение:
Интересует разработка Telegram-бота для автоматизации заказов
🔗 Ссылка: https://www.avito.ru/moskva/predlozhenie_uslug/razrabotka_telegram-botov_123456789
```

### Как настроить с Авито:
1. Используйте email-пересылку (Авито → Gmail → Webhook через Zapier/Make)
2. Или парсите уведомления Авито через скрипт

---

## 2. ВКонтакте

### Пример запроса:
```bash
curl -X POST https://ваш-сайт.ru/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "source": "vk",
    "data": {
      "user_id": "123456789",
      "user_name": "Александр Смирнов",
      "text": "Здравствуйте! Хочу заказать веб-сервис для парсинга данных"
    }
  }'
```

### Результат в Telegram:
```
🔵 Новое сообщение ВКонтакте

👤 От: Александр Смирнов
🆔 ID: 123456789
💬 Сообщение:
Здравствуйте! Хочу заказать веб-сервис для парсинга данных
🔗 Профиль: https://vk.com/id123456789
```

### Как настроить с ВК:
1. Создайте сообщество ВКонтакте
2. Настройте Callback API в разделе "Управление" → "Работа с API"
3. Укажите адрес сервера: `https://ваш-сайт.ru/api/webhook`
4. При получении сообщения парсите данные и отправляйте POST

---

## 3. WhatsApp Business API

### Пример запроса:
```bash
curl -X POST https://ваш-сайт.ru/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "source": "whatsapp",
    "data": {
      "phone": "+79991234567",
      "name": "Мария",
      "message": "Добрый день! Нужна консультация по AI-интеграции"
    }
  }'
```

### Результат в Telegram:
```
💚 Новое сообщение WhatsApp

📱 Телефон: +79991234567
👤 Имя: Мария
💬 Сообщение:
Добрый день! Нужна консультация по AI-интеграции
```

---

## 4. Email (Gmail, Mail.ru, etc.)

### Пример запроса:
```bash
curl -X POST https://ваш-сайт.ru/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "source": "email",
    "data": {
      "from": "client@example.com",
      "subject": "Вопрос по разработке сайта",
      "body": "Здравствуйте! Интересует разработка landing page для моего бизнеса."
    }
  }'
```

### Результат в Telegram:
```
📧 Новое письмо на Email

📨 От: client@example.com
📋 Тема: Вопрос по разработке сайта
💬 Текст:
Здравствуйте! Интересует разработка landing page для моего бизнеса.
```

---

## 5. Произвольный источник

### Пример запроса:
```bash
curl -X POST https://ваш-сайт.ru/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "source": "youla",
    "data": {
      "user": "Дмитрий",
      "message": "Интересует разработка мобильного приложения",
      "link": "https://youla.ru/..."
    }
  }'
```

### Результат в Telegram:
```
📥 Новое сообщение из youla

{'user': 'Дмитрий', 'message': 'Интересует разработка мобильного приложения', 'link': 'https://youla.ru/...'}
```

---

## Как интегрировать с внешними сервисами

### Вариант 1: Zapier / Make (Integromat)
1. Создайте аккаунт на zapier.com или make.com
2. Настройте триггер (например, "Новое письмо в Gmail")
3. Добавьте действие "Webhook - POST Request"
4. URL: `https://ваш-сайт.ru/api/webhook`
5. Body: JSON с source и data

### Вариант 2: Python скрипт
```python
import requests

def send_to_webhook(source, data):
    url = "https://ваш-сайт.ru/api/webhook"
    payload = {
        "source": source,
        "data": data
    }
    response = requests.post(url, json=payload)
    return response.json()

# Пример использования
send_to_webhook("avito", {
    "name": "Клиент",
    "phone": "+79991234567",
    "message": "Текст сообщения"
})
```

### Вариант 3: Node.js скрипт
```javascript
const axios = require('axios');

async function sendToWebhook(source, data) {
    const response = await axios.post('https://ваш-сайт.ru/api/webhook', {
        source: source,
        data: data
    });
    return response.data;
}

// Пример использования
sendToWebhook('vk', {
    user_id: '123456789',
    user_name: 'Имя пользователя',
    text: 'Текст сообщения'
});
```

---

## Безопасность

Для продакшена рекомендуется добавить:
1. **API ключ** для аутентификации запросов
2. **Rate limiting** (ограничение количества запросов)
3. **IP whitelist** (разрешить только определенные IP)

Пример с API ключом:
```python
# В main.py добавить проверку
API_KEY = os.getenv("WEBHOOK_API_KEY")

@app.post("/api/webhook")
async def webhook(webhook_data: WebhookData, api_key: str = Header(None)):
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    # ... остальной код
```

Запрос с ключом:
```bash
curl -X POST https://ваш-сайт.ru/api/webhook \
  -H "Content-Type: application/json" \
  -H "api-key: ваш_секретный_ключ" \
  -d '{"source": "avito", "data": {...}}'
```
