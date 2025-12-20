import Image from 'next/image';
import { Post } from '@/types/post';

interface PostCardProps {
  post: Post;
}

const statusLabels: Record<Post['status'], string> = {
  available: '판매중',
  reserved: '예약중',
  sold: '판매완료',
};

const statusColors: Record<Post['status'], string> = {
  available: 'bg-blue-100 text-blue-800',
  reserved: 'bg-yellow-100 text-yellow-800',
  sold: 'bg-gray-100 text-gray-800',
};

export default function PostCard({ post }: PostCardProps) {
  const formattedPrice = post.price.toLocaleString('ko-KR');
  const formattedDate = new Date(post.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      {/* Image */}
      <div className="relative w-full aspect-[4/3] sm:aspect-square bg-gray-100">
        <Image
          src={post.images[0]}
          alt={post.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-2 py-1 text-xs font-semibold rounded ${
              statusColors[post.status]
            }`}
          >
            {statusLabels[post.status]}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2 line-clamp-1">
          {post.title}
        </h3>

        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <p className="text-lg sm:text-xl font-bold text-gray-900">{formattedPrice}원</p>
          <span className="text-sm text-gray-500">
            {post.condition === 'new' ? '새상품' : '중고'}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{post.location || '지역 미표시'}</span>
          <span>{formattedDate}</span>
        </div>

        <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-500">
          조회 {post.viewCount}
        </div>
      </div>
    </div>
  );
}
