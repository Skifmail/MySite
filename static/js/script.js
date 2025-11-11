document.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();
    initScrollAnimations();
    initFormHandler();
    initNavbarScroll();
});

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
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.service-card, .portfolio-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
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
