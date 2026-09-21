const mongoose = require('mongoose');
const Vendor = require('./Vendor');
const Review = require('./Review');
const Booking = require('./Booking');
const Lead = require('./Lead');
const Category = require('../admin/Category');
const Favorite = require('../user/Favorite');
const Service = require('./Service');

// Helper to escape special regex characters to prevent ReDoS
const escapeRegex = (string) => {
    if (typeof string !== 'string') return '';
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Helper to parse numeric price from string or number
const parsePriceValue = (val) => {
    if (typeof val === 'number') return val;
    if (!val || typeof val !== 'string') return null;
    const clean = val.toLowerCase().replace(/,/g, '').trim();
    // Check for 'k' notation like '50k' -> 50000
    const kMatch = clean.match(/(\d+(?:\.\d+)?)\s*k/);
    if (kMatch) {
        return parseFloat(kMatch[1]) * 1000;
    }
    // Match first sequence of digits
    const numMatch = clean.match(/\d+/);
    return numMatch ? parseInt(numMatch[0], 10) : null;
};

// Compute starting price for a vendor
const computeVendorStartingPrice = (vendor) => {
    const prices = [];
    if (typeof vendor.startingPrice === 'number' && vendor.startingPrice > 0) {
        prices.push(vendor.startingPrice);
    }
    if (Array.isArray(vendor.services)) {
        vendor.services.forEach(srv => {
            if (typeof srv.price === 'number' && srv.price > 0) {
                prices.push(srv.price);
            }
            if (srv.price && typeof srv.price === 'object') {
                const srvP = srv.price.discounted || srv.price.original;
                if (typeof srvP === 'number' && srvP > 0) {
                    prices.push(srvP);
                }
            }
            if (Array.isArray(srv.packages)) {
                srv.packages.forEach(pkg => {
                    if (typeof pkg.price === 'number' && pkg.price > 0) {
                        prices.push(pkg.price);
                    }
                });
            }
        });
    }
    if (vendor.pricing && vendor.pricing.range) {
        const parsed = parsePriceValue(vendor.pricing.range);
        if (parsed) prices.push(parsed);
    }
    return prices.length > 0 ? Math.min(...prices) : 0;
};

// @desc    Get all public approved vendors with search, filters, sorting & pagination
// @route   GET /api/vendors
// @access  Public
exports.getPublicVendors = async (req, res, next) => {
    try {
        const {
            category,
            subCategory,
            city,
            search,
            sort,
            minPrice,
            maxPrice,
            minRating,
            minExperience,
            serviceType,
            featured,
            date,
            availability,
            page = 1,
            limit = 12
        } = req.query;

        // Base filter: only approved and active vendors
        const filter = {
            status: 'Approved',
            isActive: { $ne: false }
        };

        if (city && city !== 'all') {
            const escapedCity = escapeRegex(city.trim());
            filter.$and = filter.$and || [];
            filter.$and.push({
                $or: [
                    { city: new RegExp(`^${escapedCity}$`, 'i') },
                    { 'businessDetails.serviceCities': new RegExp(`^${escapedCity}$`, 'i') },
                    { serviceCities: new RegExp(`^${escapedCity}$`, 'i') }
                ]
            });
        }

        if (featured === 'true' || featured === true) {
            filter.isFeatured = true;
        }

        if (search && search.trim()) {
            const escapedSearch = escapeRegex(search.trim());
            const searchRegex = new RegExp(escapedSearch, 'i');

            // Find vendors who have services with matching name or description in the canonical Service collection
            const matchingServiceVendorIds = await Service.distinct('vendor', {
                isActive: { $ne: false },
                $or: [
                    { name: searchRegex },
                    { shortDescription: searchRegex },
                    { detailedDescription: searchRegex }
                ]
            });

            const searchConditions = [
                { businessName: searchRegex },
                { 'businessDetails.description': searchRegex },
                { city: searchRegex },
                { 'services.name': searchRegex },
                { 'selectedCategories.categoryName': searchRegex },
                { category: searchRegex }
            ];

            if (matchingServiceVendorIds && matchingServiceVendorIds.length > 0) {
                searchConditions.push({ _id: { $in: matchingServiceVendorIds } });
            }

            filter.$and = filter.$and || [];
            filter.$and.push({ $or: searchConditions });
        }

        if (category && category !== 'all') {
            const trimmedCat = category.trim();
            const catDoc = await Category.findOne({
                $or: [
                    { slug: trimmedCat.toLowerCase() },
                    { name: new RegExp(`^${escapeRegex(trimmedCat)}$`, 'i') }
                ]
            });

            const catRegex = catDoc
                ? new RegExp(`^${escapeRegex(catDoc.name)}$`, 'i')
                : new RegExp(escapeRegex(trimmedCat.replace(/-/g, ' ')), 'i');

            const catConditions = [
                { 'selectedCategories.categoryName': catRegex },
                { 'services.category': catRegex },
                { category: catRegex }
            ];

            if (catDoc) {
                catConditions.unshift({ 'selectedCategories.categoryId': catDoc._id });
            }

            // Also check canonical Service collection for active services under this category
            const serviceCatQuery = { isActive: { $ne: false } };
            if (catDoc) {
                serviceCatQuery.category = catDoc._id;
            } else {
                const matchedCats = await Category.find({ name: catRegex }).select('_id');
                if (matchedCats.length > 0) {
                    serviceCatQuery.category = { $in: matchedCats.map(c => c._id) };
                }
            }
            const serviceVendorIds = await Service.distinct('vendor', serviceCatQuery);
            if (serviceVendorIds && serviceVendorIds.length > 0) {
                catConditions.push({ _id: { $in: serviceVendorIds } });
            }

            filter.$and = filter.$and || [];
            filter.$and.push({ $or: catConditions });
        }

        if (subCategory && subCategory !== 'all') {
            const subRegex = new RegExp(escapeRegex(subCategory.trim()), 'i');
            filter.$and = filter.$and || [];
            filter.$and.push({
                $or: [
                    { 'selectedCategories.subcategories.subcategoryName': subRegex },
                    { 'services.name': subRegex }
                ]
            });
        }

        if (serviceType && serviceType !== 'all') {
            const srvRegex = new RegExp(escapeRegex(serviceType.trim()), 'i');
            filter.$and = filter.$and || [];
            filter.$and.push({
                $or: [
                    { 'services.name': srvRegex },
                    { 'services.category': srvRegex }
                ]
            });
        }

        // Date availability check: exclude vendors booked on requested date
        if (date && (availability === 'available' || availability === 'true')) {
            const targetDate = new Date(date);
            if (!isNaN(targetDate.getTime())) {
                const startOfDay = new Date(targetDate);
                startOfDay.setUTCHours(0, 0, 0, 0);
                const endOfDay = new Date(targetDate);
                endOfDay.setUTCHours(23, 59, 59, 999);

                const bookedVendorIds = await Booking.distinct('vendorId', {
                    eventDate: { $gte: startOfDay, $lte: endOfDay },
                    status: 'Confirmed'
                });

                filter.$and = filter.$and || [];
                filter.$and.push({
                    _id: { $nin: bookedVendorIds },
                    blockedDates: { $not: { $elemMatch: { $gte: startOfDay, $lte: endOfDay } } }
                });
            }
        }

        // Fetch all matching vendors to compute review aggregates, starting prices & sorting
        const rawVendors = await Vendor.find(filter)
            .select('-password -documents -bank -bankDetails -notifications -role -subscription.orderId -subscription.paymentId -otp -resetPasswordToken -__v')
            .lean();

        // Get review stats for matching vendors
        const vendorIds = rawVendors.map(v => v._id);
        const reviews = await Review.aggregate([
            { $match: { vendorId: { $in: vendorIds }, status: 'Approved' } },
            {
                $group: {
                    _id: '$vendorId',
                    avgRating: { $avg: '$rating' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const reviewMap = {};
        reviews.forEach(r => {
            reviewMap[r._id.toString()] = {
                rating: Math.round(r.avgRating * 10) / 10,
                reviewCount: r.count
            };
        });

        // Batch fetch active canonical services for all matching vendors
        const canonicalServices = await Service.find({
            vendor: { $in: vendorIds },
            isActive: { $ne: false }
        })
            .populate('category', 'name slug')
            .sort('-createdAt')
            .lean();

        const servicesByVendor = {};
        canonicalServices.forEach(srv => {
            const vKey = srv.vendor.toString();
            if (!servicesByVendor[vKey]) servicesByVendor[vKey] = [];
            servicesByVendor[vKey].push(srv);
        });

        // Enrich vendors with canonical rating, canonical services & calculated starting price
        let enriched = rawVendors.map(v => {
            const vKey = v._id.toString();
            const rev = reviewMap[vKey] || { rating: 0, reviewCount: 0 };
            const activeServices = (servicesByVendor[vKey] && servicesByVendor[vKey].length > 0)
                ? servicesByVendor[vKey]
                : (v.services || []);

            const serviceCatNames = activeServices
                .map(s => (typeof s.category === 'object' ? s.category?.name : s.category))
                .filter(Boolean);

            const primaryCategory = v.category || serviceCatNames[0] || (v.selectedCategories && v.selectedCategories[0]?.categoryName) || '';

            // Ensure selectedCategories includes categories from canonical services
            const existingCatNames = (v.selectedCategories || []).map(c => (c.categoryName || '').toLowerCase());
            const enrichedSelectedCategories = [...(v.selectedCategories || [])];
            serviceCatNames.forEach(catName => {
                if (!existingCatNames.includes(catName.toLowerCase())) {
                    enrichedSelectedCategories.push({ categoryName: catName });
                    existingCatNames.push(catName.toLowerCase());
                }
            });

            const vendorWithServices = {
                ...v,
                category: primaryCategory,
                selectedCategories: enrichedSelectedCategories,
                services: activeServices
            };

            const startingPrice = computeVendorStartingPrice(vendorWithServices);
            const parseExp = (val) => {
                if (typeof val === 'number') return val;
                if (typeof val === 'string') {
                    const m = val.match(/\d+/);
                    return m ? parseInt(m[0], 10) : 0;
                }
                return 0;
            };
            const yearsExp = parseExp(v.businessDetails?.years) || parseExp(v.experience) || parseExp(v.businessDetails?.experience) || 0;

            return {
                ...vendorWithServices,
                rating: rev.reviewCount > 0 ? rev.rating : 0,
                reviewCount: rev.reviewCount,
                startingPrice,
                experienceYears: yearsExp
            };
        });

        // Post-enrichment filters (price, rating, experience)
        if (minRating && !isNaN(parseFloat(minRating))) {
            const minR = parseFloat(minRating);
            enriched = enriched.filter(v => v.rating >= minR);
        }

        if (minPrice && !isNaN(parseFloat(minPrice))) {
            const minP = parseFloat(minPrice);
            enriched = enriched.filter(v => v.startingPrice >= minP);
        }

        if (maxPrice && !isNaN(parseFloat(maxPrice))) {
            const maxP = parseFloat(maxPrice);
            enriched = enriched.filter(v => v.startingPrice <= maxP);
        }

        if (minExperience && !isNaN(parseInt(minExperience, 10))) {
            const minExp = parseInt(minExperience, 10);
            enriched = enriched.filter(v => v.experienceYears >= minExp);
        }

        // Apply Sorting
        if (sort === 'rating') {
            enriched.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount || b.profileViews - a.profileViews);
        } else if (sort === 'price_asc' || sort === 'price-low') {
            enriched.sort((a, b) => a.startingPrice - b.startingPrice);
        } else if (sort === 'price_desc' || sort === 'price-high') {
            enriched.sort((a, b) => b.startingPrice - a.startingPrice);
        } else if (sort === 'experience') {
            enriched.sort((a, b) => b.experienceYears - a.experienceYears);
        } else if (sort === 'newest') {
            enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sort === 'popular' || sort === 'views') {
            enriched.sort((a, b) => (b.profileViews || 0) - (a.profileViews || 0) || b.reviewCount - a.reviewCount);
        } else if (sort === 'recommended') {
            enriched.sort((a, b) => {
                const scoreA = (a.rating * 10) + ((a.reviewCount || 0) * 2) + (a.isVerified ? 5 : 0) + ((a.profileViews || 0) * 0.1);
                const scoreB = (b.rating * 10) + ((b.reviewCount || 0) * 2) + (b.isVerified ? 5 : 0) + ((b.profileViews || 0) * 0.1);
                return scoreB - scoreA;
            });
        } else {
            enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        // Pagination
        const total = enriched.length;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
        const totalPages = Math.ceil(total / limitNum) || 1;
        const startIndex = (pageNum - 1) * limitNum;
        const paginatedVendors = enriched.slice(startIndex, startIndex + limitNum);

        const hasNextPage = pageNum < totalPages;
        const hasPreviousPage = pageNum > 1;

        res.status(200).json({
            success: true,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages,
            hasNextPage,
            hasPreviousPage,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages,
                hasNextPage,
                hasPreviousPage
            },
            count: paginatedVendors.length,
            data: paginatedVendors
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single public vendor by ID with complete profile
// @route   GET /api/vendors/:id
// @access  Public
exports.getPublicVendorById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid vendor ID format'
            });
        }

        const vendor = await Vendor.findOne({
            _id: id,
            status: 'Approved',
            isActive: { $ne: false }
        })
            .select('-password -documents -bank -bankDetails -notifications -role -subscription.orderId -subscription.paymentId -otp -resetPasswordToken -__v')
            .lean();

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found or not eligible for marketplace'
            });
        }

        // Increment profile views
        await Vendor.findByIdAndUpdate(id, { $inc: { profileViews: 1 } });

        // Fetch real approved reviews for this vendor
        const reviews = await Review.find({ vendorId: id, status: 'Approved' })
            .populate('userId', 'name profileImage')
            .sort('-createdAt')
            .lean();

        const avgRating = reviews.length > 0
            ? Math.round((reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length) * 10) / 10
            : 0;

        // Fetch real active services created by this vendor from the canonical Service model
        const dbServices = await Service.find({ vendor: id, isActive: { $ne: false } })
            .populate('category', 'name')
            .sort('-createdAt')
            .lean();

        // If Service model records exist, prioritize them; otherwise fallback to embedded vendor.services
        const activeServices = (dbServices && dbServices.length > 0)
            ? dbServices
            : (vendor.services || []);

        const vendorWithServices = {
            ...vendor,
            services: activeServices
        };

        const startingPrice = computeVendorStartingPrice(vendorWithServices);

        res.status(200).json({
            success: true,
            data: {
                ...vendorWithServices,
                reviews,
                rating: avgRating,
                reviewCount: reviews.length,
                startingPrice
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Check vendor availability for specific date or month
// @route   GET /api/vendors/:id/availability
// @access  Public
exports.getVendorAvailability = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { date, month } = req.query;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid vendor ID format'
            });
        }

        const { getWeatherForDate, getWeatherForMonth } = require('../../services/weather.service');
        const vendor = await Vendor.findOne({
            _id: id,
            status: 'Approved',
            isActive: { $ne: false }
        }).select('_id businessName city blockedDates').lean();

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        const vendorCity = vendor.city || 'Indore';

        // If specific date requested
        if (date) {
            const targetDate = new Date(date);
            if (isNaN(targetDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date format. Expected YYYY-MM-DD'
                });
            }

            const startOfDay = new Date(targetDate);
            startOfDay.setUTCHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setUTCHours(23, 59, 59, 999);

            // Check confirmed bookings
            const conflictingBooking = await Booking.findOne({
                vendorId: id,
                eventDate: { $gte: startOfDay, $lte: endOfDay },
                status: 'Confirmed'
            }).select('_id eventDate status').lean();

            // Check vendor manual blocked dates
            const isManuallyBlocked = (vendor.blockedDates || []).some(bDate => {
                const b = new Date(bDate);
                return b >= startOfDay && b <= endOfDay;
            });

            const isAvailable = !conflictingBooking && !isManuallyBlocked;
            const weather = await getWeatherForDate(vendorCity, targetDate.toISOString().split('T')[0]);

            return res.status(200).json({
                success: true,
                vendorId: id,
                vendorCity,
                date: targetDate.toISOString().split('T')[0],
                isAvailable,
                status: isAvailable ? 'Available' : 'Unavailable',
                reason: conflictingBooking ? 'Confirmed Booking Conflict' : (isManuallyBlocked ? 'Blocked by Vendor' : null),
                weather
            });
        }

        // Return all booked dates for the vendor (or for the requested month)
        let dateQuery = { vendorId: id, status: 'Confirmed' };
        if (month) {
            const [y, m] = month.split('-').map(Number);
            if (y && m) {
                const startOfMonth = new Date(Date.UTC(y, m - 1, 1));
                const endOfMonth = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
                dateQuery.eventDate = { $gte: startOfMonth, $lte: endOfMonth };
            }
        }

        const confirmedBookings = await Booking.find(dateQuery).select('eventDate').lean();
        const bookedDates = confirmedBookings.map(b => b.eventDate.toISOString().split('T')[0]);
        const blockedDates = (vendor.blockedDates || []).map(d => new Date(d).toISOString().split('T')[0]);
        const weatherForecasts = await getWeatherForMonth(vendorCity, month);

        res.status(200).json({
            success: true,
            vendorId: id,
            vendorCity,
            bookedDates: Array.from(new Set(bookedDates)),
            blockedDates: Array.from(new Set(blockedDates)),
            weatherForecasts
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get featured vendors
// @route   GET /api/vendors/featured
// @access  Public
exports.getFeaturedVendors = async (req, res, next) => {
    try {
        const featuredVendors = await Vendor.find({
            status: 'Approved',
            isActive: { $ne: false },
            isFeatured: true
        })
            .select('-password -documents -bank -bankDetails -notifications -role -subscription.orderId -subscription.paymentId -otp -resetPasswordToken -__v')
            .limit(10)
            .lean();

        // If none explicitly marked isFeatured, check for active subscriptions or return empty list
        const vendors = featuredVendors.length > 0
            ? featuredVendors
            : await Vendor.find({
                status: 'Approved',
                isActive: { $ne: false },
                'subscription.status': 'Active'
            })
                .select('-password -documents -bank -notifications -role -subscription.orderId -subscription.paymentId -__v')
                .limit(10)
                .lean();

        // Attach review stats
        const vendorIds = vendors.map(v => v._id);
        const reviews = await Review.aggregate([
            { $match: { vendorId: { $in: vendorIds }, status: 'Approved' } },
            {
                $group: {
                    _id: '$vendorId',
                    avgRating: { $avg: '$rating' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const reviewMap = {};
        reviews.forEach(r => {
            reviewMap[r._id.toString()] = {
                rating: Math.round(r.avgRating * 10) / 10,
                reviewCount: r.count
            };
        });

        const canonicalServices = await Service.find({
            vendor: { $in: vendorIds },
            isActive: { $ne: false }
        })
            .populate('category', 'name slug')
            .sort('-createdAt')
            .lean();

        const servicesByVendor = {};
        canonicalServices.forEach(srv => {
            const vKey = srv.vendor.toString();
            if (!servicesByVendor[vKey]) servicesByVendor[vKey] = [];
            servicesByVendor[vKey].push(srv);
        });

        const data = vendors.map(v => {
            const vKey = v._id.toString();
            const rev = reviewMap[vKey] || { rating: 0, reviewCount: 0 };
            const activeServices = (servicesByVendor[vKey] && servicesByVendor[vKey].length > 0)
                ? servicesByVendor[vKey]
                : (v.services || []);
            const vendorWithServices = { ...v, services: activeServices };
            return {
                ...vendorWithServices,
                rating: rev.reviewCount > 0 ? rev.rating : 0,
                reviewCount: rev.reviewCount,
                startingPrice: computeVendorStartingPrice(vendorWithServices)
            };
        });

        res.status(200).json({
            success: true,
            count: data.length,
            data
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get trending vendors based on real database activity
// @route   GET /api/vendors/trending
// @access  Public
exports.getTrendingVendors = async (req, res, next) => {
    try {
        const approvedVendors = await Vendor.find({
            status: 'Approved',
            isActive: { $ne: false }
        })
            .select('-password -documents -bank -bankDetails -notifications -role -subscription.orderId -subscription.paymentId -otp -resetPasswordToken -__v')
            .lean();

        if (approvedVendors.length === 0) {
            return res.status(200).json({ success: true, count: 0, data: [] });
        }

        const vendorIds = approvedVendors.map(v => v._id);

        // Aggregate real signals: leads, bookings, reviews, favorites
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [leadsData, bookingsData, reviewsData, favoritesData] = await Promise.all([
            Lead.aggregate([
                { $match: { vendorId: { $in: vendorIds }, createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: '$vendorId', count: { $sum: 1 } } }
            ]),
            Booking.aggregate([
                { $match: { vendorId: { $in: vendorIds } } },
                { $group: { _id: '$vendorId', count: { $sum: 1 } } }
            ]),
            Review.aggregate([
                { $match: { vendorId: { $in: vendorIds }, status: 'Approved' } },
                { $group: { _id: '$vendorId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
            ]),
            Favorite.aggregate([
                { $match: { vendorId: { $in: vendorIds } } },
                { $group: { _id: '$vendorId', count: { $sum: 1 } } }
            ])
        ]);

        const leadsMap = Object.fromEntries(leadsData.map(l => [l._id.toString(), l.count]));
        const bookingsMap = Object.fromEntries(bookingsData.map(b => [b._id.toString(), b.count]));
        const reviewsMap = Object.fromEntries(reviewsData.map(r => [r._id.toString(), {
            rating: Math.round(r.avgRating * 10) / 10,
            count: r.count
        }]));
        const favoritesMap = Object.fromEntries(favoritesData.map(f => [f._id.toString(), f.count]));

        const canonicalServices = await Service.find({
            vendor: { $in: vendorIds },
            isActive: { $ne: false }
        })
            .populate('category', 'name slug')
            .sort('-createdAt')
            .lean();

        const servicesByVendor = {};
        canonicalServices.forEach(srv => {
            const vKey = srv.vendor.toString();
            if (!servicesByVendor[vKey]) servicesByVendor[vKey] = [];
            servicesByVendor[vKey].push(srv);
        });

        // Calculate deterministic trending score based on real engagement
        const ranked = approvedVendors.map(v => {
            const vId = v._id.toString();
            const views = v.profileViews || 0;
            const leads = leadsMap[vId] || 0;
            const bookings = bookingsMap[vId] || 0;
            const rev = reviewsMap[vId] || { rating: 0, count: 0 };
            const favs = favoritesMap[vId] || 0;

            const trendingScore = (views * 1) + (leads * 5) + (bookings * 10) + (rev.count * 4) + (favs * 3);
            const activeServices = (servicesByVendor[vId] && servicesByVendor[vId].length > 0)
                ? servicesByVendor[vId]
                : (v.services || []);
            const vendorWithServices = { ...v, services: activeServices };

            return {
                ...vendorWithServices,
                rating: rev.count > 0 ? rev.rating : 0,
                reviewCount: rev.count,
                startingPrice: computeVendorStartingPrice(vendorWithServices),
                trendingScore
            };
        });

        // Sort by trendingScore descending, fallback to profileViews
        ranked.sort((a, b) => b.trendingScore - a.trendingScore || (b.profileViews || 0) - (a.profileViews || 0));

        const topTrending = ranked.slice(0, 10);

        res.status(200).json({
            success: true,
            count: topTrending.length,
            data: topTrending
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get deterministic vendor recommendations
// @route   GET /api/vendors/recommendations
// @access  Public
exports.getRecommendedVendors = async (req, res, next) => {
    try {
        const { city, category, budget, date, limit = 6 } = req.query;

        const filter = {
            status: 'Approved',
            isActive: { $ne: false }
        };

        if (city && city !== 'all') {
            const escapedCity = escapeRegex(city.trim());
            filter.$and = filter.$and || [];
            filter.$and.push({
                $or: [
                    { city: new RegExp(`^${escapedCity}$`, 'i') },
                    { 'businessDetails.serviceCities': new RegExp(`^${escapedCity}$`, 'i') }
                ]
            });
        }

        if (category && category !== 'all') {
            const catRegex = new RegExp(escapeRegex(category.replace(/-/g, ' ')), 'i');
            filter.$and = filter.$and || [];
            filter.$and.push({
                $or: [
                    { 'selectedCategories.categoryName': catRegex },
                    { 'services.category': catRegex },
                    { category: catRegex }
                ]
            });
        }

        // Exclude booked vendors if date provided
        if (date) {
            const targetDate = new Date(date);
            if (!isNaN(targetDate.getTime())) {
                const startOfDay = new Date(targetDate);
                startOfDay.setUTCHours(0, 0, 0, 0);
                const endOfDay = new Date(targetDate);
                endOfDay.setUTCHours(23, 59, 59, 999);

                const bookedIds = await Booking.distinct('vendorId', {
                    eventDate: { $gte: startOfDay, $lte: endOfDay },
                    status: 'Confirmed'
                });

                filter._id = { $nin: bookedIds };
            }
        }

        const vendors = await Vendor.find(filter)
            .select('-password -documents -bank -bankDetails -notifications -role -subscription.orderId -subscription.paymentId -otp -resetPasswordToken -__v')
            .lean();

        const vendorIds = vendors.map(v => v._id);
        const reviews = await Review.aggregate([
            { $match: { vendorId: { $in: vendorIds }, status: 'Approved' } },
            { $group: { _id: '$vendorId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);

        const reviewMap = Object.fromEntries(reviews.map(r => [
            r._id.toString(),
            { rating: Math.round(r.avgRating * 10) / 10, count: r.count }
        ]));

        const canonicalServices = await Service.find({
            vendor: { $in: vendorIds },
            isActive: { $ne: false }
        })
            .populate('category', 'name slug')
            .sort('-createdAt')
            .lean();

        const servicesByVendor = {};
        canonicalServices.forEach(srv => {
            const vKey = srv.vendor.toString();
            if (!servicesByVendor[vKey]) servicesByVendor[vKey] = [];
            servicesByVendor[vKey].push(srv);
        });

        let enriched = vendors.map(v => {
            const vKey = v._id.toString();
            const rev = reviewMap[vKey] || { rating: 0, count: 0 };
            const activeServices = (servicesByVendor[vKey] && servicesByVendor[vKey].length > 0)
                ? servicesByVendor[vKey]
                : (v.services || []);
            const vendorWithServices = { ...v, services: activeServices };
            const startingPrice = computeVendorStartingPrice(vendorWithServices);
            const score = (rev.rating * 10) + (rev.count * 2) + (v.isVerified ? 5 : 0) + ((v.profileViews || 0) * 0.05);

            return {
                ...vendorWithServices,
                rating: rev.count > 0 ? rev.rating : 0,
                reviewCount: rev.count,
                startingPrice,
                matchScore: score
            };
        });

        // Filter budget if requested
        if (budget && !isNaN(parseFloat(budget))) {
            const b = parseFloat(budget);
            enriched = enriched.filter(v => v.startingPrice === 0 || v.startingPrice <= b);
        }

        enriched.sort((a, b) => b.matchScore - a.matchScore);
        const limitNum = Math.min(20, Math.max(1, parseInt(limit, 10) || 6));
        const result = enriched.slice(0, limitNum);

        res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });
    } catch (err) {
        next(err);
    }
};
