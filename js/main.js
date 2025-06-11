// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const thumbnailsContainer = document.querySelector('.thumbnails-container');

    // Remove any existing videos to avoid duplicates
    thumbnailsContainer.innerHTML = '';

    const videoFiles = [
        'a1.webm', 'a2.webm', 'a3.webm', 'a4.webm',
        'b1.webm', 'b2.webm', 'b3.webm', 'b4.webm',
        'c1.webm', 'c2.webm', 'c3.webm', 'c4.webm',
        'd1.webm', 'd2.webm', 'd3.webm', 'd4.webm'
    ];

    videoFiles.forEach(file => {
        const tile = document.createElement('div');
        tile.classList.add('background-tile');

        const video = document.createElement('video');
        video.src = `assets/thumbnails/${file}`;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover'; // Ensures full fit

        tile.appendChild(video);
        thumbnailsContainer.appendChild(tile);
    });
});



// Add animation keyframes
function addAnimationKeyframes() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { opacity: 0.05; }
            100% { opacity: 0.15; }
        }
    `;
    document.head.appendChild(style);
}
addAnimationKeyframes();

// Intersection Observer for Pricing Card Animations
const pricingCards = document.querySelectorAll('.pricing-card');
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        }
    });
}, { threshold: 0.2 });
pricingCards.forEach(card => observer.observe(card));

// Hover zoom effect on each price item
function addHoverEffect(selector) {
    document.querySelectorAll(selector).forEach(item => {
        item.addEventListener('mouseover', () => { item.style.transform = 'scale(1.05)'; });
        item.addEventListener('mouseleave', () => { item.style.transform = 'scale(1)'; });
    });
}
addHoverEffect('.pricing-card li');
addHoverEffect('.service-card');

// Toggle flip effect on service cards for mobile click
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', () => { card.classList.toggle('flipped'); });
});

// Tab switching function
function openTab(event, tabName) {
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

// JavaScript for Scroll-Triggered Animation for Other Services Cards
window.addEventListener('scroll', () => {
    const serviceCards = document.querySelectorAll('#other-services .service-card');
    const triggerPoint = window.innerHeight * 0.85;

    serviceCards.forEach((card) => {
        const cardTop = card.getBoundingClientRect().top;
        
        if (cardTop < triggerPoint) {
            card.classList.add('active');
        }
    });
});

// Studio Carousel Logic
document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.studio-carousel .slides img');
    if (!slides.length) return;

    let currentIndex = 0;
    const prevBtn = document.querySelector('.studio-carousel .prev');
    const nextBtn = document.querySelector('.studio-carousel .next');

    function showSlide(index) {
        slides.forEach((img, i) => {
            img.classList.toggle('active', i === index);
        });
    }

    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        showSlide(currentIndex);
    });

    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % slides.length;
        showSlide(currentIndex);
    });

    showSlide(currentIndex);

    // Swipe support
    let startX = null;
    slides.forEach(img => {
        img.addEventListener('touchstart', e => startX = e.touches[0].clientX);
        img.addEventListener('touchend', e => {
            if (startX === null) return;
            const endX = e.changedTouches[0].clientX;
            if (startX - endX > 50) nextBtn.click();
            else if (endX - startX > 50) prevBtn.click();
            startX = null;
        });
    });

    // Fullscreen modal
    const modal = document.querySelector('.studio-modal');
    const modalImg = modal.querySelector('img');
    const modalClose = modal.querySelector('.close');

    slides.forEach(img => {
        img.addEventListener('click', () => {
            modal.classList.add('open');
            modalImg.src = img.src;
        });
    });

    modalClose.addEventListener('click', () => {
        modal.classList.remove('open');
    });

    modal.addEventListener('click', e => {
        if (e.target === modal) {
            modal.classList.remove('open');
        }
    });
});
