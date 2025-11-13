# Настройка Email → Telegram форвардера для Авито

## 📋 Что это делает
Скрипт автоматически проверяет почту `aleksandr.shataylo@mail.ru` каждые 2 минуты и пересылает все новые сообщения от Авито в ваш Telegram.

---

## 🔧 Настройка

### Шаг 1: Получить пароль для приложений Mail.ru

Mail.ru не позволяет использовать обычный пароль для IMAP. Нужен **пароль для приложений**:

1. Зайдите на https://account.mail.ru/user/2-step-auth/passwords/
2. Войдите в аккаунт `aleksandr.shataylo@mail.ru`
3. Нажмите **"Пароли для внешних приложений"**
4. Создайте новый пароль с названием "Telegram Bot"
5. Скопируйте полученный пароль (16 символов)

**Важно:** Это НЕ ваш обычный пароль от почты!

### Шаг 2: Добавить пароль в .env

Откройте файл `.env` и добавьте строку:

```env
EMAIL_PASSWORD=ваш_пароль_для_приложений_из_шага_1
```

Ваш `.env` файл должен выглядеть так:
```env
TELEGRAM_BOT_TOKEN=8570644375:AAFM4GJ44BGpce4XAEhy5VDTAoi1Wj_5pl8
TELEGRAM_CHAT_ID=538756743
EMAIL_PASSWORD=abcd1234efgh5678
```

### Шаг 3: Запустить скрипт

```bash
cd /home/skifmail/IdeaProjects/my_site
source .venv/bin/activate
python email_forwarder.py
```

Вы увидите:
```
🚀 Запуск Email → Telegram форвардера
📧 Почта: aleksandr.shataylo@mail.ru
🔍 Проверка новых писем от Авито каждые 2 минуты...

⏰ 15:30:45 - Новых писем нет
⏰ 15:32:45 - Новых писем нет
✅ Отправлено сообщение: Вам пришло сообщение от покупателя...
```

---

## 📬 Формат сообщений в Telegram

Когда придёт письмо от Авито, в Telegram вы получите:

```
📮 Новое сообщение с Авито

📋 Тема: Вам пришло сообщение от покупателя
📨 От: noreply@avito.ru
🕐 Время: 13.11.2025 15:30
📱 Телефон: +79991234567 (если есть в письме)

💬 Текст:
Здравствуйте! Меня интересует ваша услуга...
```

---

## 🔄 Запуск в фоновом режиме

### Вариант 1: Screen (простой)

```bash
# Создать сессию
screen -S email_bot

# Внутри screen запустить скрипт
cd /home/skifmail/IdeaProjects/my_site
source .venv/bin/activate
python email_forwarder.py

# Выйти из screen (скрипт продолжит работать)
# Нажмите: Ctrl+A, затем D

# Вернуться в screen
screen -r email_bot

# Остановить скрипт
# Ctrl+C внутри screen
```

### Вариант 2: Systemd (для автозапуска при перезагрузке)

Создайте файл `/etc/systemd/system/email-forwarder.service`:

```ini
[Unit]
Description=Email to Telegram Forwarder
After=network.target

[Service]
Type=simple
User=skifmail
WorkingDirectory=/home/skifmail/IdeaProjects/my_site
Environment="PATH=/home/skifmail/IdeaProjects/my_site/.venv/bin"
ExecStart=/home/skifmail/IdeaProjects/my_site/.venv/bin/python email_forwarder.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Запустите сервис:
```bash
sudo systemctl daemon-reload
sudo systemctl enable email-forwarder
sudo systemctl start email-forwarder

# Проверить статус
sudo systemctl status email-forwarder

# Посмотреть логи
sudo journalctl -u email-forwarder -f
```

---

## 🐛 Возможные проблемы

### 1. "Ошибка при проверке почты: authentication failed"
**Решение:** Проверьте, что используете пароль для приложений (не обычный пароль)

### 2. "Не указан EMAIL_PASSWORD в .env файле"
**Решение:** Добавьте `EMAIL_PASSWORD=...` в файл `.env`

### 3. Письма не приходят в Telegram
**Решение:** 
- Проверьте, что письма от Авито не в спаме
- Убедитесь, что они приходят с адресов, содержащих "avito"
- Посмотрите в логи скрипта

### 4. Скрипт останавливается
**Решение:** Используйте systemd для автоперезапуска

---

## 📊 Мониторинг

Скрипт выводит в консоль:
- ✅ Успешно отправленные сообщения
- ❌ Ошибки при отправке
- ⏰ Регулярные отметки времени (каждые 2 минуты)

---

## 🔒 Безопасность

1. **Никогда не публикуйте** `.env` файл в Git
2. `.env` уже добавлен в `.gitignore`
3. Пароль для приложений можно в любой момент отозвать на mail.ru
4. Если пароль утёк — сгенерируйте новый в настройках Mail.ru

---

## ⚙️ Настройка под себя

### Изменить интервал проверки
В файле `email_forwarder.py` найдите строку:
```python
await asyncio.sleep(120)  # 120 секунд = 2 минуты
```

Измените на:
- `60` — каждую минуту
- `300` — каждые 5 минут
- `600` — каждые 10 минут

### Фильтровать другие источники
В строке поиска писем:
```python
status, messages = mail.search(None, '(UNSEEN FROM "avito")')
```

Можно заменить на:
- `FROM "youla"` — письма с Юлы
- `FROM "vk.com"` — уведомления ВКонтакте
- `SUBJECT "заказ"` — письма с темой "заказ"

---

## 🎯 Следующий шаг

После того как Email → Telegram заработает, можем добавить:
1. **ВКонтакте** → Telegram (через Callback API)
2. **WhatsApp Business** → Telegram
3. **Другие источники**

Готовы подключать следующий канал?
