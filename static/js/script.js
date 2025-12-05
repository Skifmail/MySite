document.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();
    initScrollAnimations();
    initFormHandler();
    initNavbarScroll();
    initNavbarScroll();
    initProjectModals();
});

function initProjectModals() {
    const projectData = {
        poizon: {
            title: 'Poizon Sync — Веб-сервис синхронизации товаров',
            description: 'Автоматизированная система для загрузки товаров из китайского маркетплейса Poizon в WooCommerce с AI-генерацией SEO-оптимизированных описаний. Система экономит 40 часов работы в месяц и позволяет загружать 50 товаров за 5-7 минут вместо часа ручной работы.',
            screenshots: [
                {
                    image: '/static/images/веб-сервис 1.png',
                    title: 'Главная страница сервиса',
                    description: 'Интерфейс для ввода ссылок на товары и настройки параметров синхронизации. Простой и интуитивно понятный дизайн.'
                },
                {
                    image: '/static/images/веб-сервис 2.png',
                    title: 'Процесс синхронизации',
                    description: 'Real-time отображение прогресса загрузки товаров с использованием Server-Sent Events (SSE). Пользователь видет каждый этап обработки.'
                },
                {
                    image: '/static/images/веб-сервис 3.png',
                    title: 'Результаты работы',
                    description: 'Завершенная синхронизация с полной статистикой и детальной информацией о загруженных товарах.'
                }
            ]
        },
        psychologist: {
            title: 'Психолог Бот — Telegram-бот записи к психологу',
            description: 'Полнофункциональный Telegram-бот для автоматизации записи клиентов на приём к психологу. Система включает управление расписанием, автоматические напоминания за 24 часа и в день приёма, полную автоматизацию административных задач. Бот работает 24/7, освобождая психолога от рутинной работы с записями.',
            screenshots: [
                {
                    image: '/static/images/psychologist_bot_1.jpg',
                    title: 'Главное меню бота',
                    description: 'Интуитивный интерфейс с кнопками для записи на приём, просмотра расписания и управления записями. Реализован на aiogram 3.4 с использованием FSM.'
                },
                {
                    image: '/static/images/psychologist_bot_2.jpg',
                    title: 'Процесс записи',
                    description: 'Пошаговый процесс выбора даты и времени с проверкой доступности слотов в реальном времени. PostgreSQL обеспечивает надёжное хранение данных.'
                },
                {
                    image: '/static/images/psychologist_bot_3.jpg',
                    title: 'Система напоминаний',
                    description: 'APScheduler автоматически отправляет напоминания клиентам за 24 часа и в день приёма. Снижает количество пропущенных сессий.'
                }
            ]
        },
        'wb-position': {
            title: 'WB Position Bot — Мониторинг позиций на Wildberries',
            description: 'Telegram-бот помогает продавцам на Wildberries отслеживать, на какой позиции находятся их товары в поисковой выдаче. Когда покупатель ищет товар по запросу (например, "кроссовки Nike"), важно знать на каком месте показывается ваш товар — на 1-й странице или на 10-й. Бот автоматически проверяет позиции каждые 10 минут и присылает уведомления, если товар поднялся или опустился в выдаче.',
            screenshots: [
                {
                    image: '/static/images/wb_rank_bot_1.jpg',
                    title: 'Добавление товаров для отслеживания',
                    description: 'Укажите артикул товара Wildberries и поисковый запрос, по которому хотите отслеживать позицию (например, "женские кроссовки"). Бот начнёт автоматический мониторинг.'
                },
                {
                    image: '/static/images/wb_rank_bot_2.jpg',
                    title: 'Отслеживание позиций в реальном времени',
                    description: 'Каждые 10 минут бот проверяет, на какой позиции находится ваш товар в поиске Wildberries. Например: товар был на 15 месте, стал на 8 — вы сразу получите уведомление.'
                },
                {
                    image: '/static/images/wb_rank_bot_3.jpg',
                    title: 'Мониторинг по регионам',
                    description: 'На Wildberries позиции товара отличаются в разных городах. Бот проверяет позиции в 85 регионах России — так вы понимаете, где товар показывается лучше, а где хуже.'
                }
            ]
        }
    };

    const modal = document.getElementById('projectModal');
    const modalBody = document.getElementById('modalBody');
    const closeBtn = document.querySelector('.modal-close');

    document.querySelectorAll('.portfolio-item[data-project]').forEach(item => {
        const projectId = item.dataset.project;
        const project = projectData[projectId];

        if (!project) return;

        item.style.cursor = 'pointer';

        // Останавливаем всплытие клика от ссылки
        const link = item.querySelector('.project-link');
        if (link) {
            link.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        item.addEventListener('click', () => {
            showModal(project);
        });
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    function showModal(project) {
        const screenshotsHTML = project.screenshots.map(screenshot => `
            <div class="screenshot-item">
                ${screenshot.image ? `<img src="${screenshot.image}" alt="${screenshot.title}" loading="lazy">` : ''}
                <div class="screenshot-description">
                    <h3>${screenshot.title}</h3>
                    <p>${screenshot.description}</p>
                </div>
            </div>
        `).join('');

        modalBody.innerHTML = `
            <h2>${project.title}</h2>
            <p>${project.description}</p>
            <div class="modal-screenshots">
                ${screenshotsHTML}
            </div>
        `;

        modal.classList.add('active');
    }
}



function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0) scale(1)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.service-card, .portfolio-item').forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(50px) scale(0.95)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${index * 0.1}s`;
        observer.observe(el);
    });

    // Parallax effect для hero секции (только на десктопе)
    window.addEventListener('scroll', () => {
        // Отключаем параллакс на мобильных устройствах
        if (window.innerWidth <= 768) return;

        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        if (hero && scrolled < window.innerHeight) {
            hero.style.transform = `translateY(${scrolled * 0.5}px)`;
            hero.style.opacity = 1 - (scrolled / window.innerHeight);
        }
    });
}

function initNavbarScroll() {
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.style.boxShadow = 'none';
        }

        lastScroll = currentScroll;
    });
}

function initFormHandler() {
    const form = document.getElementById('contactForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            contact: formData.get('contact'),
            email: formData.get('email'),
            message: formData.get('message')
        };

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = 'Отправка...';
        btn.disabled = true;

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                btn.textContent = 'Отправлено ✓';
                btn.style.background = '#10b981';
                form.reset();

                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                }, 3000);
            } else {
                throw new Error('Ошибка отправки');
            }
        } catch (error) {
            btn.textContent = 'Ошибка ✗';
            btn.style.background = '#ef4444';

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.disabled = false;
            }, 3000);
        }
    });
}

// Cookie Consent
function acceptCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    document.getElementById('cookieConsent').classList.add('hidden');
}

// Check if cookie consent was given
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('cookieConsent') === 'accepted') {
        document.getElementById('cookieConsent').classList.add('hidden');
    }
});
