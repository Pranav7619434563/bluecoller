// lib/supabase/mock-client.ts

const MOCK_WORKERS = [
  {
    id: "worker-1",
    user_id: "u1",
    full_name: "Rajesh Kumar",
    city: "Mumbai",
    job_category: "Plumber",
    hourly_rate: 400,
    avg_rating: 4.8,
    availability: true,
    bio: "Expert plumber with 10 years of experience in home repairs and piping.",
    experience_years: 10,
    avatar_url: null,
    role: "worker"
  },
  {
    id: "worker-2",
    user_id: "u2",
    full_name: "Amit Singh",
    city: "Delhi",
    job_category: "Electrician",
    hourly_rate: 350,
    avg_rating: 4.5,
    availability: true,
    bio: "Certified electrician for all your wiring and appliance needs.",
    experience_years: 7,
    avatar_url: null,
    role: "worker"
  },
  {
    id: "worker-3",
    user_id: "u3",
    full_name: "Suresh Patil",
    city: "Mumbai",
    job_category: "Carpenter",
    hourly_rate: 600,
    avg_rating: 4.9,
    availability: true,
    bio: "Custom furniture maker and wood repair specialist.",
    experience_years: 15,
    avatar_url: null,
    role: "worker"
  },
  {
    id: "worker-4",
    user_id: "u4",
    full_name: "Vijay Verma",
    city: "Bangalore",
    job_category: "Painter",
    hourly_rate: 300,
    avg_rating: 4.2,
    availability: false,
    bio: "Interior and exterior wall painting with premium finishes.",
    experience_years: 4,
    avatar_url: null,
    role: "worker"
  }
]

export const createMockClient = () => {
  const handler = {
    auth: {
      getUser: async () => ({
        data: { user: { id: "mock-user-id", email: "test@example.com", user_metadata: { role: localStorage.getItem("mock_role") || "worker" } } },
        error: null,
      }),
      getSession: async () => ({
        data: { session: { user: { id: "mock-user-id" } } },
        error: null,
      }),
      signInWithPassword: async ({ email }: { email: string }) => {
        const role = email.includes("worker") ? "worker" : "customer"
        localStorage.setItem("mock_role", role)
        return { data: { user: { id: "mock-user-id", email } }, error: null }
      },
      signUp: async ({ email, options }: any) => {
        // If role is in options, set it. Otherwise try to infer.
        const role = options?.data?.role || (email.includes("worker") ? "worker" : "customer")
        localStorage.setItem("mock_role", role)
        return { data: { user: { id: "mock-user-id", email } }, error: null }
      },
      signOut: async () => {
        localStorage.removeItem("mock_role")
        return { error: null }
      },
      onAuthStateChange: (callback: any) => {
        return { data: { subscription: { unsubscribe: () => {} } } }
      }
    },
    from: (table: string) => {
      const createBuilder = (data: any) => {
        const builder: any = {
          data,
          error: null,
          select: (query: string) => createBuilder(table === "profiles" ? MOCK_WORKERS : []),
          insert: (values: any) => {
             if (table === "profiles" && values.role) {
                localStorage.setItem("mock_role", values.role)
             }
             return Promise.resolve({ data: values, error: null })
          },
          update: (values: any) => {
             return {
                eq: (col: string, val: any) => Promise.resolve({ data: values, error: null })
             }
          },
          eq: (col: string, val: any) => {
            if (table === "profiles" && col === "user_id") {
               return createBuilder({
                  id: "mock-profile-id",
                  user_id: "mock-user-id",
                  full_name: "John Doe (Mock)",
                  role: localStorage.getItem("mock_role") || "worker",
                  city: "Mumbai",
                  job_category: "Plumber",
                  availability: true,
                  hourly_rate: 500,
                  experience_years: 5,
                  avg_rating: 4.8
                })
            }
            if (table === "profiles" && col === "role") {
               return createBuilder(MOCK_WORKERS)
            }
            return createBuilder(Array.isArray(data) ? data.filter((item: any) => item[col] === val) : data)
          },
          ilike: (col: string, val: any) => builder,
          lte: (col: string, val: any) => builder,
          order: (col: string, opts: any) => builder,
          single: async () => ({ data: Array.isArray(data) ? data[0] : data, error: null }),
          then: (onfulfilled: any) => {
            return Promise.resolve({ data, error: null }).then(onfulfilled)
          }
        }
        return builder
      }
      return createBuilder([])
    },
    channel: () => ({
      on: () => ({
        subscribe: () => ({})
      })
    }),
    removeChannel: () => {}
  }
  return handler as any
}
