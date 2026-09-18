# Dr Fit Veda — Functional Requirements Document (FRD)

**Version:** 1.1  
**Status:** Updated — Live Training Recording added

## 1. Authentication

**FR-001** Customer and staff registration/login shall be supported through the selected authentication system.

**FR-002** Users shall be routed according to role.

Required roles:
- Customer
- Doctor
- Naturopathy Doctor
- Nutritionist
- Trainer
- Yoga Doctor
- Yoga Consultant
- Admin
- Super Admin

**FR-003** Protected operations shall require authorization.

---

## 2. Public Website

**FR-004** Admin can edit homepage hero, text, media, CTAs and sections.

**FR-005** Admin can create/edit/archive programs.

**FR-006** Public users can view active memberships and offers.

**FR-007** Admin can manage testimonials and FAQs.

**FR-008** Admin can manage:
- Contact information
- Social links
- Logo
- Favicon
- SEO title/description

---

## 3. Membership Management

**FR-009** Admin can create, edit, archive, activate and deactivate memberships.

Fields:
- Name
- Duration
- Original price
- Current price
- Discount
- Benefits
- Included services
- Included consultations/reviews
- Featured
- Display order
- Status

**FR-010** Seed the current default membership at **₹9,999**.

**FR-011** Admin can create offers with:
- Offer title
- Discount
- Start date
- End date
- Applicable memberships
- Banner
- Status

---

## 4. Checkout and Payment

**FR-012** Customer sees membership, discount and final amount before payment.

**FR-013** Payment integration must use a modular provider layer.

**FR-014** Store:
- Order ID
- Customer
- Membership
- Amount
- Currency
- Payment status
- Transaction reference
- Timestamp

**FR-015** Do not store raw card details.

**FR-016** Verified payment success shall activate membership and create onboarding workflow.

---

## 5. Customer Onboarding

**FR-017** Collect personal details.

**FR-018** Collect height, weight, BMI and optional physical measurements.

**FR-019** Calculate BMI from height and weight and allow professional review.

**FR-020** Collect lifestyle information:
- Occupation
- Work schedule
- Sleep
- Activity
- Exercise history
- Stress/lifestyle habits

**FR-021** Collect food information:
- Dietary preference
- Meal timing
- Typical meals
- Snacks
- Preferences/dislikes
- Eating-out frequency
- Water intake
- Relevant restrictions/allergies

**FR-022** Collect goals.

**FR-023** Provide optional women's wellness information with restricted access.

---

## 6. Documents

**FR-024** Customer can upload requested reports/documents such as blood reports.

**FR-025** Store:
- Type
- Customer
- Uploader
- File reference
- Date
- Status
- Notes

**FR-026** Documents must be private and authorization-protected.

---

## 7. Professional Assignment

**FR-027** Admin can assign doctors, nutritionists, trainers and yoga professionals.

**FR-028** Admin can reassign customers.

**FR-029** Old assignment history must remain available.

---

## 8. Doctor Assessment

**FR-030** Doctor can review authorized customer information and reports.

**FR-031** Doctor can create an initial assessment containing:
- Lifestyle observations
- Food observations
- What to add
- What to reduce
- What to modify
- Nutrition/protein guidance
- Sleep/lifestyle guidance
- Activity guidance
- Follow-up date
- Internal notes

**FR-032** Doctor can publish customer-facing plan content.

---

## 9. Food and Nutrition

**FR-033** Authorized users can manage/search a central food database.

Fields:
- Food name
- Category
- Serving size
- Calories
- Protein
- Carbohydrates
- Fat
- Fibre
- Unit
- Dietary classification
- Region/category
- Status

**FR-034** Nutrition guidance shall use centralized food records rather than hard-coded frontend values.

---

## 10. Personalized Plans

**FR-035** Authorized professionals can create plans.

Plan may contain:
- Nutrition
- Foods to add/reduce
- Meal guidance
- Protein guidance
- Water
- Meal timing
- Workout
- Yoga
- Steps/activity
- Stretching/mobility
- Sleep
- Lifestyle actions

**FR-036** Internal notes are separate from customer-facing instructions.

**FR-037** Publishing a changed plan creates a new version.

**FR-038** Previous versions remain accessible according to permissions.

---

## 11. Trainer

**FR-039** Trainer sees assigned customers.

