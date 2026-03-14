# 90-Day Validation Plan
## VinDex — Vehicle Identity & Secondary Market Trust Layer

*Internal Founder Document — Not for distribution*
*Version: 2.0*
*Derived from: context-pack.md v0.3 | document-architecture.md v0.2 | vision-and-thesis.md v2.0 | incentive-and-adoption-model.md v3.0 | signal-and-trust-model.md v2.0 | business-model-and-monetization.md v3.0 | work/verifiers/context.md | work/verifiers/decisions.md*

---

## 1. Purpose of This Document

This plan exists to prevent idea drift.

The previous documents establish a coherent thesis, an adoption logic, a signal model, and a business model. None of that matters if the behavioral assumptions underlying them are wrong. This plan operationalizes the discipline of testing whether they are right — before committing significant resources to infrastructure built on unvalidated assumptions.

The verifier-first pivot (see work/verifiers/context.md and work/verifiers/decisions.md) repositions the validation target: the critical behavioral assumptions are now about inspectors, not workshops. The tool value proposition is different (a better report generator, not a CRM), the adoption friction profile is different (tool for existing work vs. workflow change), and the artifact that propagates recognition is different (verified inspection link vs. service certificate).

The 90-day window is not about building the product. It is about answering the hardest feasibility questions using the minimum viable evidence.

The standard for this period is not "does this feel promising?" It is: **"Is there structural evidence that the inspector adoption model is viable, that the tool produces a genuinely superior deliverable, and that the verified artifact generates engagement beyond the inspector's immediate client?"**

If the answer is no, this document defines the conditions under which the project must be killed or fundamentally restructured.

---

## 2. The Hypotheses

These are the foundational behavioral assumptions on which the verifier-first architecture rests. Each one is a point of failure.

### H1 — Inspector Tool Value Is Real

**Statement:** Inspectors perceive the report generator as a genuine improvement over their current method — faster, more professional, or both. The tool produces a deliverable that the inspector considers superior to their existing Word/PDF template, Google Doc, or ad-hoc report format.

**Why it matters:** The entire Phase 1 strategy rests on tool value, not network value. If the tool is not genuinely better than what inspectors use today, the foundational adoption mechanism fails. Unlike the workshop model — where operational value came from multiple sources (job registry, dispute protection, differentiation) — the inspector model concentrates on a single proposition: a better tool for the work they already do. That concentration is a strength (clear pitch) and a risk (single point of failure).

**The honest concern:** "Better" is subjective and context-dependent. An inspector with a well-developed personal template may resist switching even if the platform's output is objectively superior. The tool must be better enough to overcome switching inertia — not just marginally different. This must be tested against actual inspector workflows, not assumed from product design.

---

### H2 — Inspector Usage Persists After Initial Adoption

**Statement:** Inspectors who begin using the tool continue using it for subsequent inspections without prompting. The tool becomes their default report generation method, not a one-time experiment.

**Why it matters:** A single verified inspection proves the tool works. Sustained usage is what produces signal density. An inspector who uses the tool once and reverts to their template is a failed experiment, not a validated node.

**The honest concern:** Onboarding motivation and ongoing behavior are different phenomena. An inspector may use the tool to evaluate it, produce one report, and decide their existing method is "good enough." The threshold for switching is not whether the tool is better in isolation — it is whether the improvement is sufficient to justify changing an established workflow. This plan must detect reversion early.

---

### H3 — Verified Links Generate Buyer Engagement

**Statement:** Buyers who receive a verified inspection link — whether directly from an inspector or through a marketplace listing — open it and spend meaningful time on it. The link is treated as a credible information source, not ignored as spam or an unfamiliar artifact.

**Why it matters:** The verified inspection link is the primary distribution mechanism. It is how the signal propagates beyond the inspector-client relationship into the broader market. If buyers do not open the link, or open it and bounce immediately, the artifact has no propagation value — it is a better PDF for the inspector but not a signal-building mechanism for the platform.

