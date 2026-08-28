import { useEffect, useMemo, useState } from 'react'
import { api, type Product } from '../api/client'
import ProductCard from '../components/ProductCard'
import Section from '../components/Section'
import Reveal from '../components/Reveal'

export default function Products() {
  const [products, setProducts] = useState<Product[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    api
      .products()
      .then(setProducts)
      .catch(() => setFailed(true))
  }, [])

  const filtered = useMemo(() => {
    const list = products ?? []
    const sorted = [...list].sort((a, b) => Number(b.featured) - Number(a.featured))
    const q = query.trim().toLowerCase()
    return q ? sorted.filter(p => p.name.toLowerCase().includes(q)) : sorted
  }, [products, query])

  return (
    <main className="container page">
      <Section title="Shop">
        <input
          className="search"
          placeholder="Search products…"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        {failed ? (
          <p className="muted">Start the backend server to load products.</p>
        ) : products === null ? (
          <div className="grid grid-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="skeleton" style={{ height: 260 }} />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-3">
              {filtered.map((product, index) => (
                <Reveal key={product.id} delay={Math.min(index * 70, 350)}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
              {filtered.length === 0 ? <p className="muted">No products match your search.</p> : null}
            </div>
          </>
        )}
      </Section>
    </main>
  )
}
