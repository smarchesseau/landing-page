function setLanguage(lang) {
    // Store the selected language in localStorage
    localStorage.setItem('selectedLanguage', lang);
    
    // Update all elements with data-* attributes
    document.querySelectorAll('[data-en], [data-fr], [data-es]').forEach(el => {
        const translation = el.getAttribute(`data-${lang}`);
        if (translation) {
            el.textContent = translation;
        }
    });

    // Update any placeholder attributes if they exist
    document.querySelectorAll('[data-placeholder-en], [data-placeholder-fr], [data-placeholder-es]').forEach(el => {
        const translation = el.getAttribute(`data-placeholder-${lang}`);
        if (translation) {
            el.setAttribute('placeholder', translation);
        }
    });
}

// Set initial language based on localStorage or browser preference
document.addEventListener('DOMContentLoaded', () => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    const browserLanguage = navigator.language.split('-')[0];
    const defaultLanguage = savedLanguage || (browserLanguage === 'fr' || browserLanguage === 'es' ? browserLanguage : 'en');
    
    // Set the select element to the correct value
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.value = defaultLanguage;
    }
    
    // Apply the language
    setLanguage(defaultLanguage);
});