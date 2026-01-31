// =============================================================================
// Serious Control Database Seed Script
// =============================================================================

import { PrismaClient, UserRole, ProviderTier, ProviderStatus, CategorySlug } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// =============================================================================
// CATEGORIES
// =============================================================================

const categories = [
    // Home Services
    { name: 'Plumbing', slug: 'plumbing', icon: '🔧', description: 'Professional plumbing services including repairs, installations, and emergency callouts.' },
    { name: 'Electrical', slug: 'electrical', icon: '⚡', description: 'Qualified electricians for installations, rewiring, and electrical repairs.' },
    { name: 'Heating & Boilers', slug: 'heating-boilers', icon: '🔥', description: 'Boiler servicing, repairs, and central heating installations.' },
    { name: 'Cleaning', slug: 'cleaning', icon: '🧹', description: 'Professional cleaning services for homes and offices.' },
    { name: 'Handyman', slug: 'handyman', icon: '🛠️', description: 'General repairs, maintenance, and odd jobs around the home.' },
    { name: 'Painting & Decorating', slug: 'painting-decorating', icon: '🎨', description: 'Interior and exterior painting, wallpapering, and decorating services.' },
    { name: 'Carpentry', slug: 'carpentry', icon: '🪚', description: 'Bespoke carpentry, furniture making, and wood repairs.' },
    { name: 'Gardening', slug: 'gardening', icon: '🌿', description: 'Garden maintenance, landscaping, and tree surgery.' },
    { name: 'Locksmith', slug: 'locksmith', icon: '🔐', description: 'Emergency lockout services, lock repairs, and security installations.' },
    { name: 'Pest Control', slug: 'pest-control', icon: '🐜', description: 'Professional pest removal and prevention services.' },
    { name: 'Roofing', slug: 'roofing', icon: '🏠', description: 'Roof repairs, replacements, and gutter services.' },
    { name: 'Flooring', slug: 'flooring', icon: '🪵', description: 'Floor installation including laminate, hardwood, and tiles.' },
    { name: 'Plastering', slug: 'plastering', icon: '🧱', description: 'Plastering, rendering, and wall finishing services.' },
    { name: 'Window & Door Fitting', slug: 'windows-doors', icon: '🚪', description: 'Window and door installation, repairs, and replacements.' },
    { name: 'Kitchen Fitting', slug: 'kitchen-fitting', icon: '🍳', description: 'Complete kitchen design and installation services.' },
    { name: 'Bathroom Fitting', slug: 'bathroom-fitting', icon: '🚿', description: 'Bathroom design, installation, and renovation.' },
    { name: 'Tiling', slug: 'tiling', icon: '🔲', description: 'Wall and floor tiling for kitchens, bathrooms, and more.' },
    { name: 'Damp Proofing', slug: 'damp-proofing', icon: '💧', description: 'Damp treatment, waterproofing, and mould removal.' },
    { name: 'Chimney Sweep', slug: 'chimney-sweep', icon: '🏭', description: 'Chimney cleaning, inspection, and maintenance.' },
    { name: 'Drainage', slug: 'drainage', icon: '🚰', description: 'Drain unblocking, CCTV surveys, and drainage repairs.' },

    // Personal Services
    { name: 'Tutoring', slug: 'tutoring', icon: '📚', description: 'Private tutoring for all subjects and levels.' },
    { name: 'Beauty & Wellness', slug: 'beauty-wellness', icon: '💅', description: 'Beauty treatments, massage, and wellness services.' },
    { name: 'Personal Training', slug: 'personal-training', icon: '💪', description: 'Personal fitness training and coaching.' },
    { name: 'Photography', slug: 'photography', icon: '📷', description: 'Professional photography for events and portraits.' },
    { name: 'Dog Walking', slug: 'dog-walking', icon: '🐕', description: 'Professional dog walking and pet sitting services.' },
    { name: 'Pet Grooming', slug: 'pet-grooming', icon: '🐩', description: 'Professional pet grooming services.' },
    { name: 'Music Lessons', slug: 'music-lessons', icon: '🎵', description: 'Private music lessons for all instruments and levels.' },
    { name: 'Driving Lessons', slug: 'driving-lessons', icon: '🚗', description: 'Driving instruction and test preparation.' },
    { name: 'Child Care', slug: 'child-care', icon: '👶', description: 'Babysitting, nanny services, and childcare.' },
    { name: 'Elderly Care', slug: 'elderly-care', icon: '👵', description: 'Companionship and care services for the elderly.' },

    // Moving & Transport
    { name: 'Removals', slug: 'removals', icon: '📦', description: 'House and office removals and packing services.' },
    { name: 'Man with Van', slug: 'man-with-van', icon: '🚚', description: 'Light removals and delivery services.' },
    { name: 'Courier', slug: 'courier', icon: '📬', description: 'Same-day and scheduled courier services.' },

    // Automotive
    { name: 'Car Mechanic', slug: 'car-mechanic', icon: '🚙', description: 'Car repairs, servicing, and MOT preparation.' },
    { name: 'Car Valeting', slug: 'car-valeting', icon: '✨', description: 'Professional car cleaning and detailing.' },
    { name: 'Mobile Tyre Fitting', slug: 'mobile-tyre-fitting', icon: '🛞', description: 'Mobile tyre replacement and repair services.' },

    // Events
    { name: 'Catering', slug: 'catering', icon: '🍽️', description: 'Event catering and private chef services.' },
    { name: 'DJ & Entertainment', slug: 'dj-entertainment', icon: '🎧', description: 'DJs, musicians, and entertainment for events.' },
    { name: 'Event Planning', slug: 'event-planning', icon: '🎉', description: 'Event planning and coordination services.' },

    // Professional Services
    { name: 'Accountant', slug: 'accountant', icon: '📊', description: 'Accounting, bookkeeping, and tax services.' },
    { name: 'IT Support', slug: 'it-support', icon: '💻', description: 'Computer repairs, IT support, and tech help.' },
    { name: 'Web Design', slug: 'web-design', icon: '🌐', description: 'Website design, development, and maintenance.' },
    { name: 'Graphic Design', slug: 'graphic-design', icon: '🎯', description: 'Logo design, branding, and graphic design services.' },
    { name: 'Legal Services', slug: 'legal-services', icon: '⚖️', description: 'Legal advice and document services.' },

    // Specialist
    { name: 'Appliance Repair', slug: 'appliance-repair', icon: '🔌', description: 'Washing machine, dishwasher, and appliance repairs.' },
    { name: 'Aerial & Satellite', slug: 'aerial-satellite', icon: '📡', description: 'TV aerial and satellite installation and repairs.' },
    { name: 'Solar Panel Installation', slug: 'solar-panels', icon: '☀️', description: 'Solar panel installation and maintenance.' },
    { name: 'EV Charger Installation', slug: 'ev-charger', icon: '🔋', description: 'Electric vehicle charger installation.' },
    { name: 'Security Systems', slug: 'security-systems', icon: '📹', description: 'CCTV, alarms, and security system installation.' },
    { name: 'Fencing', slug: 'fencing', icon: '🏗️', description: 'Garden fencing, gates, and boundary work.' },
];

