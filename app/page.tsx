"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

const LEAD_WEBHOOK_URL = process.env.NEXT_PUBLIC_LEAD_WEBHOOK_URL;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const DISCOVERY_PRICE = process.env.NEXT_PUBLIC_DISCOVERY_PRICE ?? "79";

const expectations = [
  "Perte de poids localisée",
  "Cellulite",
  "Jambes lourdes",
  "Ventre plus plat",
  "Raffermissement",
  "Accompagnement minceur",
];

const zones = [
  "Ventre",
  "Hanches",
  "Cuisses",
  "Bras",
  "Dos",
  "Fessiers",
  "Plusieurs zones",
];

const beforeAfter = [
  { title: "Programme silhouette", src: "/jfg-before-after-1.jpg" },
  { title: "Affinement global", src: "/jfg-before-after-2.jpg" },
  { title: "Objectif ventre", src: "/jfg-before-after-3.jpg" },
  { title: "Cryo & raffermissement", src: "/jfg-before-after-4.jpg" },
  { title: "Parcours minceur", src: "/jfg-before-after-5.jpg" },
];

const reviews = [
  { name: "Stephanie Rodier", src: "/jfg-review-1.jpg" },
  { name: "Pierre Farge", src: "/jfg-review-2.jpg" },
  { name: "Joelle Jouandane", src: "/jfg-review-3.jpg" },
  { name: "Celine Clement", src: "/jfg-review-4.jpg" },
];

const faq = [
  {
    question: "Le bilan est-il vraiment offert ?",
    answer:
      "Oui, le bilan permet de comprendre vos objectifs, vos zones prioritaires et de vérifier l'offre la plus adaptée.",
  },
  {
    question: "La séance test est à quel prix ?",
    answer:
      "La séance test haute technologie est proposée à 79 euros dans le cadre de l'offre découverte.",
  },
  {
    question: "Pourquoi demander la taille, le poids et l'âge ?",
    answer:
      "Ces informations servent uniquement à calculer un IMC indicatif et à orienter l'offre découverte la plus cohérente.",
  },
  {
    question: "Les résultats sont-ils garantis ?",
    answer:
      "Chaque personne est différente. Le bilan sert à vérifier les indications et à proposer un accompagnement réaliste.",
  },
];

function track(eventName: string, params?: Record<string, unknown>) {
  window.fbq?.("track", eventName, params);
}

function getTrackingParams() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") ?? "",
    utm_medium: params.get("utm_medium") ?? "",
    utm_campaign: params.get("utm_campaign") ?? "",
    utm_content: params.get("utm_content") ?? "",
    utm_term: params.get("utm_term") ?? "",
    fbclid: params.get("fbclid") ?? "",
    meta_campaign_id: params.get("campaign_id") ?? "",
    meta_adset_id: params.get("adset_id") ?? "",
    meta_ad_id: params.get("ad_id") ?? "",
  };
}

function getCenterName() {
  if (typeof window === "undefined") return "JFG Clinic";
  const subdomain = window.location.hostname.split(".")[0];
  if (!subdomain || subdomain === "www") return "JFG Clinic";
  return `JFG Clinic ${subdomain.charAt(0).toUpperCase()}${subdomain.slice(1)}`;
}

