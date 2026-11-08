"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

export default function HomeMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const gallery =
      root.querySelector<HTMLElement>("[data-gallery-carousel]");
    const galleryTrack =
      root.querySelector<HTMLUListElement>("[data-gallery-track]");
    const galleryToggle =
      root.querySelector<HTMLButtonElement>("[data-gallery-toggle]");
    const galleryPrevious =
      root.querySelector<HTMLButtonElement>("[data-gallery-previous]");
    const galleryNext =
      root.querySelector<HTMLButtonElement>("[data-gallery-next]");
    let dragStartX = 0;
    let dragStartScrollLeft = 0;
    let isDragging = false;
    let isInteracting = false;
    let isPointerOverGallery = false;
    let isGalleryFocused = false;
    let isGalleryVisible = false;
    let isAutoplayPaused = prefersReducedMotion;
    let autoplayInterval: number | undefined;
    let interactionTimeout: number | undefined;
    const updateAutoplay = () => {
      const shouldRun =
        !isAutoplayPaused &&
        !isPointerOverGallery &&
        !isGalleryFocused &&
        !isDragging &&
        !isInteracting &&
        isGalleryVisible &&
        !document.hidden;

      if (shouldRun && autoplayInterval === undefined) {
        autoplayInterval = window.setInterval(() => scrollGallery(1), 5000);
      } else if (!shouldRun && autoplayInterval !== undefined) {
        window.clearInterval(autoplayInterval);
        autoplayInterval = undefined;
      }
    };
    const updateGalleryToggle = () => {
      if (!galleryToggle) {
        return;
      }

      galleryToggle.textContent = isAutoplayPaused ? "Play" : "Pause";
      galleryToggle.setAttribute(
        "aria-label",
        isAutoplayPaused
          ? "Resume automatic gallery scrolling"
          : "Pause automatic gallery scrolling",
      );
      galleryToggle.setAttribute("aria-pressed", String(isAutoplayPaused));
    };
    const scrollGallery = (direction: -1 | 1) => {
      if (!galleryTrack) {
        return;
      }

      const firstItem =
        galleryTrack.querySelector<HTMLElement>("[data-gallery-item]");
      const gap = Number.parseFloat(
        window.getComputedStyle(galleryTrack).columnGap,
      );
      const distance = firstItem
        ? firstItem.getBoundingClientRect().width +
          (Number.isFinite(gap) ? gap : 0)
        : galleryTrack.clientWidth * 0.8;
      const maxScroll = galleryTrack.scrollWidth - galleryTrack.clientWidth;
      const atStart = galleryTrack.scrollLeft <= 8;
      const atEnd = maxScroll - galleryTrack.scrollLeft <= 8;
      const left =
        direction > 0 && atEnd
          ? 0
          : direction < 0 && atStart
            ? maxScroll
            : Math.max(
                0,
                Math.min(maxScroll, galleryTrack.scrollLeft + direction * distance),
              );

      galleryTrack.scrollTo({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        left,
      });
    };
    const onGalleryPrevious = () => scrollGallery(-1);
    const onGalleryNext = () => scrollGallery(1);
    const onGalleryKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      event.preventDefault();
      scrollGallery(event.key === "ArrowLeft" ? -1 : 1);
    };
    const onGalleryToggle = () => {
      isAutoplayPaused = !isAutoplayPaused;
      if (isAutoplayPaused && galleryTrack) {
        galleryTrack.scrollTo({
          behavior: "instant",
          left: galleryTrack.scrollLeft,
        });
      }

      updateGalleryToggle();
      updateAutoplay();
    };
    const onGalleryPointerEnter = (event: PointerEvent) => {
      if (event.pointerType === "mouse") {
        isPointerOverGallery = true;
        updateAutoplay();
      }
    };
    const onGalleryPointerLeave = (event: PointerEvent) => {
      if (event.pointerType === "mouse") {
        isPointerOverGallery = false;
        updateAutoplay();
      }
    };
    const onGalleryFocusIn = () => {
      isGalleryFocused = true;
      updateAutoplay();
    };
    const onGalleryFocusOut = (event: FocusEvent) => {
      if (
        event.relatedTarget instanceof Node &&
        gallery?.contains(event.relatedTarget)
      ) {
        return;
      }

      isGalleryFocused = false;
      updateAutoplay();
    };
    const onVisibilityChange = () => updateAutoplay();
    const onGalleryPointerDown = (event: PointerEvent) => {
      if (
        !galleryTrack ||
        (event.pointerType === "mouse" && event.button !== 0)
      ) {
        return;
      }

      isInteracting = true;
      if (interactionTimeout !== undefined) {
        window.clearTimeout(interactionTimeout);
        interactionTimeout = undefined;
      }

      if (event.pointerType === "mouse") {
        isDragging = true;
        dragStartX = event.clientX;
        dragStartScrollLeft = galleryTrack.scrollLeft;
        galleryTrack.classList.add("is-dragging");
        galleryTrack.setPointerCapture(event.pointerId);
        event.preventDefault();
      }

      updateAutoplay();
    };
    const onGalleryPointerMove = (event: PointerEvent) => {
      if (galleryTrack && isDragging) {
        galleryTrack.scrollLeft =
          dragStartScrollLeft - (event.clientX - dragStartX);
      }
    };
    const onGalleryPointerUp = (event: PointerEvent) => {
      if (!galleryTrack) {
        return;
      }

      if (isDragging) {
        isDragging = false;
        galleryTrack.classList.remove("is-dragging");
        if (galleryTrack.hasPointerCapture(event.pointerId)) {
          galleryTrack.releasePointerCapture(event.pointerId);
        }
      }

      interactionTimeout = window.setTimeout(() => {
        isInteracting = false;
        interactionTimeout = undefined;
        updateAutoplay();
      }, 6000);
      updateAutoplay();
    };
    const galleryObserver = gallery
      ? new IntersectionObserver(
          ([entry]) => {
            isGalleryVisible = entry.isIntersecting;
            updateAutoplay();
          },
          { threshold: 0.2 },
        )
      : undefined;

    galleryObserver?.observe(gallery!);
    galleryToggle?.addEventListener("click", onGalleryToggle);
    galleryPrevious?.addEventListener("click", onGalleryPrevious);
    galleryNext?.addEventListener("click", onGalleryNext);
    gallery?.addEventListener("pointerenter", onGalleryPointerEnter);
    gallery?.addEventListener("pointerleave", onGalleryPointerLeave);
    gallery?.addEventListener("focusin", onGalleryFocusIn);
    gallery?.addEventListener("focusout", onGalleryFocusOut);
    galleryTrack?.addEventListener("keydown", onGalleryKeyDown);
    galleryTrack?.addEventListener("pointerdown", onGalleryPointerDown);
    galleryTrack?.addEventListener("pointermove", onGalleryPointerMove);
    galleryTrack?.addEventListener("pointerup", onGalleryPointerUp);
    galleryTrack?.addEventListener("pointercancel", onGalleryPointerUp);
    document.addEventListener("visibilitychange", onVisibilityChange);
    updateGalleryToggle();

    const removeGalleryListeners = () => {
      galleryObserver?.disconnect();
      galleryToggle?.removeEventListener("click", onGalleryToggle);
      galleryPrevious?.removeEventListener("click", onGalleryPrevious);
      galleryNext?.removeEventListener("click", onGalleryNext);
      gallery?.removeEventListener("pointerenter", onGalleryPointerEnter);
      gallery?.removeEventListener("pointerleave", onGalleryPointerLeave);
      gallery?.removeEventListener("focusin", onGalleryFocusIn);
      gallery?.removeEventListener("focusout", onGalleryFocusOut);
      galleryTrack?.removeEventListener("keydown", onGalleryKeyDown);
      galleryTrack?.removeEventListener("pointerdown", onGalleryPointerDown);
      galleryTrack?.removeEventListener("pointermove", onGalleryPointerMove);
      galleryTrack?.removeEventListener("pointerup", onGalleryPointerUp);
      galleryTrack?.removeEventListener("pointercancel", onGalleryPointerUp);
      galleryTrack?.classList.remove("is-dragging");
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (autoplayInterval !== undefined) {
        window.clearInterval(autoplayInterval);
      }
      if (interactionTimeout !== undefined) {
        window.clearTimeout(interactionTimeout);
      }
    };

    if (prefersReducedMotion) {
      return removeGalleryListeners;
    }

    const heroVideo = root.querySelector<HTMLVideoElement>("[data-home-video]");
    if (heroVideo) {
      void heroVideo.play().catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "NotAllowedError") {
          return;
        }

        console.error("Could not start the homepage hero video.", error);
      });
    }

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({ autoRaf: false });
    const tick = (time: number) => lenis.raf(time * 1000);

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const context = gsap.context(() => {
      const title = root.querySelector<HTMLElement>("[data-home-title]");
      if (title) {
        gsap.from(title, {
          autoAlpha: 0,
          duration: 1.15,
          ease: "power4.out",
          yPercent: 12,
        });
      }

      const heroCopy = root.querySelector<HTMLElement>("[data-home-hero-copy]");
      if (heroCopy) {
        gsap.from(heroCopy, {
          autoAlpha: 0,
          delay: 0.3,
          duration: 0.8,
          ease: "power3.out",
          y: 18,
        });
      }

      const art = root.querySelector<HTMLElement>("[data-home-art]");
      if (art) {
        gsap.from(art, {
          autoAlpha: 0,
          duration: 1.6,
          delay: 0.15,
          ease: "power2.out",
          scale: 0.94,
        });
      }

      root.querySelectorAll<HTMLElement>("[data-home-reveal]").forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              once: true,
              start: "top 88%",
              trigger: element,
            },
            y: 0,
          },
        );
      });

      const hero = root.querySelector<HTMLElement>("[data-home-hero]");
      const wordmark = root.querySelector<HTMLElement>("[data-home-word]");
      if (hero && wordmark) {
        gsap.to(wordmark, {
          scale: 0.94,
          scrollTrigger: {
            end: "bottom top",
            scrub: 1,
            start: "top top",
            trigger: hero,
          },
          yPercent: -4,
        });
      }

    }, root);

    gsap.ticker.lagSmoothing(0);
    const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      window.cancelAnimationFrame(refreshFrame);
      removeGalleryListeners();
      context.revert();
      gsap.ticker.remove(tick);
      lenis.destroy();
      gsap.ticker.lagSmoothing(500, 33);
      heroVideo?.pause();
    };
  }, []);

  return (
    <div className="villa-home" ref={rootRef}>
      {children}
    </div>
  );
}
