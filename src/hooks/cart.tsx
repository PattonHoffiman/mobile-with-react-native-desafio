import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storaged = await AsyncStorage.getItem('@GoMarketplace:products');
      if (storaged) setProducts([...JSON.parse(storaged)]);
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const hasProduct = products.find(
        cartProduct => cartProduct.id === product.id,
      );

      if (hasProduct) {
        const updatedProducts = products.map(cartProduct => {
          if (cartProduct.id === product.id) cartProduct.quantity += 1;
          return cartProduct;
        });

        setProducts(updatedProducts);
      } else {
        const newProduct: Product = {
          quantity: 1,
          id: product.id,
          title: product.title,
          price: product.price,
          image_url: product.image_url,
        };

        setProducts([newProduct, ...products]);

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify([newProduct, ...products]),
        );
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const updatedProducts = products.map(product => {
        if (product.id === id) product.quantity += 1;
        return product;
      });

      setProducts(updatedProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const validProduct = products.find(product => product.id === id);
      if (validProduct && validProduct.quantity > 1) {
        const updatedProducts = products.map(product => {
          if (product.id === id) product.quantity -= 1;
          return product;
        });

        setProducts(updatedProducts);

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(updatedProducts),
        );
      } else {
        const removedProduct = products.find(product => product.id === id);
        if (removedProduct) {
          const updatedProducts = products.filter(
            product => product.id !== removedProduct.id,
          );

          setProducts(updatedProducts);

          await AsyncStorage.setItem(
            '@GoMarketplace:products',
            JSON.stringify(updatedProducts),
          );
        }
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
