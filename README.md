# FinPilot AI

FinPilot AI este o aplicație web de contabilitate asistată de inteligență artificială, concepută pentru întreprinderile mici și mijlocii din Republica Moldova. Scopul aplicației este să transforme documentele financiare în înregistrări contabile verificabile, păstrând controlul uman asupra validării și aprobării finale.

Aplicația urmărește un principiu simplu: inteligența artificială poate extrage, clasifica și propune, dar o operațiune contabilă importantă trebuie să rămână explicabilă, trasabilă și aprobată înainte de înregistrarea definitivă.

## Ce probleme rezolvă

În activitatea contabilă, datele provin din facturi, bonuri, extrase bancare și alte documente care trebuie prelucrate manual. Acest proces consumă timp și poate produce erori greu de identificat.

FinPilot AI este proiectat să ofere:

- încărcarea și organizarea documentelor financiare;
- extragerea automată a câmpurilor prin OCR și modele AI;
- identificarea furnizorilor, sumelor, TVA-ului și datelor documentelor;
- validarea deterministă a totalurilor și a câmpurilor obligatorii;
- propunerea înregistrărilor contabile pe baza politicilor companiei;
- aprobarea umană înainte de postarea în registrul contabil;
- urmărirea fiecărei operațiuni printr-un jurnal de audit;
- răspunsuri explicabile despre situația financiară, bazate pe documente și înregistrări verificate.

## Modulele aplicației

### Panou de control

Panoul de control va prezenta veniturile, cheltuielile, fluxul de numerar, documentele procesate și elementele care necesită atenție. În starea actuală sunt afișate valori goale până la conectarea surselor reale de date.

### Documente

Modulul de documente este destinat încărcării, procesării și revizuirii facturilor, bonurilor, extraselor bancare și altor documente justificative. Încărcarea în Supabase Storage și procesarea OCR urmează să fie conectate.

### Registru contabil

Registrul va conține înregistrările contabile aprobate, liniile de debit și credit, documentul sursă și persoana care a aprobat operațiunea. Schema bazei de date verifică faptul că fiecare linie conține debit sau credit, dar nu ambele simultan.

### FinPilot Copilot

Copilot este interfața conversațională a aplicației. El va răspunde la întrebări despre cheltuieli, facturi, plăți și registrul contabil. Răspunsurile numerice trebuie calculate din datele stocate, iar sursele folosite trebuie afișate utilizatorului.

### Setări

Aplicația folosește un singur spațiu de lucru personal. Utilizatorul își poate configura profilul companiei, moneda de bază, anul fiscal, planul de conturi și politicile de automatizare. Nu există organizații, membri sau roluri separate.

## Starea actuală

În prezent sunt implementate:

- interfața aplicației în Next.js;
- autentificarea cu email și parolă prin Supabase Auth;
- clienți Supabase separați pentru browser și server;
- sesiuni SSR bazate pe cookie-uri;
- actualizarea sesiunilor prin Next.js Proxy;
- protejarea paginilor de lucru și a endpointurilor API;
- stări goale pentru panoul de control, documente, registru și Copilot;
- validarea cererilor API cu Zod;
- migrarea inițială pentru baza de date Supabase;
- un bucket privat Supabase Storage pentru documentele originale;
- politici RLS prin care utilizatorul autentificat accesează doar propriile date.

Proiectul nu conține utilizatori demonstrativi, parole demonstrative, companii fictive, documente contabile fictive sau valori financiare prestabilite.

## Arhitectură

```text
Browser
   │
   ├── Next.js App Router
   │      ├── pagini și componente React
   │      ├── Route Handlers API
   │      └── Proxy pentru actualizarea sesiunii
   │
   └── Supabase
          ├── Auth
          ├── PostgreSQL
          ├── Row Level Security
          └── Storage — bucket privat pentru documente
```

## Tehnologii

- Next.js 16 cu App Router;
- React 19;
- TypeScript;
- Tailwind CSS 4;
- Supabase Auth și PostgreSQL;
- `@supabase/ssr` pentru sesiuni pe server;
- Zod pentru validarea datelor de intrare;
- Lucide React pentru pictograme;
- ESLint pentru verificarea codului.

## Structura principală

