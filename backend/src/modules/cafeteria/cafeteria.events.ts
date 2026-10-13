import { publishChange } from '../../sockets/liveSync';

/**
 * Live-update hints for cafeteria data. Menu items and reviews are readable by every signed-in
 * user, so these reach everyone. Orders keep their own `order:*` events (owner + cafeteria staff).
 */

/** A dish was created, edited, archived, sold out/restocked, or its rating changed. */
export const emitMenuChanged = (menuItemIds: string[], reason: 'created' | 'updated' | 'archived' | 'stock' | 'rating') =>
  publishChange('menu', { all: true }, reason === 'created' ? 'created' : reason === 'archived' ? 'deleted' : 'updated', menuItemIds);

/** A review on a dish was added, edited or removed. */
export const emitReviewsChanged = (menuItemId: string) => publishChange('reviews', { all: true }, 'updated', [menuItemId]);