**The honest concern:** Buyers in secondary vehicle markets are accustomed to low-quality links, scams, and irrelevant marketing. A link from an unfamiliar platform may be dismissed without engagement regardless of its content. The OpenGraph preview must be compelling enough to generate the click, and the report page must be compelling enough to hold attention.

---

### H4 — Market Values Verification

**Statement:** At least some transactions in the target market show organic demand for verifiable inspection documentation. Buyers and sellers reference documentation, history, or verifiability in real transaction contexts — even without the product's intervention.

**Why it matters:** If the market is genuinely indifferent to inspection documentation — if transactions are entirely relational and informal with no appetite for structured proof — the consumer flywheel cannot spin. The verified inspection link would be valuable to inspectors as a tool but would not generate the market recognition needed for Phase 2 expansion.

**The honest concern:** In informal markets, the premium for documentation may be conceptually endorsed and practically ignored. Interviews and surveys will not detect this. Observed transaction behavior will.

---

### H5 — Inspector Onboarding Is Frictionless

**Statement:** An inspector can complete their first verified inspection report within a single session without requiring dedicated technical support. The tool is intuitive enough that the inspector can set up their template, perform an inspection, and generate a verified report without assistance.

**Why it matters:** Time-to-first-verified-report is a direct friction proxy. If it requires multiple sessions, escalation, or significant support overhead, the model cannot scale even if the value proposition is correct. Inspectors are busy professionals — if the tool is not immediately productive, they will revert to their existing method.

**The honest concern:** "Single session" depends on what "session" means for different inspectors. Some will dedicate focused time to evaluate the tool. Others will attempt it between jobs with fragmented attention. The tool must work for the second type, not just the first.

---

### H6 — Inspector-Workshop Overlap Exists

**Statement:** A meaningful proportion of the inspectors acquired in Phase 1 also operate as workshops — performing vehicle repairs, maintenance, or modifications in addition to inspection services. The boundary between "inspector" and "workshop" is blurry enough in practice that the platform gains a foot in both worlds from Phase 1.

**Why it matters:** The inspector-workshop overlap is the earliest and strongest bridge mechanism to Phase 2. If the overlap is real, the transition from inspectors to workshops is not a separate acquisition challenge — it is a scope expansion within existing users. If the overlap is false — if inspectors and workshops are genuinely distinct populations — the bridge to workshops requires a separate pitch, a separate product adaptation, and a separate validation cycle.

**The honest concern:** The overlap hypothesis is based on market observation, not data. It may be true in some geographies and false in others. It may be true for certain inspector subtypes (mechanics who also do inspections) and false for others (dedicated inspection-only services). This must be probed directly in inspector conversations.

---

## 3. Pre-Build Conversations

Before writing code, structured conversations with market actors resolve open challenges and inform build decisions. These are extracted from the "What Must Be Validated Before Building" sections of each challenge in work/verifiers/decisions.md.

### Inspector Conversations (3–5 inspectors)

These conversations are the most critical pre-build activity. They inform H1, H2, H5, H6, and multiple challenge decisions simultaneously.

**Tool and workflow probe:**
- How do you produce your inspection report today? What tool/template do you use?
- How long does it take to produce a report?
- How do you organize your inspection methodology? What sections, what order, what level of detail?
- What information do you include today vs. what you would include if the tool made it easy?
- Show a mockup of the white-label report — do they perceive it as an upgrade or as a threat to their independence?

**Competition and differentiation probe:**
- Do you feel you compete with less qualified inspectors? How do you differentiate today?
- Would visible metrics (inspection count, detail level, time operating) address the differentiation problem?
- How do you feel about sharing a platform with less qualified competitors?
- What would you consider minimum requirements for someone to be a verifier on the platform?

**Switching and adoption probe:**
- Would a professional report generator with verified links be useful?
- What would make you switch from your current method?
- What would make you NOT switch?

**Workshop overlap probe (H6):**
- Do you also operate as a workshop (repairs, maintenance, modifications)?
- If yes: would you use the same tool for documenting vehicle state on arrival (intake inspection)?
- If no: do you know inspectors who also run workshops?

### Seller Conversations (3–5 recent sellers)

