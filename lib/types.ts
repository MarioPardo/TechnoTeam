export type Database = {
  public: {
    Tables: {
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at'>
        Update: Partial<Omit<Event, 'id' | 'created_at'>>
      }
      stages: {
        Row: Stage
        Insert: Omit<Stage, 'id' | 'created_at'>
        Update: Partial<Omit<Stage, 'id' | 'created_at'>>
      }
      performances: {
        Row: Performance
        Insert: Omit<Performance, 'id' | 'created_at'>
        Update: Partial<Omit<Performance, 'id' | 'created_at'>>
      }
      groups: {
        Row: Group
        Insert: Omit<Group, 'id' | 'created_at'>
        Update: Partial<Omit<Group, 'id' | 'created_at'>>
      }
      members: {
        Row: Member
        Insert: Omit<Member, 'id' | 'created_at'>
        Update: Partial<Omit<Member, 'id' | 'created_at'>>
      }
      plans: {
        Row: Plan
        Insert: Omit<Plan, 'id' | 'created_at'>
        Update: Partial<Omit<Plan, 'id' | 'created_at'>>
      }
    }
  }
}

export type Event = {
  id: string
  name: string
  date_start: string
  date_end: string
  location: string
  timezone: string
  description: string | null
  image_url: string | null
  image_url_dark: string | null
  links: Array<{ label: string; url: string }> | null
  password_hash: string | null
  created_at: string
}

export type Stage = {
  id: string
  event_id: string
  name: string
  order_index: number
  color: string | null
  created_at: string
}

export type Performance = {
  id: string
  stage_id: string
  artist: string
  start_time: string
  end_time: string
  description: string | null
  created_at: string
}

export type Group = {
  id: string
  event_id: string
  name: string
  code: string
  created_at: string
}

export type Member = {
  id: string
  group_id: string
  name: string
  session_token: string
  created_at: string
}

export type Plan = {
  id: string
  member_id: string
  performance_id: string
  created_at: string
}

export type Message = {
  id: string
  group_id: string
  member_id: string
  content: string
  created_at: string
}

export type PerformanceWithPlans = Performance & {
  plans: (Plan & { members: Member })[]
}

export type StageWithPerformances = Stage & {
  performances: PerformanceWithPlans[]
}

export type GroupWithMembers = Group & {
  members: Member[]
}
