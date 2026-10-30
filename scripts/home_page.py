"""Golden Alchemy homepage copy and layout, from the owner's October 30 revisions."""

def render_home(image, eyebrow, instagram, tiktok):
    elements = [
        ('01', 'Fire', 'Grilling · roasting · smoking', '△'),
        ('02', 'Water', 'Simmering · steaming · infusing', '▽'),
        ('03', 'Earth', 'Clay · stone · salt', '◇'),
        ('04', 'Air', 'Baking · aeration · fermentation', '≋'),
    ]
    tiles = ''.join(
        f'<a class="element" href="/{title.lower()}/" aria-label="Explore {title}">'
        f'<span class="element-number">{number}</span><span class="element-symbol" aria-hidden="true">{symbol}</span>'
        f'<h3>{title}</h3><p>{description}</p><span class="element-arrow" aria-hidden="true">↗</span></a>'
        for number,title,description,symbol in elements
    )
    realms = [
        ('guild', '03 / THE COMMUNITY', 'Chef Rain’s Guild',
         'Find your place in a community built around your craft. Planned membership tiers will offer a photo editor, uploads, and a gallery of work from fellow guild members.',
         'forum', 'Enter the guild', 'Memberships & community tools coming soon', 'Hands preparing food together in a kitchen'),
        ('oracle', '04 / THE DISCOVERY', 'Global News Feed',
         'Stay in the loop with official food-recall reports and local forecasts. Recipe discovery is coming next, bringing fresh inspiration to the ingredients already in your pantry.',
         'theoracle', 'Browse news and recipes', 'FDA reports & New York forecasts available', 'A colorful bowl of fresh vegetables'),
        ('bazaar', '05 / THE MARKET', 'Chef Rain’s Marketplace',
         'Explore the collection taking shape: online cooking classes, cookbooks, signature seasonings, and culinary goods. Meal preparation and catering for New York City residents are planned, with availability to be announced.',
         'marketplace', 'Explore the marketplace', 'Products & services coming soon', 'Colorful spices at a market'),
    ]
    cards = ''.join(
        f'<a class="realm-card" href="/{route}/"><div class="realm-image">{image(key, alt)}'
        f'<span class="card-arrow" aria-hidden="true">↗</span></div><div class="realm-copy">{eyebrow(kicker)}'
        f'<h3>{title}</h3><p>{description}</p><span class="realm-status">{status}</span>'
        f'<span class="underlink">{action} <span aria-hidden="true">→</span></span></div></a>'
        for key,kicker,title,description,route,action,status,alt in realms
    )
    return f'''
    <section class="hero revised-hero">
      <div class="hero-image">{image('hero','An editorial platter of grilled meats, vegetables, and dipping sauces',True)}</div>
      <div class="hero-shade"></div>
      <div class="wrap hero-content">
        {eyebrow('CHEF RAIN’S KITCHEN · GOLDEN ALCHEMY')}
        <h1>Simple ingredients.<br>Extraordinary<br><em>possibilities.</em></h1>
        <p>Make your time in the kitchen more creative and less intimidating. Explore Golden Alchemy for practical tips, techniques, and recipe inspiration that bring confidence to your cooking and new life to every plate.</p>
        <div class="hero-actions"><a class="button" href="#explore">Explore Golden Alchemy <span aria-hidden="true">↗</span></a><a class="hero-link" href="/about/">Meet Chef Rain <span aria-hidden="true">→</span></a></div>
      </div>
      <div class="hero-bottom wrap"><span>FIRE. FLAVOR. A LITTLE WONDER.</span><a href="#philosophy">SCROLL TO DISCOVER ↓</a></div>
    </section>
    <section id="philosophy" class="philosophy wrap section">
      <div class="section-top"><div>{eyebrow('01 / THE PHILOSOPHY')}<h2>Epistemology<br>&amp; Aesthetics.</h2></div>
      <div class="section-description"><p>How do we know what works? What makes a dish beautiful? Epistemology explores knowledge and how we establish what is true; aesthetics considers beauty and artistic expression.</p>
      <p>In Golden Alchemy’s kitchen, the two meet through precise measurements, an understanding of technique, and thoughtful presentation—balancing the science of cooking with the art of a delicious-looking plate.</p>
      <p>Every kitchen has its own alchemy. Ours begins with four elements.</p></div></div>
      <div class="elements">{tiles}</div>
      <div class="transformation"><span aria-hidden="true">✧</span><p><strong>The fifth ingredient: transformation.</strong> Time, technique, and intention turn the everyday into something extraordinary.</p></div>
    </section>
    <section id="explore" class="realm-section section"><div class="wrap">
      <div class="section-heading">{eyebrow('02 / FIND YOUR PLACE')}<h2>Explore the realm<span class="gold-dot">.</span></h2>
      <p class="realm-introduction">There’s more than one way to stay connected through food. Golden Alchemy brings together the tools and inspiration for your next kitchen adventure: recipes inspired by your pantry, a place to chat and share in <a href="/forum/">Chef Rain’s Guild</a>, classes and culinary goods at <a href="/marketplace/">Chef Rain’s Marketplace</a>, and local forecasts to help you plan a meal for the weather.</p>
      <p class="realm-phase-note">Explore what’s available now and what’s coming next below.</p></div>
      <div class="realm-grid">{cards}</div>
    </div></section>
    <section class="social-section"><div class="wrap social-inner"><div>
      {eyebrow('THANK YOU FOR VISITING THIS SITE')}<h2>Follow Chef Rain’s<br>next creation.</h2>
      <p>Explore Chef Rain’s work on TikTok and Instagram.</p>
    </div><div class="social-links">
      <a href="{instagram}" target="_blank" rel="noopener noreferrer"><span>INSTAGRAM<small>@goldenalchemy.na</small></span><span aria-hidden="true">↗</span></a>
      <a href="{tiktok}" target="_blank" rel="noopener noreferrer"><span>TIKTOK — EXTENDED VIDEOS<small>@goldenalchemy.net</small></span><span aria-hidden="true">↗</span></a>
    </div></div></section>'''
