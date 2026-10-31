import Link from "next/link";

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
  { name: "Day", time: "A bright beginning to your celebration" },
  { name: "Night", time: "An evening made for gathering" },
  { name: "Whole day", time: "More time to make it your own" },
];

export default function Home() {
  return (
    <>
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
          <a href="#spaces">The spaces</a>
          <a href="#packages">Packages</a>
          <a href="#process">How it works</a>
        </nav>
        <Link className="button button-outline header-cta" href="/reserve">
          Request a quote <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-image" aria-hidden="true" />
          <div className="hero-content">
            <p className="eyebrow eyebrow-light">
              A PLACE FOR YOUR MOST MEANINGFUL DAYS
            </p>
            <h1>
              Gather close.
              <br />
              Celebrate <em>beautifully.</em>
            </h1>
            <p className="hero-copy">
              A warm and welcoming place for the moments that bring everyone
              together. Find a space that feels like yours at Villa Corazon.
            </p>
            <div className="hero-actions">
              <a className="button button-light" href="#spaces">
                Explore our spaces <span aria-hidden="true">↓</span>
              </a>
              <Link className="text-link text-link-light" href="/reserve">
                Request a quotation <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <div className="hero-note">
            <span className="hero-note-icon" aria-hidden="true">
              V
            </span>
            <span>
              <strong>Made for gathering</strong>
              <small>Spaces for intimate moments and grand celebrations</small>
            </span>
          </div>
          <div className="hero-index" aria-hidden="true">
            01 <span /> 03
          </div>
        </section>

        <section className="intro-section section-wrap">
          <p className="eyebrow">WELCOME TO VILLA CORAZON</p>
          <div className="intro-grid">
            <h2>
              The best days are
              <br />
              the ones we <em>share.</em>
            </h2>
            <p>
              From heartfelt family gatherings to once-in-a-lifetime
              celebrations, Villa Corazon offers a place to bring your people
              together. Explore our spaces, then talk with our team about the
              date and details you have in mind.
            </p>
          </div>
          <div className="intro-rule">
            <span>THOUGHTFULLY HOSTED</span>
            <span>ROOM TO CELEBRATE</span>
            <span>MADE WITH CORAZON</span>
          </div>
        </section>

        <section className="spaces-section" id="spaces">
          <div className="section-wrap">
            <div className="section-heading">
              <div>
                <p className="eyebrow">FIND YOUR SETTING</p>
                <h2>Spaces for every <em>kind of together.</em></h2>
              </div>
              <p className="section-heading-copy">
                Choose a setting that fits your gathering. Our team can help
                you explore arrangements and availability.
              </p>
            </div>

            <div className="spaces-grid">
              {spaces.map((space) => (
                <article className={space.className} key={space.name}>
                  <div
                    className="space-image"
                    role="img"
                    aria-label={`${space.name} event space`}
                    style={{ backgroundImage: `url("${space.image}")` }}
                  >
                    <span className="space-number">{space.number}</span>
                    <span className="space-capacity">{space.capacity}</span>
                  </div>
                  <div className="space-info">
                    <div>
                      <h3>{space.name}</h3>
                      <p>{space.description}</p>
                    </div>
                    <span className="space-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </div>
                </article>
              ))}
            </div>
            <p className="fine-print">
              Guest Room and Guest House accommodation may also be available.
              Capacities and facility details are approximate; please confirm
              current arrangements with the venue.
            </p>
          </div>
        </section>

        <section className="packages-section" id="packages">
          <div className="section-wrap packages-grid">
            <div className="packages-intro">
              <p className="eyebrow eyebrow-light">YOUR DAY, YOUR WAY</p>
              <h2>
                Make room for
                <br />
                <em>the good stuff.</em>
              </h2>
              <p>
                Choose a day, night, or whole-day rental. Tell us what you are
                planning and we will prepare a quotation for your event.
              </p>
              <Link className="text-link text-link-light" href="/reserve">
                Ask us for a quotation{" "}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="package-list">
              {packages.map((item, index) => (
                <article className="package-item" key={item.name}>
                  <span className="package-index">0{index + 1}</span>
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.time}</p>
                  </div>
                  <span className="package-arrow" aria-hidden="true">
                    ↗
                  </span>
                </article>
              ))}
              <p className="package-note">
                Rates and included services are confirmed with your quotation.
              </p>
            </div>
          </div>
        </section>

        <section className="process-section section-wrap" id="process">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A PERSONAL TOUCH, AT EVERY STEP</p>
              <h2>From first hello to <em>“I do.”</em></h2>
            </div>
            <p className="section-heading-copy">
              For now, our team helps you personally with your inquiry,
              quotation, and reservation confirmation.
            </p>
          </div>
          <div className="process-grid">
            <article>
              <span>01</span>
              <h3>Share your plans</h3>
              <p>
                Tell our team your event type, preferred date and time, guest
                count, and the space you have in mind.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Receive a quotation</h3>
              <p>
                The team checks the schedule and prepares a quotation based on
                your event details.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Confirm your date</h3>
              <p>
                After you accept the quote and the team verifies your deposit,
                they confirm your reservation.
              </p>
            </article>
          </div>
          <div className="process-callout">
            <div>
              <p className="eyebrow eyebrow-light">LET&apos;S MAKE IT A DAY TO REMEMBER</p>
              <h2>Your celebration starts with a conversation.</h2>
            </div>
            <Link className="button button-light" href="/reserve">
              Tell us about your event <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="site-footer">
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
        <a className="footer-top" href="#home">
          Back to top <span aria-hidden="true">↑</span>
        </a>
        <small>Venue details and pricing are subject to confirmation.</small>
      </footer>
    </>
  );
}