**FR-040** Trainer can create:
- Workout plans
- Daily workouts
- Exercises
- Sets
- Repetitions
- Duration
- Rest
- Video/demo
- Instructions

**FR-041** Customer can mark workout completed/partially/not completed.

**FR-042** Default trainer allocation = **₹5,499**, centrally configurable for future applicable services.

**FR-042a** Trainer can conduct live online training sessions with assigned customers.

**FR-042b** Trainer can start and end a live session and initiate recording.

**FR-042c** Trainer can view the recording status for each session: uploading, processing, available.

**FR-042d** Trainer can publish a completed recording to make it available to the customer.

---

## 12. Yoga

**FR-043** Admin/professionals can create yoga programs.

**FR-044** Yoga professionals can assign:
- Session
- Asana
- Duration
- Frequency
- Instructions
- Video

**FR-045** Customer can track yoga completion.

---

## 30. Live Training Sessions

**FR-LT-001** The system shall support live training sessions per customer-trainer assignment.

**FR-LT-002** Trainer can set a session status: Scheduled, Live, Completed, Cancelled.

**FR-LT-003** Trainer can initiate and finalize a recording for a live session.

**FR-LT-004** The system shall store the recording file reference in private/secure object storage. No recording shall ever be placed in a public folder.

**FR-LT-005** The system shall retain **only the latest completed recording** per customer (rolling retention). Only one recording shall be active per customer at any time.

**FR-LT-006** When a new recording is finalized and made active, the previous recording is marked inactive.

**FR-LT-007** The previous recording video file is deleted/overwritten according to the configured retention policy, via a background job that does not block the application.

**FR-LT-008** Training session metadata (date, trainer, customer, recording status, deletion timestamp) shall be permanently retained even after the video file is removed.

**FR-LT-009** Customer can view the latest available recording from the **Latest Training Session** section on their dashboard.

**FR-LT-010** If the recording is being processed, the customer shall see: *"Your training recording is being prepared."*

**FR-LT-011** If no recording exists, the customer shall see: *"No recording available yet."*

**FR-LT-012** Recordings shall only be served to authorized customers via time-limited signed URLs generated server-side. Public direct links shall never be created.

**FR-LT-013** Admin can view all training sessions with: customer name, trainer name, session date, session status, recording status.

**FR-LT-014** Admin can configure the retention policy: immediate deletion or a configurable grace period (in hours) before old video is removed.

**FR-LT-015** Admin can manually override recording availability (e.g., disable a recording, restore from grace period).

**FR-LT-016** Old video file deletion shall be performed asynchronously by a background job. The metadata record is never deleted.

---

---

## 13. Daily Check-In

**FR-046** Customer can open a compact daily check-in.

Required/conditional items:
- Workout
- Diet
- Yoga
- Water
- Other assigned activities

Statuses:
- Yes
- Partially
- No
- Skip where applicable

**FR-047** Optional fields:
- Energy
- Mood/stress
- Note

**FR-048** The check-in should generally take 30 seconds to 1 minute.

**FR-049** Store date, customer, plan version, responses, timestamp and note.

**FR-050** Prevent duplicate check-in records unless editing is explicitly allowed.

---

## 14. Progress

**FR-051** Show weekly adherence.

**FR-052** Show monthly adherence.

**FR-053** Show current streak where appropriate.

**FR-054** Show professional-approved measurements and trends.

---

## 15. Weekly Doctor Review

**FR-055** System creates or exposes due-review tasks for doctors.

**FR-056** Doctor sees:
- Current/previous measurements
- Adherence
- Customer feedback
- Current plan
- Previous plan
- Relevant trends

**FR-057** Doctor can continue or modify plan.

**FR-058** New plan version is created for significant modifications.

**FR-059** Review status:
- Due
- In Progress
- Completed
- Approved
- Skipped/Cancelled

**FR-060** Default weekly review payout = **₹199 per completed/approved review**.

---

## 16. Consultation

**FR-061** Professionals can set availability.

**FR-062** Customers can view available slots and book.

**FR-063** Customers can view upcoming/history.

**FR-064** Professionals can complete consultation records with notes/recommendations.

---

## 17. Stress and Women's Wellness

