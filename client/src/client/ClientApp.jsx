import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import * as api from "../api.js";
import { addEntry } from "../lib/myBookings.js";
import Stepper from "../components/Stepper.jsx";
import Ornament from "../components/Ornament.jsx";
import { isoDate } from "../data/format.js";

import ClientHero from "./ClientHero.jsx";
import ClientFooter from "./ClientFooter.jsx";
import BookingSummary from "./BookingSummary.jsx";
import StepServices from "./StepServices.jsx";
import StepDate from "./StepDate.jsx";
import StepTime from "./StepTime.jsx";
import StepDetails from "./StepDetails.jsx";
import StepConfirmed from "./StepConfirmed.jsx";

const STEPS = ["Usluga", "Datum", "Vreme", "Podaci", "Potvrda"];

export default function ClientApp() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [workingHours, setWorkingHours] = useState({});
  const [loadError, setLoadError] = useState(null);

  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", note: "", consent: false });
  const [submittedId, setSubmittedId] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.getServices(), api.getWorkingHours()])
      .then(([s, w]) => {
        setServices(s.services);
        setCategories(s.categories);
        setWorkingHours(w.workingHours);
      })
      .catch((err) => setLoadError(err.message || String(err)));
  }, []);

  // Pre-select a service when arriving via /?service=<id> from the services page.
  // Consume the query param once services have loaded, then clear it so a later
  // "Zakaži još jedan termin" reset starts fresh.
  useEffect(() => {
    if (services.length === 0) return;
    const preselectId = searchParams.get("service");
    if (!preselectId) return;
    const svc = services.find((s) => s.id === preselectId);
    if (svc) setSelectedService(svc);
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services]);

  // Refetch slots when date/service change
  useEffect(() => {
    if (!selectedDate || !selectedService) {
      setSlots([]);
      return;
    }
    const date = isoDate(selectedDate);
    setSlotsLoading(true);
    api
      .getAvailability(date, selectedService.id)
      .then((res) => {
        // Map server { time, taken, past } to UI shape with `label` field used by selection.
        setSlots(res.slots.map((s) => ({ label: s.time, taken: s.taken, past: s.past })));
      })
      .catch((err) => {
        setSlots([]);
        setLoadError(err.message || String(err));
      })
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, selectedService]);

  const canNext = useMemo(() => {
    if (step === 0) return !!selectedService;
    if (step === 1) return !!selectedDate;
    if (step === 2) return !!selectedTime;
    if (step === 3) return form.name.trim() && form.phone.trim() && form.consent;
    return true;
  }, [step, selectedService, selectedDate, selectedTime, form]);

  async function handleConfirm() {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await api.createBooking({
        service: selectedService.id,
        date: isoDate(selectedDate),
        time: selectedTime.label,
        client: { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() },
        note: form.note.trim(),
      });
      addEntry({ id: res.booking.id, accessToken: res.accessToken });
      setSubmittedId(res.booking.id);
      setStep(4);
    } catch (err) {
      setSubmitError(err.message || "Greška pri slanju zahteva.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep(0);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setForm({ name: "", phone: "", email: "", note: "", consent: false });
    setSubmittedId(null);
    setSubmitError(null);
  }

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 60 }}>
      <ClientHero />

      <section id="booking" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 clamp(16px, 3vw, 32px)" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <span className="eyebrow">Zakazivanje termina</span>
          <h2 className="h-display" style={{ fontSize: "clamp(28px, 5vw, 44px)", marginTop: 10, marginBottom: 10 }}>
            <em style={{ fontStyle: "italic", color: "var(--gold)" }}>Pet</em> koraka do vašeg termina
          </h2>
          <Ornament width={60} />
        </div>

        <div style={{ marginBottom: 40 }}>
          <Stepper steps={STEPS} current={step} />
        </div>

        {loadError && (
          <div
            style={{
              marginBottom: 20,
              padding: 16,
              border: "1px solid var(--bad)",
              borderRadius: 2,
              color: "#d99a8b",
              fontSize: 13,
            }}
          >
            Greška pri učitavanju: {loadError}
          </div>
        )}

        <div className="card" style={{ padding: 0, position: "relative", overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background: "linear-gradient(90deg, transparent, var(--bronze-deep), transparent)",
            }}
          />
          <div style={{ padding: "clamp(20px, 3vw, 40px)" }}>
            {step === 0 && (
              <StepServices
                services={services}
                categories={categories}
                selected={selectedService}
                onSelect={(s) => {
                  setSelectedService(s);
                  setStep(1);
                }}
              />
            )}
            {step === 1 && (
              <StepDate
                selected={selectedDate}
                onSelect={(d) => {
                  setSelectedDate(d);
                  setSelectedTime(null);
                  setStep(2);
                }}
                workingHours={workingHours}
              />
            )}
            {step === 2 && (
              <StepTime
                slots={slots}
                loading={slotsLoading}
                selected={selectedTime}
                onSelect={(t) => {
                  setSelectedTime(t);
                  setStep(3);
                }}
                date={selectedDate}
                service={selectedService}
              />
            )}
            {step === 3 && <StepDetails form={form} setForm={setForm} />}
            {step === 4 && (
              <StepConfirmed
                id={submittedId}
                service={selectedService}
                date={selectedDate}
                time={selectedTime}
                onReset={reset}
              />
            )}
          </div>

          {step !== 4 && (
            <div
              style={{
                padding: "20px clamp(20px, 3vw, 40px)",
                borderTop: "1px solid var(--line-soft)",
                background: "rgba(0,0,0,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
                flexWrap: "wrap",
              }}
            >
              <BookingSummary service={selectedService} date={selectedDate} time={selectedTime} />

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {submitError && (
                  <span style={{ color: "#d99a8b", fontSize: 12 }}>{submitError}</span>
                )}
                {step > 0 && (
                  <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
                    Nazad
                  </button>
                )}
                {step < 3 && (
                  <button
                    className="btn btn-primary"
                    disabled={!canNext}
                    onClick={() => setStep(step + 1)}
                  >
                    Dalje →
                  </button>
                )}
                {step === 3 && (
                  <button
                    className="btn btn-primary"
                    disabled={!canNext || submitting}
                    onClick={handleConfirm}
                  >
                    {submitting ? "Slanje…" : "Pošalji zahtev"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <ClientFooter />
    </div>
  );
}
