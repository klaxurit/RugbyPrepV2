# Medical Red Flags — RugbyPrep Stop Rules

> This document is for the AI coach system prompt and LegalPage disclaimer.
> It defines conditions under which training must STOP and professional medical care is required.
> RugbyPrep is a training assistance tool — it does NOT replace medical or physiotherapy assessment.

---

## IMPORTANT LEGAL DISCLAIMER

RugbyPrep provides general physical preparation guidance based on established sports science principles.
It is **not a medical device** and **does not constitute medical advice**.
Any symptom listed below requires consultation with a qualified healthcare professional (doctor, physiotherapist, sports physician).
Users with known medical conditions should obtain medical clearance before starting any training program.

---

## Absolute Stop Rules — Cease Training Immediately

The following symptoms require **immediate cessation of training** and **emergency medical attention** (call 15/SAMU or 112):

### Cardiovascular
- Chest pain or pressure during exercise
- Pain radiating to the left arm, jaw, or back during exercise
- Sudden severe shortness of breath disproportionate to effort
- Loss of consciousness or syncope (fainting) during or after exercise
- Palpitations with dizziness or chest tightness
- Known cardiac condition (HCM, arrhythmia) with any exertional symptoms

### Neurological
- Sudden severe headache ("thunderclap") during exercise
- Loss of consciousness, even briefly
- Visual disturbances (double vision, visual field loss)
- Numbness or weakness in both legs (bilateral)
- Loss of bladder/bowel control after spinal impact → **Suspected spinal cord injury — do not move**
- Concussion symptoms (confusion, amnesia, vomiting, unequal pupils) → Rugby-specific return-to-play protocol mandatory

### Musculoskeletal (Traumatic — stop, do not continue)
- Sensation of a "pop" + immediate swelling at a joint (knee ACL, ankle, shoulder)
- Bone deformity or suspected fracture
- Severe acute joint instability ("giving way") under load
- Achilles tendon rupture: palpable gap, positive Thompson test (squeeze calf — no foot movement)
- Complete inability to weight-bear after lower limb trauma

---

## Relative Red Flags — Stop Training, See a Professional Soon (24-48h)

Do not train until assessed by a doctor or physiotherapist:

### Pain
- New joint pain > 5/10 appearing during a session without clear cause
- Pain that increases progressively during a session (not normal fatigue)
- Resting pain > 4/10 persisting > 24h after training
- Night pain that wakes the athlete (possible stress fracture, tumor, inflammatory condition)

### Swelling & Inflammation
- Acute joint swelling appearing within 2h of training (effusion — possible ligament/cartilage injury)
- Warmth + redness at a joint without trauma history (possible infection or inflammatory arthritis)

### Neurological (Non-emergency)
- New unilateral radiating pain (sciatica, brachialgia) triggered or worsened by training
- Persistent tingling or numbness in fingers or toes
- Progressive weakness in a limb not explained by fatigue

### Systemic
- Fever > 38°C → no training (risk of myocarditis, especially post-viral)
- Significant unintentional weight loss (> 5% body weight in 1 month)
- Unusual extreme fatigue with normal ACWR (possible anemia, thyroid issue, overtraining syndrome)

---

## Rehab-Specific Stop Rules

When using rehab protocols (REHAB_UPPER/LOWER_P1/P2/P3):

| Signal | Action |
|--------|--------|
| Pain > 4/10 during P1 exercises | Stop session, return to P1 or rest |
| Pain > 6/10 during any exercise | Stop session, consult physiotherapist |
| Acute swelling after P2/P3 session | Regress to P1 protocols |
| Sensation of instability during P3 sport-specific work | Stop, reassess with physio |
| No improvement after 4 weeks at P1 | Medical reassessment mandatory |

→ See also: `return-to-play-criteria.md` for phase progression criteria.

---

## Rugby-Specific Concussion Protocol

RugbyPrep does not manage concussion. Players with suspected concussion must follow:

1. **Immediate removal** from play (GRTP step 0)
2. **Medical assessment** within 24h
3. **World Rugby GRTP (Graduated Return to Play):**
   - Step 1: Rest (symptom-free)
   - Step 2: Light aerobic exercise (walking/swimming)
   - Step 3: Sport-specific exercise (no contact)
   - Step 4: Non-contact training drills
   - Step 5: Full-contact practice (medical clearance)
   - Step 6: Return to competition
   - Minimum 6 days, one step per day maximum

**RugbyPrep should not generate training programs for players currently in GRTP steps 1–3.**

---

## Communication in the AI Coach

When the AI coach detects potential red flag scenarios, it should:

1. **Not attempt to diagnose** the symptom
2. **Recommend professional consultation** clearly
3. **Redirect to appropriate resource** (sports physician, physio, emergency services)
4. **Not provide training modifications** for symptoms above the stop rules

Example response pattern:
> "Ce que tu décris (douleur thoracique à l'effort) nécessite une consultation médicale avant de reprendre l'entraînement. Ce n'est pas quelque chose que je peux gérer via l'application — parle-en à ton médecin ou kiné au plus tôt."

---

*Last updated: 2026-03-03*
*Sources: World Rugby Concussion Guidelines 2023; BJSM Pre-participation Screening 2023; ESC Guidelines Cardiovascular Pre-participation Screening 2020*
