/**
 * Google AdSense Manager & Configuration for Tic-Tac-Toe Pro
 * Manages Post-Game Interstitials, Banner Ad Units, and AdSense lifecycle.
 */

const ADS_CONFIG = {
    // Official Google AdSense Publisher ID
    publisherId: 'ca-pub-2711605087755702',

    // Official Google AdSense Ad Slot IDs
    slots: {
        postGameInterstitial: '4293059609',  // Triggered after match intermission
        topBanner: '4293059609',             // Displayed above the Game Arena
        bottomBanner: '4293059609',          // Displayed below the Game Arena
        resultModalBanner: '4293059609'      // Displayed inside Victory/Result modal
    },

    // Ad Trigger Frequency: Show ad after every match
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
        this.checkAdSenseScript();
        
        window.addEventListener('DOMContentLoaded', () => {
            this.refreshInPageBanners();
        });
    }

    checkAdSenseScript() {
        if (window.adsbygoogle) {
            this.adSenseLoaded = true;
            console.log('⚡ Google AdSense Engine detected & ready.');
        } else {
            console.log('ℹ️ Google AdSense: Using publisher ca-pub-2711605087755702 and slot 4293059609.');
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
        if (this.matchCount % this.config.showAdEveryNMatches !== 0) {
            if (typeof onComplete === 'function') onComplete();
            return;
        }

        const modal = document.getElementById('adIntermissionModal');
        const container = document.getElementById('adInterstitialContainer');
        const timerBadge = document.getElementById('adTimerCountdown');
        const skipBtn = document.getElementById('btnSkipAd');
        const skipCountdown = document.getElementById('adSkipCountdown');

        if (!modal || !container) {
            if (typeof onComplete === 'function') onComplete();
            return;
        }

        this.isAdShowing = true;
        modal.classList.add('active');

        // Render AdSense Unit inside Interstitial modal
        container.innerHTML = `
            <ins class="adsbygoogle"
                 style="display:block; min-height: 250px; width: 100%;"
                 data-ad-client="${this.config.publisherId}"
                 data-ad-slot="${this.config.slots.postGameInterstitial}"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
        `;

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.log('AdSense interstitial push notice:', e);
        }

        // Setup Countdown
        let remaining = this.config.countdownSeconds;
        if (timerBadge) timerBadge.textContent = remaining;
        if (skipCountdown) skipCountdown.textContent = remaining;
        if (skipBtn) {
            skipBtn.disabled = true;
            skipBtn.innerHTML = `<span>⏳ Please wait (<span id="adSkipCountdown">${remaining}</span>s)...</span>`;
        }

        const finishAd = () => {
            if (this.timerInterval) clearInterval(this.timerInterval);
            this.timerInterval = null;
            this.isAdShowing = false;
            modal.classList.remove('active');
            if (typeof onComplete === 'function') onComplete();
        };

        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            remaining--;
            const countEl = document.getElementById('adSkipCountdown');
            if (countEl) countEl.textContent = remaining;
            if (timerBadge) timerBadge.textContent = remaining;

            if (remaining <= 0) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
                if (skipBtn) {
                    skipBtn.disabled = false;
                    skipBtn.innerHTML = `<span>▶ Continue to Results</span>`;
                    skipBtn.onclick = finishAd;
                }
            }
        }, 1000);
    }

    /**
     * Renders responsive in-page banner ads into containers
     */
    refreshInPageBanners() {
        if (!this.config.enabled) return;

        // Top Banner
        const topContainer = document.getElementById('adBannerTopContainer');
        if (topContainer) {
            topContainer.innerHTML = `
                <div class="ad-unit-label">SPONSORED ADVERTISEMENT</div>
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-client="${this.config.publisherId}"
                     data-ad-slot="${this.config.slots.topBanner}"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
            `;
            try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
        }

        // Bottom Banner
        const bottomContainer = document.getElementById('adBannerBottomContainer');
        if (bottomContainer) {
            bottomContainer.innerHTML = `
                <div class="ad-unit-label">SPONSORED ADVERTISEMENT</div>
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-client="${this.config.publisherId}"
                     data-ad-slot="${this.config.slots.bottomBanner}"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
            `;
            try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
        }

        // Result Modal Banner
        const resultContainer = document.getElementById('adResultBannerContainer');
        if (resultContainer) {
            resultContainer.innerHTML = `
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-client="${this.config.publisherId}"
                     data-ad-slot="${this.config.slots.resultModalBanner}"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
            `;
            try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
        }
    }
}

// Instantiate global AdsManager instance
window.adsManager = new AdsManager(ADS_CONFIG);