```text
src/
  app/                         Pagini și endpointuri API
  components/                  Componente comune ale interfeței
  features/                    Module funcționale
  types/                       Tipuri TypeScript ale domeniului
  utils/supabase/              Clienți Supabase pentru browser și server
  proxy.ts                     Actualizarea sesiunilor Supabase

supabase/
  migrations/                  Schema PostgreSQL și politicile RLS
```

## Modelul inițial de date

Migrarea din `supabase/migrations` definește următoarele entități:

- `profiles` — profilul utilizatorului și datele companiei;
- `app_settings` — preferințele de automatizare și notificări;
- `documents` — metadatele documentelor încărcate;
- `document_extractions` — rezultatele extragerii OCR/AI;
- `accounts` — planul de conturi al utilizatorului;
- `ledger_entries` — antetele înregistrărilor contabile;
- `ledger_lines` — liniile de debit și credit;
- `audit_events` — istoricul acțiunilor importante.

Fiecare tabel operațional conține `user_id`. Nu există roluri sau drepturi diferențiate: utilizatorul autentificat administrează propriul spațiu de lucru, iar RLS împiedică accesul la datele altui cont. Fișierele sunt păstrate în bucketul privat `documents`, în directorul identificat prin ID-ul utilizatorului.

## Securitate

- Accesul la spațiul de lucru necesită o sesiune Supabase validă.
- Endpointurile financiare răspund cu `401 Unauthorized` pentru utilizatorii neautentificați.
- Toate tabelele expuse folosesc Row Level Security.
- Un utilizator poate vedea și modifica doar propriile date.
- Nu există separare pe roluri; controlul accesului se bazează exclusiv pe proprietarul datelor.
- Cheile privilegiate Supabase nu trebuie expuse în browser.
- Fișierul `.env.local` este exclus din Git.

Migrațiile sunt aplicate proiectului Supabase configurat, iar schema locală din `supabase/migrations` corespunde istoricului remote.

## Configurarea mediului

Copiază variabilele necesare într-un fișier `.env.local` aflat în rădăcina proiectului:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://proiectul-tau.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=cheia-publicabila
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Nu adăuga în repository chei secrete, parole ale bazei de date sau cheia Supabase `service_role`.

## Pornire locală

Este necesară o versiune modernă de Node.js și npm.

```bash
npm install
npm run dev
```

Aplicația va fi disponibilă la:

```text
http://localhost:3000
```

## Comenzi disponibile

```bash
npm run dev      # pornește serverul de dezvoltare
npm run build    # creează versiunea de producție
npm run start    # pornește versiunea de producție
npm run lint     # verifică regulile ESLint
```

## API

### Autentificare

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "utilizator@companie.md",
  "password": "parola-utilizatorului"
}
```

Autentificarea este efectuată prin Supabase Auth. Endpointul nu mai conține credențiale fixe.

### Rezumat financiar

```http
GET /api/v1/analytics/summary
```

Endpointul necesită autentificare. Până la conectarea tabelelor financiare, răspunsul conține valori zero.

### Copilot

```http
POST /api/v1/copilot/query
Content-Type: application/json

{
  "query": "Care sunt cheltuielile perioadei curente?"
}
```

Endpointul necesită autentificare. Până la conectarea registrului contabil, răspunsul indică faptul că sursa de date nu este configurată.

## Principii de dezvoltare

- Nicio valoare financiară nu trebuie inventată de interfață sau de modelul AI.
- Datele calculate trebuie să provină din înregistrări verificate.
- Fiecare răspuns financiar trebuie să poată indica sursa.
- Înregistrările contabile trebuie validate înainte de postare.
- Acțiunile importante trebuie păstrate în jurnalul de audit.
- Datele fiecărui utilizator trebuie izolate la nivelul bazei de date.
- Migrațiile nu trebuie să conțină date demonstrative sau credențiale.

## Următorii pași

1. Conectarea listei de documente la PostgreSQL.
2. Implementarea încărcării și verificării fișierelor în bucketul privat.
3. Conectarea unui serviciu OCR/vision.
4. Implementarea regulilor contabile și a fluxului de aprobare.
5. Calcularea indicatorilor financiari din registrul real.
6. Conectarea Copilot la sursele verificate.
7. Adăugarea testelor automate și a monitorizării.

## Verificarea proiectului

Înainte de commit sau deployment rulează:

```bash
npm run lint
npm run build
```

Ambele comenzi trebuie să se finalizeze fără erori.
