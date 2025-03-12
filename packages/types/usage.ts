interface UsageMetrics {
    total: number;
    daily: {
        [key: string]: number;
    };
    monthly: {
        [key: string]: number;
    };
    yearly: {
        [key: string]: number;
    };
}

interface ServiceUsage {
    test: UsageMetrics;
    live: UsageMetrics;
}

export interface Usage {
    _id: string;
    clientId: string;
    createdAt: number;
    buildkit: ServiceUsage;
    chat: ServiceUsage;
}