interface StarRatingProps {
  rating: number
  count: number
  size?: 'sm' | 'md'
}

export default function StarRating({ rating, count, size = 'sm' }: StarRatingProps) {
  const starSize = size === 'md' ? 18 : 13
  const fontSize = size === 'md' ? 13 : 11

  const stars = Array.from({ length: 5 }, (_, i) => {
    const val = i + 1
    if (rating >= val) return 'full'
    if (rating >= val - 0.5) return 'half'
    return 'empty'
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <span style={{ display: 'flex', gap: 1 }}>
        {stars.map((type, i) => (
          <span
            key={i}
            style={{
              fontSize: starSize,
              color: type === 'empty' ? '#d1d5db' : '#f59e0b',
              opacity: type === 'half' ? 0.6 : 1,
              lineHeight: 1,
            }}
          >
            {type === 'empty' ? '☆' : '★'}
          </span>
        ))}
      </span>
      <span style={{ fontSize, color: '#64748b', fontWeight: 600 }}>
        {size === 'sm' ? `(${count})` : `(${count} reviews)`}
      </span>
    </div>
  )
}
