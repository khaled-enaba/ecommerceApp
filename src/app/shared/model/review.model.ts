export interface IReview {
  _id: string;
  rating: number;
  comment: string;
  userId: { _id: string; name: string };
  productId: string;
  createdAt: Date;
}

export interface INewReview {
  rating: number;
  comment: string;
}