// =============================================================================
// UK CITIES
// =============================================================================

const cities = [
    // England - Major Cities
    { name: 'London', slug: 'london', county: 'Greater London', region: 'London', latitude: 51.5074, longitude: -0.1278, population: 8982000 },
    { name: 'Birmingham', slug: 'birmingham', county: 'West Midlands', region: 'West Midlands', latitude: 52.4862, longitude: -1.8904, population: 1141000 },
    { name: 'Manchester', slug: 'manchester', county: 'Greater Manchester', region: 'North West', latitude: 53.4808, longitude: -2.2426, population: 553000 },
    { name: 'Leeds', slug: 'leeds', county: 'West Yorkshire', region: 'Yorkshire', latitude: 53.8008, longitude: -1.5491, population: 793000 },
    { name: 'Liverpool', slug: 'liverpool', county: 'Merseyside', region: 'North West', latitude: 53.4084, longitude: -2.9916, population: 498000 },
    { name: 'Sheffield', slug: 'sheffield', county: 'South Yorkshire', region: 'Yorkshire', latitude: 53.3811, longitude: -1.4701, population: 584000 },
    { name: 'Bristol', slug: 'bristol', county: 'Bristol', region: 'South West', latitude: 51.4545, longitude: -2.5879, population: 463000 },
    { name: 'Newcastle', slug: 'newcastle', county: 'Tyne and Wear', region: 'North East', latitude: 54.9783, longitude: -1.6178, population: 302000 },
    { name: 'Nottingham', slug: 'nottingham', county: 'Nottinghamshire', region: 'East Midlands', latitude: 52.9548, longitude: -1.1581, population: 332000 },
    { name: 'Leicester', slug: 'leicester', county: 'Leicestershire', region: 'East Midlands', latitude: 52.6369, longitude: -1.1398, population: 355000 },

    // More English Cities
    { name: 'Coventry', slug: 'coventry', county: 'West Midlands', region: 'West Midlands', latitude: 52.4068, longitude: -1.5197, population: 366000 },
    { name: 'Bradford', slug: 'bradford', county: 'West Yorkshire', region: 'Yorkshire', latitude: 53.7960, longitude: -1.7594, population: 537000 },
    { name: 'Stoke-on-Trent', slug: 'stoke-on-trent', county: 'Staffordshire', region: 'West Midlands', latitude: 53.0027, longitude: -2.1794, population: 256000 },
    { name: 'Wolverhampton', slug: 'wolverhampton', county: 'West Midlands', region: 'West Midlands', latitude: 52.5870, longitude: -2.1288, population: 264000 },
    { name: 'Plymouth', slug: 'plymouth', county: 'Devon', region: 'South West', latitude: 50.3755, longitude: -4.1427, population: 264000 },
    { name: 'Southampton', slug: 'southampton', county: 'Hampshire', region: 'South East', latitude: 50.9097, longitude: -1.4044, population: 253000 },
    { name: 'Reading', slug: 'reading', county: 'Berkshire', region: 'South East', latitude: 51.4543, longitude: -0.9781, population: 163000 },
    { name: 'Derby', slug: 'derby', county: 'Derbyshire', region: 'East Midlands', latitude: 52.9225, longitude: -1.4746, population: 257000 },
    { name: 'Sunderland', slug: 'sunderland', county: 'Tyne and Wear', region: 'North East', latitude: 54.9061, longitude: -1.3811, population: 277000 },
    { name: 'Norwich', slug: 'norwich', county: 'Norfolk', region: 'East of England', latitude: 52.6309, longitude: 1.2974, population: 144000 },

    // More Cities
    { name: 'Luton', slug: 'luton', county: 'Bedfordshire', region: 'East of England', latitude: 51.8787, longitude: -0.4200, population: 215000 },
    { name: 'Brighton', slug: 'brighton', county: 'East Sussex', region: 'South East', latitude: 50.8225, longitude: -0.1372, population: 290000 },
    { name: 'Portsmouth', slug: 'portsmouth', county: 'Hampshire', region: 'South East', latitude: 50.8198, longitude: -1.0880, population: 215000 },
    { name: 'Milton Keynes', slug: 'milton-keynes', county: 'Buckinghamshire', region: 'South East', latitude: 52.0406, longitude: -0.7594, population: 249000 },
    { name: 'Oxford', slug: 'oxford', county: 'Oxfordshire', region: 'South East', latitude: 51.7520, longitude: -1.2577, population: 154000 },
    { name: 'Cambridge', slug: 'cambridge', county: 'Cambridgeshire', region: 'East of England', latitude: 52.2053, longitude: 0.1218, population: 130000 },
    { name: 'York', slug: 'york', county: 'North Yorkshire', region: 'Yorkshire', latitude: 53.9591, longitude: -1.0815, population: 210000 },
    { name: 'Bournemouth', slug: 'bournemouth', county: 'Dorset', region: 'South West', latitude: 50.7192, longitude: -1.8808, population: 195000 },
    { name: 'Peterborough', slug: 'peterborough', county: 'Cambridgeshire', region: 'East of England', latitude: 52.5695, longitude: -0.2405, population: 202000 },
    { name: 'Doncaster', slug: 'doncaster', county: 'South Yorkshire', region: 'Yorkshire', latitude: 53.5228, longitude: -1.1285, population: 311000 },

    // More Coverage
    { name: 'Hull', slug: 'hull', county: 'East Yorkshire', region: 'Yorkshire', latitude: 53.7676, longitude: -0.3274, population: 260000 },
    { name: 'Middlesbrough', slug: 'middlesbrough', county: 'North Yorkshire', region: 'North East', latitude: 54.5742, longitude: -1.2350, population: 140000 },
    { name: 'Blackpool', slug: 'blackpool', county: 'Lancashire', region: 'North West', latitude: 53.8142, longitude: -3.0503, population: 139000 },
    { name: 'Bolton', slug: 'bolton', county: 'Greater Manchester', region: 'North West', latitude: 53.5785, longitude: -2.4299, population: 195000 },
    { name: 'Stockport', slug: 'stockport', county: 'Greater Manchester', region: 'North West', latitude: 53.4106, longitude: -2.1575, population: 291000 },
    { name: 'Wigan', slug: 'wigan', county: 'Greater Manchester', region: 'North West', latitude: 53.5448, longitude: -2.6326, population: 326000 },
    { name: 'Rotherham', slug: 'rotherham', county: 'South Yorkshire', region: 'Yorkshire', latitude: 53.4300, longitude: -1.3568, population: 264000 },
    { name: 'Ipswich', slug: 'ipswich', county: 'Suffolk', region: 'East of England', latitude: 52.0567, longitude: 1.1482, population: 138000 },
    { name: 'Exeter', slug: 'exeter', county: 'Devon', region: 'South West', latitude: 50.7184, longitude: -3.5339, population: 130000 },
    { name: 'Gloucester', slug: 'gloucester', county: 'Gloucestershire', region: 'South West', latitude: 51.8642, longitude: -2.2382, population: 129000 },

    // London Boroughs
    { name: 'Croydon', slug: 'croydon', county: 'Greater London', region: 'London', latitude: 51.3762, longitude: -0.0982, population: 386000 },
    { name: 'Bromley', slug: 'bromley', county: 'Greater London', region: 'London', latitude: 51.4039, longitude: 0.0198, population: 331000 },
    { name: 'Enfield', slug: 'enfield', county: 'Greater London', region: 'London', latitude: 51.6538, longitude: -0.0799, population: 333000 },
    { name: 'Barnet', slug: 'barnet', county: 'Greater London', region: 'London', latitude: 51.6252, longitude: -0.1517, population: 395000 },
    { name: 'Ealing', slug: 'ealing', county: 'Greater London', region: 'London', latitude: 51.5130, longitude: -0.3089, population: 342000 },
    { name: 'Hounslow', slug: 'hounslow', county: 'Greater London', region: 'London', latitude: 51.4668, longitude: -0.3613, population: 271000 },
    { name: 'Harrow', slug: 'harrow', county: 'Greater London', region: 'London', latitude: 51.5802, longitude: -0.3340, population: 250000 },
    { name: 'Hillingdon', slug: 'hillingdon', county: 'Greater London', region: 'London', latitude: 51.5441, longitude: -0.4760, population: 306000 },
    { name: 'Brent', slug: 'brent', county: 'Greater London', region: 'London', latitude: 51.5673, longitude: -0.2711, population: 330000 },
    { name: 'Redbridge', slug: 'redbridge', county: 'Greater London', region: 'London', latitude: 51.5590, longitude: 0.0741, population: 305000 },

    // Scotland
    { name: 'Edinburgh', slug: 'edinburgh', county: 'City of Edinburgh', region: 'Scotland', country: 'Scotland', latitude: 55.9533, longitude: -3.1883, population: 524000 },
    { name: 'Glasgow', slug: 'glasgow', county: 'Glasgow City', region: 'Scotland', country: 'Scotland', latitude: 55.8642, longitude: -4.2518, population: 635000 },
    { name: 'Aberdeen', slug: 'aberdeen', county: 'Aberdeen City', region: 'Scotland', country: 'Scotland', latitude: 57.1497, longitude: -2.0943, population: 229000 },
    { name: 'Dundee', slug: 'dundee', county: 'Dundee City', region: 'Scotland', country: 'Scotland', latitude: 56.4620, longitude: -2.9707, population: 149000 },
    { name: 'Inverness', slug: 'inverness', county: 'Highland', region: 'Scotland', country: 'Scotland', latitude: 57.4778, longitude: -4.2247, population: 63000 },

    // Wales
    { name: 'Cardiff', slug: 'cardiff', county: 'Cardiff', region: 'Wales', country: 'Wales', latitude: 51.4816, longitude: -3.1791, population: 362000 },
    { name: 'Swansea', slug: 'swansea', county: 'Swansea', region: 'Wales', country: 'Wales', latitude: 51.6214, longitude: -3.9436, population: 246000 },
    { name: 'Newport', slug: 'newport', county: 'Newport', region: 'Wales', country: 'Wales', latitude: 51.5842, longitude: -2.9977, population: 154000 },
    { name: 'Wrexham', slug: 'wrexham', county: 'Wrexham', region: 'Wales', country: 'Wales', latitude: 53.0463, longitude: -2.9926, population: 65000 },

    // Northern Ireland
    { name: 'Belfast', slug: 'belfast', county: 'Belfast', region: 'Northern Ireland', country: 'Northern Ireland', latitude: 54.5973, longitude: -5.9301, population: 343000 },
    { name: 'Derry', slug: 'derry', county: 'Derry and Strabane', region: 'Northern Ireland', country: 'Northern Ireland', latitude: 54.9966, longitude: -7.3086, population: 85000 },

    // More English Cities
    { name: 'Cheltenham', slug: 'cheltenham', county: 'Gloucestershire', region: 'South West', latitude: 51.8994, longitude: -2.0783, population: 117000 },
    { name: 'Bath', slug: 'bath', county: 'Somerset', region: 'South West', latitude: 51.3758, longitude: -2.3599, population: 90000 },
    { name: 'Worcester', slug: 'worcester', county: 'Worcestershire', region: 'West Midlands', latitude: 52.1920, longitude: -2.2216, population: 101000 },
    { name: 'Lincoln', slug: 'lincoln', county: 'Lincolnshire', region: 'East Midlands', latitude: 53.2307, longitude: -0.5406, population: 99000 },
    { name: 'Chester', slug: 'chester', county: 'Cheshire', region: 'North West', latitude: 53.1930, longitude: -2.8931, population: 118000 },
    { name: 'Warrington', slug: 'warrington', county: 'Cheshire', region: 'North West', latitude: 53.3900, longitude: -2.5970, population: 210000 },
    { name: 'Preston', slug: 'preston', county: 'Lancashire', region: 'North West', latitude: 53.7632, longitude: -2.7031, population: 141000 },
    { name: 'Lancaster', slug: 'lancaster', county: 'Lancashire', region: 'North West', latitude: 54.0466, longitude: -2.8007, population: 52000 },
    { name: 'Carlisle', slug: 'carlisle', county: 'Cumbria', region: 'North West', latitude: 54.8951, longitude: -2.9382, population: 75000 },
    { name: 'Durham', slug: 'durham', county: 'County Durham', region: 'North East', latitude: 54.7761, longitude: -1.5733, population: 48000 },

    // More Towns
    { name: 'Northampton', slug: 'northampton', county: 'Northamptonshire', region: 'East Midlands', latitude: 52.2405, longitude: -0.9027, population: 225000 },
    { name: 'Colchester', slug: 'colchester', county: 'Essex', region: 'East of England', latitude: 51.8860, longitude: 0.8919, population: 194000 },
    { name: 'Southend-on-Sea', slug: 'southend-on-sea', county: 'Essex', region: 'East of England', latitude: 51.5459, longitude: 0.7077, population: 183000 },
    { name: 'Basildon', slug: 'basildon', county: 'Essex', region: 'East of England', latitude: 51.5761, longitude: 0.4886, population: 185000 },
    { name: 'Slough', slug: 'slough', county: 'Berkshire', region: 'South East', latitude: 51.5105, longitude: -0.5950, population: 164000 },
    { name: 'Watford', slug: 'watford', county: 'Hertfordshire', region: 'East of England', latitude: 51.6565, longitude: -0.3903, population: 97000 },
    { name: 'Hemel Hempstead', slug: 'hemel-hempstead', county: 'Hertfordshire', region: 'East of England', latitude: 51.7533, longitude: -0.4722, population: 97000 },
    { name: 'St Albans', slug: 'st-albans', county: 'Hertfordshire', region: 'East of England', latitude: 51.7550, longitude: -0.3360, population: 88000 },
    { name: 'Stevenage', slug: 'stevenage', county: 'Hertfordshire', region: 'East of England', latitude: 51.9015, longitude: -0.2019, population: 87000 },
    { name: 'Woking', slug: 'woking', county: 'Surrey', region: 'South East', latitude: 51.3190, longitude: -0.5581, population: 105000 },
    { name: 'Guildford', slug: 'guildford', county: 'Surrey', region: 'South East', latitude: 51.2362, longitude: -0.5704, population: 80000 },
    { name: 'Crawley', slug: 'crawley', county: 'West Sussex', region: 'South East', latitude: 51.1120, longitude: -0.1871, population: 112000 },
    { name: 'Eastbourne', slug: 'eastbourne', county: 'East Sussex', region: 'South East', latitude: 50.7687, longitude: 0.2905, population: 103000 },
    { name: 'Hastings', slug: 'hastings', county: 'East Sussex', region: 'South East', latitude: 50.8574, longitude: 0.5730, population: 92000 },
    { name: 'Maidstone', slug: 'maidstone', county: 'Kent', region: 'South East', latitude: 51.2720, longitude: 0.5290, population: 113000 },
    { name: 'Canterbury', slug: 'canterbury', county: 'Kent', region: 'South East', latitude: 51.2802, longitude: 1.0789, population: 55000 },
    { name: 'Dover', slug: 'dover', county: 'Kent', region: 'South East', latitude: 51.1279, longitude: 1.3134, population: 32000 },
    { name: 'Folkestone', slug: 'folkestone', county: 'Kent', region: 'South East', latitude: 51.0816, longitude: 1.1666, population: 54000 },
    { name: 'Ashford', slug: 'ashford', county: 'Kent', region: 'South East', latitude: 51.1465, longitude: 0.8746, population: 128000 },
    { name: 'Tunbridge Wells', slug: 'tunbridge-wells', county: 'Kent', region: 'South East', latitude: 51.1320, longitude: 0.2630, population: 59000 },
    { name: 'Swindon', slug: 'swindon', county: 'Wiltshire', region: 'South West', latitude: 51.5558, longitude: -1.7797, population: 222000 },
    { name: 'Salisbury', slug: 'salisbury', county: 'Wiltshire', region: 'South West', latitude: 51.0688, longitude: -1.7945, population: 45000 },
    { name: 'Taunton', slug: 'taunton', county: 'Somerset', region: 'South West', latitude: 51.0190, longitude: -3.1003, population: 65000 },
    { name: 'Yeovil', slug: 'yeovil', county: 'Somerset', region: 'South West', latitude: 50.9421, longitude: -2.6356, population: 45000 },
    { name: 'Torquay', slug: 'torquay', county: 'Devon', region: 'South West', latitude: 50.4619, longitude: -3.5253, population: 65000 },
    { name: 'Truro', slug: 'truro', county: 'Cornwall', region: 'South West', latitude: 50.2632, longitude: -5.0510, population: 21000 },
    { name: 'Newquay', slug: 'newquay', county: 'Cornwall', region: 'South West', latitude: 50.4120, longitude: -5.0757, population: 22000 },
    { name: 'Poole', slug: 'poole', county: 'Dorset', region: 'South West', latitude: 50.7150, longitude: -1.9874, population: 154000 },
    { name: 'Weymouth', slug: 'weymouth', county: 'Dorset', region: 'South West', latitude: 50.6144, longitude: -2.4579, population: 53000 },
];

