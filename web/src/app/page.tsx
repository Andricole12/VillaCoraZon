import Link from "next/link";
import ScrollReveal from "./scroll-reveal";

const spaces = [
  {
    number: "01",
    name: "Grand Hall",
    description: "A welcoming main venue for weddings, celebrations, and gatherings.",
    capacity: "Approx. 100-150 guests",
    image:
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=85",
    className: "space-card space-card-large",
  },
  {
    number: "02",
    name: "Alfresco",
    description: "An open-air setting for relaxed celebrations and special evenings.",
    capacity: "Approx. 50 guests",
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1100&q=85",
    className: "space-card",
  },
  {
    number: "03",
    name: "Veranda",
    description: "A charming space for intimate occasions and smaller gatherings.",
    capacity: "Approx. 40 guests",
    image:
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1100&q=85",
    className: "space-card",
  },
];

const packages = [
  {
    name: "Day",
    time: "A bright beginning to your celebration, with a relaxed daytime feel.",
    label: "DAY CELEBRATION",
  },
  {
    name: "Night",
    time: "An evening made for gathering, sharing a meal, and making memories.",
    label: "EVENING CELEBRATION",
  },
  {
    name: "Whole day",
    time: "More time to settle in, celebrate, and make the day your own.",
    label: "FULL-DAY CELEBRATION",
  },
];