function calculateBmi(weightKg: number, heightCm: number) {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

function getOfferFromBmi(bmi: number | null) {
  if (!bmi) {
    return {
      label: "Votre offre découverte vous attend",
      type: `Bilan offert + séance découverte haute technologie à ${DISCOVERY_PRICE} euros`,
    };
  }

  if (bmi < 27) {
    return {
      label: "Bonne nouvelle, vous êtes éligible à notre offre cryo",
      type: `Bilan offert + séance découverte haute technologie à ${DISCOVERY_PRICE} euros`,
    };
  }

  return {
    label: "Bonne nouvelle, vous êtes éligible à notre offre minceur découverte à -50%",
    type: `Bilan offert + séance découverte haute technologie à ${DISCOVERY_PRICE} euros`,
  };
}

export default function Home() {
  const panelRef = useRef<HTMLElement | null>(null);
  const [selectedExpectations, setSelectedExpectations] = useState<string[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [quizQuestion, setQuizQuestion] = useState<"expectations" | "zones">("expectations");
  const [step, setStep] = useState<"quiz" | "form" | "calculating" | "result">("quiz");
  const [messageOptIn, setMessageOptIn] = useState("oui");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bmi, setBmi] = useState<number | null>(null);
  const [centerName, setCenterName] = useState("JFG Clinic");
  const trackingParams = useMemo(getTrackingParams, []);
  const offer = getOfferFromBmi(bmi);

  useEffect(() => {
    setCenterName(getCenterName());
  }, []);

  useEffect(() => {
    if (step !== "calculating" && step !== "result") return;
    window.setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 40);
  }, [step]);

  useEffect(() => {
    if (!META_PIXEL_ID || typeof window === "undefined" || window.fbq) return;

    const fbq = function (...args: unknown[]) {
      ((fbq as unknown as { callMethod?: (...items: unknown[]) => void; queue: unknown[] }).callMethod
        ? (fbq as unknown as { callMethod: (...items: unknown[]) => void }).callMethod(...args)
        : (fbq as unknown as { queue: unknown[] }).queue.push(args));
    } as Window["fbq"] & { queue: unknown[]; loaded: boolean; version: string };

    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq;
    window._fbq = fbq;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
    window.fbq("init", META_PIXEL_ID);
    track("PageView");
    track("ViewContent", { content_name: "Landing JFG minceur" });
  }, []);

  function toggle(list: string[], setList: (items: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((value) => value !== item) : [...list, item]);
  }

  function goToForm() {
    if (selectedExpectations.length === 0) return;
    if (quizQuestion === "expectations") {
      setQuizQuestion("zones");
      return;
    }
    if (selectedZones.length === 0) return;
    track("CustomizeProduct", {
      expectations: selectedExpectations,
      zones: selectedZones,
    });
    setStep("form");
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const heightCm = Number(data.get("height_cm"));
    const weightKg = Number(data.get("weight_kg"));
    const computedBmi = calculateBmi(weightKg, heightCm);
    const computedOffer = getOfferFromBmi(computedBmi);

    setBmi(computedBmi);
    setIsSubmitting(true);
    setStep("calculating");

    const payload = {
      full_name: String(data.get("full_name") ?? ""),
      phone: String(data.get("phone") ?? ""),
      email: String(data.get("email") ?? ""),
      age: String(data.get("age") ?? ""),
      height_cm: String(data.get("height_cm") ?? ""),
      weight_kg: String(data.get("weight_kg") ?? ""),
      imc: computedBmi ?? "",
      recommended_offer: computedOffer.label,
      offer_details: computedOffer.type,
      discovery_price: DISCOVERY_PRICE,
      expectations: selectedExpectations,
      zones: selectedZones,
      message_opt_in: messageOptIn,
      center: centerName,
      brand: "JFG Clinic",
      page: "Landing minceur JFG Clinic",
      submitted_at: new Date().toISOString(),
      ...trackingParams,
    };

    try {
      if (LEAD_WEBHOOK_URL) {
        await fetch(LEAD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      track("Lead", {
        content_name: computedOffer.label,
        value: Number(DISCOVERY_PRICE),
        currency: "EUR",
      });
      window.setTimeout(() => setStep("result"), 2200);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <section className="hero">
        <header className="brand">
          <img src="/jfg-logo-2026.jpg" alt="JFG Clinic - La Clinic de la Beauté" />
        </header>

        <div className="hero-grid">
          <div className="hero-copy">
            <div className="hero-steps">
              <strong>2 étapes</strong>
              <span>Réponse immédiate après calcul de votre IMC</span>
            </div>
            <h1>Vérifiez votre éligibilité à votre offre découverte à -50%</h1>
          </div>

          <div className="results-strip" aria-label="Avant après JFG Clinic">
            <p className="scroll-hint">Faites défiler les résultats</p>
            <div className="results-track">
              {beforeAfter.map((item, index) => (
                <article className="result-card" key={`${item.title}-${index}`}>
                  <img src={item.src} alt={item.title} loading={index > 1 ? "lazy" : "eager"} />
                  <div>
                    <strong>{item.title}</strong>
                    <span>Avant / après</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="conversion-panel" id="formulaire" ref={panelRef}>
        {step === "quiz" && (
          <div className="panel-inner">
            <div className="panel-head">
              <span>Étape 1 sur 2</span>
              <p className="red-note">Obtenez votre offre découverte à -50%</p>
              <h2>
                {quizQuestion === "expectations"
                  ? "Quelles sont vos attentes principales ?"
                  : "Quelles zones souhaitez-vous cibler ?"}
              </h2>
              <p>Vous pouvez cocher plusieurs réponses.</p>
            </div>

            <div className="choice-group">
              {(quizQuestion === "expectations" ? expectations : zones).map((item) => {
                const selected =
                  quizQuestion === "expectations"
                    ? selectedExpectations.includes(item)
                    : selectedZones.includes(item);
                return (
                  <button
                    className={selected ? "choice selected" : "choice"}
                    key={item}
                    onClick={() =>
                      quizQuestion === "expectations"
                        ? toggle(selectedExpectations, setSelectedExpectations, item)
                        : toggle(selectedZones, setSelectedZones, item)
                    }
                    type="button"
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            <button
              className="primary-cta"
              disabled={
                quizQuestion === "expectations"
                  ? selectedExpectations.length === 0
                  : selectedZones.length === 0
              }
              onClick={goToForm}
              type="button"
            >
              {quizQuestion === "expectations" ? "Continuer" : "Continuer pour accéder à mon offre"}
            </button>
          </div>
        )}

        {step === "form" && (
          <form className="panel-inner" onSubmit={submitLead}>
            <div className="panel-head">
              <span>Étape 2 sur 2</span>
              <h2>Nous calculons votre IMC pour adapter votre offre</h2>
              <p className="red-note">Je veux ma séance découverte haute technologie à -50%</p>
            </div>

            <div className="field-grid">
              <input name="full_name" placeholder="Nom complet" required />
              <input inputMode="tel" name="phone" placeholder="Téléphone" required />
              <input inputMode="email" name="email" placeholder="E-mail" type="email" />
              <input inputMode="numeric" min="18" name="age" placeholder="Âge" required type="number" />
              <input inputMode="decimal" min="120" name="height_cm" placeholder="Taille en cm" required type="number" />
              <input inputMode="decimal" min="35" name="weight_kg" placeholder="Poids en kg" required type="number" />
            </div>

            <div className="message-consent">
              <p>Pouvons-nous vous contacter par message pour valider votre offre ?</p>
              <div>
                {["oui", "non"].map((value) => (
                  <button
                    className={messageOptIn === value ? "mini-choice active" : "mini-choice"}
                    key={value}
                    onClick={() => setMessageOptIn(value)}
                    type="button"
                  >
                    {value === "oui" ? "Oui" : "Non"}
                  </button>
                ))}
              </div>
            </div>

            <button className="primary-cta" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Calcul en cours..." : "Voir si je suis éligible à mon offre"}
            </button>
            <p className="microcopy">
              IMC indicatif, utilisé uniquement pour orienter votre bilan. Une conseillère
              confirmera l'offre adaptée avec vous.
            </p>
          </form>
        )}

        {step === "calculating" && (
          <div className="panel-inner calculating">
            <div className="loader" />
            <h2>Analyse de vos résultats en cours</h2>
            <p>Nous calculons votre IMC et préparons l'offre découverte adaptée à votre profil.</p>
          </div>
        )}

        {step === "result" && (
          <div className="panel-inner result">
            <span>Votre demande a été envoyée</span>
            <h2>
              Bonne nouvelle, vous êtes éligible à notre bilan offert + notre séance
              découverte haute technologie à {DISCOVERY_PRICE} euros
            </h2>
            <p>
              Votre IMC indicatif est de <strong>{bmi}</strong>. Votre rendez-vous
              personnalisé dure environ 1h30 avec votre experte minceur. Une personne
              de l'équipe vous contactera pour valider votre créneau.
            </p>
          </div>
        )}
      </section>

      <section className="proof">
        <div className="section-head">
          <span>Résultats</span>
          <h2>Nous limitons chaque mois le nombre de nouvelles demandes afin de garantir entière satisfaction.</h2>
        </div>
        <div className="before-after-grid">
          {beforeAfter.map((item) => (
            <article className="gallery-card" key={item.title}>
              <img src={item.src} alt={item.title} loading="lazy" />
              <strong>{item.title}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="reviews" id="avis">
        <div className="section-head">
          <span>Avis clients</span>
          <h2>Ce que nos clients disent de nous</h2>
        </div>
        <div className="review-grid">
          {reviews.map((review) => (
            <article className="review-card" key={review.name}>
              <img src={review.src} alt={`Avis Google de ${review.name}`} loading="lazy" />
            </article>
          ))}
        </div>
      </section>

      <section className="faq">
        <div className="section-head">
          <span>Questions fréquentes</span>
          <h2>Avant de demander votre bilan</h2>
        </div>
        <div className="faq-grid">
          {faq.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