// =============================================================================
// SUBCATEGORIES
// =============================================================================

const subcategories: Record<string, string[]> = {
    'plumbing': ['Emergency Plumbing', 'Bathroom Plumbing', 'Kitchen Plumbing', 'Pipe Repairs', 'Water Tank Installation', 'Drain Unblocking', 'Leak Detection', 'Tap Installation'],
    'electrical': ['Rewiring', 'Fuse Box Replacement', 'Lighting Installation', 'Socket Installation', 'Electrical Safety Check', 'EV Charger Installation', 'Smart Home Wiring'],
    'heating-boilers': ['Boiler Installation', 'Boiler Servicing', 'Boiler Repair', 'Radiator Installation', 'Underfloor Heating', 'Power Flushing', 'Gas Safety Check'],
    'cleaning': ['Regular Cleaning', 'Deep Cleaning', 'End of Tenancy', 'Carpet Cleaning', 'Window Cleaning', 'Oven Cleaning', 'Office Cleaning', 'After Builders Clean'],
    'handyman': ['Furniture Assembly', 'Shelf Installation', 'Picture Hanging', 'Door Repairs', 'General Repairs', 'Odd Jobs'],
    'painting-decorating': ['Interior Painting', 'Exterior Painting', 'Wallpapering', 'Feature Walls', 'Wood Staining', 'Spray Painting'],
    'gardening': ['Lawn Care', 'Hedge Trimming', 'Tree Surgery', 'Landscaping', 'Garden Clearance', 'Patio Cleaning', 'Fence Repair', 'Planting'],
    'tutoring': ['Maths', 'English', 'Science', 'Languages', 'Music', 'GCSE Prep', 'A-Level Prep', '11+ Prep', 'University Level'],
    'beauty-wellness': ['Hair Styling', 'Makeup', 'Nails', 'Massage', 'Facials', 'Waxing', 'Eyelashes', 'Mobile Spa'],
};