**Pre-sale inspection probe:**
- Did you consider doing a pre-sale inspection? Why or why not?
- If you could include a verified inspection link in your listing, would you? Would you pay for it?
- How much did you sell for? What is the inspection cost as a percentage?

### Buyer Conversations (3–5 recent buyers)

**Inspection and trust probe:**
- Did you pay for an inspection? How much?
- Would you trust an inspection commissioned by the seller if you could verify it independently?
- What would make you trust it? What would make you not trust it?
- Would you leave a review after purchase if the inspection report had a mechanism for it?

### Agency Conversations (1–2 used car agencies)

**Agency service model probe:**
- Do you already offer any type of inspection as part of your service?
- How do you document it?
- Would a verified, shareable inspection report be valuable as part of your package?

---

## 4. Experiments

### Experiment 1 — Inspector Outreach and Tool Pitch

**Objective:** Test whether inspectors in the target market respond positively to the report generator pitch and agree to participate as beta verifiers.

**Method:**
- Direct outreach to 15–20 inspectors in the initial geographic focus area.
- Profile filter: established pre-purchase inspection services, alignment specialists, or mechanics who offer inspection as a distinct service. Must have an existing report production method (however informal).
- Pitch is tool-first: a better report generator that produces professional, verifiable, white-label output. Do not lead with platform, network, or market signal positioning.
- Measure: what proportion agree to try the tool? What objections arise? Where does the pitch fail?

**Expected learning:** Whether the tool pitch converts qualified inspectors, and whether the value proposition resonates as tool improvement or is perceived as platform adoption (which carries higher resistance).

---

### Experiment 2 — Time-to-First-Verified-Report

**Objective:** Measure actual onboarding friction against the target threshold.

**Method:**
- For each inspector that agrees to participate, track time from tool introduction to completion of first verified inspection report.
- Observe where the session stops, where questions arise, where the workflow breaks.
- Include template customization in the measurement — the inspector must set up their own inspection structure, not use a generic default.
- Target threshold: first verified report completed within a single working session without escalation.

**Expected learning:** Concrete friction map. Specific workflow steps that exceed tolerance. Whether template customization adds unacceptable friction or is perceived as a valuable feature.

---

### Experiment 3 — Inspector Usage Persistence

**Objective:** Determine whether initial inspector tool usage is sustained over the 90-day window.

**Method:**
- Track verified report generation frequency per inspector across weeks 1–12.
- Segment inspectors by profile characteristics (inspection-only vs. workshop-overlap, digital sophistication, current report method).
- Flag any inspector that produced a verified report in weeks 1–2 but has zero reports in weeks 5–8.
- For inactive inspectors: a single structured conversation to understand why usage stopped. Did they revert to their previous method? Was the tool inadequate? Was the friction too high?

**Expected learning:** Whether tool adoption is real or experimental. Early warning signal for inspectors that will churn. Whether the inspector-workshop overlap correlates with higher or lower persistence.

---

### Experiment 4 — Buyer Engagement with Verified Links

**Objective:** Test whether verified inspection links generate meaningful engagement from buyers who receive them.

**Method:**
- Track link engagement metrics for all verified reports generated during the 90-day window:
  - Open rate (did the recipient click the link?).
  - Time on page (how long did they engage with the report content?).
  - Return visits (did they come back?).
  - Sharing behavior (did they forward the link?).
- Where possible, identify the context in which the link was shared (direct delivery by inspector, posted in marketplace listing, forwarded in WhatsApp conversation).
- Qualitative probe: in buyer conversations, show a sample verified report link. Does the OpenGraph preview generate curiosity? Does the report page hold attention?

**Expected learning:** Whether the verified link functions as a credible information artifact or is treated as an unfamiliar/ignorable link. Whether marketplace listing context generates higher engagement than direct delivery.

---

### Experiment 5 — Observed Transaction Behavior Probe

**Objective:** Test whether verified history or the concept of structured inspection documentation influences transaction behavior in a real secondary market context.

