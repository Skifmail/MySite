/**
 * Сайт-портфолио: фон (canvas), навбар, скролл, анимации появления, модалки проектов, форма, cookie.
 */

(function () {
    'use strict';

    // ─── Canvas Background ─────────────────────────────────────────
    function initCanvas() {
        var canvas = document.getElementById('bg-canvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var particles = [];
        var mouse = { x: null, y: null };

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            var area = canvas.width * canvas.height;
            var count = Math.floor(area / 12000);
            particles = [];
            for (var i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4,
                    size: Math.random() * 1.5 + 0.5,
                    cyan: Math.random() > 0.6
                });
            }
        }

        function animate() {
            requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            var i, j, dx, dy, d;
            for (i = 0; i < particles.length; i++) {
                var p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.cyan ? 'rgba(0,229,255,0.6)' : 'rgba(124,58,237,0.4)';
                ctx.fill();
            }
            for (i = 0; i < particles.length; i++) {
                for (j = i + 1; j < particles.length; j++) {
                    dx = particles[i].x - particles[j].x;
                    dy = particles[i].y - particles[j].y;
                    d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 100) {
                        ctx.beginPath();
                        ctx.strokeStyle = 'rgba(99,102,241,' + (1 - d / 100) * 0.4 + ')';
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
                if (mouse.x != null) {
                    dx = particles[i].x - mouse.x;
                    dy = particles[i].y - mouse.y;
                    d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 150) {
                        ctx.beginPath();
                        ctx.strokeStyle = 'rgba(0,229,255,' + (1 - d / 150) * 0.6 + ')';
                        ctx.lineWidth = 1;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.stroke();
                    }
                }
            }
        }

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', function (e) {
            mouse.x = e.x;
            mouse.y = e.y;
        });
        window.addEventListener('mouseout', function () {
            mouse.x = null;
            mouse.y = null;
        });
        resize();
        animate();
    }

    // ─── Navbar scroll ─────────────────────────────────────────────
    function initNavbar() {
        window.addEventListener('scroll', function () {
            var nav = document.getElementById('navbar');
            if (nav) nav.classList.toggle('scrolled', window.pageYOffset > 60);
        });
    }

    // ─── Smooth scroll ─────────────────────────────────────────────
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function (a) {
            a.addEventListener('click', function (e) {
                e.preventDefault();
                var id = this.getAttribute('href');
                if (id === '#') return;
                var el = document.querySelector(id);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    // ─── Reveal animations ─────────────────────────────────────────
    function initReveal() {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var delay = entry.target.dataset.delay || 0;
                    entry.target.style.transitionDelay = delay + 'ms';
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        document.querySelectorAll('.reveal').forEach(function (el, i) {
            el.dataset.delay = (i % 4) * 80;
            observer.observe(el);
        });
    }

    // ─── Spotlight (mouse) on cards ───────────────────────────────
    function initSpotlight() {
        document.querySelectorAll('.service-card, .portfolio-item').forEach(function (el) {
            el.addEventListener('mousemove', function (e) {
                var r = el.getBoundingClientRect();
                el.style.setProperty('--mouse-x', (e.clientX - r.left) + 'px');
                el.style.setProperty('--mouse-y', (e.clientY - r.top) + 'px');
            });
        });
    }

    // ─── FAQ accordion ────────────────────────────────────────────
    function initFaq() {
        document.querySelectorAll('.faq-question').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var item = this.closest('.faq-item');
                var isOpen = item.classList.contains('open');
                document.querySelectorAll('.faq-item').forEach(function (i) { i.classList.remove('open'); });
                if (!isOpen) item.classList.add('open');
            });
        });
    }

    // ─── Modal: project data and open/close ────────────────────────
    var projectData = {
        tennisfan: {
            title: 'TennisFan.ru — платформа для теннисистов-любителей',
            description: 'Платформа для отслеживания теннисных матчей, турниров и статистики. Адаптивный интерфейс, удобный поиск по турнирам и игрокам.',
            screenshots: [
                { image: '/static/images/tennisfan_1.png', title: 'Главная страница', description: 'Обзор турниров, матчей и ближайших событий.' },
                { image: '/static/images/tennisfan_2.png', title: 'Личный кабинет игрока', description: 'Детальная статистика по матчам, рейтингу и динамике результатов конкретного игрока.' },
                { image: '/static/images/tennisfan_3.png', title: 'Раздел тренировок', description: 'Планирование и просмотр тренировок, слотов и доступных тренеров.' },
                { image: '/static/images/tennisfan_4.png', title: 'Тарифы и подписки', description: 'Доступные подписки и платные опции платформы для участников.' }
            ]
        },
        poizon: {
            title: 'Poizon Sync — синхронизация товаров',
            description: 'Автоматизация загрузки товаров из маркетплейса Poizon в WooCommerce с AI-генерацией SEO-описаний (GigaChat). Экономит 40 часов/месяц.',
            screenshots: [
                { image: '/static/images/веб-сервис 1.png', title: 'Главная страница сервиса', description: 'Ввод ссылок и настройки синхронизации.' },
                { image: '/static/images/веб-сервис 2.png', title: 'Процесс синхронизации', description: 'Прогресс в реальном времени (SSE).' },
                { image: '/static/images/веб-сервис 3.png', title: 'Результаты', description: 'Статистика и детали загруженных товаров.' }
            ]
        },
        'floral-bot': {
            title: 'FloralDetailsBot — бот для заказа цветов',
            description: 'Telegram-бот для флористического сервиса: каталог букетов, оформление заказа, уведомления о статусе. Принимает заявки 24/7.',
            screenshots: [
                { image: '/static/images/bot_1.png', title: 'Главное меню', description: 'Выбор формата заказа.' },
                { image: '/static/images/bot_2.png', title: 'Подбор букета', description: 'Вопросы по бюджету, цветам и поводу.' },
                { image: '/static/images/bot_3.png', title: 'Оформление заказа', description: 'Контакт, доставка, подтверждение.' },
                { image: '/static/images/bot_4.png', title: 'Статус заказа', description: 'Уведомления на каждом этапе.' }
            ]
        },
        psychologist: {
            title: 'Психолог Бот — запись к специалисту',
            description: 'Telegram-бот для автоматизации записи на приём: расписание, слоты, напоминания за 24 часа и в день приёма.',
            screenshots: [
                { image: '/static/images/psychologist_bot_1.jpg', title: 'Главное меню', description: 'Запись, расписание, управление.' },
                { image: '/static/images/psychologist_bot_2.jpg', title: 'Запись на приём', description: 'Выбор даты и времени, проверка слотов.' },
                { image: '/static/images/psychologist_bot_3.jpg', title: 'Напоминания', description: 'APScheduler, меньше пропусков.' }
            ]
        },
        'wb-position': {
            title: 'WB Position Bot — мониторинг Wildberries',
            description: 'Отслеживание позиций товаров в поисковой выдаче. Проверка каждые 10 минут, 85 регионов, уведомления при изменении.',
            screenshots: [
                { image: '/static/images/wb_rank_bot_1.jpg', title: 'Добавление товара', description: 'Артикул и поисковый запрос.' },
                { image: '/static/images/wb_rank_bot_2.jpg', title: 'Отслеживание', description: 'Уведомления при изменении позиции.' },
                { image: '/static/images/wb_rank_bot_3.jpg', title: 'Регионы', description: 'Позиции в 85 регионах России.' }
            ]
        }
    };

    function initModal() {
        var modal = document.getElementById('projectModal');
        var modalBody = document.getElementById('modalBody');
        var modalClose = document.getElementById('modalClose');

        if (!modal || !modalBody) return;

        document.querySelectorAll('.portfolio-item[data-project]').forEach(function (item) {
            var projectId = item.dataset.project;
            var project = projectData[projectId];
            if (!project) return;
            item.addEventListener('click', function () {
                var html = '<h2>' + project.title + '</h2><p>' + project.description + '</p><div class="modal-screenshots">';
                project.screenshots.forEach(function (s) {
                    html += '<div class="screenshot-item">';
                    if (s.image) html += '<img src="' + s.image + '" alt="' + (s.title || '') + '" loading="lazy">';
                    html += '<h3>' + (s.title || '') + '</h3><p>' + (s.description || '') + '</p></div>';
                });
                html += '</div>';
                modalBody.innerHTML = html;
                modal.classList.add('active');
            });
        });

        if (modalClose) modalClose.addEventListener('click', function () { modal.classList.remove('active'); });
        modal.addEventListener('click', function (e) {
            if (e.target === modal) modal.classList.remove('active');
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') modal.classList.remove('active');
        });
    }

    // ─── Contact form ─────────────────────────────────────────────
    function initForm() {
        var form = document.getElementById('contactForm');
        if (!form) return;
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = form.querySelector('.form-submit');
            var orig = btn.textContent;
            btn.textContent = 'Отправка...';
            btn.disabled = true;
            var data = {
                name: form.name.value,
                contact: form.contact.value,
                email: form.email.value,
                message: form.message.value
            };
            fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
                .then(function (res) {
                    if (res.ok) {
                        btn.textContent = 'Отправлено ✓';
                        btn.style.background = '#10b981';
                        form.reset();
                    } else {
                        throw new Error();
                    }
                })
                .catch(function () {
                    btn.textContent = 'Ошибка ✗';
                    btn.style.background = '#ef4444';
                })
                .finally(function () {
                    setTimeout(function () {
                        btn.textContent = orig;
                        btn.style.background = '';
                        btn.disabled = false;
                    }, 3000);
                });
        });
    }

    // ─── Privacy notice ───────────────────────────────────────────
    function acceptPrivacy() {
        try {
            localStorage.setItem('privacyConsent', 'accepted');
        } catch (e) {}
        var notice = document.getElementById('privacyNotice');
        if (notice) notice.classList.add('hidden');
    }
    window.acceptPrivacy = acceptPrivacy;

    function initPrivacy() {
        try {
            if (localStorage.getItem('privacyConsent') === 'accepted') {
                var notice = document.getElementById('privacyNotice');
                if (notice) notice.classList.add('hidden');
            }
        } catch (e) {}
    }

    // ─── Init on DOM ready ────────────────────────────────────────
    function init() {
        initCanvas();
        initNavbar();
        initSmoothScroll();
        initReveal();
        initSpotlight();
        initFaq();
        initModal();
        initForm();
        initPrivacy();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
