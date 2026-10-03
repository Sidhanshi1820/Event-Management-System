Implement the 3 chosen frontend upgrade packages (Booking upgrade, Events upgrade, Trust extras). ~6 parallel agents (disjoint file ownership) + my sweeps, then verification and push.

## 1. Booking upgrade — contact.html (agent A1)
- Convert the single form into a **3-step wizard with progress bar**:
  - Step 1 "Event": event type + event date + event time + guests
  - Step 2 "Your Details": full name, company, email, phone
  - Step 3 "Review & Submit": Event Details textarea + summary of entered data + live estimate
- Per-step validation before "Next"; Back button; progress bar (3 segments, filled = accent, labels Event/Details/Confirm)
- **Live price estimator**: on page load fetch `GET /api/events` and populate the Event Type dropdown dynamically from the DB (keeps static options as fallback); when event type + guests are chosen, show "**Estimated from ₹X**" where X = startingPrice + guests × 850 (₹850/plate catering add-on from the services data) + note "Final quote after our team reviews your request"
- Submit payload unchanged (POST /api/proposals; `guests` now sent as Number) — backend already validates
- Step transitions animate (fade/slide); Enter key advances steps safely

## 2. Events upgrade — events.html + NEW event.html (agents A2, A3)
**events.html (A2):**
- Category filter chips above the grid: "All" + one chip per unique category from the DB data; clicking filters cards instantly
- Sort dropdown: Recommended (sortOrder) / Price: Low→High / Price: High→Low / Rating
- Filter + sort compose with the existing search box (single render function)
- Each card gets a "View details →" link to `event.html?slug=<slug>`

**NEW event.html (A3):**
- Detail page driven by `GET /api/events` + `?slug=` param: big hero (icon in accent circle, title, category chip, ★rating (reviews)), "Starting from ₹X" price block, description, standard "What's included" list (venue sourcing, end-to-end coordination, vendor management, on-site team, post-event report), two CTAs: "Book this event" → `contact.html?event=<title>` and "Back to all events"
- Unknown slug → redirect to events.html; same head/style conventions + favicon + footer year

**contact.html prefill (A1 also):** on load, read `?event=` and pre-select the matching event type in the dropdown

## 3. Trust extras (agents A4, A6 + my sweep)
**Backend (A4):** NEW `models/Newsletter.js` (email unique, subscribedAt) + NEW `routes/newsletter.js` (`POST /api/newsletter` {email} — validated, rate-limited by the global limiter, duplicate → 400 'Already subscribed') + mounted in server.js
**home.html (A6):** client logos strip after the trust stats ("Trusted by teams at" + 5 styled text marks: TechNova, FinEdge, Zenith Group, Acme Corp, Vertex Labs) + newsletter email form in the footer (wired to the new API with classList-safe messages)
**NEW widgets.js (A5):** injects a floating WhatsApp button (bottom-right, green circle, WhatsApp SVG, link `https://wa.me/<number>?text=...`) with `const WHATSAPP_NUMBER = '919876543210'; // ← replace with your real number` at the top
**My sweep (after agents):** add `<script src="widgets.js"></script>` to home, events, about, services, get-started pages

## Verification (me)
1. `npm test` (jest still 61/61) + `node --check` all backend files
2. Browser E2E: wizard steps + validation + estimator math + submit → MongoDB; filters/sort/search; detail page + prefill; newsletter POST → DB; WhatsApp button
3. Screenshots of the wizard, estimator, filters, detail page
4. Commit + push to GitHub

Notes: WhatsApp number is a documented placeholder you can swap in widgets.js; the ₹850/plate estimator coefficient is an approximation clearly labeled on the page.