**Method:**
- This is qualitative and structured, not quantitative at this stage.
- Identify 5–10 vehicle transactions in the target market (through seller or buyer contacts) across the 90-day window.
- In each case, conduct structured post-transaction interviews: Did inspection documentation come up? Did its presence or absence affect price or negotiation? What format of documentation carried credibility? Did anyone share a link or document related to vehicle condition?
- Do not inject the product into transactions. Observe and probe what actually happened.

**Expected learning:** Whether there is organic demand for credible inspection documentation in real transaction contexts — and what form of evidence buyers and sellers currently treat as meaningful.

---

### Experiment 6 — Inspector-Workshop Overlap Probe

**Objective:** Determine whether the inspector-workshop overlap hypothesis (H6) is structurally real in the target market.

**Method:**
- In every inspector conversation and onboarding, explicitly ask: "Do you also operate as a workshop? Do you perform repairs, maintenance, or modifications in addition to inspections?"
- For inspectors who confirm overlap: probe whether they would use the same tool for intake documentation (documenting vehicle state on arrival before work begins).
- For inspectors who do not overlap: ask whether they know inspectors in their market who also run workshops.
- Track the proportion of onboarded inspectors who are also workshops.

**Expected learning:** Whether the overlap is real and prevalent enough to serve as a natural bridge to workshop adoption. If the overlap is below 20% of the initial inspector cohort, the bridge mechanism requires a different approach.

---

## 5. Metrics

### Primary Signal Metric

**Node-signed inspection events per month (from active beta inspectors)**
This is the single most important operational metric. It captures whether the supply side is functionally working.

Target by end of month 3: a minimum of 3 inspectors each producing at least 8 verified reports per month consistently. Total signed inspection events ≥ 80 across the period.

---

### Secondary Metrics

**Inspector conversion rate from outreach to first verified report**
Definition: proportion of inspectors contacted that complete at least one verified report.
Target: ≥ 30% of qualified outreach.

**Time-to-first-verified-report**
Definition: elapsed time from beginning of tool introduction to completion of first verified inspection report (including template setup).
Target: ≤ 90 minutes within a single working session, without escalation.

**Inspector usage persistence rate**
Definition: proportion of inspectors that produced verified reports in weeks 1–4 who continue producing reports in weeks 9–12.
Target: ≥ 70% persistence rate across the cohort.

**Buyer engagement with verified links**
Definition: open rate and average time on page for verified inspection report links.
Target: ≥ 40% open rate for links delivered directly to buyers. Average time on page ≥ 60 seconds for opened links.

**Inspector-workshop overlap rate**
Definition: proportion of onboarded inspectors who also operate as workshops (repairs, maintenance, modifications).
Target: ≥ 30% of initial inspector cohort. This is not a hard threshold — any overlap is valuable — but below 20% the bridge mechanism requires reassessment.

**Qualitative signal from transaction probes**
Definition: proportion of observed transactions in which inspection documentation or vehicle history was referenced by at least one party.
Target: ≥ 50% of probed transactions show some documentation reference — regardless of format.

---

### Red Flag Indicators (Immediate Attention Required)

- Any inspector that produced verified reports in weeks 1–2 has zero reports in weeks 5–6.
- Average time-to-first-verified-report exceeds 3 hours or requires multiple sessions.
- More than 50% of outreach conversations result in the inspector perceiving the tool as a platform threat rather than a tool improvement.
- Buyer open rate for verified links is below 15% across all contexts.
- Zero of the initial inspector cohort also operates as a workshop.
- No transaction probe reveals any organic inspection documentation discussion.

These are not kill criteria on their own. They are signals that a specific hypothesis is failing and that immediate diagnostic conversation is required.

---

## 6. Validation Thresholds

The following thresholds define what the 90-day evidence must demonstrate to justify proceeding to MVP build.

### Threshold 1 — Inspector Supply Side Is Functionally Viable

**Minimum condition:** At least 3 inspectors are consistently producing verified reports at the end of 90 days. Consistently means at least 6 reports per month in months 2 and 3, without significant founder intervention required to maintain the behavior.

**What this confirms:** The tool value proposition is real and the inspector adoption sequence is functionally sound at small scale.

---

### Threshold 2 — Onboarding Friction Is Within Manageable Range

