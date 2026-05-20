-- WorkForce AI Database Schema & RLS Policies

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    role TEXT CHECK (role IN ('customer', 'worker')) NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    city TEXT,
    pincode TEXT,
    bio TEXT,
    job_category TEXT,
    hourly_rate NUMERIC DEFAULT 0,
    daily_rate NUMERIC DEFAULT 0,
    project_rate NUMERIC DEFAULT 0,
    availability BOOLEAN DEFAULT true,
    experience_years INTEGER DEFAULT 0,
    avg_rating NUMERIC DEFAULT 0,
    profile_views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create work_experience table
CREATE TABLE work_experience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    years TEXT NOT NULL,
    description TEXT
);

-- Create documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('aadhaar', 'certificate', 'sample')) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    budget NUMERIC,
    date_needed DATE NOT NULL,
    status TEXT CHECK (status IN ('open', 'closed')) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    job_description TEXT NOT NULL,
    date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    estimated_hours NUMERIC NOT NULL,
    address TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'paid')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    last_message TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    file_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    razorpay_order_id TEXT NOT NULL,
    razorpay_payment_id TEXT,
    status TEXT CHECK (status IN ('pending', 'paid')) DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Create reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Helper to get auth user's profile id
CREATE OR REPLACE FUNCTION public.get_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles:
-- Workers and Customers can update their own row
-- Everyone can read all rows
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Work Experience: Only the employee who owns them can CRUD, everyone can read
CREATE POLICY "Work experience is viewable by everyone." ON work_experience FOR SELECT USING (true);
CREATE POLICY "Employees can insert their own work experience." ON work_experience FOR INSERT WITH CHECK (employee_id = get_profile_id());
CREATE POLICY "Employees can update their own work experience." ON work_experience FOR UPDATE USING (employee_id = get_profile_id());
CREATE POLICY "Employees can delete their own work experience." ON work_experience FOR DELETE USING (employee_id = get_profile_id());

-- Documents: Only the employee who owns them can CRUD
CREATE POLICY "Employees can view own documents" ON documents FOR SELECT USING (employee_id = get_profile_id());
CREATE POLICY "Employees can insert own documents" ON documents FOR INSERT WITH CHECK (employee_id = get_profile_id());
CREATE POLICY "Employees can update own documents" ON documents FOR UPDATE USING (employee_id = get_profile_id());
CREATE POLICY "Employees can delete own documents" ON documents FOR DELETE USING (employee_id = get_profile_id());

-- Jobs: Everyone can read, only the customer can CRUD
CREATE POLICY "Jobs are viewable by everyone." ON jobs FOR SELECT USING (true);
CREATE POLICY "Customers can insert their own jobs." ON jobs FOR INSERT WITH CHECK (customer_id = get_profile_id());
CREATE POLICY "Customers can update their own jobs." ON jobs FOR UPDATE USING (customer_id = get_profile_id());
CREATE POLICY "Customers can delete their own jobs." ON jobs FOR DELETE USING (customer_id = get_profile_id());

-- Bookings: Only the customer or employee involved can CRUD
CREATE POLICY "Users can view own bookings." ON bookings FOR SELECT USING (customer_id = get_profile_id() OR employee_id = get_profile_id());
CREATE POLICY "Customers can insert bookings." ON bookings FOR INSERT WITH CHECK (customer_id = get_profile_id());
CREATE POLICY "Users can update own bookings." ON bookings FOR UPDATE USING (customer_id = get_profile_id() OR employee_id = get_profile_id());

-- Conversations: Only the two parties involved
CREATE POLICY "Users can view own conversations." ON conversations FOR SELECT USING (customer_id = get_profile_id() OR employee_id = get_profile_id());
CREATE POLICY "Users can insert own conversations." ON conversations FOR INSERT WITH CHECK (customer_id = get_profile_id() OR employee_id = get_profile_id());
CREATE POLICY "Users can update own conversations." ON conversations FOR UPDATE USING (customer_id = get_profile_id() OR employee_id = get_profile_id());

-- Messages: Only the two parties involved in the conversation
CREATE POLICY "Users can view messages in their conversations." ON messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = messages.conversation_id AND (c.customer_id = get_profile_id() OR c.employee_id = get_profile_id())
    )
);
CREATE POLICY "Users can insert messages in their conversations." ON messages FOR INSERT WITH CHECK (sender_id = get_profile_id());

-- Payments: Only the customer who made it
CREATE POLICY "Customers can view their payments." ON payments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = payments.booking_id AND b.customer_id = get_profile_id()
    )
);
CREATE POLICY "Customers can insert payments." ON payments FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = payments.booking_id AND b.customer_id = get_profile_id()
    )
);
CREATE POLICY "Customers can update their payments." ON payments FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = payments.booking_id AND b.customer_id = get_profile_id()
    )
);

-- Reviews: Everyone can read, customer who wrote it can CRUD
CREATE POLICY "Reviews are viewable by everyone." ON reviews FOR SELECT USING (true);
CREATE POLICY "Customers can insert their own reviews." ON reviews FOR INSERT WITH CHECK (customer_id = get_profile_id());
CREATE POLICY "Customers can update their own reviews." ON reviews FOR UPDATE USING (customer_id = get_profile_id());
CREATE POLICY "Customers can delete their own reviews." ON reviews FOR DELETE USING (customer_id = get_profile_id());
