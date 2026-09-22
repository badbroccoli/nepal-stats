# Nepal One-Stop Metrics Catalog

Expanded metric inventory so the dashboard becomes a **single destination for understanding Nepal** — not only demography and disasters. Inspired by Worldometers, Trading Economics country pages, National Data Portal Nepal (`nationaldata.gov.np`), World Bank Nepal Fiscal Dashboard, NRB macro releases, and sector MIS reports (NTA, MoHP, CEHRD, NTB).

**Freshness legend:** `RT` = minutes · `NR` = near-real (hours–day) · `P` = periodic (month/quarter/year) · `E` = estimated ticker from official rates

---

## Information architecture (site sections)

```text
Home (National pulse)
├── People & Society
├── Economy & Markets
├── Government & Public Finance
├── Health
├── Education
├── Energy & Infrastructure
├── Environment & Climate
├── Disasters & Safety          ← already in core plan
├── Tourism & Culture
├── Connectivity & Digital
├── Transport & Mobility
├── Agriculture & Food
├── Labor & Migration
├── Places (map drill-down)
└── News & Calendar
```

Each section gets: national KPI strip → trend charts → province/district map layer → source + as-of stamp.

---

## A. People & Society *(Worldometers-style)*

| Metric | Why it belongs | Typical source | Freshness |
|--------|----------------|----------------|-----------|
| Population (national + by province/district/local) | Core identity KPI | NSO / NPHC 2021 + estimate model | E / P |
| Births / deaths (registered + crude rates) | Vital statistics | National Data Portal, MoHA CRS, UN WPP | P / E |
| Households, average household size | Living arrangements | NPHC | P |
| Sex ratio, age pyramid, dependency ratio | Demography story | NPHC / NSO | P |
| Urban vs rural / urbanization % | Development lens | NPHC, World Bank | P |
| Literacy rate (15+) | Human capital | NPHC, education flash reports | P |
| Life expectancy | Health outcome | UN WPP, MoHP | P |
| HDI / MPI (multidimensional poverty) | Wellbeing composite | UNDP Nepal, NSO | P |
| Religion / language / caste-ethnicity shares *(optional, careful UX)* | Cultural census slices | NPHC tables | P |
| Social security coverage | Welfare | National Data Portal / MoLESS | P |
| Marriage / divorce registrations | Civil registration | National Data Portal | P |

**UI ideas:** live population counter (labeled estimated), age pyramid, district choropleth for density.

---

## B. Economy & Markets *(Trading Economics–style)*

| Metric | Why it belongs | Typical source | Freshness |
|--------|----------------|----------------|-----------|
| GDP / GDP growth / GDP per capita | Headline economy | NSO, MoF `data.mof.gov.np`, World Bank, IMF | P |
| Inflation (CPI headline + food) | Cost of living | NRB monthly macro, MoF | NR / P |
| NPR FX vs USD/INR/EUR/CNY | Everyday finance | NRB Forex API | NR |
| Gross FX reserves + import cover (months) | Macro stability | NRB current macro situation | P |
| Remittance inflows (NPR + USD) | Nepal’s economic backbone | NRB | P |
| Current account / BoP | External balance | NRB | P |
| Exports / imports / trade balance | Trade pulse | NRB, DoC / Customs | P |
| Bank interest rates / base rate | Credit conditions | NRB | P |
| NEPSE index + turnover + gainers/losers | Markets | NEPSE / community APIs (e.g. nepseapi.com) — verify ToS | RT / NR |
| Gold/silver local prices *(if feed exists)* | Household store of value | Local market aggregators / NRB | NR |
| Unemployment / labor force participation | Jobs | Labor Force Survey (NSO) | P |
| Informal economy share *(estimate)* | Context | ILO / research | P |

**UI ideas:** “Nepal markets bar” (NEPSE + USD/NPR + CPI yoY + remittance MTD), sparkline strip like Trading Economics.

---

