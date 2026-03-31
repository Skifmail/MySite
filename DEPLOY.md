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

### Редирект www → без www (важно для SEO)

Если и `https://aleks-shataylo.ru`, и `https://www.aleks-shataylo.ru` открываются без редиректа, поисковики видят **дубликат**. В `deploy/nginx.conf` для порта **80** уже отдельный `server` с `return 301` для `www`.

После **certbot** проверьте файл сайта в `/etc/nginx/sites-enabled/`:

- Должен быть отдельный блок `listen 443 ssl` с `server_name www.aleks-shataylo.ru` и строкой  
  `return 301 https://aleks-shataylo.ru$request_uri;`
- Если certbot оставил только один SSL-блок на оба имени — добавьте второй блок только для `www` с редиректом (как для порта 80).

Проверка с компьютера:

```bash
curl -sI https://www.aleks-shataylo.ru/ | head -5
# Ожидается: HTTP/2 301 и Location: https://aleks-shataylo.ru/
```

---
🎉 **Готово! Ваш сайт должен быть доступен по адресу вашего домена.**

## 8. SSH-ключи и доступ к серверу (рекомендуется)

1. На вашей локальной машине проверьте наличие ключей:
```bash
ls -al ~/.ssh
```

2. Если ключа нет, сгенерируйте ed25519 ключ командой:
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```
Оставьте путь по умолчанию (`~/.ssh/id_ed25519`) и задайте passphrase по желанию.

3. Самый простой способ добавить ключ на сервер — использовать `ssh-copy-id`:
```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server_ip
```
Эта команда автоматически добавит ваш публичный ключ в `/home/user/.ssh/authorized_keys` на сервере.

4. Если `ssh-copy-id` недоступен, можно вручную: на локальной машине
```bash
cat ~/.ssh/id_ed25519.pub | ssh user@server_ip "mkdir -p ~/.ssh 6 chmod 700 ~/.ssh 6 cat >> ~/.ssh/authorized_keys 6 chmod 600 ~/.ssh/authorized_keys"
```

5. После добавления ключа проверьте подключение:
```bash
ssh user@server_ip
```

6. (Опция) Создайте обычного пользователя на сервере и добавьте его в sudoers для безопасной работы:
```bash
adduser deployer
usermod -aG sudo deployer
su - deployer
```

7. (Опция) Добавление SSH-ключа в GitHub (для push по SSH):
 - Скопируйте публичный ключ: `cat ~/.ssh/id_ed25519.pub`
 - Вставьте его в GitHub → Settings → SSH and GPG keys → New SSH key

8. (Опция) Чтобы снизить вероятность ошибок, можно создать алиас в `~/.ssh/config`:
```
Host myvps
	HostName server_ip
	User deployer
	IdentityFile ~/.ssh/id_ed25519
```
Теперь подключение — `ssh myvps`.

9. Дополнительно: после проверки работы ключей можно отключить пароли в `/etc/ssh/sshd_config`:
```
PasswordAuthentication no
PermitRootLogin prohibit-password
```
и перезагрузить SSH: `sudo systemctl restart sshd`.