**Minimum condition:** The median time-to-first-verified-report is under 90 minutes, achieved within a single session, for at least 4 inspectors.

**What this confirms:** The onboarding path can be standardized and scaled without a high-touch support dependency.

---

### Threshold 3 — Inspector Usage Persists Without Active Maintenance

**Minimum condition:** At least 70% of inspectors that produced verified reports in weeks 1–4 continue producing reports in weeks 9–12 without requiring founder-initiated prompting.

**What this confirms:** The tool integration is real, not performative. The value is sufficient to sustain behavior beyond the novelty of initial adoption.

---

### Threshold 4 — Verified Links Generate Nonzero Buyer Engagement

**Minimum condition:** At least 30% of verified inspection links delivered to buyers are opened. Of those opened, average time on page exceeds 45 seconds. At least one instance of a verified link appearing in a marketplace listing or being forwarded by a buyer to a third party.

**What this confirms:** The verified report artifact functions as an information source that buyers engage with, not a link they ignore. The artifact has propagation potential beyond the inspector-client pair.

---

### Threshold 5 — Latent Demand Signal Is Directionally Present

**Minimum condition:** In structured transaction probes, at least 3 of the 5–10 observed transactions include unprompted reference to inspection, documentation, or verifiability in any form. This does not need to reference the product — it must reveal that the problem exists behaviorally.

**What this confirms:** There is organic demand for the signal's underlying function, even if buyers and sellers do not yet have a structured way to access it.

---

## 7. Kill Criteria

These are conditions under which the project must be restructured or stopped. They are not reasons to pivot to a slightly different version of the same thesis. They are structural invalidations.

### Kill Criterion 1 — Inspector Tool Adoption Fails

**Condition:** By the end of month 3, fewer than 2 inspectors are actively producing verified reports (defined as at least 4 reports in the final 30-day period), AND outreach to additional inspectors has not produced a qualified pipeline of candidates willing to try the tool.

**What it means:** The tool value proposition is not real. Inspectors do not perceive the report generator as a genuine improvement over their current method. Without inspector adoption, there are no signed events, no verified links, and no foundation for any subsequent phase.

**Required response:** Full stop. Do not proceed to MVP build. Conduct structured post-mortems with all participating inspectors. The question to answer: was the tool not good enough (product problem), or was the target profile wrong (market problem)? If product, redesign and retest. If market, the verifier-first adoption model requires fundamental revision.

---

### Kill Criterion 2 — Inspector Usage Persistence Collapses

**Condition:** Fewer than 50% of inspectors that produced verified reports in weeks 1–4 continue producing reports in weeks 9–12, despite founder engagement and active troubleshooting.

**What it means:** Initial adoption is not translating into durable behavior. The tool is interesting enough to try but not good enough to keep. The inspector reverts to their existing method because the switching cost exceeds the perceived improvement.

**Required response:** Do not proceed to MVP build until the tool's competitive advantage over existing methods is identified and strengthened. Conduct structured exit interviews with every inspector who reverted. The question is specific: what did they go back to, and why was it better?

---

### Kill Criterion 3 — Verified Links Generate No Buyer Engagement

**Condition:** Buyer open rate for verified inspection links is below 10% across all contexts (direct delivery, marketplace listing, forwarded), AND average time on page for opened links is below 20 seconds.

**What it means:** The verified report artifact does not function as a credible information source in the buyer's context. The link is treated as noise. Without buyer engagement, the artifact has no propagation value — the inspector gets a better tool, but the platform gets no signal distribution. The tool becomes a standalone product, not infrastructure.

**Required response:** This does not necessarily kill the project, but it kills the assumption that verified links will propagate market recognition organically. If the tool is valuable to inspectors (Thresholds 1–3 met) but the artifact does not travel (Threshold 4 failed), the business model must be reassessed: can the company sustain itself as an inspector SaaS tool without consumer-side signal propagation? If yes, pivot the thesis accordingly. If no, the distribution mechanism requires fundamental redesign.

---

### Kill Criterion 4 — Transaction Probes Reveal No Organic Demand for Documentation

