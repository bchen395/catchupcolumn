export type UserRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  email: string;
  created_at: string;
};

export type UserInsert = Omit<UserRow, 'created_at' | 'avatar_url' | 'bio'> & {
  created_at?: string;
  avatar_url?: string | null;
  bio?: string | null;
};

export type UserUpdate = Partial<Omit<UserRow, 'id'>>;

export type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  publish_day: number;
  publish_time: string;
  timezone: string;
  created_by: string;
  invite_code: string;
  created_at: string;
};

export type GroupInsert = Omit<GroupRow, 'id' | 'created_at' | 'invite_code' | 'cover_image_url' | 'timezone'> & {
  id?: string;
  created_at?: string;
  invite_code?: string;
  cover_image_url?: string | null;
  timezone?: string;
};

export type GroupUpdate = Partial<Omit<GroupRow, 'id' | 'created_by'>>;

export type GroupMemberRow = {
  group_id: string;
  user_id: string;
  role: 'moderator' | 'contributor';
  joined_at: string;
};

export type GroupMemberInsert = Omit<GroupMemberRow, 'joined_at'> & {
  joined_at?: string;
};

export type GroupMemberUpdate = {
  role?: 'moderator' | 'contributor';
};

export type PostRow = {
  id: string;
  group_id: string;
  author_id: string;
  body: string;
  image_url: string | null;
  edition_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PostInsert = Omit<PostRow, 'id' | 'created_at' | 'updated_at' | 'edition_id'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  edition_id?: string | null;
};

export type PostUpdate = Partial<Omit<PostRow, 'id' | 'group_id' | 'author_id'>>;

export type EditionRow = {
  id: string;
  group_id: string;
  edition_number: number;
  published_at: string;
  created_at: string;
};

export type EditionInsert = Omit<EditionRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type EditionUpdate = Partial<Omit<EditionRow, 'id' | 'group_id'>>;

// Derived types for common query patterns
export type GroupWithMembers = GroupRow & {
  members: (GroupMemberRow & { user: UserRow })[];
};

export type EditionWithPosts = EditionRow & {
  posts: (PostRow & { author: UserRow })[];
};

export type PostWithAuthor = PostRow & {
  author: UserRow;
};

export type Database = {
  public: {
    Tables: {
      users: { Row: UserRow; Insert: UserInsert; Update: UserUpdate; Relationships: [] };
      groups: { Row: GroupRow; Insert: GroupInsert; Update: GroupUpdate; Relationships: [] };
      group_members: {
        Row: GroupMemberRow;
        Insert: GroupMemberInsert;
        Update: GroupMemberUpdate;
        Relationships: [];
      };
      posts: { Row: PostRow; Insert: PostInsert; Update: PostUpdate; Relationships: [] };
      editions: { Row: EditionRow; Insert: EditionInsert; Update: EditionUpdate; Relationships: [] };
    };
    Views: {};
    Functions: {
      find_group_by_invite_code: {
        Args: { p_invite_code: string };
        Returns: GroupRow[];
      };
      delete_group_as_moderator: {
        Args: { p_group_id: string };
        Returns: void;
      };
      get_groups_to_compile: {
        Args: { p_tolerance_minutes?: number };
        Returns: Pick<GroupRow, 'id' | 'name' | 'timezone' | 'publish_day' | 'publish_time'>[];
      };
      compile_due_editions: {
        Args: { p_tolerance_minutes?: number };
        Returns: {
          compiled: number;
          skipped_no_posts: number;
          details: (
            | { group_id: string; group_name: string; edition_number: number; post_count: number }
            | { group_id: string; group_name: string; skipped: true; reason: string }
          )[];
        };
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
};
