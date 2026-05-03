import { apiRequest, ApiResponse } from './apiClient';

export interface CheapProduct {
    title: string;
    price: number;
    category: string;
    seller_name: string;
    seller_role: string;
}

export interface CategoryStat {
    category: string;
    count: number;
}

export interface MarketplaceStats {
    active_sales: number;
    active_leases: number;
    unique_vendors: number;
    avg_price: number;
    min_price: number;
    max_price: number;
}

export interface TrendingProduct {
    title: string;
    price: number;
    category: string;
    seller_name: string;
}

export interface AIInsights {
    cheapest_products: CheapProduct[];
    popular_categories: CategoryStat[];
    marketplace_stats: MarketplaceStats;
    trending_products: TrendingProduct[];
}

/**
 * Fetch marketplace insights for AI assistant context
 * Includes cheap products, popular categories, stats, and trending items
 */
export const getMarketplaceInsights = async (): Promise<AIInsights | null> => {
    try {
        const response = await apiRequest<{ insights: AIInsights }>(
            '/listings/insights/ai',
            { method: 'GET' }
        );

        if (response.success && response.data?.insights) {
            return response.data.insights;
        }
        return null;
    } catch (error) {
        console.error('Failed to fetch marketplace insights:', error);
        return null;
    }
};

/**
 * Format marketplace insights into a readable string for AI context
 * Used to enrich the system prompt with real marketplace data
 */
export const formatInsightsForAI = (insights: AIInsights): string => {
    if (!insights) return '';

    const lines: string[] = [];

    // Cheapest products section
    if (insights.cheapest_products?.length > 0) {
        lines.push('CHEAP PRODUCTS AVAILABLE:');
        insights.cheapest_products.slice(0, 5).forEach((product, idx) => {
            const type = product.seller_role === 'vendor' ? 'Vendor' : 'Student';
            lines.push(`${idx + 1}. ${product.title} - ${product.price} (${product.category}) by ${product.seller_name} (${type})`);
        });
        lines.push('');
    }

    // Popular categories
    if (insights.popular_categories?.length > 0) {
        lines.push('POPULAR CATEGORIES:');
        insights.popular_categories.slice(0, 5).forEach((cat) => {
            lines.push(`• ${cat.category}: ${cat.count} listings`);
        });
        lines.push('');
    }

    // Marketplace stats
    if (insights.marketplace_stats) {
        const stats = insights.marketplace_stats;
        lines.push('MARKETPLACE STATS:');
        lines.push(`• ${stats.active_sales} items for sale`);
        lines.push(`• ${stats.active_leases} items available to lease`);
        lines.push(`• ${stats.unique_vendors} sellers active`);
        lines.push(`• Price range: ${stats.min_price} to ${stats.max_price} (avg: ${stats.avg_price})`);
        lines.push('');
    }

    // Trending products
    if (insights.trending_products?.length > 0) {
        lines.push('RECENT LISTINGS:');
        insights.trending_products.slice(0, 3).forEach((product, idx) => {
            lines.push(`${idx + 1}. ${product.title} - ${product.price} (${product.category}) by ${product.seller_name}`);
        });
    }

    return lines.join('\n');
};

/**
 * Generate a system instruction for the AI that includes real marketplace context
 */
export const buildAISystemInstruction = (insightsContext: string): string => {
    const baseInstruction = `You are an AI Campus Assistant for CampusMart, a university marketplace platform. Your role is to help students find, sell, or lease items on campus safely and conveniently.

IMPORTANT FORMATTING RULES: DO NOT use any markdown syntax like asterisks (*), dashes (-), or bullet points. Write in plain, natural sentences. Use emojis occasionally 😊. Be friendly, energetic, and concise.

CURRENT MARKETPLACE DATA:
${insightsContext}

YOUR RESPONSIBILITIES:
1. Help students discover cheap items in their categories of interest
2. Provide search recommendations and tips for finding specific products
3. Give safety tips for campus trading
4. Explain how to use CampusMart features (selling, buying, leasing, messaging)
5. Reference real products and categories from the marketplace when relevant
6. Highlight good deals and trending items
7. Encourage safe transactions on CampusMart
8. Answer questions about campus commerce and student needs

TONE: Be friendly, encouraging, and practical. Make campus trading feel easy and safe. Occasionally reference specific products or categories from the marketplace to show you understand what's available.`;

    return baseInstruction;
};
