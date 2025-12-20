export type PostStatus = 'available' | 'reserved' | 'sold';

export type InstrumentCategory =
  | 'guitar'
  | 'bass'
  | 'drum'
  | 'keyboard'
  | 'wind'
  | 'string'
  | 'etc';

export type ProductCondition = 'new' | 'used';

export interface Post {
  id: string;
  title: string;
  price: number;
  status: PostStatus;
  category: InstrumentCategory;
  condition: ProductCondition;
  images: string[];
  description: string;
  location?: string;
  createdAt: Date;
  viewCount: number;
}
