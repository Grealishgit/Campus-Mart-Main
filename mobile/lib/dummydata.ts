
import { Listing, TransactionType } from '../types/index';

export const dummyListing: Listing[] = [
    {
        id: '1',
        title: 'Organic Chemistry II',
        price: 38,
        type: TransactionType.SALE,
        category: 'Textbooks',
        condition: 'Like New',
        location: 'Science Library',
        distance: '0.2m',
        imageUrl: 'https://picsum.photos/seed/chem/400/500',
        isVerified: true,
        description: 'Professional-grade textbook with minimal highlighting. Perfect for CHEM 202.',
        seller: {
            name: 'Sarah Mitchell',
            rating: 4.5,
            avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
            isVerified: true
        }
    },
    {
        id: '2',
        title: 'Canon EOS R6 Kit',
        price: 12,
        priceUnit: '/day',
        type: TransactionType.LEASE,
        category: 'Tech',
        condition: 'Excellent',
        location: 'Student Union',
        distance: '0.5m',
        imageUrl: 'https://picsum.photos/seed/cam/400/500',
        isVerified: true,
        description: 'High-end camera for students. Includes 24-105mm lens.',
        seller: {
            name: 'Campus Tech Store',
            rating: 4.9,
            avatarUrl: 'https://i.pravatar.cc/150?u=techstore',
            isVerified: true
        }
    },
    {
        id: '3',
        title: 'Desk Chair (Like New)',
        price: 45,
        type: TransactionType.SALE,
        category: 'Dorm Decor',
        condition: 'Used - Like New',
        location: 'West Dorms',
        distance: '0.8m',
        imageUrl: 'https://picsum.photos/seed/chair/400/500',
        isVerified: false,
        description: 'Very comfortable ergonomic chair. Only used for one semester.',
        seller: {
            name: 'Alex Rivera',
            rating: 4.8,
            avatarUrl: 'https://i.pravatar.cc/150?u=alex',
            isVerified: true
        }
    },
    {
        id: '4',
        title: 'iPad Pro 12.9"',
        price: 25,
        priceUnit: '/week',
        type: TransactionType.LEASE,
        category: 'Tech',
        condition: 'Brand New',
        location: 'Media Center',
        distance: '1.1m',
        imageUrl: 'https://picsum.photos/seed/ipad/400/500',
        isVerified: true,
        description: 'Powerful tablet for design and note-taking. Pencil included.',
        seller: {
            name: 'Jordan Smith',
            rating: 4.2,
            avatarUrl: 'https://i.pravatar.cc/150?u=jordan',
            isVerified: false
        }
    }
];


