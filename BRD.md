# Dr Fit Veda — Business Requirements Document (BRD)

**Version:** 1.1  
**Status:** Updated — Live Training Recording added

## 1. Executive Summary

Dr Fit Veda is a doctor-guided fitness, yoga, nutrition and lifestyle management platform.

Core lifecycle:

**Membership → Onboarding → Professional Assessment → Personalized Plan → Trainer/Yoga Guidance → Daily Tracking → Weekly Review → Plan Adjustment → Continuous Monitoring**

The product should feel like a professional lifestyle-management service, not a generic gym or calorie-counting app.

## 2. Business Objectives

1. Deliver personalized, practical lifestyle guidance.
2. Connect doctors, nutritionists, trainers and yoga professionals around one customer lifecycle.
3. Make daily adherence tracking possible in about 30 seconds to 1 minute.
4. Give management centralized control over memberships, offers, assignments and finances.
5. Track professional earnings separately.
6. Preserve historical financial accuracy when pricing/payout rules change.
7. Prepare for future food/diet-food and AI modules.

## 3. Current Business Model

### Standard Membership

**₹9,999**

### Current Default Allocations

| Component | Amount |
|---|---:|
| Initial doctor plan + diet | ₹999 |
| Trainer service | ₹5,499 |
| Weekly doctor review | ₹199 per completed/approved review |
| Initial example company allocation | ₹3,302 |

Current example calculation:

**₹9,999 − ₹999 − ₹5,499 − ₹199 = ₹3,302**

Because weekly doctor review is a recurring service, total company economics over a full lifecycle may change based on the number of reviews and future services.

## 4. Centralized Compensation Model

The values above must be configurable, not hard-coded.

Admin/Super Admin must be able to change globally:

- Membership price
- Initial doctor payout
- Trainer payout
- Weekly doctor review payout
- Yoga professional payout
- Nutritionist payout
- Other service payouts
- Other cost allocations
- Effective dates
- Active/inactive state

Create one centralized compensation/revenue rules area.

Example:

If Trainer changes from ₹5,499 to ₹5,999:

**₹9,999 − ₹999 − ₹5,999 − ₹199 = ₹2,802**

The system must calculate this automatically.

## 5. Historical Financial Rule

New rules apply only to new/future applicable service events.

Completed historical transactions must retain the original:

- Membership amount
- Discount
- Payout rule/version
- Professional payout amounts
- Company allocation

Changing current settings must never silently change historical records.

## 6. Professional Revenue Share

The same customer membership can create multiple earnings events.

Supported professional roles:

- Doctor / Naturopathy Doctor
- Nutritionist
- Trainer
- Yoga Doctor
- Yoga Consultant
- Future roles

Payout states:

- Pending
- Approved
- Paid
- Cancelled
- On Hold

## 7. Core Customer Lifecycle

### Step 1 — Membership
Customer selects a program and purchases membership.

### Step 2 — Onboarding
Customer provides personal, physical, lifestyle and food information and uploads requested reports.

### Step 3 — Professional Assignment
Admin assigns the required professionals.

### Step 4 — Doctor Assessment
Doctor understands lifestyle, work, food habits, physical information, goals and relevant reports.

### Step 5 — Personalized Plan
Doctor/professional recommends practical changes:
- What to add
- What to reduce
- What to modify
- Nutrition/protein guidance
- Lifestyle guidance
- Activity guidance

### Step 6 — Trainer/Yoga Guidance
Trainer/yoga professional delivers the applicable program online.

Live training sessions may be recorded. The customer can watch the most recent completed recording from their dashboard. Only the latest recording is made available; previous recordings are removed according to the retention policy.

### Step 7 — Daily Tracking
Customer completes a simple daily check-in.

### Step 8 — Weekly Review
Doctor reviews progress.

### Step 9 — Adjustment
Doctor continues or changes the plan.

### Step 10 — Continuous Monitoring
Repeat while the membership remains active.

## 8. Customer Information

Capture where relevant:

- Personal details
- Height
- Weight
- BMI
- Occupation
- Work schedule
- Sleep
- Activity
- Exercise history
- Stress/lifestyle information
- Food habits
- Dietary preference
- Meal timings
- Food preferences/dislikes
- Water intake
- Goals
- Women's wellness information where applicable

## 9. Professional Model

### Doctor / Naturopathy Doctor
- Initial assessment
- Personalized plan/diet
- Weekly review
- Plan modifications
- Professional notes

### Nutritionist
- Nutrition assessment
- Food/protein guidance

### Trainer
- Online workout programming
- Workout guidance
- Adherence
- Conduct live online training sessions
- Record live sessions
- Monitor recording status (uploading / processing / available)
- Make completed recording available to the assigned customer

### Yoga Doctor / Consultant
- Yoga assessment/programs/sessions
- Yoga adherence

## 10. Women's Wellness

The platform may support:
- Stress management
- Sleep/lifestyle support
- Women's wellness
- PCOD/PCOS lifestyle support
- Yoga and nutrition support

