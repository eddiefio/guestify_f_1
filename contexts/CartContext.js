// contexts/CartContext.js
import { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [propertyId, setPropertyId] = useState(null);

  // Load cart from localStorage on initial load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('guestify-cart');
      const savedPropertyId = localStorage.getItem('guestify-property-id');
      
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error('Failed to parse cart from localStorage', e);
          setCart([]);
        }
      }
      
      if (savedPropertyId) {
        setPropertyId(savedPropertyId);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && cart.length > 0) {
      localStorage.setItem('guestify-cart', JSON.stringify(cart));
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('guestify-cart');
    }
  }, [cart]);

  // Save propertyId to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && propertyId) {
      localStorage.setItem('guestify-property-id', propertyId);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('guestify-property-id');
    }
  }, [propertyId]);

  const addToCart = (item) => {
    const existingIndex = cart.findIndex(
      (cartItem) => cartItem.productId === item.productId && cartItem.propertyId === item.propertyId
    );
  
    if (existingIndex >= 0) {
      const updatedCart = [...cart];
      // Calculate new quantity but ensure it doesn't exceed max available
      const newQuantity = updatedCart[existingIndex].quantity + item.quantity;
      const maxAvailable = item.maxQuantity || updatedCart[existingIndex].maxQuantity;
      updatedCart[existingIndex].quantity = Math.min(newQuantity, maxAvailable);
      // Always keep track of maxQuantity to use for validation
      updatedCart[existingIndex].maxQuantity = maxAvailable;
      setCart(updatedCart);
    } else {
      // For new items, include the maxQuantity property
      setCart([...cart, { 
        ...item,
        maxQuantity: item.maxQuantity || item.quantity 
      }]);
    }
  
    // If this is the first item, set the property ID
    if (!propertyId) {
      setPropertyId(item.propertyId);
    }
  };

  const updateCartItem = (productId, propertyId, quantity) => {
    const updatedCart = cart.map((item) => {
      if (item.productId === productId && item.propertyId === propertyId) {
        // Ensure quantity doesn't exceed maximum available
        const validatedQty = Math.min(quantity, item.maxQuantity);
        return { ...item, quantity: validatedQty };
      }
      return item;
    });
    setCart(updatedCart);
  };

  const removeFromCart = (productId, propertyId) => {
    const updatedCart = cart.filter(
      (item) => !(item.productId === productId && item.propertyId === propertyId)
    );
    setCart(updatedCart);
  };

  const clearCart = () => {
    setCart([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('guestify-cart');
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cart,
    propertyId,
    setPropertyId,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);