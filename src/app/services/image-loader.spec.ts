import { TestBed } from '@angular/core/testing';

import { ImageLoader } from './image-loader';

describe('ImageLoader', () => {
  let service: ImageLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageLoader);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
