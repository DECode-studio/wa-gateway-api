import { createClient } from '@supabase/supabase-js';

class MenuKitaStageSupabase {
  supabaseUrl = process.env.SUPABASE_MENU_KITA_STAGE_URL || '';
  supabaseKey = process.env.SUPABASE_MENU_KITA_STAGE_KEY || '';

  supabase = createClient(this.supabaseUrl, this.supabaseKey);

  constructor() {
    this.supabase;
  }
}

export default new MenuKitaStageSupabase();