## C. Government & Public Finance *(World Bank Fiscal Dashboard–style)*

| Metric | Why it belongs | Typical source | Freshness |
|--------|----------------|----------------|-----------|
| Federal budget: revenue vs expenditure YTD | Fiscal pulse | MoF, FCGO, World Bank Nepal Fiscal Dashboard | P |
| Tax revenue composition (VAT, customs, income) | Who pays | MoF / IRD summaries | P |
| Inter-governmental transfers (federal → province/local) | Federalism story | WB Fiscal Dashboard, FCGO | P |
| Provincial & local spending profiles | Drill-down finance | Provincial budget speeches, FCGO | P |
| Public debt / deficit | Sustainability | MoF, NRB | P |
| Capital vs recurrent spending | Development vs ops | MoF | P |
| Procurement / Hello Sarkar performance *(transparency)* | Governance | National Data Portal | P |
| Election results / turnout *(module)* | Political calendar | election.gov.np | Event-driven |

**UI ideas:** sankey of transfers; province fiscal capacity map.

---

## D. Health

| Metric | Why it belongs | Typical source | Freshness |
|--------|----------------|----------------|-----------|
| Health facilities count (hospital/PHCC/HP) | Access | MoHP / National Data Portal | P |
| Doctors / nurses per 10k population | Workforce | MoHP | P |
| Maternal mortality, under-5 mortality, fertility | Outcomes | MoHP, DHS, National Data Portal | P |
| Child malnutrition (stunting/wasting) | Nutrition | NDHS / MoHP | P |
| Disease prevalence (new cases by selected notifiable diseases) | Surveillance | MoHP HMIS / EWARS | NR / P |
| Immunization coverage | Prevention | MoHP | P |
| Family planning indicators | Reproductive health | MoHP | P |
| COVID / outbreak situation *(when relevant)* | Crisis mode | MoHP sitreps | NR |
| Bed occupancy / ambulance *(aspirational)* | Ops | Provincial health directorates | — |

**UI ideas:** health facility density map; outbreak alert banner when EWARS spikes.

---

## E. Education

| Metric | Why it belongs | Typical source | Freshness |
|--------|----------------|----------------|-----------|
| Schools / ECE centers count | Supply | CEHRD IEMIS / Flash reports | P |
| Enrollment by level (ECE, basic, secondary) | Access | IEMIS Flash | P |
| Gender parity index | Equity | IEMIS | P |
| Net/gross enrollment, repetition, dropout | Efficiency | IEMIS | P |
| Student–teacher ratio | Quality proxy | IEMIS | P |
| SEE / Grade 12 pass rates | Outcomes | NEB / MoEST releases | Seasonal |
| Higher education enrollment | Pipeline | UGC / MoEST | P |
| Outbound education spending (travel/education payments) | Brain-drain $ | NRB services account | P |

**UI ideas:** district enrollment choropleth; annual flash-report timeline.

---

## F. Energy & Infrastructure

| Metric | Why it belongs | Typical source | Freshness |
|--------|----------------|----------------|-----------|
| Installed capacity (hydro / solar / thermal) | Power mix | NEA annual reports, DoED | P |
| Peak demand / energy generation / export–import | Grid pulse | NEA | P / NR |
| Electrification / access to electricity % | Development | NEA, World Bank | P |
| Scheduled load-shedding / outage notices *(if structured)* | Citizen utility | NEA notices (hard to automate) | NR |
| Petroleum imports / fuel prices | Cost of energy | NOC price notices | NR |
| Road network length (strategic / local) | Connectivity | DoR / National Data Portal | P |
| Drinking water access / sanitation | Utilities | NMIP / National Data Portal | P |
| Internet backbone / international bandwidth | Digital infra | NTA MIS | P |

**UI ideas:** energy mix donut; “power & fuel” card next to FX.

---

## G. Environment & Climate

