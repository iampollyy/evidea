export interface Option<T extends string> {
  value: T;
  label: string;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface Loaded<T> {
  key: string;
  data: T | null;
  error: string | null;
}

export interface PageControl {
  label: string;
  targetPage: number;
  disabled: boolean;
}
