import Image from "next/image";
import Link from "next/link";
import HomeMotion from "./home-motion";

const stockPhotos = {
  reception:
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=85",
  garden:
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1400&q=85",
  celebration:
    "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1400&q=85",
};

const galleryImages = [
  {
    title: "Gather around the table",
    description: "An indoor celebration",
    image: stockPhotos.reception,
    imageAlt: "Illustrative stock photo of a reception hall set for a celebration",
  },
  {
    title: "Celebrate in the open air",
    description: "A garden gathering",
    image: stockPhotos.garden,
    imageAlt: "Illustrative stock photo of an outdoor celebration among greenery",
  },
  {
    title: "Make the evening your own",
    description: "A table set for the occasion",
    image: stockPhotos.celebration,
    imageAlt: "Illustrative stock photo of a decorated event table",
  },
  {
    title: "A day made for your people",
    description: "A wedding venue in bloom",
    image: "/images/wedding-set-up-poster.jpg",
    imageAlt: "Illustrative stock photo of an outdoor wedding venue with floral decorations",
  },
];

const reasons = [
  {
    title: "A setting for your gathering",
    description:
      "Gather in the Grand Hall, enjoy the open-air Alfresco, or choose the more intimate Veranda.",
  },
  {
    title: "A schedule that suits your day",
    description:
      "Ask about Day, Night, or Whole day experiences and find the format that fits your plans.",
  },
  {
    title: "Planning with the details in view",
    description:
      "Share your date, preferred space, and guest count. The team can confirm availability, amenities, and current rates.",
  },
];

const questions = [
  {
    question: "How do I ask about a date?",
    answer:
      "Send an inquiry with your preferred date, event details, space, and guest count. Our team will check availability and prepare a quotation.",
  },
  {
    question: "Does an inquiry hold my date?",
    answer:
      "No. An inquiry does not reserve or hold a date. Availability and reservation details are confirmed with our team before a reservation is finalized.",
  },
  {
    question: "What celebrations can I host?",
    answer:
      "Villa Corazon is a setting for weddings, milestones, and meaningful gatherings. Share your plans with the team to discuss which space may suit your event.",
  },
  {
    question: "What spaces can I ask about?",
    answer:
      "You can ask about the Grand Hall, Alfresco, and Veranda. The team can confirm current arrangements and help you choose a setting.",
  },
  {
    question: "How does pricing work?",
    answer:
      "Rates and included services are confirmed with your quotation after the team reviews your event details.",
  },
];

function HeartMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 64 64"
    >
      <path d="M32 47S13 36 13 22a10 10 0 0 1 19-4 10 10 0 0 1 19 4c0 14-19 25-19 25Z" />
      <path d="M4 28h10m36 0h10M10 21c4-5 8-7 14-8m30 8c-4-5-8-7-14-8" />
      <path d="M13 18c4-1 7 0 9 4-4 2-7 1-9-4Zm38 0c-4-1-7 0-9 4 4 2 7 1 9-4Z" />
    </svg>
  );
}

