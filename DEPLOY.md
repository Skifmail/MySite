# 🚀 Инструкция по деплою на VPS (Ubuntu 22.04/24.04)

## 1. Подготовка сервера

Зайдите на сервер по SSH:
```bash
ssh root@ваш_ip_адрес
```

Обновите систему и установите необходимые пакеты:
```bash
apt update && apt upgrade -y
apt install python3-pip python3-venv git nginx -y
```

## 2. Клонирование проекта

Перейдите в домашнюю директорию и склонируйте репозиторий:
```bash
cd /root
git clone https://github.com/Skifmail/MySite.git
cd MySite
```

## 3. Настройка окружения

Создайте виртуальное окружение и установите зависимости:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 4. Настройка переменных окружения

Создайте файл `.env` на основе примера (или просто создайте новый):
```bash
nano .env
```

Вставьте туда ваши настройки:
```ini
TELEGRAM_BOT_TOKEN=ваш_токен
TELEGRAM_CHAT_ID=ваш_id
EMAIL_PASSWORD=ваш_пароль_приложения_mail_ru
```
*Нажмите Ctrl+X, затем Y и Enter для сохранения.*

## 5. Настройка автозапуска (Systemd)

Мы подготовили файлы служб в папке `deploy/`. Скопируйте их в системную папку:

```bash
# Копируем файлы служб
cp deploy/mysite.service /etc/systemd/system/
cp deploy/email_forwarder.service /etc/systemd/system/

# Перезагружаем демона systemd
systemctl daemon-reload

# Включаем автозапуск и запускаем службы
systemctl enable mysite
systemctl start mysite

systemctl enable email_forwarder
systemctl start email_forwarder
```

Проверьте статус:
```bash
systemctl status mysite
systemctl status email_forwarder
```

## 6. Настройка Nginx (Веб-сервер)

Скопируйте конфиг nginx:
```bash
cp deploy/nginx.conf /etc/nginx/sites-available/mysite
```

Откройте его и замените `your-domain.ru` на ваш реальный домен (или IP, если домена пока нет):
```bash
nano /etc/nginx/sites-available/mysite
```

Активируйте сайт:
```bash
ln -s /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # Удаляем дефолтный сайт
nginx -t  # Проверка конфига
systemctl restart nginx
```

## 7. Подключение HTTPS (SSL)

Если у вас есть домен, установите Certbot для бесплатного SSL-сертификата:

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d ваш-домен.ru -d www.ваш-домен.ru
```

Следуйте инструкциям на экране. Certbot сам обновит конфиг Nginx.

---
🎉 **Готово! Ваш сайт должен быть доступен по адресу вашего домена.**