Sensitive information must be role-restricted and recommendations must remain within the professional's scope.

## 11. Daily Tracking Business Requirement

Daily tracking must be extremely quick.

Suggested:

- Workout completed
- Diet followed
- Yoga completed
- Water target completed
- Other assigned activity

Statuses:
- Yes
- Partially
- No
- Skip where allowed

Optional:
- Energy
- Mood/stress
- Short note

## 12. Weekly Review

Doctor should see:
- Adherence
- Weight/BMI where recorded
- Relevant measurements
- Customer feedback
- Current plan
- Previous plan
- Relevant trends

Doctor can:
- Continue plan
- Modify plan
- Create a new plan version
- Set next review date

Completed/approved weekly review can generate the configured review payout.

## 13. Membership and Offers

Admin can manage:

- Memberships
- Prices
- Discounts
- Benefits
- Duration
- Included services
- Included reviews
- Offers
- Start/end dates
- Featured status
- Display order

## 14. Public Website

Core pages:

- Home
- Programs
- How It Works
- Memberships
- Yoga
- Nutrition
- Women's Wellness
- About
- Testimonials
- FAQ
- Contact
- Login

Website content must be editable through Admin without code changes.

## 15. Admin

Admin controls:

- Customers
- Professionals
- Assignments
- Memberships
- Prices
- Offers
- Compensation rules
- Website CMS
- Revenue
- Professional earnings
- Reports
- Notifications
- Audit logs
- Training session recordings
  - View all sessions (customer, trainer, session date, recording status)
  - Manage recording availability
  - Configure retention policy (grace period before old video deletion)

## 16. Reporting

Management metrics:

- Membership sales
- Active memberships
- Customer growth
- Onboarding status
- Daily adherence
- Weekly review completion
- Consultations
- Gross revenue
- Professional payouts
- Company allocation
- Pending/paid payouts

Date filters:
- Today
- Week
- Month
- Custom

## 17. Future Business

Future food business:
- Healthy meals
- Protein meals
- Diet food
- Meal plans
- Subscriptions
- Ordering
- Delivery
- Inventory

Future AI:
- Food recognition
- Food logging
- Protein estimation
- Progress summaries
- Professional dashboard summaries

AI must not diagnose or replace qualified professionals.

## 18. Key Business Rules

1. Default membership = ₹9,999.
2. Default initial doctor plan payout = ₹999.
3. Default trainer payout = ₹5,499.
4. Default weekly doctor review payout = ₹199 per completed/approved review.
5. Initial example company allocation = ₹3,302.
6. All these are configurable.
7. Changes apply based on effective dates.
8. Historical finalized transactions retain their original snapshot.
9. Doctor and trainer earnings are tracked independently.
10. Weekly doctor payout is service/event based.
11. All financial calculations use one centralized engine.
12. Financial events must be auditable.
13. Only the latest completed training recording is available to the customer.
14. When a new recording is finalized, the previous recording is deactivated.
15. The previous recording video is deleted according to the configured retention policy.
16. Session metadata (date, trainer, customer, recording status) is permanently retained even after the video is removed.
17. Recording videos must be stored in private/secure storage — never in a public folder.
18. Recording access requires a time-limited signed URL generated after authorization.
19. The retention policy (immediate deletion or configurable grace period) is set by Admin and applies globally.
20. Old video deletion is performed by a background job to avoid slowing down the application.

## 19. Live Training Session Recording

### Business Overview

Dr Fit Veda provides live online training sessions conducted by Trainers and Yoga professionals. Every live session may be recorded.

### Rolling Retention Rule

Only the **latest completed training recording** is made available to the customer at any time.

- When a new recording is finalized, it becomes the active recording for that customer.
- The previous recording is deactivated and scheduled for deletion per the configured retention policy.
- The customer always sees only the most recent recording.

### Customer View

The customer's dashboard shows a **Latest Training Session** section:

- Training date
- Trainer name
- Watch Recording (if available)
- "Your training recording is being prepared." (if processing)
- "No recording available yet." (if no recording exists)

### Trainer View

The trainer can:
- Conduct live sessions
- Record the session
- See recording status
- Publish the recording to the customer

### Admin View

The admin can:
- View all training session history (customer, trainer, date, recording status)
- Manage recording availability
- Configure the retention policy

### Storage

- All recordings are stored in **private/secure object storage only**.
- Access is provided via **time-limited signed URLs** generated server-side after authorization.
- Public direct links to recordings are never created.
- Old video files are deleted by a background job.
- Session metadata is permanently retained even after the video file is deleted.

### History

Admin can always view:
- Training session date
- Trainer
- Customer
- Recording status (including whether video has been deleted)

The video file itself does not need to be permanently stored.

---

## 20. Business Vision

Dr Fit Veda should make the customer feel:

**"A professional understands my lifestyle, gives me practical changes, guides me, monitors me and adjusts the plan regularly."**

The business should simultaneously have complete operational and financial visibility.
