import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import "./Support.css";

const NEXTGEN_DIGITAL_SERVICE = "NextGen Digital Service";
const NEXTGEN_WEBSITE = "https://nextgendigital-lilac.vercel.app/";
const SUPPORT_PHONE_DISPLAY = "+91 82180 58950";
const SUPPORT_PHONE_E164 = "918218058950";
const WHATSAPP_E164 = "918218058950";

function buildWhatsAppHref() {
  const text = `Hi ${NEXTGEN_DIGITAL_SERVICE}, I'm reaching out from the Maa Jaanki admin console and need help.`;
  return `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(text)}`;
}

const HELP_CATEGORIES = [
  {
    id: "orders",
    title: "Order issues",
    desc: "Refunds, cancellations, delivery tracking, and order history.",
    icon: IconReceipt,
  },
  {
    id: "payments",
    title: "Payment queries",
    desc: "Payouts, commissions, invoices, and tax-related documents.",
    icon: IconWallet,
  },
  {
    id: "menu",
    title: "Menu management",
    desc: "Item availability, pricing, photos, and category structure.",
    icon: IconUtensils,
  },
  {
    id: "account",
    title: "Account settings",
    desc: "Staff permissions, security, and console preferences.",
    icon: IconUserSimple,
  },
];

const MOCK_TICKETS = [
  {
    id: "MJ-8921",
    subject: "Menu API sync failure",
    status: "in_progress",
    label: "In progress",
    updated: "2 hrs ago",
  },
  {
    id: "MJ-8745",
    subject: "GST statement correction",
    status: "resolved",
    label: "Resolved",
    updated: "Yesterday",
  },
  {
    id: "MJ-8612",
    subject: "Printer driver incompatibility",
    status: "pending",
    label: "Pending",
    updated: "3 days ago",
  },
];

function IconReceipt() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function IconWallet() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M21 12V7H5a2 2 0 010-4h14v4" />
      <path d="M3 5v14a2 2 0 002 2h16v-5M18 12a2 2 0 100 4 2 2 0 000-4z" />
    </svg>
  );
}

function IconUtensils() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M3 2v7c0 1.66 1 3 3 3h0M16 8V2M8 2v20M16 2v20l-2-2-2 2" />
    </svg>
  );
}

function IconUserSimple() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="8" r="4" />
      <path d="M6 21v-1a4 4 0 014-4h4a4 4 0 014 4v1" />
    </svg>
  );
}

function IconChatCard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 018.5-8.5h.5a8.5 8.5 0 018 5.5" />
    </svg>
  );
}

function IconChannels() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 19h16M4 15h10M4 11h16M4 7h10M4 3h16" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function ticketPillClass(status) {
  if (status === "resolved") return "support-ticket-pill support-ticket-pill--resolved";
  if (status === "pending") return "support-ticket-pill support-ticket-pill--pending";
  return "support-ticket-pill support-ticket-pill--progress";
}

function textMatches(q, ...parts) {
  if (!q) return true;
  return parts.some((p) => (p ?? "").toLowerCase().includes(q));
}

