// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});document.addEventListener("DOMContentLoaded", function () {
    const thumbnailsContainer = document.querySelector('.thumbnails-container');

    // Ensure videos are appended only once
    if (!thumbnailsContainer.classList.contains('videos-initialized')) {
        console.log("Appending videos to the thumbnails-container");

        const numRows = 4;
        const numCols = 4;
        const videoFiles = [
            'a1.mov', 'a2.mov', 'a3.mov', 'a4.mov',
            'b1.mov', 'b2.mov', 'b3.mov', 'b4.mov',
            'c1.mov', 'c2.mov', 'c3.mov', 'c4.mov',
            'd1.mov', 'd2.mov', 'd3.mov', 'd4.mov'
        ];

        // Append videos
        for (let i = 0; i < numRows; i++) {
            for (let j = 0; j < numCols; j++) {
                const videoIndex = i * numCols + j;
                const video = document.createElement('video');
                video.src = `assets/thumbnails/${videoFiles[videoIndex]}`;
                video.autoplay = true;
                video.loop = true;
                video.muted = true;
                video.playsInline = true;
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.objectFit = 'cover';

                const tile = document.createElement('div');
                tile.className = 'background-tile';
                tile.style.flex = '1';
                tile.style.margin = '0'; // Remove margin for seamless grid layout
                tile.appendChild(video);

                // thumbnailsContainer.appendChild(tile);
            }
        }

        // Mark videos as initialized
        thumbnailsContainer.classList.add('videos-initialized');
    } else {
        console.log("Videos already initialized");
    }
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
