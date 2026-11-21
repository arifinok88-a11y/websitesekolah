export interface Teacher {
  id: number;
  name: string;
  role: string;
  subject: string;
  nip: string;
  photo_url: string;
}

export interface NewsItem {
  id: number;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  image_url: string;
  published_date: string;
}

export interface SchoolProfile {
  id: number;
  name: string;
  tagline: string;
  about: string;
  vision: string;
  mission: string;
  address: string;
  phone: string;
  email: string;
  students_count: number;
  teachers_count: number;
  achievements_count: number;
}
