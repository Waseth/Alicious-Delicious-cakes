import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const addToCart = (cake) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === cake.id);
      if (exists) return prev.map((i) => i.id === cake.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...cake, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const updateQuantity = (id, qty) => {
    if (qty < 1) { removeFromCart(id); return; }
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, i) => sum + i.base_price * i.quantity, 0);
  const deposit = Math.round(total * 0.5);
  const count = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total, deposit, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
