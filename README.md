# Akuafo Market

**Source produce with confidence.**

Akuafo Market is a B2B agricultural marketplace that connects producers across Ghana with the businesses that source from them: wholesalers, retailers, restaurants, food processors and institutional buyers. Buyers can see live quantities, prices, grades and harvest windows before committing, then place a request and follow it from farm to destination.

This is a working prototype populated with representative marketplace records, designed and built by Osman Limam (KNUST, Kumasi, Ghana).

## Who it is for

**Buyers** source produce at wholesale scale. They browse and search live supply, compare prices and quantities, place non-binding requests, and track each order through a documented farm-to-buyer journey.

**Suppliers** list what they have. Farmers, cooperatives and aggregators publish available lots with quantity, grade and price, receive requests from businesses, and manage fulfilment from one dashboard.

## Core features

- Search-first marketplace with filters for commodity, region, quantity, price, quality grade, delivery availability and verified suppliers
- List and map views; the map shows supply across a recognisable Ghana outline with real supplier locations
- Supply detail pages with lot codes, harvest windows, supplier track records and live availability
- Interactive supply meter showing available, requested and remaining quantities
- Four-step request flow (quantity, delivery, destination, review) with quantity reservation
- Order tracking with a six-step timeline and a route map showing progress in transit
- Buyer dashboard: active orders, monthly spend, spend-by-commodity, six-month spend chart, average purchase prices, supplier performance
- Supplier dashboard: available inventory, incoming requests with one-click confirmation, active listings
- Account management: profile, password change, notification preferences, saved produce and suppliers
- Email and password authentication with separate buyer and supplier onboarding
- Light and dark themes, fully responsive from 375px to desktop

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router) with TypeScript and React 19
- [Tailwind CSS 4](https://tailwindcss.com/) with shadcn/ui components
- [Prisma ORM](https://www.prisma.io/) on PostgreSQL ([Neon](https://neon.tech))
- [Zustand](https://zustand.docs.pmnd.rs/) for state, [TanStack Query](https://tanstack.com/query) for data fetching
- [Framer Motion](https://motion.dev/) for motion, [Lucide](https://lucide.dev/) for icons
- Typography: Fraunces (display), DM Sans (UI), IBM Plex Mono (data)

## Local development

Requirements: [Node.js 20+](https://nodejs.org/) or [Bun](https://bun.sh), and a PostgreSQL database (a free Neon project works well).

```bash
# 1. Install dependencies
bun install        # or npm install

# 2. Configure the database
cp .env.example .env
#    then edit .env and set DATABASE_URL to your PostgreSQL connection string

# 3. Create the tables and seed representative data
bun run db:push
bun run db:seed

# 4. Start the dev server
bun run dev        # or npm run dev
```

Open http://localhost:3000.

Two demo accounts are created by the seed script (password `market123` for both):

| Role | Email |
| --- | --- |
| Buyer | ama@accrafresh.com |
| Supplier | akwasi@akwasifarms.com |

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma (see `.env.example`) |

That is the only required variable. Authentication uses signed session tokens stored in the database, so no third-party auth secrets are needed.

## Testing

- `bun run lint` runs ESLint over the project
- `bunx tsc --noEmit` runs the TypeScript compiler check
- The application was verified end to end in a real browser: landing, search, filters, map, produce detail, request flow, order tracking, both dashboards, authentication for both roles, empty, loading and error states, mobile widths from 375px, and both themes

## Production build

```bash
bun run build     # or npm run build
```

## Deploying to Vercel

1. Push this repository to GitHub
2. In Vercel, choose **Add New Project** and import the repository
3. Vercel detects Next.js automatically; keep the default build settings (`next build`)
4. Add the environment variable `DATABASE_URL` with your Neon pooled connection string (Production, Preview and Development)
5. Deploy
6. After the first deploy, run the schema push and seed once from your machine against the production database:
   ```bash
   DATABASE_URL="<your production Neon URL>" bunx prisma db push
   DATABASE_URL="<your production Neon URL>" bun run db:seed
   ```
   (Skip the seed if you prefer to start with an empty marketplace.)
7. Visit the deployment URL and walk the golden path: search, open a lot, place a request, track the order

Note: in development the app runs with `next dev`; in production Vercel runs the standard `next build` output. No other configuration differs.

## Known limitations

- Email delivery is not implemented. Password reset returns the reset link directly in the API response instead of sending an email, which is fine for a prototype but must be replaced before real production use.
- Payments are not processed. Requests are non-binding; fulfilment and payment happen directly between buyer and supplier.
- Supplier verification is represented in data but no verification workflow exists yet.
- Representative seed records stand in for real marketplace activity.

## Future improvements

- Email and SMS notifications, and phone/OTP sign-in
- Payment integration (mobile money is the natural fit for Ghana)
- Supplier verification workflow with document uploads
- In-app messaging between buyer and supplier
- Live price history and commodity trend charts

## Contact

Osman Limam, KNUST, Kumasi, Ghana. [osmanlimam083@gmail.com](mailto:osmanlimam083@gmail.com), +233 53 682 8150.