export default function Support() {
  const ctx = useOutletContext();
  const supportSearch = typeof ctx?.supportSearch === "string" ? ctx.supportSearch : "";
  const q = supportSearch.trim().toLowerCase();

  const whatsAppHref = useMemo(() => buildWhatsAppHref(), []);

  const filteredCategories = useMemo(
    () => HELP_CATEGORIES.filter((c) => textMatches(q, c.title, c.desc, c.id)),
    [q]
  );

  const filteredTickets = useMemo(
    () => MOCK_TICKETS.filter((t) => textMatches(q, t.id, t.subject, t.label, t.status)),
    [q]
  );

  const websiteLabel = NEXTGEN_WEBSITE.replace(/^https:\/\//, "");

  return (
    <div className="support-page">
      <div className="support-layout">
        <div className="support-main">
          <header className="support-hero">
            <h1 className="support-hero-title">How can we help you today?</h1>
            <p className="support-hero-lead">
              Search articles and FAQs from the top bar, browse topics below, or start a WhatsApp
              chat with <strong style={{ color: "var(--color-text)" }}>{NEXTGEN_DIGITAL_SERVICE}</strong>{" "}
              for help with your admin console.
            </p>
          </header>

          {q && (filteredCategories.length === 0 || filteredTickets.length === 0) && (
            <p className="support-empty-filter" role="status">
              No results for &quot;{supportSearch.trim()}&quot;. Try another keyword or clear the search.
            </p>
          )}

          <div className="support-help-grid" aria-label="Help topics">
            {filteredCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <article key={cat.id} className="support-help-card">
                  <div className="support-help-card-icon" aria-hidden="true">
                    <Icon />
                  </div>
                  <h3>{cat.title}</h3>
                  <p>{cat.desc}</p>
                  <a
                    href="#browse"
                    className="support-help-card-link"
                    onClick={(e) => e.preventDefault()}
                  >
                    Browse articles
                    <span aria-hidden="true">→</span>
                  </a>
                </article>
              );
            })}
          </div>

          <section className="support-tickets" aria-labelledby="support-tickets-heading">
            <div className="support-section-head">
              <h2 id="support-tickets-heading">Recent support tickets</h2>
              <a href="#tickets" onClick={(e) => e.preventDefault()}>
                View all tickets
              </a>
            </div>

            {filteredTickets.length === 0 ? (
              <p className="ds-hint">No tickets match your search.</p>
            ) : (
              <div className="data-panel">
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Ticket ID</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Last update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.map((row) => (
                        <tr key={row.id}>
                          <td data-label="Ticket ID">
                            <span className="cell-order-id">#{row.id}</span>
                          </td>
                          <td data-label="Subject">{row.subject}</td>
                          <td data-label="Status">
                            <span className={ticketPillClass(row.status)}>{row.label}</span>
                          </td>
                          <td data-label="Last update">{row.updated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="support-aside" aria-label="Contact and status">
          <div className="support-side-card">
            <div className="support-side-card-header">
              <IconChatCard />
              <h3>Live chat</h3>
            </div>
            <p>
              Chat with <strong>{NEXTGEN_DIGITAL_SERVICE}</strong> on WhatsApp ({SUPPORT_PHONE_DISPLAY}
              ). Typical responses are quickest during business hours.
            </p>
            <a
              className="btn btn-primary"
              href={whatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconWhatsApp />
              Chat on WhatsApp
            </a>
            <span className="support-partner-tag">
              Partner: <strong>{NEXTGEN_DIGITAL_SERVICE}</strong> ·{" "}
              <a href={NEXTGEN_WEBSITE} target="_blank" rel="noopener noreferrer">
                Visit website
              </a>
            </span>
          </div>

          <div className="support-side-card">
            <div className="support-side-card-header">
              <IconChannels />
              <h3>Direct channels</h3>
            </div>
            <dl className="support-channel-list">
              <div>
                <dt>Phone</dt>
                <dd>
                  <a className="support-phone" href={`tel:+${SUPPORT_PHONE_E164}`}>
                    {SUPPORT_PHONE_DISPLAY}
                  </a>
                </dd>
              </div>
              <div>
                <dt>Website</dt>
                <dd>
                  <a href={NEXTGEN_WEBSITE} target="_blank" rel="noopener noreferrer">
                    {websiteLabel}
                  </a>
                </dd>
              </div>
              <div>
                <dt>WhatsApp</dt>
                <dd>
                  <a href={whatsAppHref} target="_blank" rel="noopener noreferrer">
                    Message {NEXTGEN_DIGITAL_SERVICE}
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <div className="support-emergency" role="note">
            <IconAlert aria-hidden="true" />
            <div>
              <h4>System emergency</h4>
              <p>
                If POS or orders are completely down, use WhatsApp for the fastest escalation and
                mention &quot;Emergency&quot; in your first message.
              </p>
            </div>
          </div>

          <div className="support-network">
            <div className="support-network-visual" aria-hidden="true" />
            <div className="support-network-body">
              <strong>Console status</strong>
              <div className="support-network-stats">
                <span>Services: operational</span>
                <span>Region: IN</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <a
        className="support-fab"
        href={whatsAppHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open WhatsApp chat with ${NEXTGEN_DIGITAL_SERVICE}`}
      >
        <IconWhatsApp />
      </a>
    </div>
  );
}
