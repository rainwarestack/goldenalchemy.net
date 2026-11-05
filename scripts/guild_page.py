"""Golden Alchemy's browser-local Guild preview; no invented public activity."""


def guild():
    return '''<section class="wrap ga-guild" id="guild-app" aria-label="Chef Rain’s Guild">
    <div class="g-topline"><p class="eyebrow">CHEF RAIN’S GUILD / YOUR OWN LITTLE WORLD</p><span class="status">WORKING PREVIEW</span></div>
    <div class="g-banner" id="g-banner"><span class="g-banner-word">A little kitchen magic.</span><span class="g-banner-star" aria-hidden="true">✧</span></div>
    <section class="g-identity" aria-labelledby="g-name"><div class="g-avatar" id="g-avatar" aria-label="Profile picture"><span aria-hidden="true">✧</span></div><div class="g-identity-copy"><p class="eyebrow">THE ART OF YOUR EVERYDAY</p><h1 id="g-name">Chef Rain</h1><p id="g-bio">Your kitchen. Your rhythm. Your little alchemy.</p><p id="g-specialty" class="small muted">A space for whatever you’re making.</p></div><div class="g-profile-actions"><button type="button" class="button" id="g-edit">Personalize profile</button><button type="button" class="g-secondary" id="g-view" aria-pressed="false">Preview visitor view</button></div></section>
    <p class="g-local-note" id="g-local-note">Your working preview is saved on this browser only. Photos, activity, and reactions aren’t shared with other visitors yet.</p>
    <p id="g-notice" class="g-notice" role="status" aria-live="polite"></p>
    <section aria-labelledby="g-kitchen-heading"><div class="g-section-heading"><div><p class="eyebrow">01 / FROM FIRST THOUGHT TO FIRST BITE</p><h2 id="g-kitchen-heading">In the kitchen.</h2></div><span class="g-session-label" id="g-session-label">Make something yours.</span></div>
    <div class="g-apps" id="g-apps"></div></section>
    <section class="g-board-section" aria-labelledby="g-board-heading"><div class="g-section-heading"><div><p class="eyebrow">02 / THE THINGS THAT FEED YOU</p><h2 id="g-board-heading">Your moodboard.</h2></div><div class="g-board-actions"><button type="button" class="g-secondary" id="g-arrange" aria-pressed="false">Arrange board</button><button type="button" class="button" id="g-add">+ Add a moment</button></div></div><div class="g-board" id="g-board"></div></section>
    <div class="g-bottom-note"><span>Every chef. Every kitchen. Every kind of magic.</span><button type="button" class="underlink" id="g-export">Download my backup</button><a class="underlink" href="/account/">Your chef account</a></div>
    <noscript><p>Enable JavaScript to personalize your profile and use the five kitchen apps. Changes stay in this browser during the preview.</p></noscript>
    <dialog class="g-dialog" id="g-dialog" aria-labelledby="g-dialog-title"><div class="g-dialog-top"><p class="eyebrow" id="g-dialog-kicker">YOUR KITCHEN</p><button type="button" class="g-close" aria-label="Close kitchen app">×</button></div><h2 id="g-dialog-title"></h2><div id="g-dialog-body"></div></dialog>
    </section>'''
