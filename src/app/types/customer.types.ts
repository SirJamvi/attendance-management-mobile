export interface Customer {
  id: number;
  name: string;
  address: string;
  google_maps_link: string;
  phone: string | null;
  is_active: boolean;
}