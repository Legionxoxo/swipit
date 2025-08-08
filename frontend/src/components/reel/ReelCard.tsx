import ReelActions from './ReelActions';
import ReelDetails from './ReelDetails';
import ReelThumbnail from './ReelThumbnail';

interface InstagramReel {
    reel_id: string;
    reel_shortcode: string;
    reel_url: string;
    reel_thumbnail_url: string;
    reel_caption: string;
    reel_likes: number;
    reel_comments: number;
    reel_views: number;
    reel_date_posted: string;
    reel_duration: number;
    reel_hashtags: string[];
    reel_mentions: string[];
    // Additional fields for Instagram posts tracked via oEmbed
    embed_link?: string;
    post_link?: string;
    hashtags?: string[];
}

interface ReelCardProps {
    reel: InstagramReel;
    creatorName: string;
    followerCount?: number;
    viewMode?: 'grid' | 'list';
}

export default function ReelCard({ reel, creatorName: _creatorName, followerCount, viewMode = 'grid' }: ReelCardProps) {
    if (viewMode === 'list') {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 p-4">
                <div className="flex gap-4">
                    <div className="relative flex-shrink-0 w-40 h-24 overflow-hidden rounded">
                        <ReelThumbnail reel={reel} followerCount={followerCount} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <ReelDetails reel={reel} compact={true} />
                    </div>
                    <div className="flex-shrink-0 ml-4">
                        <ReelActions
                            reelId={reel.reel_id}
                            reelTitle={reel.reel_caption || 'Instagram Reel'}
                            thumbnailUrl={reel.reel_thumbnail_url}
                            reelUrl={reel.reel_url || reel.post_link || ''}
                            embedLink={reel.embed_link}
                            postLink={reel.post_link}
                            reelCaption={reel.reel_caption}
                            reelHashtags={reel.reel_hashtags?.length > 0 ? reel.reel_hashtags : (reel.hashtags || [])}
                            layout="inline"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 relative flex flex-col h-full">
            <div className="relative h-48">
                <ReelThumbnail reel={reel} followerCount={followerCount} />
                <ReelActions
                    reelId={reel.reel_id}
                    reelTitle={reel.reel_caption || 'Instagram Reel'}
                    thumbnailUrl={reel.reel_thumbnail_url}
                    reelUrl={reel.reel_url || reel.post_link || ''}
                    embedLink={reel.embed_link}
                    postLink={reel.post_link}
                    reelCaption={reel.reel_caption}
                    reelHashtags={reel.reel_hashtags?.length > 0 ? reel.reel_hashtags : (reel.hashtags || [])}
                />
            </div>
            <ReelDetails reel={reel} />
        </div>
    );
}