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
        },
        'ostorozhno-detali': {
            title: 'Осторожно Детали — сайт студии декора мероприятий',
            description: 'Сайт полностью сделан по дизайну заказчика: промо-подача студии декора и оформления событий, презентация услуг, кейсов, этапов работы и удобная точка входа для новых клиентов.',
            screenshots: [
                { image: '/static/images/ostorozhno_1.png', title: 'Главная страница', description: 'Первый экран с визуальной подачей студии и основным оффером для клиентов.' },
                { image: '/static/images/ostorozhno_2.png', title: 'Форма заявки', description: 'Интерактивная форма заявки с отправкой данных в Телеграм и на email.' },
                { image: '/static/images/ostorozhno_3.png', title: 'Кейсы и визуальный стиль', description: 'Демонстрация оформленных проектов и атмосферы бренда через контентные секции.' },
                { image: '/static/images/ostorozhno_4.png', title: 'Instagram* виджет', description: 'Автоматически обновляемый виджет, подключенный к страничке заказчика.' }
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
                message: form.message.value,
                consent: form.consent.checked
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

    function initHeroTerminal() {
        var codeEl = document.getElementById('heroTerminalCode');
        var resultEl = document.getElementById('heroTerminalResult');
        var metaEl = document.getElementById('heroTerminalMeta');
        var stepEls = document.querySelectorAll('#heroTerminalSteps .hero-terminal-step');
        if (!codeEl || !resultEl || !metaEl || !stepEls.length) return;

        var frames = [
            {
                lines: [
                    '<span class="c-cm"># FastAPI + Telegram automation pipeline</span>',
                    '<span class="c-kw">from</span> fastapi <span class="c-kw">import</span> <span class="c-var">FastAPI</span>',
                    '<span class="c-kw">from</span> aiogram <span class="c-kw">import</span> <span class="c-var">Bot</span>',
                    '',
                    '<span class="c-var">app</span> = <span class="c-fn">FastAPI</span>()',
                    '<span class="c-var">bot</span> = <span class="c-fn">Bot</span>(token=<span class="c-str">"***"</span>)',
                    '',
                    '<span class="c-kw">async def</span> <span class="c-fn">build_flow</span>():',
                    '    <span class="c-kw">await</span> <span class="c-fn">sync_products</span>()',
                    '    <span class="c-kw">await</span> <span class="c-fn">render_landing</span>()',
                    '    <span class="c-kw">return</span> <span class="c-str">"ready"</span><span class="cursor"></span>'
                ],
                step: 0,
                result: 'Собираю backend и UI-сценарий',
                meta: 'FastAPI • templates • static assets'
            },
            {
                lines: [
                    '<span class="c-cm"># Attach webhook + validate payload</span>',
                    '<span class="c-kw">async def</span> <span class="c-fn">bind_webhook</span>(payload):',
                    '    lead = <span class="c-fn">normalize_payload</span>(payload)',
                    '    <span class="c-kw">if</span> <span class="c-kw">not</span> lead.<span class="c-var">email</span>:',
                    '        <span class="c-kw">raise</span> <span class="c-var">ValueError</span>(<span class="c-str">"missing email"</span>)',
                    '    <span class="c-kw">await</span> <span class="c-fn">push_to_crm</span>(lead)',
                    '    <span class="c-kw">await</span> <span class="c-fn">notify_manager</span>(lead)',
                    '    <span class="c-kw">return</span> <span class="c-str">"delivered"</span><span class="cursor"></span>'
                ],
                step: 1,
                result: 'Проверяю webhook и доставку данных',
                meta: 'validation • lead routing • CRM sync'
            },
            {
                lines: [
                    '<span class="c-cm"># Deploy new version</span>',
                    '<span class="c-var">$</span> git pull origin main',
                    '<span class="c-var">$</span> systemctl restart mysite',
                    '<span class="c-var">$</span> systemctl restart email_forwarder',
                    '',
                    '[ok] app restarted in <span class="c-num">0.8s</span>',
                    '[ok] webhook healthcheck passed',
                    '[ok] metrics stream online<span class="cursor"></span>'
                ],
                step: 2,
                result: 'Выкатываю обновление без простоя',
                meta: 'deploy • healthcheck • monitoring'
            },
            {
                lines: [
                    '<span class="c-cm"># Final action</span>',
                    '<span class="c-kw">await</span> <span class="c-fn">bot.send_message</span>(',
                    '    chat_id=<span class="c-str">"owner"</span>,',
                    '    text=<span class="c-str">"Проект запущен: лиды приходят, сайт обновлён, webhook активен."</span>',
                    ')',
                    '',
                    '<span class="c-var">status</span> = <span class="c-str">"LIVE"</span><span class="cursor"></span>'
                ],
                step: 3,
                result: 'Проект в эфире. Уведомление отправлено.',
                meta: 'launch complete • telegram notification'
            }
        ];

        var frameIndex = 0;
        var lineIndex = 0;

        function setSteps(activeIndex) {
            stepEls.forEach(function (stepEl, index) {
                stepEl.classList.remove('is-active', 'is-done', 'is-pending');
                if (index < activeIndex) {
                    stepEl.classList.add('is-done');
                } else if (index === activeIndex) {
                    stepEl.classList.add('is-active');
                } else {
                    stepEl.classList.add('is-pending');
                }
            });
        }

        function renderFrame() {
            var frame = frames[frameIndex];
            setSteps(frame.step);
            resultEl.textContent = frame.result;
            metaEl.textContent = frame.meta;
            codeEl.innerHTML = frame.lines.slice(0, lineIndex + 1).join('\n');
            lineIndex += 1;

            if (lineIndex < frame.lines.length) {
                setTimeout(renderFrame, 120);
                return;
            }

            setTimeout(function () {
                frameIndex = (frameIndex + 1) % frames.length;
                lineIndex = 0;
                codeEl.innerHTML = '';
                renderFrame();
            }, 1500);
        }

        renderFrame();
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
        initHeroTerminal();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
