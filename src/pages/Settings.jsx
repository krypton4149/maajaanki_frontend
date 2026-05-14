import { useState } from "react";
import "./Settings.css";

function IconStorefront() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function IconSliders() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M9 10h6M17 16h-6M5 8h2M15 14h2" />
    </svg>
  );
}

const CHANNELS = ["Push", "Email", "SMS"];

/** Same destination as the restaurant’s Google listing (Shikohabad). */
const RESTAURANT_MAPS_URL =
  "https://www.google.com/maps/place/Maa+Jaanki+Restaurant,+Shikohabad+Rd,+near+Tiwariya+Chauraha,+Shikohabad,+Uttar+Pradesh+283135/@27.1298908,78.6002772,17z/data=!3m1!4b1!4m6!3m5!1s0x39744b76295c7f29:0xa742681b627b1455!8m2!3d27.1298908!4d78.6002772";

const DEFAULT_ADDRESS =
  "Shikohabad Rd, near Tiwariya Chauraha, Shikohabad, Uttar Pradesh 283135";

export default function Settings() {
  const [restaurantName, setRestaurantName] = useState("Maa Jaanki Restaurant");
  const [contactEmail, setContactEmail] = useState("maajaanki2@gmail.com");
  const [phone, setPhone] = useState("+91 99276 66666");
  const [address, setAddress] = useState(DEFAULT_ADDRESS);
  const [openingHours, setOpeningHours] = useState("11 AM – 11 PM");
  const [language, setLanguage] = useState("en-US");
  const [channels, setChannels] = useState(() => new Set(["Push", "Email"]));

  function toggleChannel(name) {
    setChannels((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const phoneTelHref = `tel:${phone.replace(/[^\d+]/g, "")}`;

  return (
    <div className="settings-page">
      <h1 className="settings-page-title">Settings</h1>

      <div className="settings-grid">
        <section className="settings-card settings-card--profile" aria-labelledby="settings-profile-heading">
          <div className="settings-card-header">
            <IconStorefront aria-hidden="true" />
            <h2 id="settings-profile-heading" className="settings-card-title">
              Restaurant profile
            </h2>
          </div>

          <div className="settings-field">
            <label className="settings-label" htmlFor="settings-restaurant-name">
              Restaurant name
            </label>
            <input
              id="settings-restaurant-name"
              className="settings-input"
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              autoComplete="organization"
            />
          </div>

          <div className="settings-row-2">
            <div className="settings-field">
              <label className="settings-label" htmlFor="settings-email">
                Contact email
              </label>
              <input
                id="settings-email"
                className="settings-input"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="settings-field">
              <label className="settings-label" htmlFor="settings-phone">
                Phone number
              </label>
              <input
                id="settings-phone"
                className="settings-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="settings-field">
            <label className="settings-label" htmlFor="settings-address">
              Full address
            </label>
            <textarea
              id="settings-address"
              className="settings-textarea"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
            />
          </div>

          <div className="settings-field">
            <label className="settings-label" htmlFor="settings-hours">
              Opening hours
            </label>
            <input
              id="settings-hours"
              className="settings-input"
              type="text"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              placeholder="e.g. 11 AM – 11 PM"
              autoComplete="off"
            />
          </div>

          <div className="settings-save">
            <button type="button" className="btn btn-primary">
              Save changes
            </button>
          </div>
        </section>

        <section className="settings-card" aria-labelledby="settings-pref-heading">
          <div className="settings-card-header">
            <IconSliders aria-hidden="true" />
            <h2 id="settings-pref-heading" className="settings-card-title settings-card-title--caps">
              Preferences
            </h2>
          </div>

          <div className="settings-field">
            <label className="settings-label" htmlFor="settings-language">
              Language
            </label>
            <select
              id="settings-language"
              className="settings-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en-US">English (US)</option>
              <option value="en-IN">English (India)</option>
              <option value="hi">Hindi</option>
            </select>
          </div>

          <div className="settings-pref-row">
            <span className="settings-pref-label">Dark mode</span>
            <span className="settings-badge-active">Active</span>
          </div>

          <div className="settings-field">
            <span className="settings-label" id="settings-channels-label">
              Notification channels
            </span>
            <div
              className="settings-channel-group"
              role="group"
              aria-labelledby="settings-channels-label"
            >
              {CHANNELS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  className={`settings-channel${channels.has(ch) ? " settings-channel--on" : ""}`}
                  aria-pressed={channels.has(ch)}
                  onClick={() => toggleChannel(ch)}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="settings-card" aria-labelledby="settings-loc-heading">
          <h2 id="settings-loc-heading" className="settings-card-title settings-card-title--caps">
            Location
          </h2>
          <a
            className="settings-loc-visual settings-loc-visual--link"
            href={RESTAURANT_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Maa Jaanki Restaurant in Google Maps (new tab)"
          >
            <div className="settings-loc-map" aria-hidden="true" />
            <p className="settings-loc-hq">Maa Jaanki · Shikohabad, UP</p>
          </a>
          <p className="settings-loc-hours">{openingHours}</p>
          <p className="settings-loc-phone">
            <a href={phoneTelHref}>{phone}</a>
          </p>
          <p className="settings-loc-sync">Last operational sync: 2 mins ago</p>
        </section>
      </div>
    </div>
  );
}
