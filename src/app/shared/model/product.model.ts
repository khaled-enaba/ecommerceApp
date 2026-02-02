export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  categoryId: { _id: string; name: string; slug: string };
  subCategoryId?: { _id: string; name: string; slug: string };
  soldCount: number;
  image: string | string[];
  stock: number;
  createdAt?: Date;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
}

export interface IProductsRes {
  message: string;
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface IProductRes {
  message: string;
  data: Product;
}


export interface ICategory {
  _id: string;
  name: string;
  description?: string;
}

export interface IProductsByCategoryRes {
  message: string;
  data: {
    category: ICategory;
    products: Product[];
  };
}
export interface IProductsBySubCategoryRes {
  message: string;
  data: {
    subCategory: ICategory;
    products: Product[];
  };
}
export interface IBestSellersRes {
  message: string;
  data: Product[];
}
export interface INewArrivalsRes {
  message: string;
  data: Product[];
}
export interface ISearchProductsRes {
  message: string;
  data: Product[];
}
