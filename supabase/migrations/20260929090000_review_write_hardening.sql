-- Reviews: enforce in the database the same limits as /api/reviews/upsert, so
-- writes made directly through the Supabase API (bypassing the website)
-- cannot store a rating outside 1-5 (which would skew the average shown to
-- Google) or oversized text.
-- NOT VALID: applies to new and changed reviews without failing on any existing row.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'product_reviews_rating_range') then
    alter table public.product_reviews
      add constraint product_reviews_rating_range check (rating between 1 and 5) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'product_reviews_text_lengths') then
    alter table public.product_reviews
      add constraint product_reviews_text_lengths check (
        char_length(display_name) between 2 and 60
        and char_length(coalesce(title, '')) <= 100
        and char_length(body) between 5 and 1200
      ) not valid;
  end if;
end $$;
