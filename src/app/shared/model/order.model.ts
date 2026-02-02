export interface IOrderItem {
    product: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
}

export interface IOrder {
    _id: string;
    orderNumber: string;
    user: {
        _id: string;
        name: string;
        email: string;
        mobile?: string;
    };
    items: IOrderItem[];
    totalAmount: number;
    shippingAddress: {
        addressLine: string;
        city: string;
        phone: string;
    };
    status: 'pending' | 'preparing' | 'shipped' | 'received' | 'cancelled' | 'return-requested' | 'returned' | 'return-rejected';
    returnReason?: string;
    returnAdminResponse?: string;
    createdAt: Date;
    updatedAt: Date;
}