**Condition:** Across 5–10 structured transaction probes, fewer than 2 transactions reveal any organic reference to inspection documentation, history, or verifiability. Buyers and sellers operate in a purely relational, informal mode with no apparent appetite for structured evidence.

**What it means:** The LATAM informality premium hypothesis is wrong for the target segment and geography. The demand for the signal does not exist at the consumer level — at least not in the near term.

**Required response:** Reassess the consumer thesis. If institutional demand is structurally real but consumer demand is not, the adoption model must be rebuilt around inspector-to-institution pathways without relying on consumer-facing transaction signals. This requires a fundamental rewrite of the incentive model before further investment.

---

### Kill Criterion 5 — Inspector-Workshop Overlap Is Zero

**Condition:** None of the inspectors acquired in the 90-day window also operate as workshops. The inspector and workshop populations are genuinely distinct with no natural bridge between them.

**What it means:** This does not kill the project. But it elevates the risk of Challenge 9 (the transition from inspectors to workshops) from "natural bridge" to "separate acquisition challenge requiring its own validation." The workshop bridge can no longer be assumed to emerge from the inspector base — it requires a distinct pitch, a distinct entry mechanism, and a distinct validation cycle.

**Required response:** Do not stop the project. But do not assume the workshop bridge will happen organically. Before committing to Phase 2 workshop expansion, design and validate a standalone workshop acquisition strategy — likely centered on the intake inspection pitch to workshops that are not inspectors. Factor the additional acquisition cost and timeline into Phase 2 planning.

---

## 8. Iteration Cycles

The 90-day window is structured into three 30-day cycles, each with a defined focus and decision gate.

---

### Cycle 1 — Days 1–30: Pre-Build Conversations, Outreach, and First Evidence

**Objective:** Complete pre-build conversations. Produce the first verified inspection reports in a live environment. Establish initial inspector cohort.

**Activities:**
- Complete pre-build conversations: 3–5 inspectors, 3–5 sellers, 3–5 buyers, 1–2 agencies (Section 3).
- Complete outreach to 15–20 target inspectors.
- Onboard 4–6 willing participants as beta verifiers.
- Track time-to-first-verified-report for each.
- Probe inspector-workshop overlap in every conversation (Experiment 6).
- Deploy initial verified inspection report pages with OpenGraph previews.
- Begin tracking buyer engagement with verified links.

**Decision gate at Day 30:**
- Is at least one inspector producing verified reports consistently?
- Is the onboarding flow producing first reports within the target threshold?
- Are there blocking objections appearing in outreach conversations that require pitch or tool revision?
- What proportion of onboarded inspectors also operate as workshops?

If zero inspectors are producing verified reports by day 30, cycle 2 cannot proceed as designed. Diagnosis required immediately.

---

### Cycle 2 — Days 31–60: Persistence Testing and Buyer Engagement

**Objective:** Determine whether inspector usage is durable. Begin measuring buyer engagement with verified links at meaningful volume.

**Activities:**
- Continue monitoring report generation frequency for all onboarded inspectors.
- Flag any inspector with declining report frequency and conduct structured diagnostic conversation.
- Accumulate buyer engagement data: open rates, time on page, sharing behavior.
- Begin transaction probes: identify 3–5 secondary market transactions to observe.
- Collect first iteration of transaction probe data.
- For inspector-workshop overlap actors: probe whether they would use the tool for intake documentation.

**Decision gate at Day 60:**
- Is inspector usage stable or declining across the cohort?
- Are verified links generating nonzero buyer engagement?
- Are transaction probes generating any useful qualitative data?

If inspector usage has materially declined by day 60 without a clear recoverable cause, kill criterion 2 may be approaching. Escalate assessment.

---

### Cycle 3 — Days 61–90: Persistence Confirmation and Threshold Assessment

**Objective:** Accumulate final evidence against all validation thresholds. Make go/no-go decision.

