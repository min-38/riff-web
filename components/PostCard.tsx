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
  available: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 border border-primary-200 dark:border-primary-800',
  reserved: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
  sold: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700',
};

export default function PostCard({ post }: PostCardProps) {
  const formattedPrice = post.price.toLocaleString('ko-KR');
  const formattedDate = new Date(post.createdAt).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="group cursor-pointer">
      <div className="rounded-2xl border border-border overflow-hidden hover:border-primary-500/40 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-500 transform hover:-translate-y-1" style={{ background: 'var(--background)' }}>
        {/* Image */}
        <div
          className="relative w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden"
          style={{
            aspectRatio: '1 / 1',
            minHeight: '200px',
            containIntrinsicSize: '100% 100%',
            contentVisibility: 'auto'
          }}
        >
          <Image
            src={post.images[0]}
            alt={post.title}
            fill
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            style={{ width: '100%', height: '100%' }}
          />
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Status badge */}
          <div className="absolute top-3 right-3">
            <span
              className={`px-3 py-1.5 text-xs font-semibold rounded-full backdrop-blur-md ${
                statusColors[post.status]
              }`}
            >
              {statusLabels[post.status]}
            </span>
          </div>

          {/* Quick view on hover */}
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button className="w-full px-4 py-2.5 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm text-foreground font-semibold rounded-lg hover:bg-primary-500 hover:text-white transition-colors">
              빠른 보기
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 line-clamp-2 leading-tight group-hover:text-primary-600 transition-colors">
            {post.title}
          </h3>

          <div className="mb-4">
            <p className="text-2xl font-bold text-foreground">
              {formattedPrice}
              <span className="text-base font-normal text-neutral-500 dark:text-neutral-400 ml-1">원</span>
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {post.location || '미표시'}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {post.viewCount}
              </span>
            </div>
            <span className="text-neutral-400 dark:text-neutral-500">{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
