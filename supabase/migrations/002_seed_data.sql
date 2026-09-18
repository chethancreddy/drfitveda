-- ============================================================
-- Dr Fit Veda — Migration 002: Seed Data
-- Database Engineer Agent
-- ============================================================

-- ─── Seed: Default Membership ─────────────────────────────

insert into public.memberships (
  name, description, duration_days,
  original_price, current_price, discount,
  benefits, included_services, included_reviews,
  is_featured, display_order, is_active
) values (
  'Dr Fit Veda Standard',
  'Complete doctor-guided lifestyle management program with live training, nutrition, yoga, and weekly doctor reviews.',
  90,
  9999, 9999, 0,
  '["Initial doctor assessment", "Personalized lifestyle plan", "Live trainer sessions (recorded)", "Yoga program", "Nutrition guidance", "12 weekly doctor reviews", "Daily tracking", "Progress monitoring"]'::jsonb,
  '["doctor_assessment", "trainer_service", "yoga_guidance", "nutrition_guidance", "weekly_reviews", "live_training"]'::jsonb,
  12,
  true, 1, true
);

-- ─── Seed: Compensation Rule Version ──────────────────────

insert into public.compensation_rule_versions (
  name, effective_from, is_active
) values (
  'Standard Rate V1', '2024-01-01', true
);

-- ─── Seed: Payout Components ──────────────────────────────

-- Reference the rule version we just created
with rv as (
  select id from public.compensation_rule_versions
  where name = 'Standard Rate V1' limit 1
)
insert into public.payout_rule_components (
  rule_version_id, component_code, component_name,
  role, amount_type, amount, is_active
)
select
  rv.id, prc.component_code, prc.component_name,
  prc.role::user_role, prc.amount_type, prc.amount, true
from rv,
(values
  ('initial_doctor_plan', 'Initial Doctor Plan', 'doctor',           'fixed', 999),
  ('trainer_service',     'Trainer Service',     'trainer',          'fixed', 5499),
  ('weekly_review',       'Weekly Doctor Review','doctor',           'fixed', 199),
  ('yoga_service',        'Yoga Service',        'yoga_doctor',      'fixed', 0),
  ('nutrition_service',   'Nutrition Service',   'nutritionist',     'fixed', 0)
) as prc(component_code, component_name, role, amount_type, amount);

-- ─── Seed: Website Settings ───────────────────────────────

insert into public.website_settings (key, value) values
  ('site_name',    '"Dr Fit Veda"'),
  ('site_tagline', '"Doctor-Guided Lifestyle Management"'),
  ('contact_email','"info@drfitveda.com"'),
  ('contact_phone','"1800-XXX-XXXX"'),
  ('social_links', '{"instagram":"","facebook":"","youtube":""}'),
  ('hero_title',   '"Your health, guided by experts."'),
  ('hero_subtitle','"A professional understands your lifestyle, creates a personalized plan, guides you daily, and adjusts as you progress."')
on conflict (key) do nothing;

-- ─── Seed: FAQs ───────────────────────────────────────────

insert into public.faqs (question, answer, category, display_order, is_active) values
  ('What is Dr Fit Veda?',
   'Dr Fit Veda is a doctor-guided lifestyle management platform that connects you with qualified doctors, trainers, yoga professionals and nutritionists.',
   'general', 1, true),
  ('Are the training sessions recorded?',
   'Yes. Your latest live training session is recorded and available to you until your next session. Only the most recent recording is kept.',
   'training', 2, true),
  ('How do I access my training recording?',
   'Go to your dashboard and find the "Latest Training Session" section. Click "Watch Recording" to view it securely.',
   'training', 3, true),
  ('How long is my membership valid?',
   'The standard membership is valid for 90 days from activation.',
   'membership', 4, true),
  ('Can I change my doctor or trainer?',
   'Yes. Contact our support team and we will arrange a reassignment.',
   'general', 5, true)
on conflict do nothing;

-- ─── Seed: Testimonials ───────────────────────────────────

insert into public.testimonials (customer_name, content, rating, is_featured, display_order, is_active) values
  ('Priya M.', 'The weekly doctor reviews really helped me stay on track. Lost 8kg in 3 months with Dr Fit Veda!', 5, true, 1, true),
  ('Rahul K.', 'Live training sessions are excellent. The recordings are super helpful when I want to revisit the session.', 5, true, 2, true),
  ('Ananya S.', 'The yoga program combined with nutrition guidance has completely changed how I feel. Highly recommended.', 5, true, 3, true)
on conflict do nothing;

-- ─── Seed: Training Retention Config (default) ────────────

insert into public.training_retention_config (config_key, retention_mode, grace_period_hours)
values ('default_retention_policy', 'grace_period', 24)
on conflict (config_key) do nothing;

-- ─── Seed: Public Website Pages ───────────────────────────

insert into public.website_pages (slug, title, meta_title, meta_desc, is_published) values
  ('home',            'Home',              'Dr Fit Veda — Doctor-Guided Lifestyle',     'Personalized fitness, yoga, nutrition by doctors.',    true),
  ('programs',        'Programs',          'Programs | Dr Fit Veda',                   'Explore our fitness, yoga and nutrition programs.',    true),
  ('memberships',     'Memberships',       'Memberships | Dr Fit Veda',                'Transparent pricing for your wellness journey.',       true),
  ('how-it-works',    'How It Works',      'How It Works | Dr Fit Veda',               'Step-by-step guide to your wellness journey.',        true),
  ('yoga',            'Yoga',              'Yoga Programs | Dr Fit Veda',              'Doctor-prescribed yoga for your health goals.',       true),
  ('nutrition',       'Nutrition',         'Nutrition Guidance | Dr Fit Veda',         'Personalized nutrition guidance by qualified experts.',true),
  ('womens-wellness', 'Women''s Wellness',  'Women''s Wellness | Dr Fit Veda',           'PCOD, stress and lifestyle support for women.',       true),
  ('about',           'About',             'About Us | Dr Fit Veda',                   'Our mission, team and approach to health.',           true),
  ('contact',         'Contact',           'Contact | Dr Fit Veda',                    'Get in touch with the Dr Fit Veda team.',             true),
  ('faq',             'FAQ',               'FAQ | Dr Fit Veda',                        'Frequently asked questions about Dr Fit Veda.',       true)
on conflict (slug) do nothing;
