export interface EmployeePublic {
  id: string;
  slug: string;
  full_name: string;
  designation: string;
  bio: string | null;
  profile_image: string | null;
  email: string;
  phone: string;
  linkedin_url: string | null;
  website_url: string | null;
  address: string | null;
  is_active: boolean;
  social_links: SocialLinkPublic[];
  phone_numbers: PhoneNumberPublic[];
  qr_code: QRCodePublic | null;
}

export interface PhoneNumberPublic {
  id: string;
  country_code: string;
  number: string;
  label: string | null;
  is_primary: boolean;
}

export interface SocialLinkPublic {
  id: string;
  platform: string;
  url: string;
}

export interface QRCodePublic {
  id: string;
  qr_url: string;
  scan_count: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}
