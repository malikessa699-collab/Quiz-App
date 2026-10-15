function SkeletonCard({ count = 3 }) {
  return (
    <div className="grid grid--3 stagger">
      {Array.from({ length: count }).map((_, i) => (
        <div className="card" key={i}>
          <div className="skeleton skeleton--card" style={{ height: '100px' }} />
        </div>
      ))}
    </div>
  );
}

export default SkeletonCard;