**Activities:**
- Final 30-day report generation frequency measurement for all inspectors.
- Complete remaining transaction probes (target total: 5–10).
- Compile full buyer engagement data (open rates, time on page, sharing, return visits).
- Conduct structured exit interviews with any inspector that stopped using the tool.
- Compile inspector-workshop overlap data and assess bridge viability.
- Draft preliminary signal integrity assessment: are the verified reports produced structurally consistent and manipulation-resistant in observed practice?
- Compile full evidence summary against each validation threshold.

**Decision gate at Day 90:**
- Have validation thresholds 1–5 been met?
- If not, which specific kill criteria apply?
- What is the inspector-workshop overlap rate, and what does it imply for Phase 2 planning?
- If proceeding: specific unresolved risks to carry forward and monitor in MVP phase.
- If not proceeding: precise diagnosis of which assumptions failed and what evidence would be required to revisit.

---

## 9. What This Plan Does Not Validate

This 90-day plan is scoped to validate the behavioral assumptions underlying inspector-first adoption. It does not validate:

- **Workshop adoption.** Workshop onboarding is a Phase 2 event. The overlap probe (H6) provides early signal, but full workshop validation requires a separate cycle once inspector traction is demonstrated.
- **Institutional demand.** This is a Phase 3 event. No meaningful institutional validation is expected or targeted in 90 days.
- **Monetization.** Revenue in Phase 1 is zero by design (see business-model-and-monetization.md v3.0). This plan validates traction, not revenue. Monetization paths are enabled by Phase 1 traction, not designed during Phase 1.
- **Signal recognition at scale.** Coverage density at scale cannot be validated in 90 days. The objective is to validate that the supply-side mechanism works, not that it has reached recognition.
- **The seller-pays model inversion.** Whether sellers will commission and pay for pre-sale inspections with verified links is a behavioral change that may take years to materialize. This plan does not test it — it maintains the existing buyer-pays dynamic and observes whether seller-pays behavior emerges organically.
- **Competitive response.** The plan does not attempt to map or test competitor reaction. It is too early for that signal to be meaningful.

Attempting to validate these things in 90 days would produce noise, not signal. The plan is scoped to what can actually be tested in this window.

---

## 10. Operating Discipline

### On Data Interpretation

The most dangerous outcome is misreading weak evidence as validation. An inspector expressing enthusiasm about the mockup is not validation. A single buyer clicking a verified link is not validation. One transaction where inspection was mentioned is not validation.

Each threshold is defined to prevent this. The plan must be evaluated against thresholds as written — not against the best-case reading of ambiguous evidence.

### On Founder Involvement

Any tool usage that requires regular founder prompting to sustain is not validated behavior. It is managed behavior. The thresholds are defined against autonomous adoption. The plan must actively test whether inspectors use the tool when the founder is not watching, not just when they are.

### On Negative Evidence

Negative evidence — inspectors that do not adopt, buyers that do not click, transactions where documentation is irrelevant — is as valuable as positive evidence. The temptation to explain it away must be resisted. Every instance of non-adoption deserves a structured diagnosis, not a rationalization.

### On Iteration Within the 90 Days

Tactical adjustments to the pitch, onboarding flow, report template, or OpenGraph preview are expected and appropriate within cycles. Strategic adjustments to the core thesis — the verifier-first approach, the tool-value proposition, the verified link as distribution mechanism — are not within scope. If 90-day evidence suggests strategic-level changes are required, that is a kill or restructure signal, not an iteration signal.

---

## 11. Output of This Plan

At day 90, the output is a single structured assessment document covering:

1. Evidence state against each hypothesis (H1–H6).
2. Evidence state against each validation threshold (1–5).
3. Whether any kill criteria have been triggered.
4. Inspector-workshop overlap assessment and implications for Phase 2 bridge strategy.
5. Pre-build conversation synthesis: key findings from inspector, seller, buyer, and agency conversations that inform build decisions for each challenge (per work/verifiers/decisions.md).
6. If proceeding: specific unresolved risks to carry forward and monitor in MVP phase.
7. If not proceeding: precise diagnosis of which assumptions failed and what evidence would be required to revisit.

This document becomes the foundation for the verifier-first MVP build or the project restructure decision.

---

*90-Day Validation Plan v2.0 | Internal Use Only*
