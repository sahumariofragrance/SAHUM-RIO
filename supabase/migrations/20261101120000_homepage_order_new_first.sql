-- Homepage order: the 15 new perfumes first, mixed (him, her, everyone in
-- turn) so the page doesn't look grouped, then the first six, also mixed.
-- Only the order changes; nothing is added, hidden or put on sale.
-- Safe to run twice. Change any perfume's place later in
-- Admin → Catalogue → Display order (lower numbers show first).

update public.products as p
set display_order = v.display_order
from (values
  ('samrat',            10),
  ('rasmalai',          20),
  ('mogra-oud',         30),
  ('rajtilak',          40),
  ('laal-gulab',        50),
  ('kesar-kasturi',     60),
  ('kali-elaichi',      70),
  ('mogra-elaichi',     80),
  ('gulab-khus',        90),
  ('chandan-mirch',    100),
  ('gulabi-savar',     110),
  ('chandni',          120),
  ('hara-ananas',      130),
  ('komal',            140),
  ('chandan-lavender', 150),
  ('night-queen',      160),
  ('bloom',            170),
  ('blix',             180),
  ('lemon-breeze',     190),
  ('dew-drop',         200),
  ('morning-dew',      210)
) as v(slug, display_order)
where p.slug = v.slug;