// =============================================================================
// MAIN SEED FUNCTION
// =============================================================================

async function main() {
    console.log('🌱 Starting database seed...');

    // Clear existing data (in reverse order of dependencies)
    console.log('🧹 Clearing existing data...');
    await prisma.adminActionLog.deleteMany();
    await prisma.webhookEvent.deleteMany();
    await prisma.pageIndexControl.deleteMany();
    await prisma.sEOContentBlock.deleteMany();
    await prisma.dynamicPricingRule.deleteMany();
    await prisma.featuredPlacement.deleteMany();
    await prisma.promoCode.deleteMany();
    await prisma.referral.deleteMany();
    await prisma.leadTransaction.deleteMany();
    await prisma.creditTransaction.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.notificationPreference.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.messageAttachment.deleteMany();
    await prisma.message.deleteMany();
    await prisma.messageThread.deleteMany();
    await prisma.disputeComment.deleteMany();
    await prisma.disputeEvidence.deleteMany();
    await prisma.dispute.deleteMany();
    await prisma.reviewVote.deleteMany();
    await prisma.reviewResponse.deleteMany();
    await prisma.reviewMedia.deleteMany();
    await prisma.review.deleteMany();
    await prisma.ledgerEntry.deleteMany();
    await prisma.payout.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.savedJobBrief.deleteMany();
    await prisma.quoteTemplate.deleteMany();
    await prisma.quote.deleteMany();
    await prisma.quoteInvitation.deleteMany();
    await prisma.quoteRequest.deleteMany();
    await prisma.serviceBundleItem.deleteMany();
    await prisma.serviceBundle.deleteMany();
    await prisma.providerService.deleteMany();
    await prisma.providerDocument.deleteMany();
    await prisma.certification.deleteMany();
    await prisma.portfolioItem.deleteMany();
    await prisma.timeOff.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.providerLocation.deleteMany();
    await prisma.property.deleteMany();
    await prisma.providerFavorite.deleteMany();
    await prisma.providerProfile.deleteMany();
    await prisma.customerProfile.deleteMany();
    await prisma.phoneVerification.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.subcategory.deleteMany();
    await prisma.category.deleteMany();
    await prisma.city.deleteMany();
    await prisma.featureFlag.deleteMany();
    await prisma.platformConfig.deleteMany();

    // Seed categories
    console.log('📁 Seeding categories...');
    for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        const category = await prisma.category.create({
            data: {
                name: cat.name,
                slug: cat.slug,
                icon: cat.icon,
                description: cat.description,
                displayOrder: i,
                metaTitle: `${cat.name} Services Near You | Serious Control`,
                metaDescription: `Find trusted ${cat.name.toLowerCase()} professionals in your area. Compare quotes, read reviews, and book with confidence. Free quotes, no obligation.`,
            },
        });

        // Seed subcategories if exists
        if (subcategories[cat.slug]) {
            for (let j = 0; j < subcategories[cat.slug].length; j++) {
                await prisma.subcategory.create({
                    data: {
                        categoryId: category.id,
                        name: subcategories[cat.slug][j],
                        slug: subcategories[cat.slug][j].toLowerCase().replace(/ /g, '-'),
                        displayOrder: j,
                    },
                });
            }
        }
    }
    console.log(`✅ Created ${categories.length} categories`);

    // Seed cities
    console.log('🏙️ Seeding cities...');
    for (let i = 0; i < cities.length; i++) {
        const city = cities[i];
        await prisma.city.create({
            data: {
                name: city.name,
                slug: city.slug,
                county: city.county,
                region: city.region,
                country: city.country || 'England',
                latitude: city.latitude,
                longitude: city.longitude,
                population: city.population,
                displayOrder: i,
                metaTitle: `Local Services in ${city.name} | Serious Control`,
                metaDescription: `Find trusted tradespeople and service providers in ${city.name}. Get free quotes from verified professionals. Plumbers, electricians, cleaners, and more.`,
            },
        });
    }
    console.log(`✅ Created ${cities.length} cities`);

    // Seed feature flags
    console.log('🚩 Seeding feature flags...');
    const featureFlags = [
        { key: 'instant_booking', name: 'Instant Booking', enabled: true, description: 'Allow instant booking for eligible providers' },
        { key: 'dynamic_pricing', name: 'Dynamic Pricing', enabled: false, description: 'Enable dynamic pricing based on demand' },
        { key: 'ai_assist', name: 'AI Assist', enabled: false, description: 'AI-powered features like job summary and profile suggestions' },
        { key: 'stripe_identity', name: 'Stripe Identity Verification', enabled: false, description: 'Enable Stripe Identity for provider verification' },
        { key: 'customer_plus', name: 'Customer Plus Subscription', enabled: true, description: 'Enable customer Plus subscription tier' },
        { key: 'referral_program', name: 'Referral Program', enabled: true, description: 'Enable customer referral program' },
        { key: 'photo_review_bonus', name: 'Photo Review Bonus', enabled: true, description: 'Award credits for photo reviews' },
        { key: 'service_bundles', name: 'Service Bundles', enabled: true, description: 'Allow providers to offer service bundles' },
        { key: 'maintenance_reminders', name: 'Maintenance Reminders', enabled: true, description: 'Send automated maintenance reminders' },
    ];

    for (const flag of featureFlags) {
        await prisma.featureFlag.create({ data: flag });
    }
    console.log(`✅ Created ${featureFlags.length} feature flags`);

    // Seed platform config
    console.log('⚙️ Seeding platform config...');
    const platformConfigs = [
        { key: 'platform_fee_default', value: '0.18', type: 'NUMBER', description: 'Default platform fee (18%)' },
        { key: 'platform_fee_starter', value: '0.22', type: 'NUMBER', description: 'Platform fee for Starter tier (22%)' },
        { key: 'platform_fee_pro', value: '0.18', type: 'NUMBER', description: 'Platform fee for Pro tier (18%)' },
        { key: 'platform_fee_premium', value: '0.15', type: 'NUMBER', description: 'Platform fee for Premium tier (15%)' },
        { key: 'lead_fee_starter', value: '3.00', type: 'NUMBER', description: 'Cost per lead for Starter tier after free quota' },
        { key: 'starter_free_leads', value: '5', type: 'NUMBER', description: 'Free leads per month for Starter tier' },
        { key: 'customer_plus_price', value: '7.99', type: 'NUMBER', description: 'Customer Plus subscription price per month' },
        { key: 'customer_plus_cashback', value: '0.05', type: 'NUMBER', description: 'Customer Plus cashback rate (5%)' },
        { key: 'provider_pro_price', value: '79', type: 'NUMBER', description: 'Provider Pro subscription price per month' },
        { key: 'provider_premium_price', value: '199', type: 'NUMBER', description: 'Provider Premium subscription price per month' },
        { key: 'auto_confirm_hours', value: '48', type: 'NUMBER', description: 'Hours before auto-confirming completion' },
        { key: 'review_window_days', value: '14', type: 'NUMBER', description: 'Days to leave a review after completion' },
        { key: 'quote_expiry_hours', value: '72', type: 'NUMBER', description: 'Default quote expiry in hours' },
        { key: 'max_quotes_per_request', value: '5', type: 'NUMBER', description: 'Maximum quotes per quote request' },
        { key: 'photo_review_credit', value: '5.00', type: 'NUMBER', description: 'Credit awarded for leaving a photo review' },
        { key: 'referral_reward', value: '10.00', type: 'NUMBER', description: 'Reward for successful referral' },
        { key: 'booking_fee', value: '0', type: 'NUMBER', description: 'Fixed booking fee (0 = disabled)' },
        { key: 'seo_min_providers', value: '3', type: 'NUMBER', description: 'Minimum providers before indexing a page' },
        { key: 'seo_min_reviews', value: '1', type: 'NUMBER', description: 'Minimum reviews before indexing a page' },
        { key: 'support_email', value: 'support@servicematch.co.uk', type: 'STRING', description: 'Support email address' },
        { key: 'company_name', value: 'Serious Control Ltd', type: 'STRING', description: 'Company legal name' },
        { key: 'company_address', value: '123 High Street, London, EC1A 1BB', type: 'STRING', description: 'Company registered address' },
    ];

    for (const config of platformConfigs) {
        await prisma.platformConfig.create({ data: config as any });
    }
    console.log(`✅ Created ${platformConfigs.length} platform configs`);

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminPassword = await hash('admin123456', 12);
    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@servicematch.co.uk',
            passwordHash: adminPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN',
            emailVerified: new Date(),
            twoFactorEnabled: false,
        },
    });
    console.log(`✅ Created admin user: admin@servicematch.co.uk (password: admin123456)`);

    // Create sample customer
    console.log('👤 Creating sample customer...');
    const customerPassword = await hash('customer123', 12);
    const customerUser = await prisma.user.create({
        data: {
            email: 'customer@example.com',
            passwordHash: customerPassword,
            firstName: 'Jane',
            lastName: 'Customer',
            role: 'CUSTOMER',
            emailVerified: new Date(),
        },
    });

    await prisma.customerProfile.create({
        data: {
            userId: customerUser.id,
            stripeCustomerId: null,
        },
    });
    console.log(`✅ Created sample customer: customer@example.com (password: customer123)`);

    // Create sample provider
    console.log('👤 Creating sample provider...');
    const providerPassword = await hash('provider123', 12);
    const providerUser = await prisma.user.create({
        data: {
            email: 'provider@example.com',
            passwordHash: providerPassword,
            firstName: 'John',
            lastName: 'Plumber',
            role: 'PROVIDER',
            phone: '+447700900000',
            phoneVerified: true,
            emailVerified: new Date(),
        },
    });

    const plumbingCategory = await prisma.category.findUnique({ where: { slug: 'plumbing' } });

    const providerProfile = await prisma.providerProfile.create({
        data: {
            userId: providerUser.id,
            businessName: "John's Plumbing Services",
            slug: 'johns-plumbing-london',
            description: "Professional plumbing services in London with over 15 years of experience. We handle everything from emergency repairs to full bathroom installations. Gas Safe registered and fully insured.",
            shortBio: "15+ years experience. Gas Safe registered. Available 24/7 for emergencies.",
            businessPhone: '+447700900000',
            businessEmail: 'provider@example.com',
            city: 'London',
            postcode: 'SW1A 1AA',
            latitude: 51.5014,
            longitude: -0.1419,
            serviceRadius: 15,
            subscriptionTier: 'PRO',
            status: 'ACTIVE',
            emailVerified: true,
            phoneVerified: true,
            onboardingComplete: true,
            profileScore: 85,
            avgRating: 4.8,
            totalReviews: 47,
            totalBookings: 156,
            completionRate: 98.5,
            responseRate: 95.2,
            avgResponseTime: 45,
            repeatCustomerRate: 34.5,
        },
    });

    // Add provider services
    if (plumbingCategory) {
        await prisma.providerService.createMany({
            data: [
                {
                    providerId: providerProfile.id,
                    categoryId: plumbingCategory.id,
                    name: 'Emergency Plumbing',
                    description: '24/7 emergency plumbing callouts for leaks, burst pipes, and urgent repairs.',
                    pricingModel: 'FIXED',
                    callOutFee: 75,
                    fixedPrice: 150,
                    duration: 60,
                },
                {
                    providerId: providerProfile.id,
                    categoryId: plumbingCategory.id,
                    name: 'Tap Installation',
                    description: 'Professional tap installation or replacement. Price includes standard tap.',
                    pricingModel: 'FIXED',
                    fixedPrice: 85,
                    duration: 45,
                },
                {
                    providerId: providerProfile.id,
                    categoryId: plumbingCategory.id,
                    name: 'Bathroom Plumbing',
                    description: 'Full bathroom plumbing services including toilet, basin, shower, and bath installation.',
                    pricingModel: 'QUOTE',
                    priceFrom: 500,
                    priceTo: 3000,
                },
                {
                    providerId: providerProfile.id,
                    categoryId: plumbingCategory.id,
                    name: 'General Plumbing',
                    description: 'Hourly rate for general plumbing work and repairs.',
                    pricingModel: 'HOURLY',
                    hourlyRate: 55,
                    minHours: 1,
                    callOutFee: 35,
                },
            ],
        });
    }

    // Add provider availability
    for (let i = 1; i <= 5; i++) {
        await prisma.availability.create({
            data: {
                providerId: providerProfile.id,
                dayOfWeek: i,
                startTime: '08:00',
                endTime: '18:00',
                isAvailable: true,
            },
        });
    }
    await prisma.availability.create({
        data: {
            providerId: providerProfile.id,
            dayOfWeek: 6,
            startTime: '09:00',
            endTime: '14:00',
            isAvailable: true,
        },
    });

    // Add provider location
    await prisma.providerLocation.create({
        data: {
            providerId: providerProfile.id,
            postcode: 'SW1A 1AA',
            city: 'London',
            latitude: 51.5014,
            longitude: -0.1419,
            radius: 15,
            isDefault: true,
        },
    });

    console.log(`✅ Created sample provider: provider@example.com (password: provider123)`);

    // Create SEO content blocks for top categories and cities
    console.log('📝 Creating SEO content blocks...');
    const topCategories = await prisma.category.findMany({ take: 10 });
    const topCities = await prisma.city.findMany({ take: 10 });

    for (const category of topCategories) {
        await prisma.sEOContentBlock.create({
            data: {
                pageType: 'CATEGORY',
                categoryId: category.id,
                blockType: 'INTRO',
                title: `Find Trusted ${category.name} Professionals`,
                content: `Looking for reliable ${category.name.toLowerCase()} services? Serious Control connects you with verified professionals in your area. Compare quotes, read genuine reviews, and book with confidence. All our ${category.name.toLowerCase()} professionals are vetted and insured for your peace of mind.`,
            },
        });

        await prisma.sEOContentBlock.create({
            data: {
                pageType: 'CATEGORY',
                categoryId: category.id,
                blockType: 'FAQ',
                title: `Frequently Asked Questions About ${category.name}`,
                content: JSON.stringify([
                    { q: `How much does ${category.name.toLowerCase()} cost?`, a: `${category.name} costs vary depending on the job. Get free quotes from multiple professionals to compare prices.` },
                    { q: `How do I find a reliable ${category.name.toLowerCase()} professional?`, a: `Check reviews, verify credentials, and compare quotes on Serious Control to find the best match for your needs.` },
                    { q: 'Are professionals on Serious Control verified?', a: 'Yes, we verify identity, insurance, and qualifications where applicable. Look for the verified badge on profiles.' },
                ]),
            },
        });
    }

    for (const city of topCities) {
        await prisma.sEOContentBlock.create({
            data: {
                pageType: 'CITY',
                cityId: city.id,
                blockType: 'INTRO',
                title: `Local Services in ${city.name}`,
                content: `Find trusted tradespeople and service providers in ${city.name} and the surrounding ${city.county || city.region} area. From plumbers to cleaners, electricians to gardeners, Serious Control connects you with verified local professionals. Get free quotes and book online with confidence.`,
            },
        });
    }
    console.log(`✅ Created SEO content blocks`);

    // Create sample promo code
    console.log('🎫 Creating sample promo code...');
    await prisma.promoCode.create({
        data: {
            code: 'WELCOME10',
            description: '£10 off your first booking',
            type: 'FIXED_AMOUNT',
            value: 10,
            minBookingValue: 50,
            firstBookingOnly: true,
            newUsersOnly: true,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        },
    });
    console.log(`✅ Created promo code: WELCOME10`);

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('Test accounts:');
    console.log('  Admin:    admin@servicematch.co.uk / admin123456');
    console.log('  Customer: customer@example.com / customer123');
    console.log('  Provider: provider@example.com / provider123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
