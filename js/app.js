/* ============================================================================
   KAMC 官网主脚本
   - 内容来自 ./resources/inf/content.json 与 faq.json
   - 本文件由 index.html 的 <script> 拆分而来
   ============================================================================ */
let CONTENT = null;
        let modalCloseTimer = null;
        let currentDownloadUrl = '';
        let lastFocusedElement = null;
        let currentNotice = 0;
        let autoSwitchTimer = null;
        let manualCooldownTimer = null;
        let lastInteractionWasPointer = false;
        let modalFocusTimer = null;
        const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

        let FAQ = null;
        let faqQuery = '';
        let faqLastFocused = null;
        let faqCloseTimer = null;

        const THEME_KEY = 'kamc-theme';
        const SUN_SVG = '<span class="theme-icon icon-sun" aria-hidden="true"></span>';
        const MOON_SVG = '<span class="theme-icon icon-moon" aria-hidden="true"></span>';
        const DARK_IMAGE_NAMES = ['official_website_logo.png', 'wechat_reward.png'];

        function currentTheme() {
            return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        }

        function themedImageSrc(src, theme) {
            if (!src || theme !== 'dark') return src;
            const hasDark = DARK_IMAGE_NAMES.some(function (name) { return src.indexOf(name) !== -1; });
            return hasDark ? src.replace(/\.png(\?.*)?$/i, '@dark.png$1') : src;
        }

        function assignSrc(img, src) {
            if (!img || !src) return;
            if (img.getAttribute('src') === src) return;
            img.src = src;
        }

        function syncThemeImages() {
            const theme = currentTheme();
            if (!CONTENT) return;
            const desktop = document.querySelector('.logo-desktop');
            const mobile = document.querySelector('.logo-mobile');
            if (CONTENT.brand) {
                assignSrc(desktop, themedImageSrc(CONTENT.brand.logoDesktop.src, theme));
                assignSrc(mobile, themedImageSrc(CONTENT.brand.logoMobile.src, theme));
            }
            const hero = document.querySelector('.hero-banner img');
            if (CONTENT.home && CONTENT.home.heroImage) {
                assignSrc(hero, themedImageSrc(CONTENT.home.heroImage.src, theme));
            }
            const qr = document.querySelector('.sponsor-qr');
            if (CONTENT.sponsor) assignSrc(qr, themedImageSrc(CONTENT.sponsor.qr.src, theme));
        }

        function syncThemeUI() {
            const theme = currentTheme();
            const dark = theme === 'dark';

            const pill = document.getElementById('themeSwitch');
            if (pill) pill.classList.toggle('is-dark', dark);

            const buttons = document.querySelectorAll('.theme-switch-btn');
            for (let i = 0; i < buttons.length; i++) {
                const isActive = buttons[i].getAttribute('data-theme-value') === theme;
                buttons[i].setAttribute('aria-pressed', isActive ? 'true' : 'false');
            }

            const mobileBtn = document.getElementById('themeToggleMobile');
            if (mobileBtn) {
                mobileBtn.innerHTML = dark ? MOON_SVG : SUN_SVG;
                mobileBtn.setAttribute('aria-label', dark ? '切换到亮色主题' : '切换到暗色主题');
                mobileBtn.setAttribute('aria-pressed', dark ? 'true' : 'false');
            }
        }

        function setTheme(theme) {
            if (theme !== 'dark' && theme !== 'light') return;
            document.documentElement.setAttribute('data-theme', theme);
            try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}

            const root = document.documentElement;
            root.classList.add('theme-transition');
            window.clearTimeout(setTheme._timer);
            setTheme._timer = window.setTimeout(function () {
                root.classList.remove('theme-transition');
            }, 320);

            syncThemeUI();
            syncThemeImages();
        }

        function toggleTheme() {
            setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
        }

        function bindThemeControls() {
            const pill = document.getElementById('themeSwitch');
            if (pill) {
                pill.addEventListener('click', function (e) {
                    const target = e.target.closest('[data-theme-value]');
                    if (target) setTheme(target.getAttribute('data-theme-value'));
                });
            }

            const mobileBtn = document.getElementById('themeToggleMobile');
            if (mobileBtn) mobileBtn.addEventListener('click', toggleTheme);

            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            const onSystemChange = function (event) {
                let saved = null;
                try { saved = localStorage.getItem(THEME_KEY); } catch (err) {}
                if (saved !== 'dark' && saved !== 'light') {
                    setTheme(event.matches ? 'dark' : 'light');
                }
            };
            if (mq.addEventListener) mq.addEventListener('change', onSystemChange);
            else if (mq.addListener) mq.addListener(onSystemChange);

            syncThemeUI();
            syncThemeImages();
        }

        function setMeta(attr, key, val) {
            let el = document.querySelector('meta[' + attr + '="' + key + '"]');
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute(attr, key);
                document.head.appendChild(el);
            }
            el.setAttribute('content', val);
        }

        function applyMeta() {
            const m = CONTENT.meta;
            document.documentElement.lang = m.lang;
            document.title = m.title;

            const fav = document.querySelector('link[rel="icon"]');
            if (fav) fav.href = m.favicon;

            setMeta('name', 'description', m.description);
            setMeta('name', 'theme-color', m.themeColor);
            setMeta('property', 'og:type', m.og.type);
            setMeta('property', 'og:title', m.og.title);
            setMeta('property', 'og:description', m.og.description);
            setMeta('property', 'og:image', m.og.image);
            setMeta('property', 'og:url', m.og.url);
            setMeta('name', 'twitter:card', m.twitter.card);
            setMeta('name', 'twitter:title', m.twitter.title);
            setMeta('name', 'twitter:description', m.twitter.description);
            setMeta('name', 'twitter:image', m.twitter.image);
        }

        function renderBrand() {
            const b = CONTENT.brand;
            const desktop = document.querySelector('.logo-desktop');
            const mobile = document.querySelector('.logo-mobile');
            desktop.src = b.logoDesktop.src;
            desktop.alt = b.logoDesktop.alt;
            mobile.src = b.logoMobile.src;
            mobile.alt = b.logoMobile.alt;

            const burger = document.querySelector('.hamburger');
            if (burger && CONTENT.hamburger) {
                burger.setAttribute('aria-label', CONTENT.hamburger.ariaLabel);
            }
        }

        function renderNav() {
            const nav = document.getElementById('navMenu');
            nav.innerHTML = CONTENT.nav.map(function (item) {
                return '<button type="button" class="' + item.className + '" data-page="' + item.id + '" onclick="switchPage(\'' + item.id + '\')">' + item.label + '</button>';
            }).join('');
        }

        function renderHome() {
            const c = CONTENT.home;
            const notices = c.notices.map(function (n, i) {
                return '' +
                    '<div class="notice-page' + (i === 0 ? ' active' : '') + '" data-notice-index="' + i + '">' +
                        '<h3>' + n.title + '</h3>' +
                        '<p>' + n.body + '</p>' +
                    '</div>';
            }).join('');
            const dots = c.notices.map(function (n, i) {
                return '<button type="button" class="notice-dot' + (i === 0 ? ' active' : '') + '" data-notice-dot="' + i + '" aria-label="' + n.dotLabel + '"></button>';
            }).join('');

            return '' +
                '<div id="page-home" class="page">' +
                    '<h2 class="sr-only">' + c.srTitle + '</h2>' +
                    '<div class="hero-banner">' +
                        '<img src="' + c.heroImage.src + '" alt="' + c.heroImage.alt + '">' +
                        '<div class="floating-cards">' +
                            '<div class="card">' +
                                '<div>' +
                                    '<h3>' + c.mainCard.title + '</h3>' +
                                    '<p>' + c.mainCard.description + '</p>' +
                                '</div>' +
                                '<button type="button" class="card-btn" data-cta>' + c.mainCard.cta.label + '</button>' +
                            '</div>' +
                            '<div class="card notice-card">' +
                                '<div class="notice-content">' + notices + '</div>' +
                                '<div class="notice-dots">' + dots + '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        }

        function downloadCardList() {
            return CONTENT.downloads.items.map(function (item, i) {
                const links = item.links.map(function (link, j) {
                    return '<button type="button" class="link-' + link.type + '"' +
                        ' data-download-link' +
                        ' data-version-index="' + i + '"' +
                        ' data-link-index="' + j + '">' +
                        link.label +
                    '</button>';
                }).join('');
                return '' +
                    '<div class="download-card">' +
                        '<div class="version">' + item.version + '</div>' +
                        '<div class="date">' + item.date + '</div>' +
                        '<div class="links">' + links + '</div>' +
                    '</div>';
            });
        }

        function renderDownloads() {
            const c = CONTENT.downloads;
            return '' +
                '<div id="page-downloads" class="page">' +
                    '<div class="other-page-content">' +
                        '<h2>' + c.title + '</h2>' +
                        '<p class="download-desc">' + c.description + '</p>' +
                        '<div class="download-grid">' + columnize(downloadCardList()) + '</div>' +
                    '</div>' +
                '</div>';
        }

        const narrowQuery = window.matchMedia('(max-width: 1024px)');

        function isNarrow() {
            return narrowQuery.matches;
        }

        function columnize(cards) {
            if (isNarrow()) {
                return cards.join('');
            }
            const columns = [[], []];
            cards.forEach(function (card, index) {
                columns[index % 2].push(card);
            });
            return columns.map(function (column) {
                return '<div class="download-col">' + column.join('') + '</div>';
            }).join('');
        }

        function refreshResponsiveLayout() {
            const grid = document.querySelector('#page-downloads .download-grid');
            if (grid && CONTENT) {
                grid.innerHTML = columnize(downloadCardList());
            }
            renderFaqCards();
        }

        function escapeHtml(value) {
            return String(value == null ? '' : value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function faqSearchIconSvg() {
            return '<svg class="faq-search-icon" viewBox="0 0 24 24" fill="none" ' +
                'stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
                '<circle cx="11" cy="11" r="7"></circle>' +
                '<line x1="16.5" y1="16.5" x2="21" y2="21"></line>' +
                '</svg>';
        }

        function renderFaq() {
            const c = CONTENT.faq;
            const placeholder = (FAQ && FAQ.searchPlaceholder) || '搜索问题关键词…';
            return '' +
                '<div id="page-faq" class="page">' +
                    '<div class="other-page-content">' +
                        '<h2>' + c.title + '</h2>' +
                        '<p class="download-desc">' + c.description + '</p>' +
                        '<div class="faq-search-wrap">' +
                            faqSearchIconSvg() +
                            '<input id="faqSearch" class="faq-search" type="search" autocomplete="off"' +
                                ' placeholder="' + escapeHtml(placeholder) + '" aria-label="搜索常见问题">' +
                        '</div>' +
                        '<div class="faq-grid" id="faqGrid"></div>' +
                        '<p class="faq-empty" id="faqEmpty" hidden>' +
                            escapeHtml((FAQ && FAQ.emptyText) || '没有找到匹配的问题') +
                        '</p>' +
                    '</div>' +
                '</div>';
        }

        function faqCardHtml(item) {
            const meta = '' +
                '<div class="faq-meta">' +
                    '<span class="faq-badge">' + escapeHtml(item.version || '全部版本') + '</span>' +
                    '<span class="faq-badge is-date">' + escapeHtml(item.date || '') + '</span>' +
                '</div>';
            return '' +
                '<article class="faq-card" role="button" tabindex="0" data-faq-id="' + escapeHtml(item.id) + '"' +
                    ' aria-haspopup="dialog">' +
                    '<h3>' + escapeHtml(item.question || '') + '</h3>' +
                    meta +
                    '<p class="faq-summary">' + escapeHtml(item.summary || '') + '</p>' +
                '</article>';
        }

        function renderFaqCards() {
            const grid = document.getElementById('faqGrid');
            if (!grid) return;

            if (FAQ && FAQ.error) {
                grid.innerHTML = '' +
                    '<div class="faq-error">' +
                        '<strong>常见问题加载失败。</strong><br>' +
                        '可能是网络波动或 faq.json 暂时不可用，请刷新重试。' +
                        '<br><button type="button" onclick="location.reload()">刷新页面</button>' +
                    '</div>';
                const emptyBox = document.getElementById('faqEmpty');
                if (emptyBox) emptyBox.hidden = true;
                return;
            }

            const items = (FAQ && Array.isArray(FAQ.items)) ? FAQ.items : [];
            const keyword = faqQuery.trim().toLowerCase();

            const matched = items.filter(function (item) {
                if (!keyword) return true;
                const haystack = [
                    item.question, item.version, item.date, item.summary, item.detail,
                    (item.tags || []).join(' ')
                ].join(' ').toLowerCase();
                return haystack.indexOf(keyword) !== -1;
            });

            const cards = matched.map(faqCardHtml);
            if (isNarrow()) {
                grid.innerHTML = cards.join('');
            } else {
                const columns = [[], []];
                cards.forEach(function (card, index) {
                    columns[index % 2].push(card);
                });
                grid.innerHTML = columns.map(function (column) {
                    return '<div class="faq-col">' + column.join('') + '</div>';
                }).join('');
            }

            const empty = document.getElementById('faqEmpty');
            if (empty) {
                empty.hidden = matched.length !== 0;
            }
        }

        function openFaqModal(faqId) {
            const modal = document.getElementById('faqModal');
            if (!modal || !FAQ || !Array.isArray(FAQ.items)) return;

            const item = FAQ.items.filter(function (entry) {
                return String(entry.id) === String(faqId);
            })[0];
            if (!item) return;

            if (faqCloseTimer) {
                clearTimeout(faqCloseTimer);
                faqCloseTimer = null;
            }

            document.getElementById('faq-modal-title').textContent = item.question || '';
            document.getElementById('faq-modal-meta').innerHTML = '' +
                '<span class="faq-badge">' + escapeHtml(item.version || '全部版本') + '</span>' +
                '<span class="faq-badge is-date">' + escapeHtml(item.date || '') + '</span>';

            document.getElementById('faq-modal-body').innerHTML = item.detail || '';
            document.getElementById('faq-modal-body').scrollTop = 0;

            faqLastFocused = document.activeElement;

            modal.hidden = false;
            void modal.offsetWidth;
            modal.setAttribute('aria-hidden', 'false');
            modal.classList.add('active');

            const closeBtn = document.getElementById('faq-modal-close');
            if (closeBtn) {
                closeBtn.focus({ preventScroll: true });
            }
        }

        function closeFaqModal() {
            const modal = document.getElementById('faqModal');
            if (!modal || !modal.classList.contains('active')) return;

            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');

            if (faqCloseTimer) {
                clearTimeout(faqCloseTimer);
            }
            faqCloseTimer = setTimeout(function () {
                faqCloseTimer = null;
                modal.hidden = true;
                modal.classList.remove('active');

                if (faqLastFocused && typeof faqLastFocused.focus === 'function') {
                    try {
                        faqLastFocused.focus({ preventScroll: true });
                    } catch (err) {
                        faqLastFocused.focus();
                    }
                }
                faqLastFocused = null;
            }, 320);
        }

        function renderSponsor() {
            const c = CONTENT.sponsor;
            const paragraphs = c.paragraphs.map(function (p) {
                return '<p>' + p + '</p>';
            }).join('');

            return '' +
                '<div id="page-sponsor" class="page">' +
                    '<div class="other-page-content">' +
                        '<h2>' + c.title + '</h2>' +
                        paragraphs +
                        '<div class="sponsor-container">' +
                            '<img src="' + c.qr.src + '" alt="' + c.qr.alt + '" class="sponsor-qr" loading="lazy" decoding="async">' +
                            '<p class="sponsor-note">' + c.note + '</p>' +
                        '</div>' +
                        '<p class="sponsor-disclaimer">' + c.disclaimer + '</p>' +
                    '</div>' +
                '</div>';
        }

        function renderMain() {
            const main = document.getElementById('mainContent');
            main.innerHTML = renderHome() + renderDownloads() + renderFaq() + renderSponsor();
            renderFaqCards();
        }

        function renderFooter() {
            const c = CONTENT.footer;
            document.getElementById('pageFooter').innerHTML = '' +
                '<div class="footer-divider"></div>' +
                '<p>' + c.copyright + '</p>' +
                '<p>Bilibili: <a href="' + c.bilibiliUrl + '" target="_blank" rel="noopener noreferrer">' + c.bilibiliLabel + '</a></p>' +
                '<p>' + c.tagline + '</p>';
        }

        function renderModalStaticText() {
            document.querySelector('.btn-cancel').textContent = CONTENT.modal.cancelText;
        }

        function switchPage(pageId) {
            let targetPage = document.getElementById('page-' + pageId);
            if (!targetPage) {
                pageId = 'home';
                targetPage = document.getElementById('page-home');
                if (!targetPage) return;
            }

            document.querySelectorAll('.navbar-links button').forEach(function (link) {
                link.classList.remove('active');
                link.removeAttribute('aria-current');
            });

            const targetNav = document.querySelector('.navbar-links [data-page="' + pageId + '"]');
            if (targetNav) {
                targetNav.classList.add('active');
                targetNav.setAttribute('aria-current', 'page');
            }

            document.querySelectorAll('.page').forEach(function (page) {
                page.classList.remove('active');
            });
            targetPage.classList.add('active');

            const scroller = document.getElementById('main-scroller');
            if (scroller) {
                const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                scroller.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
            }

            closeMenu();

            if (location.hash.substring(1) !== pageId) {
                history.replaceState(null, '', '#' + pageId);
            }

            focusPageHeading(targetPage);
        }

        function focusPageHeading(page) {
            if (lastInteractionWasPointer) return;
            const h2 = page.querySelector('h2');
            if (!h2) return;
            h2.setAttribute('tabindex', '-1');
            try {
                h2.focus({ preventScroll: true });
            } catch (err) {
                h2.focus();
            }
        }

        function isModalOpen(modal) {
            return modal.classList.contains('active') && !modal.classList.contains('closing');
        }

        function showDownloadModal(link, version) {
            const modal = document.getElementById('downloadModal');
            if (!modal || !CONTENT) return;

            const tpl = (link.type === 'bili') ? CONTENT.modal.bilibili : CONTENT.modal.download;
            const platform = link.platform || '';

            const title = tpl.titleTemplate.replace('{platform}', platform);
            const desc = tpl.descTemplate
                .replace('{platform}', platform)
                .replace('{version}', version || '');

            document.getElementById('modal-title').textContent = title;
            document.getElementById('modal-desc').textContent = desc;
            document.getElementById('modal-confirm-btn').textContent = tpl.confirmText;

            if (!modal.classList.contains('active')) {
                lastFocusedElement = document.activeElement;
            }

            currentDownloadUrl = link.url;

            if (modalCloseTimer) {
                clearTimeout(modalCloseTimer);
                modalCloseTimer = null;
            }
            if (modalFocusTimer) {
                clearTimeout(modalFocusTimer);
                modalFocusTimer = null;
            }

            modal.classList.remove('closing', 'active');
            modal.hidden = false;
            void modal.offsetWidth;
            modal.setAttribute('aria-hidden', 'false');
            modal.classList.add('active');

            modalFocusTimer = setTimeout(function () {
                modalFocusTimer = null;
                if (!isModalOpen(modal)) return;
                const confirmBtn = document.getElementById('modal-confirm-btn');
                if (confirmBtn) confirmBtn.focus({ preventScroll: true });
            }, 60);
        }

        function closeDownloadModal() {
            const modal = document.getElementById('downloadModal');
            if (!modal) return;
            if (!isModalOpen(modal)) return;

            if (modalFocusTimer) {
                clearTimeout(modalFocusTimer);
                modalFocusTimer = null;
            }

            modal.setAttribute('aria-hidden', 'true');

            if (modal.contains(document.activeElement)) {
                document.activeElement.blur();
            }

            modal.classList.add('closing');

            modalCloseTimer = setTimeout(function () {
                modalCloseTimer = null;
                modal.classList.remove('active', 'closing');
                modal.hidden = true;

                const target = lastFocusedElement;
                lastFocusedElement = null;
                if (target && typeof target.focus === 'function' && document.contains(target)) {
                    try {
                        target.focus({ preventScroll: true });
                    } catch (err) {
                        target.focus();
                    }
                }
            }, 520);
        }

        function confirmDownload() {
            if (currentDownloadUrl) {
                window.open(currentDownloadUrl, '_blank', 'noopener,noreferrer');
            }
            closeDownloadModal();
        }

        function toggleMenu(btn) {
            const menu = document.getElementById('navMenu');
            if (!menu) return;

            const willOpen = !menu.classList.contains('open');
            menu.classList.toggle('open', willOpen);

            btn.classList.toggle('open', willOpen);
            btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        }

        function closeMenu() {
            const menu = document.getElementById('navMenu');
            const btn = document.querySelector('.hamburger');
            if (!menu || !btn) return;
            if (!menu.classList.contains('open')) return;

            menu.classList.remove('open');
            btn.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
        }

        function switchNotice(index) {
            const pages = document.querySelectorAll('.notice-page');
            const dots = document.querySelectorAll('.notice-dot');
            if (pages.length === 0) return;

            pages.forEach(function (page, i) {
                page.classList.toggle('active', i === index);
                if (dots[i]) dots[i].classList.toggle('active', i === index);
            });
            currentNotice = index;
        }

        function startNoticeAutoSwitch() {
            const total = document.querySelectorAll('.notice-page').length;
            if (total <= 1) return;
            if (autoSwitchTimer) clearInterval(autoSwitchTimer);
            autoSwitchTimer = setInterval(function () {
                const nextIndex = (currentNotice + 1) % total;
                switchNotice(nextIndex);
            }, 10000);
        }

        function manualSwitchNotice(index) {
            switchNotice(index);

            if (autoSwitchTimer) clearInterval(autoSwitchTimer);
            if (manualCooldownTimer) clearTimeout(manualCooldownTimer);

            manualCooldownTimer = setTimeout(function () {
                startNoticeAutoSwitch();
            }, 60000);
        }

        function bindGlobalEvents() {
            const main = document.getElementById('mainContent');

            main.addEventListener('click', function (e) {
                const ctaBtn = e.target.closest('[data-cta]');
                if (ctaBtn) {
                    const cta = CONTENT.home.mainCard.cta;
                    showDownloadModal(cta, cta.version);
                    return;
                }

                const dlBtn = e.target.closest('[data-download-link]');
                if (dlBtn) {
                    const i = Number(dlBtn.dataset.versionIndex);
                    const j = Number(dlBtn.dataset.linkIndex);
                    const item = CONTENT.downloads.items[i];
                    if (!item) return;
                    const link = item.links[j];
                    if (!link) return;
                    showDownloadModal(link, item.version);
                    return;
                }

                const dot = e.target.closest('[data-notice-dot]');
                if (dot) {
                    manualSwitchNotice(Number(dot.dataset.noticeDot));
                    return;
                }

                const faqCard = e.target.closest('[data-faq-id]');
                if (faqCard) {
                    openFaqModal(faqCard.dataset.faqId);
                    return;
                }
            });

            main.addEventListener('input', function (e) {
                if (!e.target || e.target.id !== 'faqSearch') return;
                faqQuery = e.target.value || '';
                renderFaqCards();
            });

            main.addEventListener('keydown', function (e) {
                const card = e.target.closest && e.target.closest('[data-faq-id]');
                if (!card) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openFaqModal(card.dataset.faqId);
                }
            });

            const faqModal = document.getElementById('faqModal');
            if (faqModal) {
                const faqCloseBtn = document.getElementById('faq-modal-close');
                if (faqCloseBtn) {
                    faqCloseBtn.addEventListener('click', closeFaqModal);
                }
                faqModal.addEventListener('click', function (e) {
                    if (e.target === faqModal) closeFaqModal();
                });
            }

            const modal = document.getElementById('downloadModal');
            if (modal) {
                modal.addEventListener('click', function (e) {
                    if (e.target === modal) closeDownloadModal();
                });
            }

            document.addEventListener('keydown', function (e) {
                const faq = document.getElementById('faqModal');
                if (faq && faq.classList.contains('active')) {
                    if (e.key === 'Escape') {
                        closeFaqModal();
                        return;
                    }
                    if (e.key === 'Tab') {
                        const list = faq.querySelectorAll(FOCUSABLE_SELECTOR);
                        if (list.length) {
                            const firstItem = list[0];
                            const lastItem = list[list.length - 1];
                            if (e.shiftKey && document.activeElement === firstItem) {
                                e.preventDefault();
                                lastItem.focus();
                            } else if (!e.shiftKey && document.activeElement === lastItem) {
                                e.preventDefault();
                                firstItem.focus();
                            }
                        }
                        return;
                    }
                }

                const m = document.getElementById('downloadModal');
                if (!m) return;

                if (e.key === 'Escape' && m.classList.contains('active')) {
                    closeDownloadModal();
                    return;
                }

                if (e.key !== 'Tab') return;
                if (!m.classList.contains('active') || m.classList.contains('closing')) return;

                const focusable = m.querySelectorAll(FOCUSABLE_SELECTOR);
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            });

            window.addEventListener('resize', function () {
                if (window.innerWidth > 1024) closeMenu();
            });

            narrowQuery.addEventListener('change', refreshResponsiveLayout);

            window.addEventListener('hashchange', function () {
                lastInteractionWasPointer = false;
                const pageId = location.hash.substring(1) || 'home';
                switchPage(pageId);
            });

            document.addEventListener('pointerdown', function () {
                lastInteractionWasPointer = true;
            }, true);
            document.addEventListener('keydown', function () {
                lastInteractionWasPointer = false;
            }, true);

            const scroller = document.getElementById('main-scroller');
            if (scroller) {
                scroller.addEventListener('scroll', function () {
                    if (window.innerWidth <= 1024) closeMenu();
                }, { passive: true });
            }
        }

        async function loadContent() {
            const url = './resources/inf/content.json';
            const res = await fetch(url, { cache: 'no-cache' });
            if (!res.ok) throw new Error('加载 ' + url + ' 失败：HTTP ' + res.status);
            return res.json();
        }

        function escapeForHtml(value) {
            return String(value == null ? '' : value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        /**
         * 统一错误页：居中大标题 + 下方小字说明 + 操作按钮
         * 403 / 404 / 加载失败共用同一套结构与样式（.error-page）
         */
        function renderErrorPage(options) {
            const opts = options || {};
            const code = opts.code ? '<div class="error-code">' + escapeForHtml(opts.code) + '</div>' : '';
            const title = '<div class="error-title">' + escapeForHtml(opts.title || '页面加载失败') + '</div>';
            const text = opts.text ? '<p class="error-text">' + opts.text + '</p>' : '';
            const hint = opts.hint ? '<p class="error-hint">' + opts.hint + '</p>' : '';
            const actions = opts.actions || '<a class="primary" href="/">返回首页</a>';
            return '' +
                '<div class="error-page">' +
                    code + title + text + hint +
                    '<div class="error-actions">' + actions + '</div>' +
                '</div>';
        }

        function showLoadError(err) {
            document.body.innerHTML = renderErrorPage({
                title: '页面加载失败',
                text: '无法加载 <code>./resources/inf/content.json</code>，页面内容暂时无法显示。',
                hint: '如果您是直接双击打开 index.html（file:// 协议），浏览器会因 CORS 策略拒绝读取本地 JSON；' +
                      '请在项目目录执行 <code>python -m http.server 8000</code> 后访问 http://localhost:8000。' +
                      '<br>错误信息：' + escapeForHtml(String(err)),
                actions: '<button class="primary" type="button" onclick="location.reload()">重新加载</button>' +
                         '<a href="https://kamc.top">前往官网</a>'
            });
        }

        async function loadFaq() {
            const url = './resources/inf/faq.json';
            try {
                const res = await fetch(url, { cache: 'no-cache' });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return await res.json();
            } catch (err) {

                console.warn('[KAMC] 常见问题加载失败：' + url, err);
                return { items: [], error: true };
            }
        }

        async function init() {
            try {
                CONTENT = await loadContent();
            } catch (err) {
                console.error(err);
                showLoadError(err);
                return;
            }

            FAQ = await loadFaq();

            applyMeta();
            renderBrand();
            renderNav();
            renderMain();
            renderFooter();
            renderModalStaticText();
            bindGlobalEvents();
            bindThemeControls();

            const pageId = location.hash.substring(1) || 'home';
            switchPage(pageId);
            startNoticeAutoSwitch();
        }

        document.addEventListener('DOMContentLoaded', init);
