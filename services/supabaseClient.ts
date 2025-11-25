
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hwbhozkytdjdgzsgtqds.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3Ymhvemt5dGRqZGd6c2d0cWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTY3MzIsImV4cCI6MjA3OTU5MjczMn0.239ZvJzir__ZREz4LWJNbquL9QvulQjSeAPtqhV3tmE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
