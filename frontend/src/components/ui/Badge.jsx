function Badge({ type = 'cadet', children }) {
  return <span className={`badge badge--${type}`}>{children}</span>;
}

export default Badge;