function StatCard({ icon = '📊', label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      {sub && <div className="text-small text-muted">{sub}</div>}
    </div>
  );
}

export default StatCard;