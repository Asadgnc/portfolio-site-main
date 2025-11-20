document.addEventListener("DOMContentLoaded", function() {

    /* -------------------------
       DİL ALGILAMA - Sayfanın hangi dilde olduğunu tespit et
       ------------------------- */
    function detectPageLanguage() {
        const htmlLang = document.documentElement.lang;
        const pathname = window.location.pathname;
        
        // HTML lang attribute kontrolü
        if (htmlLang && htmlLang !== 'en') {
            return htmlLang === 'uz-Cyrl' ? 'uz-cyrl' : htmlLang;
        }
        
        // URL'den dil tespiti (tr.html, ru.html, uz.html, uz-cyrl.html)
        if (pathname.includes('/tr.html') || pathname.includes('-tr.html')) return 'tr';
        if (pathname.includes('/ru.html') || pathname.includes('-ru.html')) return 'ru';
        if (pathname.includes('/uz-cyrl.html') || pathname.includes('-uz-cyrl.html')) return 'uz-cyrl';
        if (pathname.includes('/uz.html') || pathname.includes('-uz.html')) return 'uz';
        
        return 'en'; // default English
    }

    const pageLang = detectPageLanguage();
    const langSuffix = pageLang === 'en' ? '' : `-${pageLang}`;

    /* -------------------------
       Lenis smooth scroll (daha yumuşak/örnek siteye yakın)
       ------------------------- */
    const lenis = new Lenis({
        // duration kontrolü ve easing ile daha "ağır" fakat akıcı scroll
        duration: 1.2,          // kaydırma duyarlılığı (1.2 saniye tipi)
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // yumuşak ease
        smooth: true,
        orientation: 'vertical'
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    /* -----------------------------------------------
    /* Mobil Menü (Hamburger)
    /* ----------------------------------------------- */
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');

            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
                if (lenis && lenis.stop) lenis.stop();
            } else {
                document.body.style.overflow = '';
                if (lenis && lenis.start) lenis.start();
            }
        });
    }

    /* -----------------------------------------------
    /* Marquee (Kayan Yazı) Efekti
    /* ----------------------------------------------- */
    const marqueeContent = document.querySelector('.marquee-content');
    if (marqueeContent) {
        const content = marqueeContent.innerHTML;
        marqueeContent.innerHTML += content;
    }

    /* -----------------------------------------------
    /* NAV: hero-anchor görünürlüğüne göre .fixed ekle/kaldır
    /* ----------------------------------------------- */
    const heroAnchor = document.getElementById('hero-anchor');
    const navWrapper = document.getElementById('main-nav');

    if (heroAnchor && navWrapper) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    navWrapper.classList.remove('fixed');
                } else {
                    navWrapper.classList.add('fixed');
                }
            });
        }, { 
            root: null, 
            threshold: 0, 
            rootMargin: '-100px 0px 0px 0px' // Trigger slightly before hero image disappears
        });

        io.observe(heroAnchor);
    }

    /* -----------------------------------------------
     /* Gallery preview: galleryData'den ana sayfaya kartları render et
     /* - Başlıkları gallery sayfalarından çeker (h1 / og:title / title)
     /* - Varsa gallery/data.json öncelikli
     /* ----------------------------------------------- */
    async function fetchJsonIfExists(url) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('no json');
            return await res.json();
        } catch (e) {
            return null;
        }
    }

    async function fetchPageTitle(url) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('fetch failed');
            const text = await res.text();
            const doc = new DOMParser().parseFromString(text, 'text/html');

            // Öncelik: h1, og:title, document.title
            const h1 = doc.querySelector('h1');
            if (h1 && h1.textContent.trim()) return h1.textContent.trim();

            const og = doc.querySelector('meta[property="og:title"]');
            if (og && og.content) return og.content.trim();

            if (doc.title && doc.title.trim()) return doc.title.trim();

            // fallback: sayfa ismi
            return url.split('/').pop().replace('.html', '').replace(/[-_]/g, ' ');
        } catch (e) {
            // ağ veya parse hatası -> fallback başlık
            return null;
        }
    }

    async function buildGalleryData(count = 28) {
        // ALWAYS build from scratch to support language-specific pages
        // data.json is only for English, so we ignore it for multi-language support
        console.log('[Gallery] Building gallery data for language:', pageLang);
        
        const galleryItems = [];
        for (let i = 2; i <= 29; i++) {
            const page = `gallery-items/item-${i}/gallery-item-${i}${langSuffix}.html`;
            galleryItems.push({
                id: i,
                title: `Gallery Item ${i}`, // Will be replaced by actual title if fetch succeeds
                image: `images/item${i}-main-1.jpg`,
                page
            });
        }

        console.log('[Gallery] Created', galleryItems.length, 'items with suffix:', langSuffix);
        return galleryItems.slice(0, count);
    }

    function renderGalleryPreview(galleryData) {
        const container = document.getElementById('projects-preview-grid');
        if (!container) {
            console.warn('[Gallery] Container #projects-preview-grid not found on this page');
            return;
        }
        
        // Check if container already has static cards (either project-card or gallery-card)
        const existingCards = container.querySelectorAll('.project-card, .gallery-card');
        if (existingCards.length > 0) {
            console.log('[Gallery] Container already has', existingCards.length, 'static cards - skipping JS render');
            return;
        }
        
        console.log('[Gallery] Rendering', galleryData.length, 'items to container');
        container.innerHTML = '';

        galleryData.forEach(item => {
            const a = document.createElement('a');
            a.className = 'gallery-card';
            a.href = item.page;
            a.title = item.title;

            const imgWrap = document.createElement('div');
            imgWrap.className = 'project-image';

            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.title;
            img.loading = 'lazy';
            img.decoding = 'async';
            // optional fallback: replace with a placeholder if image load fails
            img.onerror = () => {
                // placeholder should exist at images/placeholder.jpg or change to your fallback path
                img.src = 'images/placeholder.jpg';
                img.onerror = null;
            };

            imgWrap.appendChild(img);

            const content = document.createElement('div');
            content.className = 'project-content';
            const h3 = document.createElement('h3');
            h3.textContent = item.title;
            content.appendChild(h3);

            a.appendChild(imgWrap);
            a.appendChild(content);
            container.appendChild(a);
        });
    }

    // build ve render
    (async () => {
        try {
            console.log('[Gallery] Starting gallery build, page lang:', pageLang, 'suffix:', langSuffix);
            const galleryDataResolved = await buildGalleryData(28);
            console.log('[Gallery] Gallery data resolved:', galleryDataResolved.length, 'items');
            renderGalleryPreview(galleryDataResolved);
            console.log('[Gallery] Render complete');
        } catch (error) {
            console.error('[Gallery] Error building/rendering gallery:', error);
        }
    })();

});