const Banner = require('../admin/Banner');

// @desc    Get public active banners for users
// @route   GET /api/public/banners
// @access  Public
exports.getPublicBanners = async (req, res, next) => {
    try {
        const { placement, platform, category } = req.query;

        const now = new Date();
        const filter = {
            status: 'Active',
            isActive: true,
            target: { $in: ['All', 'User'] },
            $or: [
                { startDate: { $exists: false } },
                { startDate: null },
                { startDate: { $lte: now } }
            ],
            $and: [
                {
                    $or: [
                        { endDate: { $exists: false } },
                        { endDate: null },
                        { endDate: { $gte: now } }
                    ]
                }
            ]
        };

        if (placement) {
            filter.placement = placement;
        }

        if (platform) {
            filter.platform = { $in: ['All', platform] };
        }

        if (category && category !== 'All') {
            filter.category = { $in: ['All', category] };
        }

        const banners = await Banner.find(filter)
            .select('_id title description imageUrl linkUrl placement platform category')
            .sort('-createdAt')
            .lean();

        res.status(200).json({
            success: true,
            count: banners.length,
            data: banners
        });
    } catch (err) {
        next(err);
    }
};