export default function Home() {
  return (
    <ScrollReveal>
      <header className="site-header">
        <a className="brand" href="#home" aria-label="Villa Corazon home">
          <span className="brand-mark" aria-hidden="true">
            VC
          </span>
          <span className="brand-name">
            <strong>VILLA CORAZON</strong>
            <span>EVENTS PLACE</span>
          </span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#story">Our story</a>
          <a href="#spaces">The spaces</a>
          <a href="#packages">Packages</a>
          <Link href="/track">Track reservation</Link>
        </nav>
        <details className="mobile-menu">
          <summary>
            Explore <span aria-hidden="true">⌄</span>
          </summary>
          <nav aria-label="Mobile navigation">
            <a href="#story">Our story</a>
            <a href="#spaces">The spaces</a>
            <a href="#packages">Packages</a>
            <Link href="/track">Track reservation</Link>
          </nav>
        </details>
        <Link className="button button-outline header-cta" href="/reserve">
          Reserve a date <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-image" aria-hidden="true" />
          <div className="hero-content" data-reveal>
            <p className="eyebrow eyebrow-light">
              YOUR CELEBRATION, BEAUTIFULLY HELD
            </p>
            <h1>
              Where your story
              <br />
              comes to <em>life.</em>
            </h1>
            <p className="hero-copy">
              An intimate garden and events place thoughtfully designed for
              weddings, milestones, and meaningful days together.
            </p>
            <div className="hero-actions">
              <a className="button button-light" href="#spaces">
                Explore spaces &amp; dates <span aria-hidden="true">→</span>
              </a>
              <Link className="text-link text-link-light" href="/reserve">
                <span className="hero-play" aria-hidden="true">▶</span>
                Start planning
              </Link>
            </div>
          </div>
          <div className="hero-index" aria-hidden="true">
            VILLA CORAZON <span /> PHILIPPINES
          </div>
        </section>

        <section className="intro-section section-wrap" id="story">
          <div className="intro-collage" data-reveal>
            <div
              className="intro-image intro-image-garden"
              role="img"
              aria-label="Garden event setting"
            />
            <div
              className="intro-image intro-image-venue"
              role="img"
              aria-label="Villa Corazon event venue"
            />
            <span className="intro-image-seal">MADE FOR<br />MEANINGFUL<br />MOMENTS</span>
          </div>
          <div className="intro-story" data-reveal>
            <p className="eyebrow">A HOME FOR YOUR MOST IMPORTANT DAYS</p>
            <h2>
              A little sanctuary,
              <br />
              <em>made for gathering.</em>
            </h2>
            <p className="intro-story-copy">
              At Villa Corazon, the setting is part of the celebration. Bring
              your favorite people together in a welcoming space, surrounded by
              thoughtful details and room to make the day your own.
            </p>
            <div className="intro-stats">
              <div><strong>150</strong><span>Approx. Grand Hall capacity</span></div>
              <div><strong>3</strong><span>Featured event spaces</span></div>
              <div><strong>VC</strong><span>Gather with corazon</span></div>
            </div>
          </div>
        </section>

        <section className="spaces-section" id="spaces">
          <div className="section-wrap">
            <div className="section-heading" data-reveal>
              <div>
                <p className="eyebrow">FIND YOUR SETTING</p>
                <h2>Spaces with <em>a sense of place.</em></h2>
              </div>
              <p className="section-heading-copy">
                From garden gatherings to grand celebrations, find a setting
                that feels right for your day.
              </p>
            </div>

            <div className="spaces-grid">
              {spaces.map((space) => (
                <article className={space.className} data-reveal key={space.name}>
                  <div
                    className="space-image"
                    role="img"
                    aria-label={`${space.name} event space`}
                    style={{ backgroundImage: `url("${space.image}")` }}
                  >
                    <span className="space-number">{space.number}</span>
                    <span className="space-image-copy">
                      <small>{space.capacity}</small>
                      <strong>{space.name}</strong>
                      <span>EXPLORE THIS SPACE <b aria-hidden="true">↗</b></span>
                    </span>
                  </div>
                  <div className="space-info">
                    <p>{space.description}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className="fine-print">
              Capacities are approximate. Please ask our team to confirm
              current venue details and arrangements.
            </p>
          </div>
        </section>

        <section className="packages-section" id="packages">
          <div className="section-wrap">
            <div className="packages-intro" data-reveal>
              <p className="eyebrow">CELEBRATIONS, CONSIDERED</p>
              <h2>Choose your <em>experience.</em></h2>
              <p>
                Tell us what you are planning. We will help shape the details
                and prepare a quotation for your event.
              </p>
            </div>
            <div className="package-list">
              {packages.map((item, index) => (
                <article
                  className={`package-item${index === 1 ? " package-item-featured" : ""}`}
                  data-reveal
                  key={item.name}
                >
                  {index === 1 ? <span className="package-featured-label">A TIME TO CELEBRATE</span> : null}
                  <span className="package-index">0{index + 1}</span>
                  <div>
                    <span className="package-label">{item.label}</span>
                    <h3>{item.name}</h3>
                    <p>{item.time}</p>
                    <strong className="package-price">Quotation on request</strong>
                    <span className="package-detail">Details tailored to your event</span>
                  </div>
                  <Link className="package-cta" href="/reserve">
                    Check availability <span aria-hidden="true">→</span>
                  </Link>
                </article>
              ))}
            </div>
            <p className="package-note" data-reveal>
              Rates and included services are confirmed with your quotation.
            </p>
          </div>
        </section>

        <section className="process-callout" id="process" data-reveal>
          <span className="callout-star" aria-hidden="true">✦</span>
          <p className="eyebrow eyebrow-light">LET&apos;S MAKE IT A DAY TO REMEMBER</p>
          <h2>Your date may still be waiting.</h2>
          <p>
            Tell us what you are dreaming of. We&apos;ll be in touch with the
            details to help make it real.
          </p>
          <Link className="button button-light" href="/reserve">
            Start your reservation <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>

      <footer className="site-footer" data-reveal>
        <a className="brand brand-footer" href="#home" aria-label="Villa Corazon home">
          <span className="brand-mark" aria-hidden="true">
            VC
          </span>
          <span className="brand-name">
            <strong>VILLA CORAZON</strong>
            <span>EVENTS PLACE</span>
          </span>
        </a>
        <p>A welcoming place to gather, celebrate, and make memories.</p>
        <nav className="footer-nav" aria-label="Footer navigation">
          <a href="#story">Our story</a>
          <a href="#spaces">The spaces</a>
          <a href="#packages">Packages</a>
          <Link href="/track">Track</Link>
        </nav>
        <a className="footer-top" href="#home">
          Back to top <span aria-hidden="true">↑</span>
        </a>
        <small>Venue details and pricing are subject to confirmation.</small>
      </footer>
    </ScrollReveal>
  );
}