**FR-065** Admin can configure:
- Stress management
- Relaxation
- Breathing
- Meditation
- Sleep/lifestyle support
- Women's wellness
- PCOD/PCOS lifestyle support

**FR-066** Sensitive records are accessible only to authorized professionals.

---

## 18. Compensation and Revenue

**FR-067** Create:

**Admin → Finance → Compensation Rules**

Seed:

- Membership = ₹9,999
- Initial doctor plan = ₹999
- Trainer = ₹5,499
- Weekly doctor review = ₹199

**FR-068** System calculates company allocation automatically.

Initial example:

**₹9,999 − ₹999 − ₹5,499 − ₹199 = ₹3,302**

**FR-069** Admin can edit payout components centrally.

**FR-070** Admin can add/deactivate payout components.

**FR-071** Admin can set effective date and rule version.

**FR-072** Historical finalized transactions retain their old snapshot.

**FR-073** No frontend page may implement its own financial calculation.

---

## 19. Payout Ledger

**FR-074** Track:
- Professional
- Customer
- Membership/order
- Service
- Amount
- Rule version
- Service date
- Status
- Paid date

**FR-075** Payout statuses:
- Pending
- Approved
- Paid
- Cancelled
- On Hold

**FR-076** Professionals see only permitted earnings.

**FR-077** Admin sees complete payout ledger.

---

## 20. Company Revenue

**FR-078** Show:
- Gross revenue
- Professional payouts
- Other configured costs
- Company allocation
- Pending payouts
- Paid payouts

**FR-079** Use:

**Company Allocation = Gross Revenue − Applicable Professional Payouts − Other Configured Costs**

---

## 21. Customer Management

**FR-080** Admin can create/edit/view/activate/suspend customers.

**FR-081** Admin can assign/reassign professionals.

**FR-082** Admin can view customer timeline:
- Membership
- Onboarding
- Assignments
- Assessments
- Plans
- Check-ins
- Reviews
- Consultations
- Payments

---

## 22. Professional Management

**FR-083** Admin manages:
- Name
- Photo
- Qualification
- Specialization
- Experience
- Bio
- Availability
- Status

**FR-084** Admin can view assigned customer counts.

---

## 23. Notifications

**FR-085** Customer notifications:
- Membership activation
- Onboarding reminder
- Plan publication
- Workout reminder
- Daily check-in
- Consultation
- Weekly review
- Plan change

**FR-086** Professional notifications:
- New assignment
- Review due
- Missed check-ins
- Consultation booking

**FR-087** Admin notifications:
- New purchase
- Payment
- Pending assignment
- Pending payouts

Prepare for in-app, email, SMS, WhatsApp and push.

---

## 24. Reporting

**FR-088** Admin reports include:
- Membership sales
- Revenue
- Customer growth
- Professional workload
- Adherence
- Reviews
- Consultations
- Payouts
- Company allocation

**FR-089** Filters:
- Today
- Week
- Month
- Previous month
- Custom range

**FR-090** Export:
- CSV
- Excel
- PDF where appropriate

---

## 25. Audit

**FR-091** Audit:
- Customer changes
- Assignments
- Plan changes
- Reviews
- Membership changes
- Compensation changes
- Payout changes
- Role changes
- Payment status changes

---

## 26. Customer Navigation

Recommended bottom navigation:

**Home | Plan | Track | Consult | Profile**

Home should prioritize:
- Today's plan
- Today's progress
- Weekly progress
- Next review
- Trainer action
- Quick check-in
- **Latest Training Session** (recording widget: date, trainer, Watch Recording button or status message)

---

## 27. Error and Loading States

Every major page must have:
- Loading
- Empty
- Error
- Success states

Never expose raw server/database errors to customers.

Additional states required for recording:
- **Processing**: recording is being prepared — show informational message, not an error.
- **Unavailable**: video was deleted per retention policy — show graceful empty state.
- **Error loading**: signed URL expired or failed — show retry option, not a raw URL/storage error.

---

## 28. Future Food Business

Keep the system extensible for:
- Food products
- Meal plans
- Orders
- Subscriptions
- Delivery
- Inventory

Do not build the full food-delivery operation in the initial release.

---

## 29. Future AI

Prepare for:
- Food recognition
- Food logging
- Protein estimation
- Progress summaries
- Reminder generation

AI must not independently diagnose or replace qualified professionals.
