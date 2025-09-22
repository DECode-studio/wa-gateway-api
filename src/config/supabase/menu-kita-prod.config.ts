import { createClient } from '@supabase/supabase-js';

class MenuKitaProdSupabase {
  supabaseUrl = process.env.SUPABASE_MENU_KITA_PROD_URL || '';
  supabaseKey = process.env.SUPABASE_MENU_KITA_PROD_KEY || '';

  supabase = createClient(this.supabaseUrl, this.supabaseKey);

  constructor() {
    this.supabase;
  }
}

export default new MenuKitaProdSupabase();
