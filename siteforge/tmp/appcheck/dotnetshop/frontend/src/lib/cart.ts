const KEY = 'cart_items'

export function getItems(): number[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as number[]
  } catch {
    return []
  }
}

export function addItem(id: number): void {
  const items = getItems()
  if (!items.includes(id)) {
    items.push(id)
    localStorage.setItem(KEY, JSON.stringify(items))
  }
  window.dispatchEvent(new Event('cart-changed'))
}

export function clearCart(): void {
  localStorage.removeItem(KEY)
  window.dispatchEvent(new Event('cart-changed'))
}

export function cartCount(): number {
  return getItems().length
}

export function addCartListener(handler: () => void): () => void {
  const listener = () => handler()
  window.addEventListener('cart-changed', listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener('cart-changed', listener)
    window.removeEventListener('storage', listener)
  }
}
