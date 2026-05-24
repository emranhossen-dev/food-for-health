'use client'

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import toast from 'react-hot-toast'

interface CartItem {
  id: string
  name_en: string
  name_bn?: string
  image_url?: string
  current_price: number
  old_price?: number
  unit: string
  quantity: number
  selectedQuantity?: string
}

interface CartState {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  isOpen: boolean
}

type CartAction =
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'LOAD_CART'; payload: CartState }

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isOpen: false
}

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItem = state.items.find(item => item.id === action.payload.id)
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        )
        
        const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
        const totalPrice = updatedItems.reduce((sum, item) => sum + (item.current_price * item.quantity), 0)
        
        return {
          ...state,
          items: updatedItems,
          totalItems,
          totalPrice
        }
      } else {
        const updatedItems = [...state.items, action.payload]
        const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
        const totalPrice = updatedItems.reduce((sum, item) => sum + (item.current_price * item.quantity), 0)
        
        return {
          ...state,
          items: updatedItems,
          totalItems,
          totalPrice
        }
      }
    }
    
    case 'REMOVE_FROM_CART': {
      const updatedItems = state.items.filter(item => item.id !== action.payload)
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalPrice = updatedItems.reduce((sum, item) => sum + (item.current_price * item.quantity), 0)
      
      return {
        ...state,
        items: updatedItems,
        totalItems,
        totalPrice
      }
    }
    
    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      ).filter(item => item.quantity > 0)
      
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalPrice = updatedItems.reduce((sum, item) => sum + (item.current_price * item.quantity), 0)
      
      return {
        ...state,
        items: updatedItems,
        totalItems,
        totalPrice
      }
    }
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalPrice: 0
      }
    
    case 'TOGGLE_CART':
      return {
        ...state,
        isOpen: !state.isOpen
      }
    
    case 'SET_CART':
      const totalItems = action.payload.reduce((sum, item) => sum + item.quantity, 0)
      const totalPrice = action.payload.reduce((sum, item) => sum + (item.current_price * item.quantity), 0)
      
      return {
        ...state,
        items: action.payload,
        totalItems,
        totalPrice
      }
    
    case 'LOAD_CART':
      return action.payload
    
    default:
      return state
  }
}

interface CartContextType {
  cart: CartState
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  isOpen: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, initialState)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        dispatch({ type: 'LOAD_CART', payload: parsedCart })
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (item: CartItem) => {
    dispatch({ type: 'ADD_TO_CART', payload: item })
    toast.success(`${item.name_en} added to cart!`)
  }

  const removeFromCart = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id })
    toast.success('Item removed from cart')
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } })
    }
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
    toast.success('Cart cleared')
  }

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' })
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleCart,
        isOpen: cart.isOpen
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
