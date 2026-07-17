-- ============================================================
-- NOMADIK: migration_v20_stories.sql
-- Complete Story Management System
-- ============================================================

-- ============================================================
-- TABLE: stories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stories (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title            text NOT NULL,
  slug             text UNIQUE NOT NULL,
  excerpt          text,
  content          text,
  cover_image      text,
  gallery          jsonb DEFAULT '[]',
  author_name      text,
  author_image     text,
  author_designation text,
  college_name     text,
  package_id       uuid REFERENCES public.journeys(id) ON DELETE SET NULL,
  destination_id   uuid REFERENCES public.destinations(id) ON DELETE SET NULL,
  category         text NOT NULL DEFAULT 'Adventure',
  rating           numeric(2,1) CHECK (rating >= 1 AND rating <= 5),
  trip_date        date,
  is_featured      boolean NOT NULL DEFAULT false,
  is_published     boolean NOT NULL DEFAULT false,
  reading_time     integer DEFAULT 5,
  views            integer NOT NULL DEFAULT 0,
  likes_count      integer NOT NULL DEFAULT 0,
  shares_count     integer NOT NULL DEFAULT 0,
  seo_title        text,
  seo_description  text,
  created_by       uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  updated_by       uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  published_at     timestamptz,
  created_at       timestamptz DEFAULT now() NOT NULL,
  updated_at       timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- TABLE: story_gallery
-- ============================================================
CREATE TABLE IF NOT EXISTS public.story_gallery (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id   uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  image_url  text NOT NULL,
  caption    text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- TABLE: story_views
-- ============================================================
CREATE TABLE IF NOT EXISTS public.story_views (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id   uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address text,
  device     text,
  browser    text,
  time_spent integer DEFAULT 0,  -- seconds
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- TABLE: story_likes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.story_likes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id   uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(story_id, user_id)
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_stories_slug          ON public.stories(slug);
CREATE INDEX IF NOT EXISTS idx_stories_published      ON public.stories(is_published);
CREATE INDEX IF NOT EXISTS idx_stories_featured       ON public.stories(is_featured);
CREATE INDEX IF NOT EXISTS idx_stories_category       ON public.stories(category);
CREATE INDEX IF NOT EXISTS idx_stories_package_id     ON public.stories(package_id);
CREATE INDEX IF NOT EXISTS idx_stories_destination_id ON public.stories(destination_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at     ON public.stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_gallery_story_id ON public.story_gallery(story_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id   ON public.story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_user_id    ON public.story_views(user_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_story_id   ON public.story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_user_id    ON public.story_likes(user_id);

-- ============================================================
-- UPDATED_AT trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_story_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stories_updated_at ON public.stories;
CREATE TRIGGER trg_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.set_story_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.stories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_likes   ENABLE ROW LEVEL SECURITY;

-- Helper: check admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE id = auth.uid()
  );
$$;

-- Stories: public can read published; admin has full access
CREATE POLICY IF NOT EXISTS "stories: public read published"
  ON public.stories FOR SELECT
  USING (is_published = true);

CREATE POLICY IF NOT EXISTS "stories: admin full access"
  ON public.stories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Story Gallery: public can read
CREATE POLICY IF NOT EXISTS "story_gallery: public read"
  ON public.story_gallery FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "story_gallery: admin full access"
  ON public.story_gallery FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Story Views: anyone can insert; admin can read all
CREATE POLICY IF NOT EXISTS "story_views: public insert"
  ON public.story_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "story_views: admin select"
  ON public.story_views FOR SELECT
  USING (public.is_admin());

-- Story Likes: auth users can insert/delete own; public can read counts
CREATE POLICY IF NOT EXISTS "story_likes: public select"
  ON public.story_likes FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "story_likes: auth insert"
  ON public.story_likes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "story_likes: auth delete own"
  ON public.story_likes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "story_likes: admin full access"
  ON public.story_likes FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- FUNCTION: increment story view count
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_story_views(p_story_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.stories SET views = views + 1 WHERE id = p_story_id;
END;
$$;

-- ============================================================
-- FUNCTION: update story likes_count from story_likes table
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_story_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.stories SET likes_count = likes_count + 1 WHERE id = NEW.story_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.stories SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.story_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_story_likes_sync ON public.story_likes;
CREATE TRIGGER trg_story_likes_sync
  AFTER INSERT OR DELETE ON public.story_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_story_likes_count();
