import Image from "next/image";
import Link from "next/link";
import HomeMotion from "./home-motion";

const stockPhotos = {
  ballroom: "/images/illustrative-reception.jpg",
  table: "/images/illustrative-garden.jpg",
  hall: "/images/illustrative-table-setting.jpg",
};

const galleryImages = [
  {
    title: "A room ready to welcome guests",
    description: "An illustrative reception setting",
    image: stockPhotos.ballroom,
    imageAlt:
      "Illustrative photograph of a ballroom arranged with round tables and chandeliers",
  },
  {
    title: "Details around the table",
    description: "An illustrative table setting",
    image: stockPhotos.table,
    imageAlt:
      "Illustrative photograph of a long reception table with floral centerpieces",
  },
  {
    title: "A celebration set for the day",
    description: "An illustrative event hall",
    image: stockPhotos.hall,
    imageAlt:
      "Illustrative photograph of banquet tables set in a bright event hall",
  },
  {
    title: "An outdoor ceremony",
    description: "An illustrative open-air arrangement",
    image: "/images/wedding-set-up-poster.jpg",
    imageAlt:
      "Illustrative photograph of an outdoor ceremony arrangement with rows of chairs and a gazebo",
  },
];

const reasons = [
  {
    title: "Three distinct spaces",
    description:
      "Choose the indoor Grand Hall, open-air Alfresco, or the more intimate Veranda.",
  },
  {
    title: "Day, Night, or Whole day",
    description:
      "Ask about the available event formats and find one that works with your plans.",
  },
  {
    title: "A quotation for your plans",
    description:
      "Share your date, preferred space, and guest count. The team can confirm availability, amenities, and current rates.",
  },
];

const venueSpaces = [
  {
    id: "grand-hall",
    name: "Grand Hall",
    description: "The Grand Hall is a spacious indoor venue designed to accommodate large gatherings and memorable celebrations. With a capacity of approximately 100–150 guests, it is ideal for weddings, debut celebrations, birthday parties, corporate events, anniversaries, and other grand occasions. Its indoor setting provides a comfortable and elegant atmosphere for formal gatherings and special celebrations. Venue arrangements and additional facilities may be coordinated with the management depending on the client's event requirements.",
    image: stockPhotos.ballroom,
    imageAlt: "Illustrative photograph of a ballroom arranged for a reception",
  },
  {
    id: "alfresco",
    name: "Alfresco",
    description: "The Alfresco offers a relaxed and welcoming setting for intimate celebrations and gatherings. Accommodating up to 50 guests, it is suitable for birthday parties, family reunions, intimate weddings, bridal showers, and small corporate gatherings. Its open-air atmosphere provides guests with a refreshing environment while allowing them to enjoy a more casual and personalized celebration. It is an excellent choice for clients who prefer a laid-back venue for meaningful occasions.",
    image: stockPhotos.table,
    imageAlt: "Illustrative photograph of a reception table with floral details",
  },
  {
    id: "veranda",
    name: "Veranda",
    description: "The Veranda is an intimate event space perfect for smaller celebrations and private gatherings. With a capacity of up to 40 guests, it is ideal for family celebrations, intimate birthday parties, small reunions, private dinners, and other exclusive occasions. Its relaxing atmosphere makes it suitable for clients who want a more personal and comfortable event experience. The venue also offers access to the swimming pool, providing guests with an additional recreational feature to enjoy during their stay.",
    image: stockPhotos.hall,
    imageAlt: "Illustrative photograph of a smaller event setting",
  },
];