| Metric | Why it belongs | Typical source | Freshness |
|--------|----------------|----------------|-----------|
| Air quality (AQI / PM2.5) major cities | Daily livability | WAQI / OpenAQ; NHRC stations | RT |
| Forest cover / deforestation | Landscape | DoFSC, Global Forest Watch | P |
| CO₂ / GHG emissions | Climate | World Bank, CAIT | P |
| Glacier / snow / temperature anomalies | Himalayan risk | DHM, research feeds | P |
| Rainfall vs normal | Monsoon tracker | DHM / BIPAD realtime | NR |
| River water levels / flood risk stations | Hazard prep | BIPAD hydrology | RT / NR |
| Protected areas / biodiversity count | Conservation | DNPWC / LocalBoundaries PA layer | P |
| Waste / plastic *(if data)* | Urban env | Municipal / research | P |

**UI ideas:** AQI chips on map for KTM/Pokhara/Biratnagar; monsoon anomaly chart.

---

## H. Disasters & Safety *(core plan — keep)*

Earthquakes (USGS), BIPAD incidents, damage & loss, rainfall/river alerts, fire hotspots, landslide seasonality. Add **crime / traffic accident** summaries if Nepal Police publishes structured open data.

---

## I. Tourism & Culture

| Metric | Why it belongs | Typical source | Freshness |
|--------|----------------|----------------|-----------|
| International tourist arrivals (monthly) | Flagship sector | Nepal Tourism Board / MoCTCA | P |
| Arrivals by nationality / region | Markets | NTB | P |
| Hotel / homestay / trekking route inventory | Supply | National Data Portal | P |
| Travel income (BoP) | Earnings | NRB | P |
| Peak season occupancy proxies | Ops | Industry reports | P |
| UNESCO / cultural sites visits *(if published)* | Heritage | DoA / site offices | P |
| Mountaineering / climbing permits | Niche prestige | MoCTCA / NMA | Seasonal |

**UI ideas:** arrivals sparkline + top-5 source countries; tourism layer on map (spots/routes).

---

## J. Connectivity & Digital

| Metric | Why it belongs | Typical source | Freshness |
|--------|----------------|----------------|-----------|
| Mobile subscriptions & penetration | Reach | NTA MIS | P |
| Broadband subscriptions (fixed + mobile) | Digital access | NTA | P |
| Operator market share (NTC / Ncell / ISPs) | Competition | NTA | P |
| International bandwidth | Capacity | NTA | P |
| Social media / internet users *(modeled)* | Society | DataReportal / ITU | P |
| Gov digital services uptake *(if open)* | e-governance | NITC / Hello Sarkar | P |

---

## K. Transport & Mobility

| Metric | Why it belongs | Typical source | Freshness |
|--------|----------------|----------------|-----------|
| Vehicle registrations (by type, EV share) | Mobility transition | DoTM | P |
| EV vs ICE new registrations | Green shift | DoTM policy releases | P |
| Road accidents / fatalities | Safety | Nepal Police / DoTM | P |
| Domestic air passengers / flights | Aviation | CAAN | P |
| Cross-border trade traffic proxies | Corridors | Customs / DoR | P |
| Public transport routes *(Kathmandu)* | Urban | Local open data / OSM | P |

---

## L. Agriculture & Food

| Metric | Why it belongs | Typical source | Freshness |
|--------|----------------|----------------|-----------|
| Area / production of paddy, maize, wheat | Food security | MoALD / NSO agriculture census | P |
| Fertilizer / seed distribution | Inputs | MoALD | P |
| Livestock counts | Rural economy | MoALD | P |
| Food price index / selected commodity prices | Kitchen inflation | NRB CPI breakdown, Kalimati prices | NR / P |
| Irrigation coverage | Resilience | DoWRI / MoALD | P |

**UI ideas:** “Kitchen prices” card (rice, oil, vegetables) — high citizen engagement.

---

## M. Labor & Migration

