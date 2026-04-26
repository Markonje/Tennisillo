export type ActivityType =
  | 'match'
  | 'availability'
  | 'ranking'
  | 'message'
  | 'system'
  | 'badge'
  | 'sparring'
  | 'challenge'
  | 'admin';

export interface ActivityFeedItem {
  id: string;
  text: string;
  time: string;
  type: ActivityType;
}
