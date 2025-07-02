import { TestBed } from '@angular/core/testing';

import { AuthSupabase } from './auth-supabase';

describe('AuthSupabase', () => {
  let service: AuthSupabase;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthSupabase);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