| Metric | Why it belongs | Typical source | Freshness |
|--------|----------------|----------------|-----------|
| Labor approvals / migrant workers outflow | Migration pulse | DoFE / MoLESS | P |
| Destination-country mix (Gulf, Malaysia, etc.) | Diaspora map | DoFE | P |
| Remittance (already in Economy) | Link migration → money | NRB | P |
| Returnee / reintegration stats | Shock absorber | MoLESS | P |
| Foreign employment complaints | Worker protection | DoFE | P |
| Internal migration / absent population | Census dynamics | NPHC | P |

---

## N. Places — map layers beyond admin stats

Toggle layers on the same Nepal map:

1. Population density  
2. Multidimensional poverty / HDI proxy  
3. Tourist arrivals gravity (district)  
4. AQI stations  
5. Disaster incidents (30d)  
6. Health facility density  
7. School density  
8. Hydropower projects / transmission  
9. Road / airport network (OSM)  
10. Protected areas  

---

## O. News, calendar & “today in Nepal”

| Module | Content |
|--------|---------|
| Live news rail | Existing RSS aggregator |
| Economic calendar | NRB/MoF release dates, CPI day, budget day |
| Holiday calendar | Nepal sambat / public holidays |
| Weather outlook | DHM summary + BIPAD alerts |
| Sports pulse *(optional)* | Cricket/national team results via public APIs — engagement, not core stats |
| “On this day” census/history facts | Editorial, low priority |

---

## Prioritization for a one-stop MVP → v2 → v3

### Ship first (high value + feasible feeds)

1. People (pop, age structure, density map)  
2. Economy pulse (FX, CPI, remittance, reserves, trade)  
3. Disasters + AQI  
4. News  
5. Tourism arrivals (monthly)  
6. NEPSE headline index *(if lawful API)*  

### Phase v2 (strong “one-stop” feel)

7. Health facilities + key MoHP indicators  
8. Education flash enrollment  
9. NTA mobile/broadband penetration  
10. Public finance (MoF / FCGO / WB fiscal)  
11. Kitchen/commodity prices  

### Phase v3 (depth & delight)

12. Energy generation mix + fuel prices  
13. Migration / DoFE outflows  
14. Agriculture production  
15. Transport / EV registrations  
16. Full local-level drill for all major metrics  
17. Personalization (“My district” home widgets)

---

## Benchmarks — what similar sites show

| Site pattern | Steal this idea for Nepal |
|--------------|---------------------------|
| **Worldometers** | Big animated counters + society/energy/environment blocks; always cite methodology |
| **Trading Economics** | Country overview strip: GDP, inflation, rate, unemployment, balance of trade |
| **National Data Portal Nepal** | Domain IA already mirrors GoN: health, tourism, water/energy, social security, civil registration |
| **World Bank Nepal Fiscal Dashboard** | Federal/provincial/local money flows — unique Nepal federalism angle |
| **Our World in Data** | Long charts + explainers; good for literacy, emissions, vaccines |
| **COVID country hubs (legacy)** | Crisis switch: one banner mode that reorders KPIs during floods/quakes/epidemics |

---

## Product principle

> Every card answers: **What is happening in Nepal right now, and how does my province/district compare?**  
> Prefer **citizen-facing metrics** (prices, AQI, remittance, arrivals, disasters) over obscure statistical abstracts — but keep the abstracts one click away for researchers.

---

## Source hubs to wire repeatedly

| Hub | URL | Role |
|-----|-----|------|
| National Data Portal | https://nationaldata.gov.np/ | Cross-ministry indicator catalog |
| Open Data Nepal | https://opendatanepal.com/ | Community + API datasets |
| NSO CKAN | https://data.nsonepal.gov.np/ | Official micro/macro tables |
| MoF data | http://data.mof.gov.np/ | Real/monetary/external sector charts |
| NRB | https://www.nrb.org.np/ | Macro PDF + Forex API |
| BIPAD | https://bipadportal.gov.np/ | Disasters + realtime env |
| World Bank | APIs + Nepal Fiscal Dashboard | International comparable series |