const questions = [
  {
    question: "Does an inquiry hold my date?",
    answer:
      "No. An inquiry does not reserve or hold a date. Availability and reservation details are confirmed with our team before a reservation is finalized.",
  },
  {
    question: "How do I ask about a date?",
    answer:
      "Send an inquiry with your preferred date, event details, space, and guest count. Our team will check availability and prepare a quotation.",
  },
  {
    question: "What spaces can I ask about?",
    answer:
      "You can ask about the Grand Hall, Alfresco, and Veranda. The team can confirm current arrangements and help you choose a setting.",
  },
  {
    question: "What celebrations can I host?",
    answer:
      "Villa Corazon is a setting for weddings, milestones, and meaningful gatherings. Share your plans with the team to discuss which space may suit your event.",
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
          <a href="#faq">FAQ</a>
        </nav>

        <details className="villa-home__mobile-menu">
          <summary>Explore</summary>
          <nav aria-label="Mobile navigation">
            <a href="#reasons">Why Villa Corazon</a>
            <a href="#about">The venue</a>
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
              A place for your <span className = "mine">people.</span>
            </h1>
            <p className="villa-home__hero-description">
              Weddings, birthdays, reunions, and milestones, set in a Grand
              Hall, open-air Alfresco, or an intimate Veranda.
            </p>
            <Link className="villa-home__button" href="/reserve">
              Request a quotation <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <figure className="villa-home__hero-feature" data-home-reveal>
            <div className="villa-home__hero-feature-window">
              <Image
                alt="Illustrative photograph of a ballroom arranged with round tables and chandeliers"
                fill
                priority
                sizes="(max-width: 700px) 78vw, 36vw"
                src={stockPhotos.ballroom}
                data-home-art
              />
            </div>
            <a className="villa-home__hero-feature-note" href="#about">
              <span>Three spaces</span>
              <strong>Day, Night, or Whole day</strong>
              <small>Explore the venue <span aria-hidden="true">↗</span></small>
            </a>
          </figure>
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
            <h2 id="villa-home-reasons-title">A few decisions shape the day.</h2>
            <p>
              Start with a setting and format. The team can confirm the details
              for your date and guest count.
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
                  alt="Illustrative photograph of a ballroom arranged with round tables and chandeliers"
                  fill
                  sizes="(max-width: 700px) 100vw, 48vw"
                  src={stockPhotos.ballroom}
                />
              </div>
              <figcaption>
                <span>A room set for a celebration.</span>
                <small>
                  Illustrative reception photography. Ask the team about
                  Villa Corazon&apos;s current arrangements.
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
              The <span className="mine">three</span> spaces for your gathering.
            </h2>
          </div>

          <div className="villa-home__venue-details" data-venue-selector>
            <div className="villa-home__venue-photo-stack">
              {venueSpaces.map((space, index) => (
                <figure
                  aria-hidden={index !== 0}
                  className="villa-home__venue-photo"
                  data-venue-photo={space.id}
                  hidden={index !== 0}
                  key={space.id}
                >
                  <div className="villa-home__venue-photo-window">
                    <Image
                      alt={space.imageAlt}
                      fill
                      sizes="(max-width: 700px) 100vw, 45vw"
                      src={space.image}
                    />
                  </div>
                </figure>
              ))}
            </div>
            <div className="villa-home__venue-content">
              <div
                aria-label="Choose an event space"
                className="villa-home__venue-tabs"
                role="tablist"
              >
                {venueSpaces.map((space, index) => (
                  <button
                    aria-controls={`venue-panel-${space.id}`}
                    aria-selected={index === 0}
                    className="villa-home__venue-tab"
                    data-venue-tab={space.id}
                    id={`venue-tab-${space.id}`}
                    key={space.id}
                    role="tab"
                    tabIndex={index === 0 ? 0 : -1}
                    type="button"
                  >
                    {space.name}
                  </button>
                ))}
              </div>
              {venueSpaces.map((space, index) => (
                <div
                  aria-labelledby={`venue-tab-${space.id}`}
                  className="villa-home__venue-panel"
                  data-venue-panel={space.id}
                  hidden={index !== 0}
                  id={`venue-panel-${space.id}`}
                  key={space.id}
                  role="tabpanel"
                  tabIndex={0}
                >
                  <h3>{space.name}</h3>
                  <p>{space.description}</p>
                </div>
              ))}
              <div className="villa-home__venue-planning">
                <h3>Details for your date</h3>
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
                <div className="villa-home__gallery-control-buttons">
                  <button
                    aria-controls="villa-home-gallery-track"
                    aria-label="Previous celebration setting"
                    className="villa-home__gallery-arrow"
                    data-gallery-previous
                    title="Previous"
                    type="button"
                  >
                    <span aria-hidden="true">←</span>
                  </button>
                  <button
                    aria-controls="villa-home-gallery-track"
                    aria-label="Next celebration setting"
                    className="villa-home__gallery-arrow"
                    data-gallery-next
                    title="Next"
                    type="button"
                  >
                    <span aria-hidden="true">→</span>
                  </button>
                  <button
                    aria-controls="villa-home-gallery-track"
                    aria-label="Pause automatic gallery scrolling"
                    aria-pressed="false"
                    data-gallery-toggle
                    type="button"
                  >
                  </button>
                </div>
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
              These are illustrative images, not photographs of Villa Corazon.
              Contact the team for current venue details.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="villa-home-faq-title"
          className="villa-home__faq"
          id="faq"
        >
          <div className="villa-home__faq-intro" data-home-reveal>
            <h2 id="villa-home-faq-title">Before you inquire.</h2>
            <p>
              How dates, spaces, and pricing are confirmed.
            </p>
          </div>
          <div className="villa-home__faq-list">
            {questions.map((item) => (
              <details
                className="villa-home__faq-item"
                data-home-reveal
                key={item.question}
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
              Your date starts with an inquiry.
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
          <figure className="villa-home__booking-image" data-home-reveal>
            <div className="villa-home__booking-image-window">
              <Image
                alt="Illustrative photograph of a reception table set for a celebration"
                fill
                sizes="(max-width: 700px) 100vw, 36vw"
                src={stockPhotos.table}
              />
            </div>
          </figure>
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
            <a href="#faq">FAQ</a>
            <Link href="/track">Track reservation</Link>
            <Link href="/reserve">Request a quote</Link>
          </nav>
        </div>
        <div className="villa-home__footer-bottom">
          <span>Villa Corazon Events Place</span>
          <a href="#home">↑</a>
        </div>
      </footer>
    </HomeMotion>
  );
}
