-- Run this in Supabase Dashboard → SQL Editor

-- Profiles table (auto-created on signup)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Progress table
CREATE TABLE user_progress (
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  question_id INT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('attempted', 'solved')),
  solved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Skill tree micro-exercise progress
CREATE TABLE IF NOT EXISTS skill_tree_progress (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, node_id, exercise_id)
);

ALTER TABLE skill_tree_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skill tree progress"
  ON skill_tree_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skill tree progress"
  ON skill_tree_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skill tree progress"
  ON skill_tree_progress FOR UPDATE USING (auth.uid() = user_id);
