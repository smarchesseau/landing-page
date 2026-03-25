function setLanguage(lang) {
    localStorage.setItem('selectedLanguage', lang);

    const switcher = document.querySelector('.language-switcher');
    if (switcher) {
        switcher.setAttribute('data-selected', lang);
    }

    document.querySelectorAll('[data-en], [data-fr], [data-es]').forEach(el => {
        const translation = el.getAttribute(`data-${lang}`);
        if (translation) {
            el.textContent = translation;
        }
    });

    document.querySelectorAll('[data-placeholder-en], [data-placeholder-fr], [data-placeholder-es]').forEach(el => {
        const translation = el.getAttribute(`data-placeholder-${lang}`);
        if (translation) {
            el.setAttribute('placeholder', translation);
        }
    });

    document.querySelectorAll('.contact-form').forEach(div => {
        const langs = (div.getAttribute('data-lang') || '').split(' ');
        if (langs.includes(lang)) {
            div.classList.remove('d-none');
        } else {
            div.classList.add('d-none');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    const browserLanguage = navigator.language.split('-')[0];
    const defaultLanguage = savedLanguage || (browserLanguage === 'fr' || browserLanguage === 'es' ? browserLanguage : 'en');

    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.value = defaultLanguage;
    }

    setLanguage(defaultLanguage);
});

document.addEventListener('DOMContentLoaded', function () {
    const accountModalEl = document.getElementById('accountModal');
    if (!accountModalEl) {
        return;
    }

    const modal = new bootstrap.Modal(accountModalEl);
    let modalClosed = false;

    let modalCount = sessionStorage.getItem('modalCount');
    if (!modalCount) {
        modalCount = 0;
    } else {
        modalCount = parseInt(modalCount, 10);
    }

    if (modalCount < 2) {
        setTimeout(() => {
            if (!modalClosed) {
                modal.show();
                modalCount++;
                sessionStorage.setItem('modalCount', modalCount);
            }
        }, 2000);
    }

    accountModalEl.addEventListener('hidden.bs.modal', () => {
        modalClosed = true;

        if (modalCount < 2) {
            setTimeout(() => {
                modalClosed = false;
                modal.show();

                modalCount++;
                sessionStorage.setItem('modalCount', modalCount);
            }, 30000);
        }
    });
});

const contactModalEl = document.getElementById('contactModal');
if (contactModalEl) {
    contactModalEl.addEventListener('show.bs.modal', function () {
        const savedLanguage = localStorage.getItem('selectedLanguage') || 'fr';

        document.querySelectorAll('.contact-form').forEach(div => {
            const langs = (div.getAttribute('data-lang') || '').split(' ');
            if (langs.includes(savedLanguage)) {
                div.classList.remove('d-none');
            } else {
                div.classList.add('d-none');
            }
        });
    });
}
