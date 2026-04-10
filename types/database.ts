export type UserRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  email: string;
  created_at: string;
};

export type UserInsert = Omit<UserRow, 'created_at'> & {
  created_at?: string;
};

export type UserUpdate = Partial<Omit<UserRow, 'id'>>;

export type ColumnRow = {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  publish_day: number;
  publish_time: string;
  created_by: string;
  invite_code: string;
  created_at: string;
};

export type ColumnInsert = Omit<ColumnRow, 'id' | 'created_at' | 'invite_code'> & {
  id?: string;
  created_at?: string;
  invite_code?: string;
};

export type ColumnUpdate = Partial<Omit<ColumnRow, 'id' | 'created_by'>>;

export type ColumnMemberRow = {
  column_id: string;
  user_id: string;
  role: 'moderator' | 'contributor';
  joined_at: string;
};

export type ColumnMemberInsert = Omit<ColumnMemberRow, 'joined_at'> & {
  joined_at?: string;
};

export type ColumnMemberUpdate = {
  role?: 'moderator' | 'contributor';
};

export type PostRow = {
  id: string;
  column_id: string;
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

export type PostUpdate = Partial<Omit<PostRow, 'id' | 'column_id' | 'author_id'>>;

export type EditionRow = {
  id: string;
  column_id: string;
  edition_number: number;
  published_at: string;
  created_at: string;
};

export type EditionInsert = Omit<EditionRow, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type EditionUpdate = Partial<Omit<EditionRow, 'id' | 'column_id'>>;

export type Database = {
  public: {
    Tables: {
      users: { Row: UserRow; Insert: UserInsert; Update: UserUpdate };
      columns: { Row: ColumnRow; Insert: ColumnInsert; Update: ColumnUpdate };
      column_members: { Row: ColumnMemberRow; Insert: ColumnMemberInsert; Update: ColumnMemberUpdate };
      posts: { Row: PostRow; Insert: PostInsert; Update: PostUpdate };
      editions: { Row: EditionRow; Insert: EditionInsert; Update: EditionUpdate };
    };
  };
};
