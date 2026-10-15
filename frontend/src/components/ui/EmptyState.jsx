function EmptyState({ icon = '📚', title = 'Nothing here yet', message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action && <div style={{ marginTop: '1.2rem' }}>{action}</div>}
    </div>
  );
}

export default EmptyState;