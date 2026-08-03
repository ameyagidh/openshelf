import { Activity } from '../models/Activity.js';
import { Follow } from '../models/Follow.js';

const PAGE_SIZE = 20;

export async function recordActivity(fields) {
  return Activity.create(fields);
}

/**
 * scope 'global' shows everyone's activity; 'following' restricts to the
 * people `forUser` follows (a simple $in query rather than a pipeline —
 * this is the "read side" of the feed; recommendationsFor in bookService
 * is where the aggregation-pipeline requirement lives).
 */
export async function getFeed({ forUser, scope = 'global', cursor, limit = PAGE_SIZE }) {
  const filter = {};
  if (cursor) filter._id = { $lt: cursor };

  if (scope === 'following') {
    const follows = await Follow.find({ follower: forUser }).select('followee').lean();
    const followeeIds = follows.map((f) => f.followee);
    filter.actor = { $in: [...followeeIds, forUser] };
  }

  const docs = await Activity.find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .populate('actor', 'name avatarUrl')
    .populate('book', 'title authorNames coverId')
    .populate('targetUser', 'name avatarUrl')
    .lean();

  const hasMore = docs.length > limit;
  const page = hasMore ? docs.slice(0, limit) : docs;

  return {
    activities: page,
    nextCursor: hasMore ? page[page.length - 1]._id.toString() : null,
  };
}
