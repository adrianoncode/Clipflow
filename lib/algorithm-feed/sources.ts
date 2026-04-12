/**
 * RSS feed sources for algorithm update monitoring.
 * These are curated sources that regularly publish about platform algorithm changes.
 */
export const ALGORITHM_FEED_SOURCES = [
  {
    name: 'Social Media Today',
    url: 'https://www.socialmediatoday.com/feed/',
    platforms: ['tiktok', 'instagram', 'youtube', 'linkedin'],
  },
  {
    name: 'Later Blog',
    url: 'https://later.com/blog/feed/',
    platforms: ['instagram', 'tiktok'],
  },
  {
    name: 'Buffer Blog',
    url: 'https://buffer.com/resources/feed/',
    platforms: ['instagram', 'tiktok', 'linkedin', 'youtube'],
  },
  {
    name: 'Hootsuite Blog',
    url: 'https://blog.hootsuite.com/feed/',
    platforms: ['instagram', 'tiktok', 'linkedin', 'youtube'],
  },
] as const
