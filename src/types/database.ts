
export interface Category {
    id: string;
    name: string;
    color?: string | null;
    is_deleted: boolean;
    updated_at: string;
}

export interface Hardware {
    id: string;
    description?: string | null;
    category?: string | null;
    quantity?: string | null;
    wholesale_price?: number | null;
    retail_price?: number | null;
    updated_at?: string | null;
    is_deleted: boolean;
    wholesale_price_unit?: string | null;
    retail_price_unit?: string | null;
    updated_by?: string | null;
    location?: any | null;
    category_id?: string | null;
}

export interface User {
    id: string;
    email: string;
    password_hash: string;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface Note {
    id: string;
    title?: string | null;
    body?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    is_deleted: boolean;
}

export interface AuditLog {
    id: string;
    item_id: string;
    username?: string | null;
    change_description: string;
    created_at: string;
    is_synced?: number;
}
