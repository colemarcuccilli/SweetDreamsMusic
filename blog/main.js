// Newsletter Form Handling
document.addEventListener('DOMContentLoaded', () => {
    const newsletterForm = document.getElementById('newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('email');
            const email = emailInput.value;
            
            try {
                // Here you would typically send this to your backend
                console.log('Newsletter signup:', email);
                
                // Show success message
                emailInput.value = '';
                alert('Thanks for subscribing! We\'ll be in touch soon.');
            } catch (error) {
                console.error('Newsletter signup error:', error);
                alert('Sorry, there was an error. Please try again later.');
            }
        });
    }
});

// Lazy Loading Images
document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
});

// Reading Time Calculation
document.addEventListener('DOMContentLoaded', () => {
    const articles = document.querySelectorAll('article');
    
    articles.forEach(article => {
        const text = article.textContent;
        const wordCount = text.trim().split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200); // Assuming 200 words per minute
        
        const meta = article.querySelector('.meta');
        if (meta) {
            const timeSpan = meta.querySelector('span');
            if (timeSpan) {
                timeSpan.textContent = `Reading time: ${readingTime} min`;
            }
        }
    });
});

// Smooth Scrolling
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