export default function Home() {
  return (
    <HomeMotion>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="villa-home__header">
        <a
          aria-label="Villa Corazon Events Place home"
          className="villa-home__brand"
          href="#home"
        >
          <HeartMark className="villa-home__brand-mark" />
          <span>
            <strong>VILLA CORAZON</strong>
            <small>EVENTS PLACE</small>
          </span>
        </a>

        <nav aria-label="Main navigation" className="villa-home__nav">
          <a href="#reasons">Why Villa Corazon</a>
          <a href="#about">The venue</a>
          <a href="#reviews">Reviews</a>
          <a href="#faq">FAQ</a>
        </nav>

        <details className="villa-home__mobile-menu">
          <summary>Explore</summary>
          <nav aria-label="Mobile navigation">
            <a href="#reasons">Why Villa Corazon</a>
            <a href="#about">The venue</a>
            <a href="#reviews">Reviews</a>
            <a href="#faq">FAQ</a>
            <Link href="/track">Track reservation</Link>
          </nav>
        </details>

        <Link className="villa-home__header-cta" href="/reserve">
          Inquire <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <main id="main-content">
        <section
          aria-labelledby="villa-home-title"
          className="villa-home__hero"
          data-home-hero
          id="home"
        >
          <figure aria-hidden="true" className="villa-home__hero-media">
            <video
              className="villa-home__hero-video"
              data-home-video
              loop
              muted
              playsInline
              poster="/images/wedding-set-up-poster.jpg"
              preload="metadata"
            >
              <source src="/video/wedding-set-up.mp4" type="video/mp4" />
            </video>
          </figure>

          <div className="villa-home__hero-copy" data-home-hero-copy>
            <h1
              className="villa-home__hero-title"
              data-home-title
              data-home-word
              id="villa-home-title"
            >
              A place for your people.
            </h1>
          </div>
        </section>

        <div
          aria-hidden="true"
          className="villa-home__marquee"
          data-home-marquee
        >
          <div className="villa-home__marquee-track" data-home-marquee-track>
            <span>GATHER WITH CORAZON · MAKE ROOM FOR YOUR PEOPLE · </span>
            <span>GATHER WITH CORAZON · MAKE ROOM FOR YOUR PEOPLE · </span>
          </div>
        </div>

        <section
          aria-labelledby="villa-home-reasons-title"
          className="villa-home__reasons"
          id="reasons"
        >
          <div className="villa-home__reasons-intro">
            <h2 id="villa-home-reasons-title">Why choose Villa Corazon?</h2>
            <p>
              A gathering feels more personal when the place, the plan, and
              your people come together.
            </p>
          </div>
          <div className="villa-home__reasons-content">
            <ul className="villa-home__reason-list">
              {reasons.map((reason) => (
                <li className="villa-home__reason" key={reason.title}>
                  <h3 data-home-reveal>{reason.title}</h3>
                  <p data-home-reveal>{reason.description}</p>
                </li>
              ))}
            </ul>
            <figure className="villa-home__reasons-image" data-home-reveal>
              <div className="villa-home__reasons-image-window">
                <Image
                  alt="Illustrative stock photo of a celebration table set with flowers and place settings"
                  fill
                  sizes="(max-width: 700px) 100vw, 48vw"
                  src={stockPhotos.garden}
                  unoptimized
                />
              </div>
              <figcaption>
                <span>A table set for the occasion.</span>
                <small>
                  An illustrative event setting; ask our team about current
                  venue arrangements.
                </small>
              </figcaption>
            </figure>
          </div>
        </section>

        <section
          aria-labelledby="villa-home-about-title"
          className="villa-home__about"
          id="about"
        >
          <div className="villa-home__about-intro">
            <h2 data-home-reveal id="villa-home-about-title">
              A welcoming place to gather.
            </h2>
            <div className="villa-home__about-copy" data-home-reveal>
              <p>
                From the Grand Hall to the open-air Alfresco and intimate
                Veranda, Villa Corazon offers different settings for the
                moments you want to share.
              </p>
              <a className="villa-home__text-link" href="#villa-home-gallery">
                Explore the gallery <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>

          <div className="villa-home__venue-details">
            <div className="villa-home__venue-spaces">
              <h3>Three spaces to make your own.</h3>
              <ul>
                <li>
                  <strong>Grand Hall</strong>
                  <span>An indoor setting for a celebration together.</span>
                </li>
                <li>
                  <strong>Alfresco</strong>
                  <span>An open-air space for gathering.</span>
                </li>
                <li>
                  <strong>Veranda</strong>
                  <span>A more intimate setting for your occasion.</span>
                </li>
              </ul>
            </div>
            <div className="villa-home__venue-planning">
              <h3>Plans, amenities, and pricing</h3>
              <p>
                Ask about Day, Night, or Whole day events. Guest capacity,
                amenities, included services, and current rates are confirmed
                with the team for your chosen space and date.
              </p>
              <Link className="villa-home__text-link" href="/reserve">
                Ask for a quotation <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>

          <div
            aria-label="Celebration settings"
            aria-roledescription="carousel"
            className="villa-home__gallery"
            data-gallery-carousel
            id="villa-home-gallery"
            role="region"
          >
            <div className="villa-home__gallery-heading">
              <h3 data-home-reveal>Imagine the gathering.</h3>
              <div className="villa-home__gallery-controls">
                <p id="villa-home-gallery-help">
                  Auto-advances. Drag, swipe, or use the arrow keys to explore.
                </p>
                <button
                  aria-controls="villa-home-gallery-track"
                  aria-label="Pause automatic gallery scrolling"
                  aria-pressed="false"
                  data-gallery-toggle
                  type="button"
                >
                  Pause
                </button>
              </div>
            </div>

            <ul
              aria-label="Celebration setting photos"
              className="villa-home__gallery-track"
              data-gallery-track
              aria-describedby="villa-home-gallery-help"
              id="villa-home-gallery-track"
              tabIndex={0}
            >
              {galleryImages.map((photo, index) => (
                <li
                  aria-label={`${index + 1} of ${galleryImages.length}`}
                  aria-roledescription="slide"
                  className="villa-home__gallery-item"
                  data-gallery-item
                  data-home-reveal
                  key={photo.title}
                  role="group"
                >
                  <figure>
                    <div className="villa-home__gallery-window">
                      <Image
                        alt={photo.imageAlt}
                        fill
                        sizes="(max-width: 700px) 84vw, 48vw"
                        src={photo.image}
                        unoptimized
                      />
                    </div>
                    <figcaption>
                      <span>{photo.title}</span>
                      <small>{photo.description}</small>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
            <p className="villa-home__gallery-note">
              Illustrative stock photos. Ask our team about current venue
              arrangements.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="villa-home-reviews-title"
          className="villa-home__reviews"
          id="reviews"
        >
          <div data-home-reveal>
            <h2 id="villa-home-reviews-title">Client reviews</h2>
            <p>
              We want this space to reflect real experiences from celebrations
              at Villa Corazon.
            </p>
          </div>
          <div className="villa-home__reviews-pending" data-home-reveal>
            <strong>Reviews coming soon.</strong>
            <p>
              Verified guest feedback will appear here once it is collected
              and approved.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="villa-home-faq-title"
          className="villa-home__faq"
          id="faq"
        >
          <div className="villa-home__faq-intro" data-home-reveal>
            <h2 id="villa-home-faq-title">A few things to know.</h2>
            <p>
              Helpful details before you start planning your celebration.
            </p>
          </div>
          <div className="villa-home__faq-list">
            {questions.map((item, index) => (
              <details
                className="villa-home__faq-item"
                data-home-reveal
                key={item.question}
                open={index === 0}
              >
                <summary>
                  <span>{item.question}</span>
                  <span aria-hidden="true" className="villa-home__faq-toggle">
                    +
                  </span>
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="villa-home-booking-title"
          className="villa-home__booking"
          id="booking"
        >
          <div className="villa-home__booking-copy" data-home-reveal>
            <h2 id="villa-home-booking-title">
              Let&apos;s make room for your celebration.
            </h2>
            <p>
              Share your preferred date, space, and guest count. Our team will
              check availability and prepare a quotation for your event.
            </p>
            <p className="villa-home__booking-note">
              An inquiry does not hold a date. Availability is confirmed with
              the team before a reservation is finalized.
            </p>
          </div>
          <Link className="villa-home__button" href="/reserve">
            Request a quotation <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </main>

      <footer className="villa-home__footer">
        <div className="villa-home__footer-top">
          <a className="villa-home__footer-brand" href="#home">
            VILLA CORAZON
          </a>
          <nav aria-label="Footer navigation">
            <a href="#reasons">Why Villa Corazon</a>
            <a href="#about">The venue</a>
            <a href="#reviews">Reviews</a>
            <a href="#faq">FAQ</a>
            <Link href="/track">Track reservation</Link>
            <Link href="/reserve">Request a quote</Link>
          </nav>
        </div>
        <div className="villa-home__footer-bottom">
          <span>Villa Corazon Events Place</span>
          <span>Venue details and pricing are confirmed with your quotation.</span>
          <a href="#home">Back to top ↑</a>
        </div>
        <p className="villa-home__credits">
          Illustrative venue photos via Unsplash. Hero footage,{" "}
          <a
            href="https://www.pexels.com/video/a-wedding-set-up-3936461/"
            rel="noreferrer"
            target="_blank"
          >
            &ldquo;A Wedding Set Up&rdquo; by viresh studio via Pexels
          </a>
          .
        </p>
      </footer>
    </HomeMotion>
  );
}
