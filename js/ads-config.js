/**
 * Google AdSense Manager & Configuration for Tic-Tac-Toe Pro
 * Manages Post-Game Interstitials, Banner Ad Units, and AdSense lifecycle.
 */

const ADS_CONFIG = {
    // Official Google AdSense Publisher ID
    publisherId: 'ca-pub-2711605087755702',

    // Replace with your Google AdSense Ad Slot IDs created in your AdSense dashboard
    slots: {
        postGameInterstitial: '1234567890',  // Triggered after every match
        topBanner: '1234567891',            // Displayed above the Game Arena
        bottomBanner: '1234567892',         // Displayed below the Game Arena
        resultModalBanner: '1234567893'     // Displayed inside Victory/Result modal
    },

    // Ad Trigger Frequency: 1 = Show an ad after every single game
    showAdEveryNMatches: 1,

    // Intermission countdown timer in seconds before allowing continue
    countdownSeconds: 4,

    // Master switch to enable/disable ads
    enabled: true
};

class AdsManager {
    constructor(config) {
        this.config = config;
        this.matchCount = 0;
        this.isAdShowing = false;
        this.timerInterval = null;
        this.adSenseLoaded = false;
        this.init();
    }

    init() {
        // Verify if Google AdSense script is present and configured
        this.checkAdSenseScript();
        
        // Initialize in-page banners on page load
        window.addEventListener('DOMContentLoaded', () => {
            this.refreshInPageBanners();
        });
    }

    checkAdSenseScript() {
        if (window.adsbygoogle) {
            this.adSenseLoaded = true;
            console.log('⚡ Google AdSense Engine detected & ready.');
        } else {
            console.log('ℹ️ Google AdSense: Using configured ad slots (Live ads will render once Publisher ID is verified).');
        }
    }

    /**
     * Called whenever a match ends in script.js
     * @param {Function} onComplete Callback function to execute after the ad finishes (e.g. open result modal)
     */
    triggerPostGameAd(onComplete) {
        if (!this.config.enabled) {
            if (typeof onComplete === 'function') onComplete();
            return;
        }

        this.matchCount++;

        // Check if this match qualifies for an ad break
        if (this.matchCount % this.config.showAdEveryNMatches !== 0) {
            if (typeof onComplete === 'function') onComplete();
            return;
        }

        const modal = document.getElementById('adIntermissionModal');
        const countdownEl = document.getElementById('adTimerCountdown');
        const skipCountdownEl = document.getElementById('adSkipCountdown');
        const skipBtn = document.getElementById('btnSkipAd');

        if (!modal) {
            if (typeof onComplete === 'function') onComplete();
            return;
        }

        this.isAdShowing = true;
        let remainingSeconds = this.config.countdownSeconds;

        // Reset and display modal
        modal.classList.add('active');
        if (countdownEl) countdownEl.textContent = remainingSeconds;
        if (skipCountdownEl) skipCountdownEl.textContent = remainingSeconds;
        
        if (skipBtn) {
            skipBtn.disabled = true;
            skipBtn.innerHTML = `<span>⏳ Please wait (${remainingSeconds}s)...</span>`;
        }

        // Render / push Google AdSense slot
        this.renderAdSlot('adInterstitialContainer', this.config.slots.postGameInterstitial);

        // Countdown Timer
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            remainingSeconds--;

            if (countdownEl) countdownEl.textContent = remainingSeconds;
            if (skipCountdownEl) skipCountdownEl.textContent = remainingSeconds;

            if (remainingSeconds <= 0) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;

                if (skipBtn) {
                    skipBtn.disabled = false;
                    skipBtn.classList.add('btn-ready');
                    skipBtn.innerHTML = `<span>⚡ Continue to Results ›</span>`;
                }
            } else {
                if (skipBtn) {
                    skipBtn.innerHTML = `<span>⏳ Please wait (${remainingSeconds}s)...</span>`;
                }
            }
        }, 1000);

        // One-time click handler for the continue button
        const handleCloseAd = () => {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
            modal.classList.remove('active');
            this.isAdShowing = false;
            skipBtn.removeEventListener('click', handleCloseAd);

            // Execute the post-ad callback (e.g. open game result modal)
            if (typeof onComplete === 'function') {
                onComplete();
            }
        };

        if (skipBtn) {
            skipBtn.onclick = handleCloseAd;
        }
    }

    /**
     * Safely pushes or renders a Google AdSense ad unit
     */
    renderAdSlot(containerId, slotId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const isRealPubId = this.config.publisherId && 
                            this.config.publisherId.startsWith('ca-pub-') && 
                            !this.config.publisherId.includes('XXXX');

        if (isRealPubId) {
            try {
                container.innerHTML = `
                    <ins class="adsbygoogle"
                         style="display:block"
                         data-ad-client="${this.config.publisherId}"
                         data-ad-slot="${slotId}"
                         data-ad-format="auto"
                         data-full-width-responsive="true"></ins>
                `;
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                console.warn('AdSense push notice:', e);
            }
        } else {
            // High-fidelity Ad placeholder for development / testing mode
            container.innerHTML = `
                <div class="ad-placeholder-box">
                    <div class="ad-placeholder-badge">GOOGLE ADSENSE</div>
                    <div class="ad-placeholder-title">⚡ High-Value Ad Placement Slot</div>
                    <p class="ad-placeholder-desc">
                        Post-game ad displays here after every match.<br>
                        Add your <strong>Publisher ID (${this.config.publisherId})</strong> in <code>js/ads-config.js</code> to go live.
                    </p>
                    <div class="ad-placeholder-dimensions">Responsive Multi-Size Unit (300x250 • 336x280 • 728x90)</div>
                </div>
            `;
        }
    }

    /**
     * Refreshes all stationary in-page ad banners
     */
    refreshInPageBanners() {
        this.renderAdSlot('adBannerTopContainer', this.config.slots.topBanner);
        this.renderAdSlot('adBannerBottomContainer', this.config.slots.bottomBanner);
        this.renderAdSlot('adResultBannerContainer', this.config.slots.resultModalBanner);
    }
}

// Global Ad Manager Instance
window.adsManager = new AdsManager(ADS_CONFIG);
